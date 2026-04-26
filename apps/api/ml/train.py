"""
Training pipeline for the golf ML model.

Usage:
    python -m ml.train

Or import train_from_data() for programmatic use.
"""

import os
import json
import logging
import warnings
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from .features import FEATURE_COLUMNS, TARGET_COLUMN
from .model import GolfMLModel
from .metrics import compute_regression_metrics

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Synthetic data generation
# ---------------------------------------------------------------------------


def generate_synthetic_training_data(n_samples: int = 500) -> pd.DataFrame:
    """
    Generate synthetic golf training data with realistic correlations.

    Handicap is the primary driver: lower handicap correlates with better
    fairway %, GIR %, lower scoring average, fewer putts, etc.

    Args:
        n_samples: Number of synthetic rows to generate.

    Returns:
        DataFrame containing all FEATURE_COLUMNS and TARGET_COLUMN.
    """
    rng = np.random.default_rng(seed=42)

    # --- Base player attributes ---
    age = rng.integers(18, 75, size=n_samples).astype(float)
    years_playing = np.clip(rng.normal(10, 7, size=n_samples), 0.5, 50)
    current_handicap = np.clip(rng.normal(15, 8, size=n_samples), 0.0, 36.0)

    practice_hours_per_week = np.clip(
        10.0 - current_handicap * 0.2 + rng.normal(0, 2, size=n_samples),
        0.5,
        40.0,
    )

    # --- Performance metrics driven by handicap ---
    # Scoring average: ~72 + handicap * 1.1 with noise
    scoring_average_recent = np.clip(
        72.0 + current_handicap * 1.1 + rng.normal(0, 2.5, size=n_samples),
        60.0,
        130.0,
    )
    score_std_recent = np.clip(
        2.0 + current_handicap * 0.15 + rng.normal(0, 1.0, size=n_samples),
        0.5,
        15.0,
    )

    # Fairway %: higher handicap -> worse
    fairway_pct = np.clip(
        65.0 - current_handicap * 1.2 + rng.normal(0, 8, size=n_samples),
        10.0,
        90.0,
    )
    # GIR %: higher handicap -> worse
    gir_pct = np.clip(
        55.0 - current_handicap * 1.8 + rng.normal(0, 8, size=n_samples),
        5.0,
        85.0,
    )
    putts_per_round = np.clip(
        29.0 + current_handicap * 0.25 + rng.normal(0, 2, size=n_samples),
        24.0,
        42.0,
    )
    penalties_per_round = np.clip(
        0.3 + current_handicap * 0.08 + rng.normal(0, 0.5, size=n_samples),
        0.0,
        6.0,
    )
    scrambling_pct = np.clip(
        55.0 - current_handicap * 1.0 + rng.normal(0, 10, size=n_samples),
        5.0,
        85.0,
    )

    # Par-specific averages
    par3_avg = np.clip(
        3.0 + current_handicap * 0.07 + rng.normal(0, 0.3, size=n_samples),
        2.5,
        6.0,
    )
    par4_avg = np.clip(
        4.0 + current_handicap * 0.10 + rng.normal(0, 0.4, size=n_samples),
        3.5,
        7.0,
    )
    par5_avg = np.clip(
        4.8 + current_handicap * 0.08 + rng.normal(0, 0.4, size=n_samples),
        4.2,
        8.0,
    )

    # --- Course scenario ---
    par = rng.choice([70, 71, 72, 73], size=n_samples, p=[0.1, 0.15, 0.65, 0.1]).astype(float)
    course_rating = np.clip(
        par - 0.5 + rng.normal(0, 1.5, size=n_samples),
        60.0,
        80.0,
    )
    slope_rating = np.clip(
        rng.normal(120, 12, size=n_samples),
        55.0,
        155.0,
    )
    yardage = np.clip(
        rng.normal(6400, 500, size=n_samples),
        4500.0,
        8000.0,
    )

    # --- Target: next round score ---
    # Based on scoring average, course difficulty, and small noise
    course_difficulty_adj = (course_rating - 72.0) * 0.3 + np.maximum(0, slope_rating - 113) * 0.05
    next_round_score = np.clip(
        scoring_average_recent
        + course_difficulty_adj
        + rng.normal(0, score_std_recent, size=n_samples),
        55.0,
        145.0,
    )

    df = pd.DataFrame(
        {
            "age": age,
            "years_playing": years_playing,
            "current_handicap": current_handicap,
            "scoring_average_recent": scoring_average_recent,
            "score_std_recent": score_std_recent,
            "fairway_pct": fairway_pct,
            "gir_pct": gir_pct,
            "putts_per_round": putts_per_round,
            "penalties_per_round": penalties_per_round,
            "scrambling_pct": scrambling_pct,
            "par3_avg": par3_avg,
            "par4_avg": par4_avg,
            "par5_avg": par5_avg,
            "course_rating": course_rating,
            "slope_rating": slope_rating,
            "par": par,
            "yardage": yardage,
            "practice_hours_per_week": practice_hours_per_week,
            TARGET_COLUMN: next_round_score,
        }
    )

    return df


# ---------------------------------------------------------------------------
# Training pipeline
# ---------------------------------------------------------------------------


def train_from_data(df: pd.DataFrame, artifacts_dir: str) -> dict:
    """
    Full training pipeline: scale, split, train, evaluate, save.

    Args:
        df: DataFrame containing all FEATURE_COLUMNS and TARGET_COLUMN.
        artifacts_dir: Directory to write model artifacts and metrics.

    Returns:
        dict with keys: mae, rmse, r2, n_train, n_test.
    """
    os.makedirs(artifacts_dir, exist_ok=True)

    X = df[FEATURE_COLUMNS].values.astype(float)
    y = df[TARGET_COLUMN].values.astype(float)

    # Train/test split 80/20
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Build and train model
    golf_model = GolfMLModel()
    golf_model.scaler = scaler
    golf_model.fit(X_train_scaled, y_train)

    # Evaluate on test set
    y_pred = golf_model.predict(X_test_scaled)
    metrics = compute_regression_metrics(y_test, y_pred)
    metrics["n_train"] = int(len(X_train))
    metrics["n_test"] = int(len(X_test))

    logger.info(
        "Test metrics — MAE: %.3f  RMSE: %.3f  R2: %.3f",
        metrics["mae"],
        metrics["rmse"],
        metrics["r2"],
    )

    # Save model artifacts
    golf_model.save(artifacts_dir)

    # Save metrics JSON
    metrics_path = os.path.join(artifacts_dir, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    logger.info("Metrics saved to %s", metrics_path)

    return metrics


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    # Resolve paths relative to this file's location
    ml_dir = os.path.dirname(os.path.abspath(__file__))
    api_dir = os.path.dirname(ml_dir)
    processed_data_path = os.path.join(api_dir, "data", "processed", "golf_data.csv")
    artifacts_dir = os.path.join(api_dir, "ml", "artifacts")

    df = None

    # Try to load real processed data
    if os.path.exists(processed_data_path):
        try:
            candidate = pd.read_csv(processed_data_path)
            required_cols = FEATURE_COLUMNS + [TARGET_COLUMN]
            if all(c in candidate.columns for c in required_cols) and len(candidate) >= 50:
                df = candidate[required_cols].dropna()
                logger.info("Loaded %d rows from %s", len(df), processed_data_path)
            else:
                logger.warning(
                    "Processed data at %s does not have enough rows or required columns. "
                    "Falling back to synthetic data.",
                    processed_data_path,
                )
        except Exception as exc:
            logger.warning("Failed to load processed data: %s. Using synthetic data.", exc)

    if df is None or len(df) < 50:
        warnings.warn(
            "Using synthetic training data. Provide real data in data/processed/ for better accuracy.",
            UserWarning,
            stacklevel=2,
        )
        logger.warning("Generating synthetic training data (n=500).")
        df = generate_synthetic_training_data(n_samples=500)

    metrics = train_from_data(df, artifacts_dir)

    print("\n=== Training Complete ===")
    print(f"  Samples   — train: {metrics['n_train']}, test: {metrics['n_test']}")
    print(f"  MAE       : {metrics['mae']:.3f} strokes")
    print(f"  RMSE      : {metrics['rmse']:.3f} strokes")
    print(f"  R²        : {metrics['r2']:.4f}")
    print(f"  Artifacts : {artifacts_dir}")


if __name__ == "__main__":
    main()
