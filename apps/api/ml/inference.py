"""
Inference utilities for golf score prediction.

Provides both a deterministic (formula-based) fallback and a model-backed
prediction path. The public entry point is model_predict().
"""

import logging
import os
from typing import Optional

import numpy as np
from scipy import stats

from .features import FEATURE_COLUMNS, build_feature_vector, validate_features

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Confidence level
# ---------------------------------------------------------------------------


def get_confidence_level(n_rounds: int, model_loaded: bool) -> str:
    """
    Determine the confidence level for a prediction.

    Args:
        n_rounds: Number of recorded rounds for the player.
        model_loaded: Whether the ML model is available.

    Returns:
        "low"    if n_rounds < 5
        "medium" if 5 <= n_rounds < 15
        "high"   if n_rounds >= 15 and model_loaded
    """
    if n_rounds < 5:
        return "low"
    if n_rounds < 15:
        return "medium"
    if model_loaded:
        return "high"
    return "medium"


# ---------------------------------------------------------------------------
# Break probability
# ---------------------------------------------------------------------------


def compute_break_probability(
    expected_score: float, std: float, threshold: float
) -> float:
    """
    Probability of breaking (scoring strictly below) a given threshold.

    Uses the normal CDF: P(score < threshold) = CDF(threshold; mu, sigma).

    Args:
        expected_score: Mean of the predicted score distribution.
        std: Standard deviation of the score distribution.
        threshold: Target score to break (e.g., 90, 80, 75).

    Returns:
        Probability in [0, 1].
    """
    if std <= 0:
        std = 1e-6
    return float(stats.norm.cdf(threshold, loc=expected_score, scale=std))


# ---------------------------------------------------------------------------
# Deterministic (formula-based) prediction
# ---------------------------------------------------------------------------


def deterministic_predict(
    scoring_average: float,
    score_std: float,
    course_rating: float,
    course_par: float,
    slope_rating: float,
    handicap: float,
) -> dict:
    """
    Predict next round score using statistical formulas (no ML model required).

    Args:
        scoring_average: Player's recent scoring average.
        score_std: Standard deviation of recent scores (0 if unknown).
        course_rating: USGA course rating.
        course_par: Par for the course.
        slope_rating: USGA slope rating.
        handicap: Player's current handicap index.

    Returns:
        dict with keys:
            expected_score, score_p10, score_p50, score_p90,
            probability_break_90, probability_break_80, probability_break_75,
            predicted_handicap, confidence_level, explanation
    """
    # Core expected score formula
    expected_score = (
        scoring_average
        + (course_rating - 72.0) * 0.3
        + max(0.0, slope_rating - 113.0) * 0.05
    )

    # Uncertainty
    uncertainty = max(3.0, score_std * 1.2) if score_std > 0 else 5.0

    # Percentile predictions (normal distribution)
    score_p10 = float(stats.norm.ppf(0.10, loc=expected_score, scale=uncertainty))
    score_p50 = float(stats.norm.ppf(0.50, loc=expected_score, scale=uncertainty))
    score_p90 = float(stats.norm.ppf(0.90, loc=expected_score, scale=uncertainty))

    # Break probabilities
    prob_break_90 = compute_break_probability(expected_score, uncertainty, 90.0)
    prob_break_80 = compute_break_probability(expected_score, uncertainty, 80.0)
    prob_break_75 = compute_break_probability(expected_score, uncertainty, 75.0)

    # Rough handicap estimate from expected score relative to course par
    predicted_handicap = max(0.0, round(expected_score - course_par - course_rating + 72.0, 1))

    confidence_level = "low"  # deterministic fallback is inherently low confidence

    explanation = (
        f"Deterministic forecast: scoring average {scoring_average:.1f} adjusted for "
        f"course rating {course_rating:.1f} and slope {slope_rating:.0f}. "
        f"Expected score {expected_score:.1f} ± {uncertainty:.1f} strokes (1 SD)."
    )

    return {
        "expected_score": round(expected_score, 2),
        "score_p10": round(score_p10, 2),
        "score_p50": round(score_p50, 2),
        "score_p90": round(score_p90, 2),
        "probability_break_90": round(prob_break_90, 4),
        "probability_break_80": round(prob_break_80, 4),
        "probability_break_75": round(prob_break_75, 4),
        "predicted_handicap": predicted_handicap,
        "confidence_level": confidence_level,
        "explanation": explanation,
    }


# ---------------------------------------------------------------------------
# Model-backed prediction
# ---------------------------------------------------------------------------


def model_predict(
    profile: dict,
    metrics: dict,
    course_scenario: dict,
    artifacts_dir: str,
) -> dict:
    """
    Predict the next round score using the ML model (with deterministic fallback).

    Attempts to load GolfMLModel from artifacts_dir. If the model loads
    successfully, builds a feature vector and runs ensemble inference.
    Falls back to deterministic_predict() if loading fails or features
    are invalid.

    Args:
        profile: Player profile dict (age, years_playing, current_handicap,
                 practice_hours_per_week, n_rounds).
        metrics: Performance metrics dict (scoring_average_recent,
                 score_std_recent, fairway_pct, gir_pct, putts_per_round,
                 penalties_per_round, scrambling_pct, par3_avg, par4_avg,
                 par5_avg).
        course_scenario: Course info dict (course_rating, slope_rating,
                         par, yardage).
        artifacts_dir: Directory containing saved model artifacts.

    Returns:
        Full prediction dict (same structure as deterministic_predict()
        plus model_used: "ml_ensemble" | "deterministic").
    """
    # Common fields needed for both paths
    scoring_average = metrics.get("scoring_average_recent", 90.0)
    score_std = metrics.get("score_std_recent", 0.0)
    course_rating = course_scenario.get("course_rating", 72.0)
    course_par = course_scenario.get("par", 72.0)
    slope_rating = course_scenario.get("slope_rating", 113.0)
    handicap = profile.get("current_handicap", 18.0)
    n_rounds = profile.get("n_rounds", 0)

    model_loaded = False
    golf_model = None

    # --- Attempt to load the ML model ---
    try:
        # Import here to avoid circular imports at module level
        from .model import GolfMLModel  # noqa: PLC0415

        metadata_path = os.path.join(artifacts_dir, "metadata.json")
        if os.path.exists(metadata_path):
            golf_model = GolfMLModel.load(artifacts_dir)
            model_loaded = golf_model.is_trained
        else:
            logger.info("No model artifacts found at %s. Using deterministic fallback.", artifacts_dir)
    except Exception as exc:
        logger.warning("Model load failed: %s. Falling back to deterministic prediction.", exc)

    confidence = get_confidence_level(n_rounds, model_loaded)

    # --- ML path ---
    if model_loaded and golf_model is not None:
        feature_dict = build_feature_vector(profile, metrics, course_scenario)
        is_valid, missing = validate_features(feature_dict)

        if is_valid:
            try:
                import numpy as np  # noqa: PLC0415

                feature_array = np.array(
                    [[feature_dict[col] for col in FEATURE_COLUMNS]], dtype=float
                )

                # Apply scaler if available
                if golf_model.scaler is not None:
                    feature_array = golf_model.scaler.transform(feature_array)

                raw_pred = float(golf_model.predict(feature_array)[0])
                uncertainty = max(3.0, score_std * 1.2) if score_std > 0 else 5.0

                from scipy import stats as _stats  # noqa: PLC0415

                score_p10 = round(float(_stats.norm.ppf(0.10, loc=raw_pred, scale=uncertainty)), 2)
                score_p50 = round(float(_stats.norm.ppf(0.50, loc=raw_pred, scale=uncertainty)), 2)
                score_p90 = round(float(_stats.norm.ppf(0.90, loc=raw_pred, scale=uncertainty)), 2)

                prob_break_90 = compute_break_probability(raw_pred, uncertainty, 90.0)
                prob_break_80 = compute_break_probability(raw_pred, uncertainty, 80.0)
                prob_break_75 = compute_break_probability(raw_pred, uncertainty, 75.0)

                predicted_handicap = max(
                    0.0,
                    round(raw_pred - course_par - course_rating + 72.0, 1),
                )

                return {
                    "expected_score": round(raw_pred, 2),
                    "score_p10": score_p10,
                    "score_p50": score_p50,
                    "score_p90": score_p90,
                    "probability_break_90": round(prob_break_90, 4),
                    "probability_break_80": round(prob_break_80, 4),
                    "probability_break_75": round(prob_break_75, 4),
                    "predicted_handicap": predicted_handicap,
                    "confidence_level": confidence,
                    "explanation": (
                        f"ML ensemble (GBR + MLP) prediction. "
                        f"Expected score {raw_pred:.1f} ± {uncertainty:.1f} strokes (1 SD). "
                        f"Confidence: {confidence}."
                    ),
                    "model_used": "ml_ensemble",
                }
            except Exception as exc:
                logger.warning("ML inference failed: %s. Falling back to deterministic.", exc)
        else:
            logger.warning(
                "Feature validation failed — missing: %s. Using deterministic fallback.", missing
            )

    # --- Deterministic fallback ---
    result = deterministic_predict(
        scoring_average=scoring_average,
        score_std=score_std,
        course_rating=course_rating,
        course_par=course_par,
        slope_rating=slope_rating,
        handicap=handicap,
    )
    result["confidence_level"] = confidence
    result["model_used"] = "deterministic"
    return result
