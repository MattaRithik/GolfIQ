from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
from models import Profile, Round, Hole
from schemas import CoachRequest, CoachResponse
from analytics.handicap import (
    calculate_handicap_differential,
    estimate_handicap,
    classify_player_level,
)
from analytics.benchmarks import (
    find_closest_benchmark,
    compute_skill_gaps,
)
from analytics.metrics import calculate_basic_metrics, generate_practice_plan

router = APIRouter(prefix="/coach", tags=["coach"])


@router.post("/recommendations", response_model=CoachResponse)
async def coach_recommendations(
    payload: CoachRequest,
    db: AsyncSession = Depends(get_db),
) -> CoachResponse:
    """
    Generate personalized coaching recommendations and a structured practice plan.

    Analyzes the golfer's recent performance, identifies skill gaps relative to
    the nearest benchmark group, and produces an actionable weekly practice plan
    with time allocation, specific drills, and on-course tracking goals.
    """
    # Fetch profile
    profile_result = await db.execute(select(Profile).where(Profile.id == payload.profile_id))
    profile = profile_result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {payload.profile_id} not found.",
        )

    # Fetch recent rounds
    rounds_result = await db.execute(
        select(Round)
        .where(Round.profile_id == payload.profile_id)
        .order_by(Round.date_played.desc())
        .limit(20)
    )
    rounds = rounds_result.scalars().all()

    # Fetch holes for those rounds
    round_ids = [r.id for r in rounds]
    holes: List[Hole] = []
    if round_ids:
        holes_result = await db.execute(
            select(Hole).where(Hole.round_id.in_(round_ids))
        )
        holes = holes_result.scalars().all()

    # Build metric dicts
    rounds_dicts = [
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
    holes_dicts = [
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

    metrics = calculate_basic_metrics(rounds_dicts, holes_dicts)

    # Estimate handicap
    differentials = []
    for r in rounds:
        if r.total_score is not None:
            diff = calculate_handicap_differential(r.total_score, 72.0, 113.0)
            differentials.append(diff)

    estimated_handicap = (
        estimate_handicap(differentials) if differentials else (profile.handicap_index or 20.0)
    )

    # Select benchmark group
    benchmark_group = find_closest_benchmark(estimated_handicap)

    # Build player metrics for gap analysis
    player_metrics = {}
    for key in [
        "scoring_average",
        "fairway_percentage",
        "gir_percentage",
        "putts_per_round",
        "penalties_per_round",
        "scrambling_percentage",
    ]:
        val = metrics.get(key)
        if val is not None:
            player_metrics[key] = val

    # Handle case where player has no rounds — use handicap-based defaults
    if not player_metrics:
        hcp = estimated_handicap
        player_metrics = {
            "scoring_average": 72.0 + max(hcp, 0),
            "fairway_percentage": max(30.0, 75.0 - hcp * 1.5),
            "gir_percentage": max(10.0, 65.0 - hcp * 2.0),
            "putts_per_round": min(38.0, 28.5 + hcp * 0.3),
            "penalties_per_round": min(4.0, hcp * 0.12),
            "scrambling_percentage": max(8.0, 60.0 - hcp * 1.8),
        }

    skill_gaps = compute_skill_gaps(player_metrics, benchmark_group)

    # Generate practice plan
    goal = payload.goal or "lower_handicap"
    practice_hours = payload.practice_hours_per_week or 5.0
    practice_plan = generate_practice_plan(skill_gaps, goal, practice_hours)

    # Identify top priorities (areas with highest priority scores)
    top_priorities = _extract_top_priorities(skill_gaps)

    return CoachResponse(
        profile_id=payload.profile_id,
        benchmark_group=benchmark_group,
        skill_gaps=skill_gaps,
        practice_plan=practice_plan,
        top_priorities=top_priorities,
        explanation=practice_plan.get("explanation", ""),
    )


def _extract_top_priorities(skill_gaps: dict) -> List[str]:
    """Extract the top 3 priority areas from skill gap analysis."""
    priority_map = {
        "scoring_average": "Lower your scoring average",
        "fairway_percentage": "Improve driving accuracy",
        "gir_percentage": "Hit more greens in regulation",
        "putts_per_round": "Reduce total putts per round",
        "scrambling_percentage": "Improve scrambling (up-and-down)",
        "penalties_per_round": "Reduce penalty strokes",
        "driving_distance": "Increase driving distance",
    }

    scored = []
    for metric, data in skill_gaps.items():
        if isinstance(data, dict) and data.get("player_is_behind", False):
            priority_score = data.get("priority_score", 0.0)
            label = priority_map.get(metric, metric.replace("_", " ").title())
            scored.append((priority_score, label))

    scored.sort(reverse=True, key=lambda x: x[0])
    return [label for _, label in scored[:3]]
