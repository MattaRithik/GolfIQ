from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any, Dict

from database import get_db
from models import Profile, Round, Hole
from schemas import (
    AnalyticsSummaryRequest,
    AnalyticsSummaryResponse,
    BenchmarkRequest,
    BenchmarkResponse,
)
from analytics.handicap import (
    calculate_handicap_differential,
    estimate_handicap,
    classify_player_level,
)
from analytics.benchmarks import (
    find_closest_benchmark,
    compute_skill_gaps,
    estimate_strokes_gained_proxy,
)
from analytics.metrics import calculate_basic_metrics

router = APIRouter(prefix="/analytics", tags=["analytics"])


async def _fetch_profile_or_404(profile_id: int, db: AsyncSession) -> Profile:
    result = await db.execute(select(Profile).where(Profile.id == profile_id))
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {profile_id} not found.",
        )
    return profile


async def _fetch_rounds(
    profile_id: int, num_rounds: int, db: AsyncSession
) -> list:
    result = await db.execute(
        select(Round)
        .where(Round.profile_id == profile_id)
        .order_by(Round.date_played.desc())
        .limit(num_rounds)
    )
    return result.scalars().all()


async def _fetch_holes_for_rounds(round_ids: list[int], db: AsyncSession) -> list:
    if not round_ids:
        return []
    result = await db.execute(
        select(Hole).where(Hole.round_id.in_(round_ids))
    )
    return result.scalars().all()


def _rounds_to_dicts(rounds: list) -> list[Dict[str, Any]]:
    return [
        {
            "total_score": r.total_score,
            "total_putts": r.total_putts,
            "fairways_hit": r.fairways_hit,
            "fairways_attempted": r.fairways_attempted,
            "greens_in_regulation": r.greens_in_regulation,
            "penalties": r.penalties,
            "date_played": r.date_played,
        }
        for r in rounds
    ]


def _holes_to_dicts(holes: list) -> list[Dict[str, Any]]:
    return [
        {
            "round_id": h.round_id,
            "par": h.par,
            "score": h.score,
            "putts": h.putts,
            "fairway_hit": h.fairway_hit,
            "green_in_regulation": h.green_in_regulation,
            "penalty_strokes": h.penalty_strokes,
            "sand_saves": h.sand_saves,
        }
        for h in holes
    ]


@router.post("/summary", response_model=AnalyticsSummaryResponse)
async def analytics_summary(
    payload: AnalyticsSummaryRequest,
    db: AsyncSession = Depends(get_db),
) -> AnalyticsSummaryResponse:
    """
    Return aggregate analytics summary for a golfer's recent rounds.
    Includes scoring metrics, handicap estimate, and player level classification.
    """
    profile = await _fetch_profile_or_404(payload.profile_id, db)
    rounds = await _fetch_rounds(payload.profile_id, payload.num_rounds, db)

    if not rounds:
        return AnalyticsSummaryResponse(
            profile_id=payload.profile_id,
            num_rounds_analyzed=0,
            recent_trend="no_rounds",
        )

    round_ids = [r.id for r in rounds]
    holes = await _fetch_holes_for_rounds(round_ids, db)

    rounds_dicts = _rounds_to_dicts(rounds)
    holes_dicts = _holes_to_dicts(holes)

    metrics = calculate_basic_metrics(rounds_dicts, holes_dicts)

    # Estimate handicap from differentials if course data available
    differentials = []
    for r in rounds:
        if r.total_score is not None:
            # Use profile's home course rating defaults if no course linked
            course_rating = 72.0
            slope_rating = 113.0
            diff = calculate_handicap_differential(r.total_score, course_rating, slope_rating)
            differentials.append(diff)

    estimated_handicap = estimate_handicap(differentials) if differentials else profile.handicap_index
    player_level = classify_player_level(estimated_handicap) if estimated_handicap is not None else None

    return AnalyticsSummaryResponse(
        profile_id=payload.profile_id,
        num_rounds_analyzed=len(rounds),
        scoring_average=metrics.get("scoring_average"),
        fairway_percentage=metrics.get("fairway_percentage"),
        gir_percentage=metrics.get("gir_percentage"),
        putts_per_round=metrics.get("putts_per_round"),
        penalties_per_round=metrics.get("penalties_per_round"),
        scrambling_percentage=metrics.get("scrambling_percentage"),
        par3_average=metrics.get("par3_average"),
        par4_average=metrics.get("par4_average"),
        par5_average=metrics.get("par5_average"),
        recent_trend=metrics.get("recent_trend"),
        player_level=player_level,
        estimated_handicap=estimated_handicap,
    )


@router.post("/benchmark", response_model=BenchmarkResponse)
async def analytics_benchmark(
    payload: BenchmarkRequest,
    db: AsyncSession = Depends(get_db),
) -> BenchmarkResponse:
    """
    Compare a golfer's metrics against a benchmark group.
    If no benchmark_group is specified, auto-selects the closest matching group.
    """
    profile = await _fetch_profile_or_404(payload.profile_id, db)
    rounds = await _fetch_rounds(payload.profile_id, 20, db)

    round_ids = [r.id for r in rounds]
    holes = await _fetch_holes_for_rounds(round_ids, db)

    rounds_dicts = _rounds_to_dicts(rounds)
    holes_dicts = _holes_to_dicts(holes)

    metrics = calculate_basic_metrics(rounds_dicts, holes_dicts)

    # Determine handicap for benchmark selection
    differentials = []
    for r in rounds:
        if r.total_score is not None:
            diff = calculate_handicap_differential(r.total_score, 72.0, 113.0)
            differentials.append(diff)

    estimated_handicap = (
        estimate_handicap(differentials) if differentials else (profile.handicap_index or 20.0)
    )

    benchmark_group = payload.benchmark_group or find_closest_benchmark(estimated_handicap)

    # Build player metrics dict (only include metrics with values)
    player_metrics: Dict[str, Any] = {}
    metric_mapping = {
        "scoring_average": "scoring_average",
        "fairway_percentage": "fairway_percentage",
        "gir_percentage": "gir_percentage",
        "putts_per_round": "putts_per_round",
        "penalties_per_round": "penalties_per_round",
        "scrambling_percentage": "scrambling_percentage",
    }
    for key, metric_key in metric_mapping.items():
        val = metrics.get(metric_key)
        if val is not None:
            player_metrics[key] = val

    # Add estimated handicap-based SG estimates if no real data
    if estimated_handicap is not None:
        player_metrics.setdefault("sg_total_estimate", round(-estimated_handicap * 0.3, 2))

    skill_gaps = compute_skill_gaps(player_metrics, benchmark_group)
    sg_proxy = estimate_strokes_gained_proxy(player_metrics, benchmark_group)

    return BenchmarkResponse(
        profile_id=payload.profile_id,
        benchmark_group=benchmark_group,
        skill_gaps=skill_gaps,
        strokes_gained_proxy=sg_proxy,
        player_metrics=player_metrics,
    )
