from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from database import get_db
from models import Round, Hole, Shot, Profile, Course
from schemas import RoundCreate, RoundResponse

router = APIRouter(prefix="/rounds", tags=["rounds"])


@router.get("/", response_model=List[RoundResponse])
async def list_rounds(
    profile_id: Optional[int] = Query(None, description="Filter by profile ID"),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> List[RoundResponse]:
    """Return a paginated list of rounds, optionally filtered by profile."""
    query = (
        select(Round)
        .options(selectinload(Round.holes), selectinload(Round.course))
        .order_by(Round.date_played.desc())
        .offset(skip)
        .limit(limit)
    )
    if profile_id is not None:
        query = query.where(Round.profile_id == profile_id)

    result = await db.execute(query)
    rounds = result.scalars().all()
    return rounds


@router.post("/", response_model=RoundResponse, status_code=status.HTTP_201_CREATED)
async def create_round(
    payload: RoundCreate,
    db: AsyncSession = Depends(get_db),
) -> RoundResponse:
    """Create a new round. Optionally creates a course inline if course_id not provided."""
    # Verify profile exists
    profile_result = await db.execute(
        select(Profile).where(Profile.id == payload.profile_id)
    )
    if profile_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {payload.profile_id} not found.",
        )

    course_id = payload.course_id

    # Auto-create course if inline course details provided without a course_id
    if course_id is None and payload.course_name:
        # Try to find existing course with same name
        existing_course_res = await db.execute(
            select(Course).where(Course.name == payload.course_name).limit(1)
        )
        existing_course = existing_course_res.scalar_one_or_none()
        if existing_course:
            course_id = existing_course.id
        else:
            new_course = Course(
                name=payload.course_name,
                location=payload.course_location,
                par=payload.course_par or 72,
                course_rating=payload.course_rating,
                slope_rating=payload.slope_rating,
                yardage=payload.yardage,
            )
            db.add(new_course)
            await db.flush()
            course_id = new_course.id

    # Build round fields (exclude nested + inline course fields)
    exclude_fields = {"holes", "shots", "course_name", "course_location",
                      "course_par", "course_rating", "slope_rating", "yardage"}
    round_data = payload.model_dump(exclude=exclude_fields)
    round_data["course_id"] = course_id

    new_round = Round(**round_data)
    db.add(new_round)
    await db.flush()

    # Create holes
    for hole_data in (payload.holes or []):
        hole = Hole(round_id=new_round.id, **hole_data.model_dump())
        db.add(hole)

    # Create shots
    for shot_data in (payload.shots or []):
        shot = Shot(round_id=new_round.id, **shot_data.model_dump())
        db.add(shot)

    await db.flush()

    # Reload with relationships
    result = await db.execute(
        select(Round)
        .options(selectinload(Round.holes), selectinload(Round.course))
        .where(Round.id == new_round.id)
    )
    return result.scalar_one()


@router.get("/{round_id}", response_model=RoundResponse)
async def get_round(
    round_id: int,
    db: AsyncSession = Depends(get_db),
) -> RoundResponse:
    """Retrieve a single round by ID, including all nested holes."""
    result = await db.execute(
        select(Round)
        .options(selectinload(Round.holes), selectinload(Round.course))
        .where(Round.id == round_id)
    )
    round_ = result.scalar_one_or_none()
    if round_ is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Round {round_id} not found.",
        )
    return round_
