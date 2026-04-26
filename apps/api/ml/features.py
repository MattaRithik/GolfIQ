"""
Feature definitions and utilities for the golf ML model.
"""

FEATURE_COLUMNS = [
    "age",
    "years_playing",
    "current_handicap",
    "scoring_average_recent",
    "score_std_recent",
    "fairway_pct",
    "gir_pct",
    "putts_per_round",
    "penalties_per_round",
    "scrambling_pct",
    "par3_avg",
    "par4_avg",
    "par5_avg",
    "course_rating",
    "slope_rating",
    "par",
    "yardage",
    "practice_hours_per_week",
]

TARGET_COLUMN = "next_round_score"


def build_feature_vector(profile: dict, metrics: dict, course_scenario: dict) -> dict:
    """
    Build a flat feature dict from profile, metrics, and course_scenario.

    Args:
        profile: dict containing player profile fields (age, years_playing,
                 current_handicap, practice_hours_per_week)
        metrics: dict containing performance metrics (scoring_average_recent,
                 score_std_recent, fairway_pct, gir_pct, putts_per_round,
                 penalties_per_round, scrambling_pct, par3_avg, par4_avg, par5_avg)
        course_scenario: dict containing course details (course_rating, slope_rating,
                         par, yardage)

    Returns:
        dict with all FEATURE_COLUMNS as keys.
    """
    feature_vector = {
        # From profile
        "age": profile.get("age"),
        "years_playing": profile.get("years_playing"),
        "current_handicap": profile.get("current_handicap"),
        "practice_hours_per_week": profile.get("practice_hours_per_week"),
        # From metrics
        "scoring_average_recent": metrics.get("scoring_average_recent"),
        "score_std_recent": metrics.get("score_std_recent"),
        "fairway_pct": metrics.get("fairway_pct"),
        "gir_pct": metrics.get("gir_pct"),
        "putts_per_round": metrics.get("putts_per_round"),
        "penalties_per_round": metrics.get("penalties_per_round"),
        "scrambling_pct": metrics.get("scrambling_pct"),
        "par3_avg": metrics.get("par3_avg"),
        "par4_avg": metrics.get("par4_avg"),
        "par5_avg": metrics.get("par5_avg"),
        # From course_scenario
        "course_rating": course_scenario.get("course_rating"),
        "slope_rating": course_scenario.get("slope_rating"),
        "par": course_scenario.get("par"),
        "yardage": course_scenario.get("yardage"),
    }
    return feature_vector


def validate_features(feature_dict: dict) -> tuple[bool, list[str]]:
    """
    Validate that all required feature columns are present and non-None.

    Args:
        feature_dict: dict to validate against FEATURE_COLUMNS.

    Returns:
        (is_valid, missing_fields) where is_valid is True if all fields
        are present and non-None, and missing_fields is a list of any
        columns that are missing or None.
    """
    missing_fields = [
        col for col in FEATURE_COLUMNS
        if col not in feature_dict or feature_dict[col] is None
    ]
    is_valid = len(missing_fields) == 0
    return is_valid, missing_fields
