"""
Benchmark data and comparison utilities for GolfIQ.

NOTE: All benchmark values are MVP seed estimates based on publicly available
aggregate statistics (PGA Tour ShotLink, USGA handicap research, Golf Digest
skill surveys). They are intentionally simplified for the MVP and should be
replaced with statistically validated data in future versions.
"""
from typing import Dict, List, Any, Optional


# ---------------------------------------------------------------------------
# Seed benchmark data (MVP estimates)
# ---------------------------------------------------------------------------
BENCHMARK_DATA: Dict[str, Dict[str, float]] = {
    "25_handicap": {
        "handicap_midpoint": 25.0,
        "scoring_average": 97.0,
        "fairway_percentage": 42.0,
        "gir_percentage": 22.0,
        "putts_per_round": 36.5,
        "scrambling_percentage": 12.0,
        "penalties_per_round": 3.5,
        "driving_distance": 210.0,
        "sg_total_estimate": -8.5,
        "sg_tee_estimate": -1.5,
        "sg_approach_estimate": -3.2,
        "sg_short_game_estimate": -2.1,
        "sg_putting_estimate": -1.7,
    },
    "20_handicap": {
        "handicap_midpoint": 20.0,
        "scoring_average": 92.0,
        "fairway_percentage": 48.0,
        "gir_percentage": 28.0,
        "putts_per_round": 34.5,
        "scrambling_percentage": 18.0,
        "penalties_per_round": 2.8,
        "driving_distance": 220.0,
        "sg_total_estimate": -5.5,
        "sg_tee_estimate": -1.1,
        "sg_approach_estimate": -2.2,
        "sg_short_game_estimate": -1.3,
        "sg_putting_estimate": -0.9,
    },
    "15_handicap": {
        "handicap_midpoint": 15.0,
        "scoring_average": 87.0,
        "fairway_percentage": 55.0,
        "gir_percentage": 36.0,
        "putts_per_round": 33.0,
        "scrambling_percentage": 27.0,
        "penalties_per_round": 2.0,
        "driving_distance": 230.0,
        "sg_total_estimate": -3.0,
        "sg_tee_estimate": -0.7,
        "sg_approach_estimate": -1.3,
        "sg_short_game_estimate": -0.7,
        "sg_putting_estimate": -0.3,
    },
    "10_handicap": {
        "handicap_midpoint": 10.0,
        "scoring_average": 82.0,
        "fairway_percentage": 60.0,
        "gir_percentage": 44.0,
        "putts_per_round": 31.5,
        "scrambling_percentage": 38.0,
        "penalties_per_round": 1.4,
        "driving_distance": 240.0,
        "sg_total_estimate": -1.2,
        "sg_tee_estimate": -0.3,
        "sg_approach_estimate": -0.5,
        "sg_short_game_estimate": -0.2,
        "sg_putting_estimate": -0.2,
    },
    "5_handicap": {
        "handicap_midpoint": 5.0,
        "scoring_average": 77.0,
        "fairway_percentage": 66.0,
        "gir_percentage": 54.0,
        "putts_per_round": 30.5,
        "scrambling_percentage": 48.0,
        "penalties_per_round": 0.9,
        "driving_distance": 252.0,
        "sg_total_estimate": 0.5,
        "sg_tee_estimate": 0.1,
        "sg_approach_estimate": 0.2,
        "sg_short_game_estimate": 0.1,
        "sg_putting_estimate": 0.1,
    },
    "scratch": {
        "handicap_midpoint": 0.0,
        "scoring_average": 72.0,
        "fairway_percentage": 71.0,
        "gir_percentage": 63.0,
        "putts_per_round": 29.5,
        "scrambling_percentage": 57.0,
        "penalties_per_round": 0.6,
        "driving_distance": 265.0,
        "sg_total_estimate": 2.0,
        "sg_tee_estimate": 0.4,
        "sg_approach_estimate": 0.7,
        "sg_short_game_estimate": 0.5,
        "sg_putting_estimate": 0.4,
    },
    "elite_junior": {
        "handicap_midpoint": -1.0,
        "scoring_average": 71.0,
        "fairway_percentage": 68.0,
        "gir_percentage": 65.0,
        "putts_per_round": 29.0,
        "scrambling_percentage": 58.0,
        "penalties_per_round": 0.5,
        "driving_distance": 270.0,
        "sg_total_estimate": 2.5,
        "sg_tee_estimate": 0.5,
        "sg_approach_estimate": 0.9,
        "sg_short_game_estimate": 0.6,
        "sg_putting_estimate": 0.5,
    },
    "college_golfer": {
        "handicap_midpoint": -2.0,
        "scoring_average": 70.5,
        "fairway_percentage": 70.0,
        "gir_percentage": 67.0,
        "putts_per_round": 28.8,
        "scrambling_percentage": 61.0,
        "penalties_per_round": 0.4,
        "driving_distance": 278.0,
        "sg_total_estimate": 3.0,
        "sg_tee_estimate": 0.6,
        "sg_approach_estimate": 1.0,
        "sg_short_game_estimate": 0.8,
        "sg_putting_estimate": 0.6,
    },
    "elite_amateur": {
        "handicap_midpoint": -4.0,
        "scoring_average": 69.0,
        "fairway_percentage": 73.0,
        "gir_percentage": 71.0,
        "putts_per_round": 28.5,
        "scrambling_percentage": 64.0,
        "penalties_per_round": 0.3,
        "driving_distance": 285.0,
        "sg_total_estimate": 4.5,
        "sg_tee_estimate": 0.8,
        "sg_approach_estimate": 1.5,
        "sg_short_game_estimate": 1.2,
        "sg_putting_estimate": 1.0,
    },
    "pga_tour_average": {
        "handicap_midpoint": -7.0,
        "scoring_average": 70.3,
        "fairway_percentage": 60.9,
        "gir_percentage": 67.0,
        "putts_per_round": 28.5,
        "scrambling_percentage": 58.7,
        "penalties_per_round": 0.5,
        "driving_distance": 299.8,
        "sg_total_estimate": 6.0,
        "sg_tee_estimate": 1.0,
        "sg_approach_estimate": 2.2,
        "sg_short_game_estimate": 1.5,
        "sg_putting_estimate": 1.3,
    },
    "pga_tour_top10": {
        "handicap_midpoint": -9.0,
        "scoring_average": 68.8,
        "fairway_percentage": 63.0,
        "gir_percentage": 70.0,
        "putts_per_round": 27.8,
        "scrambling_percentage": 63.0,
        "penalties_per_round": 0.3,
        "driving_distance": 310.0,
        "sg_total_estimate": 8.0,
        "sg_tee_estimate": 1.4,
        "sg_approach_estimate": 3.0,
        "sg_short_game_estimate": 2.0,
        "sg_putting_estimate": 1.6,
    },
}

# Ordered list of benchmark keys by handicap level (worst to best)
BENCHMARK_ORDER = [
    "25_handicap",
    "20_handicap",
    "15_handicap",
    "10_handicap",
    "5_handicap",
    "scratch",
    "elite_junior",
    "college_golfer",
    "elite_amateur",
    "pga_tour_average",
    "pga_tour_top10",
]

# Metrics where lower is better
LOWER_IS_BETTER = {
    "scoring_average",
    "putts_per_round",
    "penalties_per_round",
    "sg_total_estimate",
    "sg_tee_estimate",
    "sg_approach_estimate",
    "sg_short_game_estimate",
    "sg_putting_estimate",
}

# Metrics where higher is better
HIGHER_IS_BETTER = {
    "fairway_percentage",
    "gir_percentage",
    "scrambling_percentage",
    "driving_distance",
}


def get_benchmark_data() -> List[Dict[str, Any]]:
    """Return all benchmark groups as a list of dicts with the group name included."""
    result = []
    for group_name in BENCHMARK_ORDER:
        entry = {"group": group_name, **BENCHMARK_DATA[group_name]}
        result.append(entry)
    return result


def find_closest_benchmark(handicap: float) -> str:
    """
    Find the benchmark group whose handicap midpoint is closest to the player's handicap.

    Args:
        handicap: Player's estimated handicap index.

    Returns:
        Name of the closest benchmark group.
    """
    best_group = BENCHMARK_ORDER[0]
    best_distance = abs(BENCHMARK_DATA[best_group]["handicap_midpoint"] - handicap)

    for group_name in BENCHMARK_ORDER[1:]:
        midpoint = BENCHMARK_DATA[group_name]["handicap_midpoint"]
        distance = abs(midpoint - handicap)
        if distance < best_distance:
            best_distance = distance
            best_group = group_name

    return best_group


def compute_skill_gaps(
    player_metrics: Dict[str, float],
    benchmark_name: str,
) -> Dict[str, Any]:
    """
    Compute the gap between a player's metrics and a benchmark group.

    Positive gap values indicate the player is worse than the benchmark.
    Negative gap values indicate the player outperforms the benchmark.

    Args:
        player_metrics: Dict of metric_name -> player_value.
        benchmark_name: Key of the benchmark group in BENCHMARK_DATA.

    Returns:
        Dict with per-metric gap analysis including gap value, direction,
        and a priority score (abs gap normalized to 0–10).
    """
    if benchmark_name not in BENCHMARK_DATA:
        raise ValueError(f"Unknown benchmark group: {benchmark_name}")

    benchmark = BENCHMARK_DATA[benchmark_name]
    gaps: Dict[str, Any] = {}

    metric_keys = LOWER_IS_BETTER | HIGHER_IS_BETTER
    for metric in metric_keys:
        if metric not in player_metrics or metric not in benchmark:
            continue

        player_val = float(player_metrics[metric])
        bench_val = float(benchmark[metric])

        if metric in LOWER_IS_BETTER:
            # Positive = player is worse (higher is worse)
            raw_gap = player_val - bench_val
        else:
            # Positive = player is worse (lower is worse)
            raw_gap = bench_val - player_val

        gaps[metric] = {
            "player_value": round(player_val, 2),
            "benchmark_value": round(bench_val, 2),
            "gap": round(raw_gap, 2),
            "player_is_behind": raw_gap > 0,
            "unit": _get_unit(metric),
        }

    # Compute priority score: normalize abs gap relative to reference ranges
    _attach_priority_scores(gaps)
    return gaps


def estimate_strokes_gained_proxy(
    player_metrics: Dict[str, float],
    benchmark_name: str,
) -> Dict[str, Any]:
    """
    Estimate strokes gained proxy values by comparing player metrics to a benchmark.

    This is a simplified proxy calculation, not a true shot-by-shot SG analysis.
    Values indicate approximate strokes gained/lost per round relative to benchmark.

    Args:
        player_metrics: Dict of metric_name -> player_value.
        benchmark_name: Key of the benchmark group in BENCHMARK_DATA.

    Returns:
        Dict with proxy strokes gained estimates per category and total.
    """
    if benchmark_name not in BENCHMARK_DATA:
        raise ValueError(f"Unknown benchmark group: {benchmark_name}")

    benchmark = BENCHMARK_DATA[benchmark_name]

    # Proxy calculations using correlations from research literature
    # (simplified linear approximations)

    # SG: Off-the-tee proxy from fairway % (each 10% gap ~ 0.5 strokes)
    fairway_player = float(player_metrics.get("fairway_percentage", benchmark["fairway_percentage"]))
    fairway_gap = fairway_player - benchmark["fairway_percentage"]
    sg_tee_proxy = round(fairway_gap / 10.0 * 0.5, 2)

    # SG: Approach proxy from GIR % (each 10% gap ~ 1.0 stroke)
    gir_player = float(player_metrics.get("gir_percentage", benchmark["gir_percentage"]))
    gir_gap = gir_player - benchmark["gir_percentage"]
    sg_approach_proxy = round(gir_gap / 10.0 * 1.0, 2)

    # SG: Short game proxy from scrambling % (each 10% gap ~ 0.6 strokes)
    scram_player = float(player_metrics.get("scrambling_percentage", benchmark["scrambling_percentage"]))
    scram_gap = scram_player - benchmark["scrambling_percentage"]
    sg_short_proxy = round(scram_gap / 10.0 * 0.6, 2)

    # SG: Putting proxy from putts per round (each putt less ~ 1 stroke)
    putts_player = float(player_metrics.get("putts_per_round", benchmark["putts_per_round"]))
    putts_gap = benchmark["putts_per_round"] - putts_player
    sg_putting_proxy = round(putts_gap * 1.0, 2)

    sg_total_proxy = round(
        sg_tee_proxy + sg_approach_proxy + sg_short_proxy + sg_putting_proxy, 2
    )

    return {
        "sg_tee_proxy": sg_tee_proxy,
        "sg_approach_proxy": sg_approach_proxy,
        "sg_short_game_proxy": sg_short_proxy,
        "sg_putting_proxy": sg_putting_proxy,
        "sg_total_proxy": sg_total_proxy,
        "note": (
            "MVP seed estimate — proxy values are approximated from fairway/GIR/scrambling/putts "
            "metrics using simplified linear correlations, not true shot-by-shot strokes gained."
        ),
    }


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_unit(metric: str) -> str:
    units = {
        "scoring_average": "strokes",
        "fairway_percentage": "%",
        "gir_percentage": "%",
        "putts_per_round": "putts",
        "scrambling_percentage": "%",
        "penalties_per_round": "strokes",
        "driving_distance": "yards",
        "sg_total_estimate": "strokes",
        "sg_tee_estimate": "strokes",
        "sg_approach_estimate": "strokes",
        "sg_short_game_estimate": "strokes",
        "sg_putting_estimate": "strokes",
    }
    return units.get(metric, "")


def _attach_priority_scores(gaps: Dict[str, Any]) -> None:
    """
    Add a priority_score (0–10) to each gap entry based on its relative magnitude.
    Higher priority = bigger gap = more important to improve.
    """
    # Reference maximum gaps for normalization
    max_gaps = {
        "scoring_average": 30.0,
        "fairway_percentage": 35.0,
        "gir_percentage": 50.0,
        "putts_per_round": 10.0,
        "scrambling_percentage": 55.0,
        "penalties_per_round": 4.0,
        "driving_distance": 100.0,
        "sg_total_estimate": 20.0,
        "sg_tee_estimate": 3.0,
        "sg_approach_estimate": 6.5,
        "sg_short_game_estimate": 4.0,
        "sg_putting_estimate": 3.5,
    }

    for metric, data in gaps.items():
        raw_gap = abs(data["gap"])
        max_gap = max_gaps.get(metric, 10.0)
        priority = min(10.0, round((raw_gap / max_gap) * 10.0, 1))
        data["priority_score"] = priority if data["player_is_behind"] else 0.0
