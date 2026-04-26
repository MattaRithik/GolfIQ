from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import statistics
import math
from scipy.stats import norm

from database import get_db
from config import settings
from models import Profile, Round
from schemas import PredictScoreRequest, PredictScoreResponse
from analytics.handicap import calculate_handicap_differential, estimate_handicap

router = APIRouter(tags=["predict"])

MODEL_VERSION = "v1.0-statistical-baseline"


def _break_probability(expected: float, std: float, threshold: float) -> float:
    """Probability the score is strictly below `threshold` under N(expected, std)."""
    if std <= 0:
        return 1.0 if expected < threshold else 0.0
    return float(norm.cdf((threshold - expected) / std))


def _confidence_level(n_rounds: int, model_loaded: bool = False) -> str:
    if n_rounds < 5:
        return "low"
    if n_rounds < 15:
        return "medium"
    return "high" if model_loaded else "medium"


def _handicap_trend(scores: list[int]) -> str:
    """Compare recent half vs older half. Lower is improving."""
    if len(scores) < 6:
        return "stable"
    half = len(scores) // 2
    recent = statistics.mean(scores[:half])
    older = statistics.mean(scores[half:])
    if recent < older - 0.7:
        return "improving"
    if recent > older + 0.7:
        return "declining"
    return "stable"


@router.post("/predict-score", response_model=PredictScoreResponse)
async def predict_score(
    payload: PredictScoreRequest,
    db: AsyncSession = Depends(get_db),
) -> PredictScoreResponse:
    """
    Predict a golfer's expected score for a given course based on their round history.

    Returns expected score, p10/p50/p90 score range, break probabilities (75/80/90),
    predicted handicap, confidence level, and an explanation. Uses a statistical
    baseline model; a trained ML model can be used when available via /model/train.
    """
    # Fetch profile
    profile_result = await db.execute(select(Profile).where(Profile.id == payload.profile_id))
    profile = profile_result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {payload.profile_id} not found.",
        )

    # Fetch recent rounds (most recent first)
    rounds_result = await db.execute(
        select(Round)
        .where(Round.profile_id == payload.profile_id)
        .where(Round.total_score.is_not(None))
        .order_by(Round.date_played.desc())
        .limit(payload.num_rounds_lookback)
    )
    rounds = rounds_result.scalars().all()

    if len(rounds) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Not enough scored rounds to generate a prediction. "
                f"Found {len(rounds)} — need at least 3. Add rounds via POST /rounds."
            ),
        )

    scores = [r.total_score for r in rounds]
    mean_score = statistics.mean(scores)
    std_dev = statistics.stdev(scores) if len(scores) > 1 else 3.0
    std_dev = max(std_dev, 2.0)  # floor uncertainty

    # Compute differentials and estimate handicap
    differentials = []
    for r in rounds:
        diff = calculate_handicap_differential(r.total_score, 72.0, 113.0)
        differentials.append(diff)
    estimated_handicap = estimate_handicap(differentials)

    # Course difficulty adjustment
    course_rating = payload.course_rating or 72.0
    slope_rating = payload.slope_rating or 113.0
    weather_factor = payload.weather_factor or 0.0

    rating_adjustment = course_rating - 72.0
    slope_adjustment = (slope_rating - 113.0) / 113.0 * max(estimated_handicap, 0) * 0.1
    expected_score = mean_score + rating_adjustment + slope_adjustment + weather_factor

    # Score percentiles via normal approx
    z10, z90 = norm.ppf(0.10), norm.ppf(0.90)
    score_p10 = expected_score + z10 * std_dev
    score_p50 = expected_score
    score_p90 = expected_score + z90 * std_dev

    # 90% confidence interval (1.645 z-score)
    margin = 1.645 * std_dev
    ci_low = expected_score - margin
    ci_high = expected_score + margin

    # Break probabilities (P(score < threshold))
    p_break_90 = _break_probability(expected_score, std_dev, 90.0)
    p_break_80 = _break_probability(expected_score, std_dev, 80.0)
    p_break_75 = _break_probability(expected_score, std_dev, 75.0)

    # Trend & confidence
    handicap_trend = _handicap_trend(scores)
    conf_level = _confidence_level(len(scores), model_loaded=False)

    # Explanation
    direction = "easier" if rating_adjustment + slope_adjustment < 0 else "harder"
    explanation = (
        f"Based on your last {len(scores)} rounds (avg {mean_score:.1f}, σ {std_dev:.1f}), "
        f"your expected score on this course is {expected_score:.1f}. "
        f"Course rating {course_rating} and slope {slope_rating} suggest the course plays "
        f"{direction} than a standard 72.0/113. "
        f"Your handicap trend is {handicap_trend}. Confidence: {conf_level} ({len(scores)} rounds)."
    )

    features_used = {
        "num_rounds": len(scores),
        "historical_mean_score": round(mean_score, 2),
        "historical_std_dev": round(std_dev, 2),
        "estimated_handicap": estimated_handicap,
        "course_rating": course_rating,
        "slope_rating": slope_rating,
        "rating_adjustment": round(rating_adjustment, 2),
        "slope_adjustment": round(slope_adjustment, 2),
        "weather_factor": weather_factor,
    }

    return PredictScoreResponse(
        profile_id=payload.profile_id,
        predicted_score=round(expected_score, 1),
        expected_score=round(expected_score, 1),
        score_p10=round(score_p10, 1),
        score_p50=round(score_p50, 1),
        score_p90=round(score_p90, 1),
        confidence_interval_low=round(ci_low, 1),
        confidence_interval_high=round(ci_high, 1),
        probability_break_90=round(p_break_90, 4),
        probability_break_80=round(p_break_80, 4),
        probability_break_75=round(p_break_75, 4),
        predicted_handicap=estimated_handicap,
        confidence_level=conf_level,
        handicap_trend=handicap_trend,
        model_version=MODEL_VERSION,
        explanation=explanation,
        features_used=features_used,
    )
