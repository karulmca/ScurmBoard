from __future__ import annotations

from datetime import datetime
from io import BytesIO
from typing import Dict, Tuple

import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from ..models.task import Task

# ---------------------------------------------------------------------------
# Column normalisation map
# ---------------------------------------------------------------------------

COLUMN_ALIASES: Dict[str, str] = {
    "id": "task_id",
    "taskid": "task_id",
    "work item id": "task_id",
    "title": "title",
    "assignedto": "assigned_to",
    "assigned to": "assigned_to",
    "state": "state",
    "sub-state": "sub_state",
    "sub state": "sub_state",
    "iteration path": "iteration_path",
    "activated date": "activated_date",
    "target date": "target_date",
    "committed date": "committed_date",
    "release date": "release_date",
    "closed date": "closed_date",
    "cycle time": "cycle_time",
    "current status": "current_status",
    "currentupdate": "current_update",
    "current update": "current_update",
    "update date": "update_date",
    "riskitem": "risk_item",
    "risk item": "risk_item",
    "carry forward reason": "carry_forward_reason",
    "criticality": "criticality",
}

CRITICALITY_TIMELINES: Dict[str, Tuple[int, int]] = {
    "critical": (10, 15),
    "high": (7, 10),
    "medium": (5, 7),
    "low": (3, 5),
    "very low": (1, 3),
}

DATE_COLUMNS = {
    "activated_date",
    "target_date",
    "committed_date",
    "release_date",
    "closed_date",
    "update_date",
}


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    renamed = {}
    for col in df.columns:
        key = str(col).strip().lower()
        key = " ".join(key.replace("_", " ").split())
        if key in COLUMN_ALIASES:
            renamed[col] = COLUMN_ALIASES[key]
    return df.rename(columns=renamed)


def _coerce_dates(df: pd.DataFrame) -> pd.DataFrame:
    for col in DATE_COLUMNS:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce").dt.date
    return df


def _compute_cycle_time(df: pd.DataFrame) -> pd.DataFrame:
    if "cycle_time" not in df.columns:
        df["cycle_time"] = np.nan
    if "activated_date" in df.columns and "closed_date" in df.columns:
        computed = (
            pd.to_datetime(df["closed_date"], errors="coerce")
            - pd.to_datetime(df["activated_date"], errors="coerce")
        ).dt.days
        df["cycle_time"] = df["cycle_time"].fillna(computed)
    return df


def _apply_criticality(df: pd.DataFrame) -> pd.DataFrame:
    def timeline(row):
        crit = str(row.get("criticality") or "").strip().lower()
        return CRITICALITY_TIMELINES.get(crit)

    if "criticality" in df.columns:
        timeline_values = df.apply(timeline, axis=1)
        df["expected_timeline_min"] = timeline_values.apply(
            lambda x: x[0] if isinstance(x, tuple) else np.nan
        )
        df["expected_timeline_max"] = timeline_values.apply(
            lambda x: x[1] if isinstance(x, tuple) else np.nan
        )
    else:
        df["expected_timeline_min"] = np.nan
        df["expected_timeline_max"] = np.nan
    return df


def _apply_delay_flag(df: pd.DataFrame) -> pd.DataFrame:
    def is_delayed(row):
        cycle = row.get("cycle_time")
        max_days = row.get("expected_timeline_max")
        if pd.isna(cycle) or pd.isna(max_days):
            return False
        return float(cycle) > float(max_days)

    df["delayed"] = df.apply(is_delayed, axis=1)
    return df


def _parse_file(content: bytes, filename: str) -> pd.DataFrame:
    name = filename.lower()
    if name.endswith(".csv"):
        return pd.read_csv(BytesIO(content))
    if name.endswith(".json"):
        return pd.read_json(BytesIO(content))
    if name.endswith(".xlsx") or name.endswith(".xls"):
        return pd.read_excel(BytesIO(content))
    raise ValueError("Only CSV, JSON, or Excel supported")


def _ingest_dataframe(db: Session, df: pd.DataFrame) -> int:
    df = _normalize_columns(df)
    df = _coerce_dates(df)
    df = _compute_cycle_time(df)
    df = _apply_criticality(df)
    df = _apply_delay_flag(df)

    if "task_id" not in df.columns:
        raise ValueError("Input data must include TaskID or equivalent column.")

    ingested = 0
    for _, row in df.iterrows():
        task_id = str(row.get("task_id")).strip()
        if not task_id or task_id.lower() == "nan":
            continue

        task = db.query(Task).filter(Task.task_id == task_id).first()
        payload = {k: (None if pd.isna(v) else v) for k, v in row.to_dict().items()}

        if task is None:
            task = Task(task_id=task_id)
            db.add(task)

        for field, value in payload.items():
            if hasattr(task, field):
                setattr(task, field, value)

        ingested += 1

    db.commit()
    return ingested


# ---------------------------------------------------------------------------
# Public service API
# ---------------------------------------------------------------------------

def import_ado_dump(content: bytes, filename: str, db: Session) -> int:
    """Parse an uploaded ADO export file and upsert tasks into the database."""
    df = _parse_file(content, filename)
    return _ingest_dataframe(db, df)
