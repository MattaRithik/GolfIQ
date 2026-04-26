"""
GolfIQ Benchmark API — FastAPI application entry point.
"""
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import create_tables, SessionLocal
from routers import profiles, rounds, analytics, predict, coach, data, model_router

logger = logging.getLogger(__name__)


async def _load_seed_data() -> None:
    """
    Seed the database with a default profile and course if none exist.
    This ensures the API is immediately usable after first startup.
    """
    from models import Profile, Course
    from sqlalchemy import select

    async with SessionLocal() as session:
        try:
            # Check if any profiles exist
            result = await session.execute(select(Profile).limit(1))
            existing_profile = result.scalar_one_or_none()

            if existing_profile is None:
                seed_profile = Profile(
                    name="Demo Junior Golfer",
                    email="demo@golfiq.app",
                    handicap_index=12.0,
                    home_course="Pinehurst No. 2",
                    age=16,
                    gender="Male",
                    height_cm=175.0,
                    weight_kg=68.0,
                    years_playing=5,
                    dominant_hand="right",
                    goals="Break 78 consistently",
                    practice_hours_per_week=8.0,
                    fitness_notes="No injuries - focusing on approach play improvement",
                )
                session.add(seed_profile)
                logger.info("Seeded demo profile.")

            # Check if any courses exist
            course_result = await session.execute(select(Course).limit(1))
            existing_course = course_result.scalar_one_or_none()

            if existing_course is None:
                seed_course = Course(
                    name="Pebble Beach Golf Links",
                    location="Pebble Beach, CA",
                    par=72,
                    course_rating=75.5,
                    slope_rating=145.0,
                    yardage=7075,
                    num_holes=18,
                )
                session.add(seed_course)
                logger.info("Seeded demo course.")

            await session.commit()
        except Exception as exc:
            await session.rollback()
            logger.warning(f"Seed data load failed (non-fatal): {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup and shutdown events."""
    # Startup
    logger.info("Starting GolfIQ API...")
    await create_tables()
    logger.info("Database tables created/verified.")
    await _load_seed_data()
    logger.info("GolfIQ API ready.")

    yield

    # Shutdown
    logger.info("GolfIQ API shutting down.")


app = FastAPI(
    title="GolfIQ Benchmark API",
    description=(
        "AI-powered golf analytics backend. "
        "Provides handicap calculation, benchmark comparisons, "
        "score prediction, and personalized coaching recommendations."
    ),
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(profiles.router)
app.include_router(rounds.router)
app.include_router(analytics.router)
app.include_router(predict.router)
app.include_router(coach.router)
app.include_router(data.router)
app.include_router(model_router.router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["system"])
async def health_check() -> dict:
    """Return API health status and basic configuration info."""
    return {
        "status": "ok",
        "env": settings.env,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": app.version,
    }


@app.get("/", tags=["system"])
async def root() -> dict:
    """Root endpoint — welcome message and link to docs."""
    return {
        "message": "Welcome to the GolfIQ Benchmark API",
        "docs": "/docs",
        "health": "/health",
        "version": app.version,
    }
