from __future__ import annotations

from datetime import date, timedelta
from typing import Dict, List, Optional

import pandas as pd
from sqlalchemy.orm import Session

from ..models.task import Task


# ---------------------------------------------------------------------------
# Private helpers — dataframe builders
# ---------------------------------------------------------------------------

_DATE_COLS = [
    "activated_date", "target_date", "committed_date",
    "release_date", "closed_date", "update_date",
]


def _tasks_dataframe(db: Session) -> pd.DataFrame:
    rows = db.query(Task).all()
    data = [
        {
            "task_id": t.task_id,
            "title": t.title,
            "assigned_to": t.assigned_to,
            "state": t.state,
            "sub_state": t.sub_state,
            "iteration_path": t.iteration_path,
            "activated_date": t.activated_date,
            "target_date": t.target_date,
            "committed_date": t.committed_date,
            "release_date": t.release_date,
            "closed_date": t.closed_date,
            "cycle_time": t.cycle_time,
            "current_status": t.current_status,
            "current_update": t.current_update,
            "update_date": t.update_date,
            "risk_item": t.risk_item,
            "carry_forward_reason": t.carry_forward_reason,
            "criticality": t.criticality,
            "expected_timeline_min": t.expected_timeline_min,
            "expected_timeline_max": t.expected_timeline_max,
            "delayed": t.delayed,
        }
        for t in rows
    ]
    df = pd.DataFrame(data) if data else pd.DataFrame(
        columns=[
            "task_id", "title", "assigned_to", "state", "sub_state",
            "iteration_path", "activated_date", "target_date", "committed_date",
            "release_date", "closed_date", "cycle_time", "current_status",
            "current_update", "update_date", "risk_item", "carry_forward_reason",
            "criticality", "expected_timeline_min", "expected_timeline_max", "delayed",
        ]
    )
    # Convert all date columns to datetime64 so NaT is used instead of None/NaN
    # This makes comparisons with date/Timestamp objects work correctly.
    for col in _DATE_COLS:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce")
    return df


def _date_to_str(value) -> str | None:
    if value is None:
        return None
    try:
        if pd.isna(value):   # catches NaN, NaT, None
            return None
    except (TypeError, ValueError):
        pass
    if isinstance(value, str):
        return value
    if isinstance(value, pd.Timestamp):
        return value.date().isoformat()
    return value.isoformat()


# ---------------------------------------------------------------------------
# Private analytics helpers
# ---------------------------------------------------------------------------

def _resource_performance(df: pd.DataFrame) -> List[Dict]:
    if df.empty:
        return []
    grouped = df.groupby("assigned_to", dropna=False).agg(
        avg_cycle_time=("cycle_time", "mean"),
        completed=("closed_date", "count"),
        delayed_count=("delayed", "sum"),
    )
    return grouped.reset_index().fillna("Unassigned").to_dict(orient="records")


def _task_completion_rate(df: pd.DataFrame) -> float:
    if df.empty:
        return 0.0
    total = len(df)
    completed = df["closed_date"].notna().sum()
    return float(completed) / float(total)


def _risk_frequency(df: pd.DataFrame) -> List[Dict]:
    if df.empty:
        return []
    grouped = df[df["risk_item"].notna()].groupby("iteration_path").size()
    return grouped.reset_index(name="risk_count").to_dict(orient="records")


def _carry_forward_reasons(df: pd.DataFrame) -> List[Dict]:
    if df.empty:
        return []
    grouped = df[df["carry_forward_reason"].notna()].groupby("carry_forward_reason").size()
    return grouped.reset_index(name="count").to_dict(orient="records")


def _timeline_accuracy(df: pd.DataFrame) -> List[Dict]:
    if df.empty:
        return []
    df = df.copy()
    df["planned_vs_actual"] = df["target_date"].notna() & df["closed_date"].notna()
    df["delta_days"] = (
        df["closed_date"] - df["target_date"]
    ).dt.days
    result = df[df["planned_vs_actual"]]
    return result[["task_id", "delta_days"]].fillna(0).to_dict(orient="records")


def _release_reliability(df: pd.DataFrame) -> List[Dict]:
    if df.empty:
        return []
    df = df.copy()
    df["release_delta"] = (
        df["release_date"] - df["committed_date"]
    ).dt.days
    result = df[df["release_date"].notna() & df["committed_date"].notna()]
    return result[["task_id", "release_delta"]].to_dict(orient="records")


def _daily_update_compliance(df: pd.DataFrame, as_of: date) -> List[Dict]:
    if df.empty:
        return []
    df = df.copy()
    df["has_update"] = df["current_update"].notna()
    if "update_date" in df.columns:
        df["on_date"] = df["update_date"].dt.normalize() == pd.Timestamp(as_of)
    else:
        df["on_date"] = False
    grouped = df.groupby("assigned_to", dropna=False).agg(
        total=("task_id", "count"),
        updated=("on_date", "sum"),
        has_update=("has_update", "sum"),
    )
    return grouped.reset_index().fillna("Unassigned").to_dict(orient="records")


# ---------------------------------------------------------------------------
# Public service API
# ---------------------------------------------------------------------------

def get_daily_report(db: Session, report_date: date | None = None) -> Dict:
    """Return a daily snapshot of task activity and compliance."""
    day = report_date or date.today()
    ts_day = pd.Timestamp(day)
    df = _tasks_dataframe(db)

    activated_today = df[df["activated_date"].dt.normalize() == ts_day]
    closed_today = df[df["closed_date"].dt.normalize() == ts_day]
    risks_last_24h = df[df["risk_item"].notna()]

    return {
        "date": day.isoformat(),
        "status_distribution": df["state"].fillna("Unknown").value_counts().to_dict(),
        "activated_today": activated_today[["task_id", "title", "assigned_to"]].to_dict(
            orient="records"
        ),
        "closed_today": closed_today[["task_id", "title", "assigned_to"]].to_dict(
            orient="records"
        ),
        "risks_last_24h": risks_last_24h[["task_id", "risk_item"]].to_dict(orient="records"),
        "compliance": _daily_update_compliance(df, day),
    }


def get_weekly_report(db: Session, week_start: date | None = None) -> Dict:
    """Return a weekly velocity and summary report."""
    df = _tasks_dataframe(db)
    week_start = week_start or (date.today() - timedelta(days=date.today().weekday()))
    week_end = week_start + timedelta(days=6)
    ts_week_start = pd.Timestamp(week_start)

    in_week = df[
        (df["activated_date"] >= ts_week_start) |
        (df["closed_date"] >= ts_week_start)
    ]

    velocity = {
        "committed": int(in_week["committed_date"].notna().sum()),
        "completed": int(in_week["closed_date"].notna().sum()),
    }

    summaries = []
    for _, row in in_week.iterrows():
        line1 = {
            "task_id": row.get("task_id"),
            "title": row.get("title"),
            "assigned_to": row.get("assigned_to"),
            "state": row.get("state"),
            "sub_state": row.get("sub_state"),
            "iteration_path": row.get("iteration_path"),
            "activated_date": _date_to_str(row.get("activated_date")),
            "target_date": _date_to_str(row.get("target_date")),
            "cycle_time": row.get("cycle_time"),
            "current_status": row.get("current_status"),
        }
        line2 = {
            "weekly_update": row.get("current_update"),
            "risk_item": row.get("risk_item"),
            "carry_forward_reason": row.get("carry_forward_reason"),
            "timeline_compliance": "Delayed" if row.get("delayed") else "On-Time",
        }
        summaries.append({"line1": line1, "line2": line2})

    return {
        "week_start": week_start.isoformat(),
        "week_end": week_end.isoformat(),
        "velocity": velocity,
        "cycle_time_by_resource": in_week[["assigned_to", "cycle_time"]].to_dict(
            orient="records"
        ),
        "carry_forward_reasons": _carry_forward_reasons(in_week),
        "risk_heatmap": _risk_frequency(in_week),
        "task_summaries": summaries,
    }


def get_monthly_report(db: Session, month_start: date | None = None) -> Dict:
    """Return a monthly trend and team performance report."""
    df = _tasks_dataframe(db)
    month_start = month_start or date(date.today().year, date.today().month, 1)
    next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
    month_end = next_month - timedelta(days=1)
    ts_month_start = pd.Timestamp(month_start)

    in_month = df[
        (df["activated_date"] >= ts_month_start) |
        (df["closed_date"] >= ts_month_start)
    ]

    return {
        "month_start": month_start.isoformat(),
        "month_end": month_end.isoformat(),
        "cycle_time_trend": in_month[["activated_date", "cycle_time"]].to_dict(
            orient="records"
        ),
        "velocity_trend": {
            "committed": int(in_month["committed_date"].notna().sum()),
            "completed": int(in_month["closed_date"].notna().sum()),
        },
        "delay_trend": in_month[["task_id", "delayed"]].to_dict(orient="records"),
        "risk_register": _risk_frequency(in_month),
        "carry_forward_trend": _carry_forward_reasons(in_month),
        "release_reliability": _release_reliability(in_month),
        "team_performance": _resource_performance(in_month),
    }
