"""
Core golf metrics calculations and practice plan generation.
"""
from typing import List, Dict, Any, Optional
import statistics


def calculate_basic_metrics(
    rounds_data: List[Dict[str, Any]],
    holes_data: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Calculate aggregate golf performance metrics from round and hole data.

    Args:
        rounds_data: List of round dicts with fields:
            total_score, total_putts, fairways_hit, fairways_attempted,
            greens_in_regulation, penalties, date_played.
        holes_data: List of hole dicts with fields:
            round_id, par, score, putts, fairway_hit, green_in_regulation,
            penalty_strokes, sand_saves.

    Returns:
        Dict with computed metrics:
            scoring_average, fairway_percentage, gir_percentage,
            putts_per_round, penalties_per_round, scrambling_percentage,
            par3_average, par4_average, par5_average, recent_trend.
    """
    metrics: Dict[str, Any] = {
        "scoring_average": None,
        "fairway_percentage": None,
        "gir_percentage": None,
        "putts_per_round": None,
        "penalties_per_round": None,
        "scrambling_percentage": None,
        "par3_average": None,
        "par4_average": None,
        "par5_average": None,
        "recent_trend": "insufficient_data",
        "rounds_analyzed": len(rounds_data),
    }

    if not rounds_data:
        return metrics

    # --- Scoring average ---
    scores = [r["total_score"] for r in rounds_data if r.get("total_score") is not None]
    if scores:
        metrics["scoring_average"] = round(statistics.mean(scores), 2)

    # --- Putts per round ---
    putts = [r["total_putts"] for r in rounds_data if r.get("total_putts") is not None]
    if putts:
        metrics["putts_per_round"] = round(statistics.mean(putts), 2)

    # --- Fairway percentage ---
    fw_hit_total = sum(r.get("fairways_hit", 0) or 0 for r in rounds_data)
    fw_att_total = sum(r.get("fairways_attempted", 0) or 0 for r in rounds_data)
    if fw_att_total > 0:
        metrics["fairway_percentage"] = round(fw_hit_total / fw_att_total * 100.0, 2)

    # --- GIR percentage ---
    gir_total = sum(r.get("greens_in_regulation", 0) or 0 for r in rounds_data)
    # Assume 18 holes per round for attempted greens
    gir_attempted = len(rounds_data) * 18
    if gir_attempted > 0:
        metrics["gir_percentage"] = round(gir_total / gir_attempted * 100.0, 2)

    # --- Penalties per round ---
    penalties = [r.get("penalties", 0) or 0 for r in rounds_data]
    metrics["penalties_per_round"] = round(statistics.mean(penalties), 2)

    # --- Hole-level metrics (par breakdown + scrambling) ---
    if holes_data:
        par3_scores = []
        par4_scores = []
        par5_scores = []
        scramble_attempts = 0
        scramble_saves = 0

        for hole in holes_data:
            par = hole.get("par")
            score = hole.get("score")
            gir = hole.get("green_in_regulation")

            if par is not None and score is not None:
                if par == 3:
                    par3_scores.append(score)
                elif par == 4:
                    par4_scores.append(score)
                elif par == 5:
                    par5_scores.append(score)

            # Scrambling: missed GIR but still made par or better
            if gir is False:
                scramble_attempts += 1
                if score is not None and par is not None and score <= par:
                    scramble_saves += 1

        if par3_scores:
            metrics["par3_average"] = round(statistics.mean(par3_scores), 2)
        if par4_scores:
            metrics["par4_average"] = round(statistics.mean(par4_scores), 2)
        if par5_scores:
            metrics["par5_average"] = round(statistics.mean(par5_scores), 2)

        if scramble_attempts > 0:
            metrics["scrambling_percentage"] = round(
                scramble_saves / scramble_attempts * 100.0, 2
            )

    # --- Recent trend (compare last 5 rounds vs previous rounds) ---
    if len(scores) >= 6:
        recent_scores = scores[:5]
        earlier_scores = scores[5:]
        recent_avg = statistics.mean(recent_scores)
        earlier_avg = statistics.mean(earlier_scores)
        diff = recent_avg - earlier_avg
        if diff < -1.5:
            metrics["recent_trend"] = "improving"
        elif diff > 1.5:
            metrics["recent_trend"] = "declining"
        else:
            metrics["recent_trend"] = "stable"
    elif len(scores) >= 2:
        metrics["recent_trend"] = "stable"

    return metrics


def generate_practice_plan(
    skill_gaps: Dict[str, Any],
    goal: str,
    practice_hours: float,
) -> Dict[str, Any]:
    """
    Generate a personalized practice plan based on skill gaps, goal, and available time.

    Args:
        skill_gaps: Output from compute_skill_gaps — dict of metric -> gap analysis.
        goal: Practice goal string (e.g. "lower_handicap", "improve_putting",
              "hit_more_fairways", "more_greens").
        practice_hours: Hours per week available for practice.

    Returns:
        Dict with:
            allocation_percentages: Dict of area -> % of practice time.
            drills: List of drill descriptions.
            next_round_tracking_goals: List of specific things to track.
            explanation: String explaining the plan rationale.
    """
    # Compute priority scores for each area
    area_priorities = _compute_area_priorities(skill_gaps, goal)

    # Convert priorities to percentages
    allocation = _priorities_to_allocation(area_priorities)

    # Generate drills based on allocation and available hours
    drills = _generate_drills(allocation, practice_hours)

    # Tracking goals
    tracking_goals = _generate_tracking_goals(allocation)

    # Build explanation
    top_areas = sorted(allocation.items(), key=lambda x: x[1], reverse=True)[:2]
    top_names = [_area_display_name(a[0]) for a in top_areas]
    explanation = (
        f"Based on your skill gaps and goal of '{_goal_display(goal)}', "
        f"your practice should focus primarily on {' and '.join(top_names)}. "
        f"With {practice_hours:.1f} hours per week, targeting these areas will yield "
        f"the greatest scoring improvement. Consistency over volume is key — "
        f"shorter, focused sessions outperform long unfocused practice."
    )

    return {
        "allocation_percentages": allocation,
        "drills": drills,
        "next_round_tracking_goals": tracking_goals,
        "explanation": explanation,
        "practice_hours_per_week": practice_hours,
        "goal": goal,
    }


# ---------------------------------------------------------------------------
# Internal helpers for practice plan
# ---------------------------------------------------------------------------

def _compute_area_priorities(
    skill_gaps: Dict[str, Any],
    goal: str,
) -> Dict[str, float]:
    """Map skill gap metrics to practice areas and compute weighted priorities."""

    # Metric -> practice area mapping
    area_map = {
        "fairway_percentage": "driving",
        "driving_distance": "driving",
        "gir_percentage": "approach",
        "sg_approach_estimate": "approach",
        "scrambling_percentage": "short_game",
        "sg_short_game_estimate": "short_game",
        "putts_per_round": "putting",
        "sg_putting_estimate": "putting",
        "penalties_per_round": "course_management",
        "scoring_average": "course_management",
    }

    area_scores: Dict[str, float] = {
        "driving": 0.0,
        "approach": 0.0,
        "short_game": 0.0,
        "putting": 0.0,
        "course_management": 0.0,
    }

    for metric, gap_data in skill_gaps.items():
        area = area_map.get(metric)
        if area and isinstance(gap_data, dict):
            priority = gap_data.get("priority_score", 0.0)
            area_scores[area] += priority

    # Goal multipliers
    goal_boosts: Dict[str, Dict[str, float]] = {
        "lower_handicap": {"approach": 1.3, "putting": 1.2},
        "improve_putting": {"putting": 2.5},
        "hit_more_fairways": {"driving": 2.5},
        "more_greens": {"approach": 2.5},
        "improve_short_game": {"short_game": 2.5},
        "reduce_penalties": {"course_management": 2.0, "driving": 1.3},
    }

    boosts = goal_boosts.get(goal, {})
    for area, multiplier in boosts.items():
        area_scores[area] *= multiplier if area_scores[area] > 0 else 1.0
        if area_scores[area] == 0.0:
            area_scores[area] = multiplier

    return area_scores


def _priorities_to_allocation(area_priorities: Dict[str, float]) -> Dict[str, float]:
    """Convert raw priority scores to percentage allocations summing to 100."""
    total = sum(area_priorities.values())
    if total == 0:
        # Default allocation when no gap data
        return {
            "driving": 20.0,
            "approach": 25.0,
            "short_game": 25.0,
            "putting": 25.0,
            "course_management": 5.0,
        }

    allocation = {
        area: round(score / total * 100.0, 1)
        for area, score in area_priorities.items()
    }

    # Enforce minimum 5% for each area
    MIN_PCT = 5.0
    for area in allocation:
        if allocation[area] < MIN_PCT:
            allocation[area] = MIN_PCT

    # Renormalize after minimums
    total2 = sum(allocation.values())
    allocation = {area: round(pct / total2 * 100.0, 1) for area, pct in allocation.items()}

    return allocation


def _generate_drills(
    allocation: Dict[str, float],
    practice_hours: float,
) -> List[str]:
    """Generate a list of specific drills based on allocation percentages."""
    drills = []

    drill_library = {
        "driving": [
            "Alignment stick gate drill: Place two alignment sticks as a gate at address width and swing through without touching them. (10 min)",
            "Tempo training with metronome app at 3:1 backswing-to-downswing ratio. (10 min)",
            "Tee height consistency drill: Hit 10 drives focusing on consistent contact point on the clubface. (15 min)",
            "Draw/fade shaping drill: Hit 5 intentional draws then 5 intentional fades to develop shot-shaping control. (15 min)",
        ],
        "approach": [
            "50-yard shot clock drill: Hit 20 approach shots from 50 yards with a 30-second pre-shot routine. (20 min)",
            "Distance gapping drill: Hit 5 shots each with 9-iron, 8-iron, 7-iron to confirm carry distances. (20 min)",
            "Yardage book imagination drill: Pick precise targets at different distances and track proximity to hole. (15 min)",
            "Half-wedge ladder: From 30, 50, 70, 90 yards — 5 balls each, tracking dispersion. (25 min)",
        ],
        "short_game": [
            "Up-and-down challenge: From 5 different greenside lies, attempt up-and-down. Track success rate. (20 min)",
            "Bunker square drill: Draw a 3x3 foot square in the bunker, aim to land all shots in the square. (15 min)",
            "Chipping ladder: Chip to 3 tees at 10, 20, 30 feet. Hit 5 to each, count how many finish within 2 feet. (20 min)",
            "Fringe putting/chipping decision drill: Practice selecting and executing bump-and-run vs lob from fringe. (10 min)",
        ],
        "putting": [
            "3-foot circle drill: Place 8 tees in a circle at 3 feet from cup. Make all 8 in a row before moving on. (15 min)",
            "Speed control ladder: Putt to a tee at 10, 20, 30, 40 feet. Ball must finish within 18 inches. (20 min)",
            "Gate drill: Place two tees slightly wider than putter head 6 inches in front of ball as a gate to ensure square face. (10 min)",
            "AimPoint reading practice: Walk to 4 different putts and practice reading break before putting. (15 min)",
        ],
        "course_management": [
            "Course management journal: After each shot in practice, write down club selection rationale. (ongoing)",
            "Lay-up accuracy drill: On a hole you can't reach in regulation, practice hitting to your exact intended lay-up yardage. (10 min)",
            "Par drill: Play 9 holes aiming only for bogey or better — no heroic shots. Track decision quality. (45 min)",
        ],
    }

    for area, pct in sorted(allocation.items(), key=lambda x: x[1], reverse=True):
        if pct >= 10.0 and area in drill_library:
            hours_on_area = practice_hours * pct / 100.0
            num_drills = max(1, min(3, int(hours_on_area / 0.3)))
            for drill in drill_library[area][:num_drills]:
                drills.append(f"[{_area_display_name(area)}] {drill}")

    return drills


def _generate_tracking_goals(allocation: Dict[str, float]) -> List[str]:
    """Generate specific on-course tracking goals."""
    tracking_map = {
        "driving": "Track fairways hit — aim to improve by 10% over next 3 rounds",
        "approach": "Track GIR and proximity to hole on approach shots",
        "short_game": "Track up-and-down conversion rate from greenside misses",
        "putting": "Track 3-putt frequency and putts per GIR hole",
        "course_management": "Track penalty strokes and lay-up decisions that led to bogey or better",
    }

    goals = []
    for area, pct in sorted(allocation.items(), key=lambda x: x[1], reverse=True):
        if pct >= 10.0 and area in tracking_map:
            goals.append(tracking_map[area])

    if not goals:
        goals = list(tracking_map.values())[:3]

    return goals


def _area_display_name(area: str) -> str:
    names = {
        "driving": "Driving & Tee Shots",
        "approach": "Approach Play (Iron Game)",
        "short_game": "Short Game (Chipping & Bunkers)",
        "putting": "Putting",
        "course_management": "Course Management",
    }
    return names.get(area, area.replace("_", " ").title())


def _goal_display(goal: str) -> str:
    displays = {
        "lower_handicap": "Lower Handicap",
        "improve_putting": "Improve Putting",
        "hit_more_fairways": "Hit More Fairways",
        "more_greens": "Hit More Greens in Regulation",
        "improve_short_game": "Improve Short Game",
        "reduce_penalties": "Reduce Penalty Strokes",
    }
    return displays.get(goal, goal.replace("_", " ").title())
