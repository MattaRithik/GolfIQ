"""
create_seed_data.py
-------------------
Creates seed CSV files for the GolfIQ Benchmark project.

All values are MVP seed estimates — not official statistics.
Files are written to ../../data/seed/ relative to this script's location.

Run:
    python scripts/data_ingestion/create_seed_data.py
"""

import csv
import os
from pathlib import Path

# Resolve seed output directory relative to this script
SCRIPT_DIR = Path(__file__).resolve().parent
SEED_DIR = SCRIPT_DIR / ".." / ".." / "data" / "seed"
SEED_DIR = SEED_DIR.resolve()

SOURCE = "MVP Seed Data - Not Official Statistics"
SEASON = "2024"


# ---------------------------------------------------------------------------
# 1. benchmarks.csv
# ---------------------------------------------------------------------------

def create_benchmarks():
    """
    Creates benchmark_group-level aggregate metrics for 11 player segments.
    sg_* values are proportional estimates, not ShotLink data.
    """
    rows = []

    groups = [
        {
            "benchmark_group": "25_handicap",
            "scoring_average": 97.0,
            "fairway_percentage": 45.0,
            "gir_percentage": 22.0,
            "putts_per_round": 36.0,
            "scrambling_percentage": 15.0,
            "penalties_per_round": 2.1,
            "driving_distance": 210.0,
            "sg_total_estimate": -7.5,
            "sg_tee_estimate": -1.8,
            "sg_approach_estimate": -2.8,
            "sg_short_game_estimate": -1.5,
            "sg_putting_estimate": -1.4,
        },
        {
            "benchmark_group": "20_handicap",
            "scoring_average": 92.0,
            "fairway_percentage": 52.0,
            "gir_percentage": 28.0,
            "putts_per_round": 34.0,
            "scrambling_percentage": 22.0,
            "penalties_per_round": 1.6,
            "driving_distance": 220.0,
            "sg_total_estimate": -5.5,
            "sg_tee_estimate": -1.4,
            "sg_approach_estimate": -2.0,
            "sg_short_game_estimate": -1.1,
            "sg_putting_estimate": -1.0,
        },
        {
            "benchmark_group": "15_handicap",
            "scoring_average": 87.0,
            "fairway_percentage": 58.0,
            "gir_percentage": 34.0,
            "putts_per_round": 33.0,
            "scrambling_percentage": 28.0,
            "penalties_per_round": 1.2,
            "driving_distance": 228.0,
            "sg_total_estimate": -3.5,
            "sg_tee_estimate": -1.0,
            "sg_approach_estimate": -1.3,
            "sg_short_game_estimate": -0.7,
            "sg_putting_estimate": -0.5,
        },
        {
            "benchmark_group": "10_handicap",
            "scoring_average": 82.0,
            "fairway_percentage": 63.0,
            "gir_percentage": 40.0,
            "putts_per_round": 32.0,
            "scrambling_percentage": 35.0,
            "penalties_per_round": 0.9,
            "driving_distance": 235.0,
            "sg_total_estimate": -2.0,
            "sg_tee_estimate": -0.6,
            "sg_approach_estimate": -0.8,
            "sg_short_game_estimate": -0.4,
            "sg_putting_estimate": -0.2,
        },
        {
            "benchmark_group": "5_handicap",
            "scoring_average": 77.0,
            "fairway_percentage": 68.0,
            "gir_percentage": 48.0,
            "putts_per_round": 31.0,
            "scrambling_percentage": 45.0,
            "penalties_per_round": 0.6,
            "driving_distance": 245.0,
            "sg_total_estimate": -0.8,
            "sg_tee_estimate": -0.2,
            "sg_approach_estimate": -0.3,
            "sg_short_game_estimate": -0.2,
            "sg_putting_estimate": -0.1,
        },
        {
            "benchmark_group": "scratch",
            "scoring_average": 72.0,
            "fairway_percentage": 72.0,
            "gir_percentage": 58.0,
            "putts_per_round": 30.0,
            "scrambling_percentage": 58.0,
            "penalties_per_round": 0.4,
            "driving_distance": 255.0,
            "sg_total_estimate": 0.0,
            "sg_tee_estimate": 0.0,
            "sg_approach_estimate": 0.0,
            "sg_short_game_estimate": 0.0,
            "sg_putting_estimate": 0.0,
        },
        {
            "benchmark_group": "elite_junior",
            "scoring_average": 74.0,
            "fairway_percentage": 70.0,
            "gir_percentage": 55.0,
            "putts_per_round": 30.0,
            "scrambling_percentage": 55.0,
            "penalties_per_round": 0.5,
            "driving_distance": 252.0,
            "sg_total_estimate": -0.3,
            "sg_tee_estimate": -0.1,
            "sg_approach_estimate": -0.1,
            "sg_short_game_estimate": -0.05,
            "sg_putting_estimate": -0.05,
        },
        {
            "benchmark_group": "college_golfer",
            "scoring_average": 73.0,
            "fairway_percentage": 71.0,
            "gir_percentage": 60.0,
            "putts_per_round": 29.5,
            "scrambling_percentage": 60.0,
            "penalties_per_round": 0.3,
            "driving_distance": 265.0,
            "sg_total_estimate": 0.5,
            "sg_tee_estimate": 0.2,
            "sg_approach_estimate": 0.15,
            "sg_short_game_estimate": 0.1,
            "sg_putting_estimate": 0.05,
        },
        {
            "benchmark_group": "elite_amateur",
            "scoring_average": 71.0,
            "fairway_percentage": 74.0,
            "gir_percentage": 65.0,
            "putts_per_round": 29.0,
            "scrambling_percentage": 65.0,
            "penalties_per_round": 0.3,
            "driving_distance": 272.0,
            "sg_total_estimate": 1.2,
            "sg_tee_estimate": 0.4,
            "sg_approach_estimate": 0.4,
            "sg_short_game_estimate": 0.25,
            "sg_putting_estimate": 0.15,
        },
        {
            "benchmark_group": "pga_tour_average",
            "scoring_average": 70.5,
            "fairway_percentage": 60.0,
            "gir_percentage": 67.0,
            "putts_per_round": 28.5,
            "scrambling_percentage": 59.0,
            "penalties_per_round": 0.2,
            "driving_distance": 295.0,
            "sg_total_estimate": 2.8,
            "sg_tee_estimate": 0.9,
            "sg_approach_estimate": 0.9,
            "sg_short_game_estimate": 0.5,
            "sg_putting_estimate": 0.5,
        },
        {
            "benchmark_group": "pga_tour_top10",
            "scoring_average": 68.5,
            "fairway_percentage": 62.0,
            "gir_percentage": 72.0,
            "putts_per_round": 28.0,
            "scrambling_percentage": 65.0,
            "penalties_per_round": 0.1,
            "driving_distance": 305.0,
            "sg_total_estimate": 4.5,
            "sg_tee_estimate": 1.3,
            "sg_approach_estimate": 1.5,
            "sg_short_game_estimate": 0.8,
            "sg_putting_estimate": 0.9,
        },
    ]

    metric_keys = [
        "scoring_average",
        "fairway_percentage",
        "gir_percentage",
        "putts_per_round",
        "scrambling_percentage",
        "penalties_per_round",
        "driving_distance",
        "sg_total_estimate",
        "sg_tee_estimate",
        "sg_approach_estimate",
        "sg_short_game_estimate",
        "sg_putting_estimate",
    ]

    for group in groups:
        for key in metric_keys:
            rows.append({
                "benchmark_group": group["benchmark_group"],
                "metric_name": key,
                "metric_value": group[key],
                "source": SOURCE,
                "season": SEASON,
            })

    filepath = SEED_DIR / "benchmarks.csv"
    fieldnames = ["benchmark_group", "metric_name", "metric_value", "source", "season"]
    _write_csv(filepath, fieldnames, rows)
    print(f"  Created: {filepath}  ({len(rows)} rows)")


# ---------------------------------------------------------------------------
# 2. demo_profile.csv
# ---------------------------------------------------------------------------

def create_demo_profile():
    rows = [
        {
            "full_name": "Demo Junior Golfer",
            "age": 16,
            "gender": "Male",
            "height_cm": 175,
            "weight_kg": 68,
            "dominant_hand": "Right",
            "years_playing": 5,
            "current_handicap": 12.0,
            "goal": "Break 78 consistently",
            "practice_hours_per_week": 8.0,
            "fitness_notes": "No injuries - focusing on approach play improvement",
        }
    ]
    filepath = SEED_DIR / "demo_profile.csv"
    fieldnames = [
        "full_name", "age", "gender", "height_cm", "weight_kg",
        "dominant_hand", "years_playing", "current_handicap",
        "goal", "practice_hours_per_week", "fitness_notes",
    ]
    _write_csv(filepath, fieldnames, rows)
    print(f"  Created: {filepath}  ({len(rows)} rows)")


# ---------------------------------------------------------------------------
# 3. demo_rounds.csv
# ---------------------------------------------------------------------------

def create_demo_rounds():
    """10 rounds over past ~6 months, scores 80–91."""
    rows = [
        {
            "course_name": "Riverview Country Club",
            "location": "Austin, TX",
            "tee_box": "Blue",
            "played_at": "2023-10-14",
            "par": 72,
            "score": 85,
            "course_rating": 71.4,
            "slope_rating": 128,
            "weather": "Sunny, light breeze",
            "round_type": "Casual",
            "notes": "Good ball striking, 3-putted 3 holes",
        },
        {
            "course_name": "Pinehurst Hills Golf Course",
            "location": "Houston, TX",
            "tee_box": "White",
            "played_at": "2023-10-28",
            "par": 71,
            "score": 83,
            "course_rating": 69.8,
            "slope_rating": 122,
            "weather": "Overcast, no wind",
            "round_type": "Casual",
            "notes": "Best ball striking round of the fall, short game was shaky",
        },
        {
            "course_name": "Lakewood Junior Invitational - Round 1",
            "location": "Dallas, TX",
            "tee_box": "Blue",
            "played_at": "2023-11-11",
            "par": 72,
            "score": 88,
            "course_rating": 72.1,
            "slope_rating": 132,
            "weather": "Cold, 45F, gusty wind",
            "round_type": "Tournament",
            "notes": "Wind made scoring tough, drove it well",
        },
        {
            "course_name": "Lakewood Junior Invitational - Round 2",
            "location": "Dallas, TX",
            "tee_box": "Blue",
            "played_at": "2023-11-12",
            "par": 72,
            "score": 84,
            "course_rating": 72.1,
            "slope_rating": 132,
            "weather": "Partly cloudy, calm",
            "round_type": "Tournament",
            "notes": "Rebounded well — scrambling saved several holes",
        },
        {
            "course_name": "Creekside Golf Club",
            "location": "San Antonio, TX",
            "tee_box": "White",
            "played_at": "2023-12-02",
            "par": 72,
            "score": 80,
            "course_rating": 70.2,
            "slope_rating": 120,
            "weather": "Mild, sunny",
            "round_type": "Casual",
            "notes": "Personal best — putted very well, only 29 putts",
        },
        {
            "course_name": "The Oaks Golf & Country Club",
            "location": "Austin, TX",
            "tee_box": "Blue",
            "played_at": "2023-12-23",
            "par": 72,
            "score": 91,
            "course_rating": 73.0,
            "slope_rating": 138,
            "weather": "Windy, 55F",
            "round_type": "Casual",
            "notes": "Tough course, struggled with iron accuracy, 3 penalty shots",
        },
        {
            "course_name": "Riverview Country Club",
            "location": "Austin, TX",
            "tee_box": "Blue",
            "played_at": "2024-01-13",
            "par": 72,
            "score": 82,
            "course_rating": 71.4,
            "slope_rating": 128,
            "weather": "Clear, mild",
            "round_type": "Casual",
            "notes": "Good round — consistent ball striking, 31 putts",
        },
        {
            "course_name": "Meadow Brook Links",
            "location": "Round Rock, TX",
            "tee_box": "White",
            "played_at": "2024-01-27",
            "par": 71,
            "score": 87,
            "course_rating": 70.5,
            "slope_rating": 124,
            "weather": "Foggy morning, cleared by back nine",
            "round_type": "Casual",
            "notes": "Slow start, improved on back nine",
        },
        {
            "course_name": "State Junior Qualifier",
            "location": "Georgetown, TX",
            "tee_box": "Blue",
            "played_at": "2024-02-10",
            "par": 72,
            "score": 86,
            "course_rating": 72.3,
            "slope_rating": 131,
            "weather": "Sunny, warm for February",
            "round_type": "Tournament",
            "notes": "Pressure affected putting early, settled down on back nine",
        },
        {
            "course_name": "Cedar Valley Golf Course",
            "location": "Pflugerville, TX",
            "tee_box": "White",
            "played_at": "2024-02-24",
            "par": 72,
            "score": 84,
            "course_rating": 70.9,
            "slope_rating": 126,
            "weather": "Cloudy, light rain on holes 14-16",
            "round_type": "Casual",
            "notes": "Handled adverse conditions well, approach shots improving",
        },
    ]

    filepath = SEED_DIR / "demo_rounds.csv"
    fieldnames = [
        "course_name", "location", "tee_box", "played_at", "par",
        "score", "course_rating", "slope_rating", "weather", "round_type", "notes",
    ]
    _write_csv(filepath, fieldnames, rows)
    print(f"  Created: {filepath}  ({len(rows)} rows)")


# ---------------------------------------------------------------------------
# 4. demo_holes.csv  (round_index=0 = Riverview CC, 85 total)
# ---------------------------------------------------------------------------

def create_demo_holes():
    """
    18 holes for round_index=0 (Riverview CC, scored 85, par 72).
    Score breakdown: 13 over par = 85 total.
    """
    # par, yardage, score, fairway_result, gir, putts, penalties, sand_shots
    # fairway_result: Hit, Miss Left, Miss Right, N/A (par 3)
    holes = [
        # Hole  Par  Yds  Score  FWY             GIR    Putts  Pen  Sand
        (1,  4, 380,  5, "Miss Right",        False, 2, 0, 0),
        (2,  3, 165,  3, "N/A",               True,  2, 0, 0),
        (3,  5, 520,  6, "Hit",               False, 2, 0, 1),
        (4,  4, 395,  5, "Hit",               False, 2, 0, 0),
        (5,  4, 410,  5, "Miss Left",         False, 2, 1, 0),
        (6,  3, 195,  4, "N/A",               False, 2, 0, 1),
        (7,  5, 545,  5, "Hit",               True,  2, 0, 0),
        (8,  4, 360,  4, "Hit",               True,  1, 0, 0),
        (9,  4, 420,  5, "Miss Right",        False, 2, 0, 0),
        (10, 4, 375,  5, "Miss Left",          False, 2, 0, 0),
        (11, 3, 175,  3, "N/A",               True,  2, 0, 0),
        (12, 5, 530,  6, "Miss Left",         False, 3, 0, 0),
        (13, 4, 400,  5, "Hit",               False, 2, 0, 1),
        (14, 4, 385,  5, "Miss Right",        False, 2, 1, 0),
        (15, 3, 155,  3, "N/A",               True,  1, 0, 0),
        (16, 4, 415,  5, "Hit",               False, 3, 0, 0),
        (17, 5, 555,  6, "Hit",               True,  2, 0, 0),
        (18, 4, 390,  5, "Miss Right",         False, 2, 0, 0),
    ]

    # Validate total score = 85
    total = sum(h[3] for h in holes)
    assert total == 85, f"Hole scores sum to {total}, expected 85"

    rows = []
    for hole_number, par, yardage, score, fairway_result, gir, putts, penalties, sand_shots in holes:
        rows.append({
            "round_index": 0,
            "hole_number": hole_number,
            "par": par,
            "yardage": yardage,
            "score": score,
            "fairway_result": fairway_result,
            "green_in_regulation": gir,
            "putts": putts,
            "penalties": penalties,
            "sand_shots": sand_shots,
        })

    filepath = SEED_DIR / "demo_holes.csv"
    fieldnames = [
        "round_index", "hole_number", "par", "yardage", "score",
        "fairway_result", "green_in_regulation", "putts", "penalties", "sand_shots",
    ]
    _write_csv(filepath, fieldnames, rows)
    print(f"  Created: {filepath}  ({len(rows)} rows)")


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------

def _write_csv(filepath: Path, fieldnames: list, rows: list):
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print(f"\nGolfIQ Benchmark — Seed Data Generator")
    print(f"Output directory: {SEED_DIR}")
    print("-" * 55)

    SEED_DIR.mkdir(parents=True, exist_ok=True)

    create_benchmarks()
    create_demo_profile()
    create_demo_rounds()
    create_demo_holes()

    print("-" * 55)
    print("Done. All seed files written successfully.")
    print("\nNOTE: All values are MVP seed estimates.")
    print("      Source: 'MVP Seed Data - Not Official Statistics'")


if __name__ == "__main__":
    main()
