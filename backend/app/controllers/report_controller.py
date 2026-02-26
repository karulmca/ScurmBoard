from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.dependencies import get_db
from ..services.report_service import (
    get_daily_report,
    get_weekly_report,
    get_monthly_report,
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/daily")
def daily(report_date: date | None = None, db: Session = Depends(get_db)):
    return get_daily_report(db, report_date)


@router.get("/weekly")
def weekly(week_start: date | None = None, db: Session = Depends(get_db)):
    return get_weekly_report(db, week_start)


@router.get("/monthly")
def monthly(month_start: date | None = None, db: Session = Depends(get_db)):
    return get_monthly_report(db, month_start)
