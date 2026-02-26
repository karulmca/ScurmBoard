from io import BytesIO
from typing import Optional

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..core.dependencies import get_db
from ..repositories.task_repository import get_all_tasks, get_work_items
from ..schemas.task import TaskRead, WorkItemCreate, WorkItemUpdate
from ..schemas.task_update import TaskUpdateRequest, TaskUpdateRead
from ..services.task_service import (
    update_task_status,
    get_task_updates,
    create_work_item,
    delete_work_item,
    update_work_item,
)

router = APIRouter(prefix="", tags=["tasks"])


# ── Legacy / import-compatible list ──────────────────────────────────────────
@router.get("/tasks", response_model=list[TaskRead])
def list_tasks(db: Session = Depends(get_db)):
    return get_all_tasks(db)


# ── Filtered work items list (used by new UI) ─────────────────────────────────
@router.get("/workitems", response_model=list[TaskRead])
def list_work_items(
    work_item_type: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    sprint: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return get_work_items(db, work_item_type, state, assigned_to, sprint, search)


# ── Create work item ──────────────────────────────────────────────────────────
@router.post("/workitems", response_model=TaskRead, status_code=201)
def create_item(payload: WorkItemCreate, db: Session = Depends(get_db)):
    return create_work_item(db, payload)


# ── Update work item ──────────────────────────────────────────────────────────
@router.patch("/workitems/{task_id}", response_model=TaskRead)
def update_item(task_id: str, payload: WorkItemUpdate, db: Session = Depends(get_db)):
    try:
        return update_work_item(db, task_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


# ── Delete work item ──────────────────────────────────────────────────────────
@router.delete("/workitems/{task_id}", status_code=204)
def delete_item(task_id: str, db: Session = Depends(get_db)):
    if not delete_work_item(db, task_id):
        raise HTTPException(status_code=404, detail="Work item not found")


# ── Update task status (patch) ────────────────────────────────────────────────
@router.patch("/tasks/{task_id}", response_model=TaskRead)
def update_task(task_id: str, payload: TaskUpdateRequest, db: Session = Depends(get_db)):
    try:
        return update_task_status(db, task_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/tasks/{task_id}/updates", response_model=list[TaskUpdateRead])
def list_task_updates(task_id: str, db: Session = Depends(get_db)):
    return get_task_updates(db, task_id)


# ── Excel export ──────────────────────────────────────────────────────────────
@router.get("/export/excel")
def export_excel(db: Session = Depends(get_db)):
    tasks = get_all_tasks(db)
    df = pd.DataFrame([
        {
            "TaskID": t.task_id,
            "Type": t.work_item_type,
            "Title": t.title,
            "AssignedTo": t.assigned_to,
            "State": t.state,
            "Priority": t.priority,
            "StoryPoints": t.story_points,
            "Sprint": t.sprint,
            "Sub-State": t.sub_state,
            "Iteration Path": t.iteration_path,
            "Activated Date": t.activated_date,
            "Target Date": t.target_date,
            "Cycle Time": t.cycle_time,
            "Current Status": t.current_status,
            "CurrentUpdate": t.current_update,
            "RiskItem": t.risk_item,
            "CarryForwardReason": t.carry_forward_reason,
            "Criticality": t.criticality,
            "Delayed": t.delayed,
        }
        for t in tasks
    ])
    output = BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=scrum_report.xlsx"},
    )


@router.get("/tasks", response_model=list[TaskRead])
def list_tasks(db: Session = Depends(get_db)):
    return get_all_tasks(db)


@router.patch("/tasks/{task_id}", response_model=TaskRead)
def update_task(task_id: str, payload: TaskUpdateRequest, db: Session = Depends(get_db)):
    try:
        return update_task_status(db, task_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/tasks/{task_id}/updates", response_model=list[TaskUpdateRead])
def list_task_updates(task_id: str, db: Session = Depends(get_db)):
    return get_task_updates(db, task_id)


@router.get("/export/excel")
def export_excel(db: Session = Depends(get_db)):
    tasks = get_all_tasks(db)
    df = pd.DataFrame([
        {
            "TaskID": t.task_id,
            "Title": t.title,
            "AssignedTo": t.assigned_to,
            "State": t.state,
            "Sub-State": t.sub_state,
            "Iteration Path": t.iteration_path,
            "Activated Date": t.activated_date,
            "Target Date": t.target_date,
            "Committed Date": t.committed_date,
            "Release Date": t.release_date,
            "Closed Date": t.closed_date,
            "Cycle Time": t.cycle_time,
            "Current Status": t.current_status,
            "CurrentUpdate": t.current_update,
            "RiskItem": t.risk_item,
            "CarryForwardReason": t.carry_forward_reason,
            "Criticality": t.criticality,
            "Delayed": t.delayed,
        }
        for t in tasks
    ])

    output = BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=scrum_report.xlsx"},
    )
