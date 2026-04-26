# Analytics package for GolfIQ benchmark calculations
from analytics.handicap import (
    calculate_handicap_differential,
    estimate_handicap,
    classify_player_level,
)
from analytics.benchmarks import (
    get_benchmark_data,
    find_closest_benchmark,
    compute_skill_gaps,
    estimate_strokes_gained_proxy,
    BENCHMARK_DATA,
)
from analytics.metrics import (
    calculate_basic_metrics,
    generate_practice_plan,
)

__all__ = [
    "calculate_handicap_differential",
    "estimate_handicap",
    "classify_player_level",
    "get_benchmark_data",
    "find_closest_benchmark",
    "compute_skill_gaps",
    "estimate_strokes_gained_proxy",
    "BENCHMARK_DATA",
    "calculate_basic_metrics",
    "generate_practice_plan",
]
