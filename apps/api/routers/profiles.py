from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
from models import Profile
from schemas import ProfileCreate, ProfileUpdate, ProfileResponse

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/", response_model=List[ProfileResponse])
async def list_profiles(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> List[ProfileResponse]:
    """Return a paginated list of all profiles."""
    result = await db.execute(select(Profile).offset(skip).limit(limit))
    profiles = result.scalars().all()
    return profiles


@router.post("/", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    payload: ProfileCreate,
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    """Create a new golfer profile."""
    # Check for duplicate email if provided
    if payload.email:
        existing = await db.execute(
            select(Profile).where(Profile.email == payload.email)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A profile with email '{payload.email}' already exists.",
            )

    profile = Profile(**payload.model_dump())
    db.add(profile)
    await db.flush()
    await db.refresh(profile)
    return profile


@router.get("/{profile_id}", response_model=ProfileResponse)
async def get_profile(
    profile_id: int,
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    """Retrieve a single profile by ID."""
    result = await db.execute(select(Profile).where(Profile.id == profile_id))
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {profile_id} not found.",
        )
    return profile


@router.put("/{profile_id}", response_model=ProfileResponse)
async def update_profile(
    profile_id: int,
    payload: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    """Update an existing profile (partial update supported)."""
    result = await db.execute(select(Profile).where(Profile.id == profile_id))
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {profile_id} not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)

    # Check for duplicate email if being changed
    new_email = update_data.get("email")
    if new_email and new_email != profile.email:
        existing = await db.execute(
            select(Profile).where(Profile.email == new_email)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A profile with email '{new_email}' already exists.",
            )

    for field, value in update_data.items():
        setattr(profile, field, value)

    await db.flush()
    await db.refresh(profile)
    return profile
