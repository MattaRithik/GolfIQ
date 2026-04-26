"""
Regression evaluation metrics for golf score prediction.
"""

import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from scipy import stats
from typing import List, Tuple


def compute_regression_metrics(y_true, y_pred) -> dict:
    """
    Compute standard regression metrics.

    Args:
        y_true: Array-like of true target values.
        y_pred: Array-like of predicted values.

    Returns:
        dict with keys:
            - mae: Mean Absolute Error
            - rmse: Root Mean Squared Error
            - r2: R-squared coefficient of determination
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)

    mae = mean_absolute_error(y_true, y_pred)
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = r2_score(y_true, y_pred)

    return {
        "mae": float(mae),
        "rmse": float(rmse),
        "r2": float(r2),
    }


def compute_prediction_intervals(
    predictions: List[float],
    residuals: List[float],
    alpha: float = 0.1,
) -> Tuple[float, float]:
    """
    Compute prediction interval bounds using the empirical distribution of residuals.

    The interval covers (1 - alpha) * 100% of predictions. For example, alpha=0.1
    gives a 90% prediction interval.

    Args:
        predictions: List of point predictions.
        residuals: List of residuals (y_true - y_pred) from the training/validation set.
        alpha: Significance level. Default 0.1 for a 90% interval.

    Returns:
        (lower_bound, upper_bound) as a tuple of floats.
    """
    predictions = np.asarray(predictions, dtype=float)
    residuals = np.asarray(residuals, dtype=float)

    # Use the empirical quantiles of residuals to form bounds
    lower_quantile = alpha / 2.0
    upper_quantile = 1.0 - alpha / 2.0

    residual_lower = float(np.quantile(residuals, lower_quantile))
    residual_upper = float(np.quantile(residuals, upper_quantile))

    # Apply residual bounds to the mean prediction
    mean_pred = float(np.mean(predictions))
    lower_bound = mean_pred + residual_lower
    upper_bound = mean_pred + residual_upper

    return lower_bound, upper_bound
