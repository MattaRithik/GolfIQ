"""
Handicap calculation utilities following USGA/WHS methodology.
"""
from typing import List


def calculate_handicap_differential(
    score: int,
    course_rating: float,
    slope_rating: float,
    playing_conditions_calc: float = 0.0,
) -> float:
    """
    Compute the handicap differential for a single round.

    Formula (WHS):
        differential = (adjusted_gross_score - course_rating - PCC) * 113 / slope_rating

    Args:
        score: Adjusted gross score for the round.
        course_rating: Course rating (typically 67–77).
        slope_rating: Slope rating (55–155, standard is 113).
        playing_conditions_calc: Playing Conditions Calculation adjustment (default 0).

    Returns:
        Handicap differential rounded to one decimal place.
    """
    if slope_rating <= 0:
        raise ValueError("slope_rating must be positive")
    differential = (score - course_rating - playing_conditions_calc) * 113.0 / slope_rating
    return round(differential, 1)


def estimate_handicap(differentials: List[float]) -> float:
    """
    Estimate a handicap index from a list of handicap differentials.

    WHS methodology:
    - Uses the best differentials from the most recent 20 rounds.
    - Number of differentials used depends on how many rounds are available.
    - Multiply the average of the selected differentials by 0.96.

    Args:
        differentials: List of handicap differentials (most recent first or any order).

    Returns:
        Estimated handicap index rounded to one decimal place.
        Returns 54.0 if no differentials are provided.
    """
    if not differentials:
        return 54.0

    # Use at most the 20 most recent rounds
    recent = differentials[:20]
    count = len(recent)

    # WHS lookup table: number of rounds -> number of best differentials to use
    whs_table = {
        1: (1, -2.0),
        2: (1, -1.0),
        3: (1, 0.0),
        4: (1, 0.0),
        5: (1, 0.0),
        6: (2, 0.0),
        7: (2, 0.0),
        8: (2, 0.0),
        9: (3, 0.0),
        10: (3, 0.0),
        11: (3, 0.0),
        12: (4, 0.0),
        13: (4, 0.0),
        14: (4, 0.0),
        15: (5, 0.0),
        16: (5, 0.0),
        17: (6, 0.0),
        18: (6, 0.0),
        19: (7, 0.0),
        20: (8, 0.0),
    }

    num_best, adjustment = whs_table.get(count, (8, 0.0))

    sorted_diffs = sorted(recent)
    selected = sorted_diffs[:num_best]
    average = sum(selected) / len(selected)
    handicap_index = (average * 0.96) + adjustment

    # Cap between -10.0 and 54.0 per WHS
    handicap_index = max(-10.0, min(54.0, handicap_index))
    return round(handicap_index, 1)


def classify_player_level(handicap: float) -> str:
    """
    Classify a golfer's playing level based on their handicap index.

    Args:
        handicap: Handicap index value.

    Returns:
        A string label describing the player level.
    """
    if handicap < 0:
        return "plus_handicap"
    elif handicap < 2:
        return "scratch"
    elif handicap < 6:
        return "5_handicap"
    elif handicap < 11:
        return "10_handicap"
    elif handicap < 16:
        return "15_handicap"
    elif handicap < 21:
        return "20_handicap"
    elif handicap < 29:
        return "25_handicap"
    else:
        return "high_handicap"
