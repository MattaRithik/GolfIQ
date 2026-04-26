import json
import os
import statistics
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models import Profile, Round
from schemas import ModelStatusResponse, ModelTrainRequest, ModelTrainResponse
from analytics.handicap import calculate_handicap_differential, estimate_handicap

router = APIRouter(prefix="/model", tags=["model"])

_MODEL_META_FILENAME = "model_meta.json"


def _meta_path() -> Path:
    return Path(settings.model_artifacts_dir) / _MODEL_META_FILENAME


def _load_meta() -> Optional[Dict[str, Any]]:
    path = _meta_path()
    if path.exists():
        with open(path, "r") as f:
            return json.load(f)
    return None


def _save_meta(meta: Dict[str, Any]) -> None:
    path = _meta_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(meta, f, indent=2)


@router.post("/train", response_model=ModelTrainResponse)
async def train_model(
    payload: ModelTrainRequest,
    db: AsyncSession = Depends(get_db),
) -> ModelTrainResponse:
    """
    Train a scoring prediction model using all available round data.

    This endpoint uses a statistical baseline approach (mean + std per golfer)
    as the MVP model. Future versions will support scikit-learn regression and
    PyTorch neural nets via the model_type parameter.

    The trained model parameters (per-profile statistics) are persisted to
    the model artifacts directory as a JSON file.
    """
    model_type = payload.model_type or "linear_regression"
    num_rounds_min = payload.num_rounds_min or 5

    # Fetch all profiles
    profiles_result = await db.execute(select(Profile))
    profiles = profiles_result.scalars().all()

    if not profiles:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No profiles found. Add golfer profiles and rounds before training.",
        )

    profile_params: Dict[int, Dict[str, Any]] = {}
    total_rounds_used = 0
    profiles_trained = 0

    # Fit per-profile statistical model
    for profile in profiles:
        rounds_result = await db.execute(
            select(Round)
            .where(Round.profile_id == profile.id)
            .where(Round.total_score.is_not(None))
            .order_by(Round.date_played.desc())
        )
        rounds = rounds_result.scalars().all()

        if len(rounds) < num_rounds_min:
            continue

        scores = [r.total_score for r in rounds]
        mean_score = statistics.mean(scores)
        std_dev = statistics.stdev(scores) if len(scores) > 1 else 3.0

        differentials = [
            calculate_handicap_differential(r.total_score, 72.0, 113.0)
            for r in rounds
        ]
        estimated_handicap = estimate_handicap(differentials)

        profile_params[str(profile.id)] = {
            "mean_score": round(mean_score, 3),
            "std_dev": round(std_dev, 3),
            "estimated_handicap": estimated_handicap,
            "num_rounds": len(rounds),
        }
        total_rounds_used += len(rounds)
        profiles_trained += 1

    if profiles_trained == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"No profiles had enough rounds to train on "
                f"(minimum {num_rounds_min} scored rounds required)."
            ),
        )

    # Compute global metrics
    all_means = [v["mean_score"] for v in profile_params.values()]
    global_mean = round(statistics.mean(all_means), 3)
    global_std = round(statistics.stdev(all_means), 3) if len(all_means) > 1 else 0.0

    timestamp = datetime.now(timezone.utc).isoformat()
    version = f"{model_type}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

    meta = {
        "model_version": version,
        "model_type": model_type,
        "trained_at": timestamp,
        "profiles_trained_on": profiles_trained,
        "rounds_trained_on": total_rounds_used,
        "global_mean_score": global_mean,
        "global_std_score": global_std,
        "profile_params": profile_params,
        "metrics": {
            "global_mean_score": global_mean,
            "global_std_score": global_std,
            "num_profiles": profiles_trained,
            "num_rounds": total_rounds_used,
        },
    }

    _save_meta(meta)

    return ModelTrainResponse(
        status="trained",
        model_version=version,
        profiles_trained_on=profiles_trained,
        rounds_trained_on=total_rounds_used,
        metrics={
            "global_mean_score": global_mean,
            "global_std_score": global_std,
        },
        message=(
            f"Model '{version}' trained successfully on {profiles_trained} profiles "
            f"and {total_rounds_used} rounds."
        ),
    )


@router.get("/status", response_model=ModelStatusResponse)
async def model_status() -> ModelStatusResponse:
    """
    Return the current status of the trained model, including version,
    training timestamp, and summary metrics.
    """
    meta = _load_meta()

    if meta is None:
        return ModelStatusResponse(
            model_loaded=False,
            model_version=None,
            last_trained=None,
            training_samples=None,
            metrics=None,
            message="No trained model found. Use POST /model/train to train a model.",
        )

    return ModelStatusResponse(
        model_loaded=True,
        model_version=meta.get("model_version"),
        last_trained=meta.get("trained_at"),
        training_samples=meta.get("rounds_trained_on"),
        metrics=meta.get("metrics"),
        message=(
            f"Model '{meta.get('model_version')}' is loaded. "
            f"Trained on {meta.get('profiles_trained_on')} profiles "
            f"and {meta.get('rounds_trained_on')} rounds."
        ),
    )
