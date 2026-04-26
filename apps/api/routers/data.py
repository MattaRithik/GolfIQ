import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models import (
    Benchmark,
    Course,
    Hole,
    ModelPrediction,
    Profile,
    Round,
    Shot,
    UploadedDataset,
)
from schemas import DataProcessResponse, DataStatusResponse, DataUploadResponse

router = APIRouter(prefix="/data", tags=["data"])


def _list_dir_files(dir_path: str) -> List[str]:
    """Safely list files in a directory, returning empty list if not found."""
    path = Path(dir_path)
    if not path.exists() or not path.is_dir():
        return []
    return sorted(f.name for f in path.iterdir() if f.is_file())


@router.get("/status", response_model=DataStatusResponse)
async def data_status(db: AsyncSession = Depends(get_db)) -> DataStatusResponse:
    """
    Return a summary of all data assets: raw files, processed files,
    seed files, uploaded datasets, model artifacts, and database record counts.
    """
    raw_files = _list_dir_files(settings.data_raw_dir)
    processed_files = _list_dir_files(settings.data_processed_dir)
    seed_files = _list_dir_files(settings.data_seed_dir)
    model_artifacts = _list_dir_files(settings.model_artifacts_dir)

    # Fetch uploaded datasets
    datasets_result = await db.execute(
        select(UploadedDataset).order_by(UploadedDataset.uploaded_at.desc()).limit(50)
    )
    datasets = datasets_result.scalars().all()
    uploaded_datasets = [
        {
            "id": d.id,
            "filename": d.filename,
            "file_size_bytes": d.file_size_bytes,
            "row_count": d.row_count,
            "status": d.status,
            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
            "processed_at": d.processed_at.isoformat() if d.processed_at else None,
        }
        for d in datasets
    ]

    # Database row counts
    async def count_table(model) -> int:
        result = await db.execute(select(func.count()).select_from(model))
        return result.scalar_one() or 0

    db_stats = {
        "profiles": await count_table(Profile),
        "courses": await count_table(Course),
        "rounds": await count_table(Round),
        "holes": await count_table(Hole),
        "shots": await count_table(Shot),
        "benchmarks": await count_table(Benchmark),
        "model_predictions": await count_table(ModelPrediction),
        "uploaded_datasets": await count_table(UploadedDataset),
    }

    return DataStatusResponse(
        raw_files=raw_files,
        processed_files=processed_files,
        seed_files=seed_files,
        uploaded_datasets=uploaded_datasets,
        model_artifacts=model_artifacts,
        database_stats=db_stats,
    )


@router.post("/upload", response_model=DataUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> DataUploadResponse:
    """
    Upload a CSV or Parquet dataset file for processing.
    File is saved to the raw data directory and registered in the database.
    """
    allowed_extensions = {".csv", ".parquet", ".json", ".xlsx"}
    filename = file.filename or "upload"
    ext = Path(filename).suffix.lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{ext}'. Allowed: {allowed_extensions}",
        )

    # Ensure raw directory exists
    raw_dir = Path(settings.data_raw_dir)
    raw_dir.mkdir(parents=True, exist_ok=True)

    # Build a timestamped filename to avoid collisions
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    safe_stem = Path(filename).stem.replace(" ", "_")[:50]
    save_name = f"{timestamp}_{safe_stem}{ext}"
    save_path = raw_dir / save_name

    # Stream file to disk
    total_bytes = 0
    with open(save_path, "wb") as f:
        while chunk := await file.read(1024 * 64):  # 64 KB chunks
            f.write(chunk)
            total_bytes += len(chunk)

    if total_bytes == 0:
        save_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # Register in database
    dataset = UploadedDataset(
        filename=save_name,
        file_path=str(save_path),
        file_size_bytes=total_bytes,
        status="uploaded",
    )
    db.add(dataset)
    await db.flush()
    await db.refresh(dataset)

    return DataUploadResponse(
        dataset_id=dataset.id,
        filename=save_name,
        file_size_bytes=total_bytes,
        status="uploaded",
        message=f"File '{filename}' uploaded successfully as '{save_name}'.",
    )


@router.post("/process", response_model=DataProcessResponse)
async def process_dataset(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
) -> DataProcessResponse:
    """
    Process a previously uploaded dataset.
    Reads the raw file, performs basic validation and summary statistics,
    and marks the dataset as processed in the database.
    """
    # Fetch dataset record
    result = await db.execute(
        select(UploadedDataset).where(UploadedDataset.id == dataset_id)
    )
    dataset = result.scalar_one_or_none()
    if dataset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset {dataset_id} not found.",
        )

    if dataset.status == "processed":
        return DataProcessResponse(
            dataset_id=dataset_id,
            status="already_processed",
            rows_processed=dataset.row_count,
            message=f"Dataset {dataset_id} was already processed.",
        )

    file_path = Path(dataset.file_path) if dataset.file_path else None
    if not file_path or not file_path.exists():
        dataset.status = "error"
        dataset.error_message = "File not found on disk."
        await db.flush()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File not found on disk. It may have been moved or deleted.",
        )

    try:
        rows, cols = _read_file_stats(file_path)
    except Exception as exc:
        dataset.status = "error"
        dataset.error_message = str(exc)
        await db.flush()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to parse file: {exc}",
        )

    # Copy to processed directory
    processed_dir = Path(settings.data_processed_dir)
    processed_dir.mkdir(parents=True, exist_ok=True)
    dest_path = processed_dir / file_path.name
    shutil.copy2(file_path, dest_path)

    dataset.status = "processed"
    dataset.row_count = rows
    dataset.column_count = cols
    dataset.processed_at = datetime.now(timezone.utc)
    await db.flush()

    return DataProcessResponse(
        dataset_id=dataset_id,
        status="processed",
        rows_processed=rows,
        message=f"Dataset {dataset_id} processed successfully: {rows} rows, {cols} columns.",
    )


def _read_file_stats(path: Path) -> tuple[int, int]:
    """Return (row_count, column_count) for a CSV or Parquet file."""
    ext = path.suffix.lower()
    if ext == ".csv":
        import pandas as pd
        df = pd.read_csv(path)
        return len(df), len(df.columns)
    elif ext == ".parquet":
        import pandas as pd
        df = pd.read_parquet(path)
        return len(df), len(df.columns)
    elif ext == ".json":
        import pandas as pd
        df = pd.read_json(path)
        return len(df), len(df.columns)
    elif ext == ".xlsx":
        import pandas as pd
        df = pd.read_excel(path)
        return len(df), len(df.columns)
    else:
        raise ValueError(f"Unsupported file extension: {ext}")
