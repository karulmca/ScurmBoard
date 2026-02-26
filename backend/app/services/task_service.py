from datetime import date
from sqlalchemy.orm import Session

from ..models.task import Task, TaskUpdate
from ..schemas.task import WorkItemCreate, WorkItemUpdate
from ..schemas.task_update import TaskUpdateRequest
from ..repositories.task_repository import (
    get_task_by_id,
    add_task_update,
    save_task,
    get_task_updates_by_task_id,
    create_work_item as _repo_create,
    delete_work_item as _repo_delete,
)


def update_task_status(db: Session, task_id: str, payload: TaskUpdateRequest) -> Task:
    task = get_task_by_id(db, task_id)
    if task is None:
        raise ValueError("Task not found")

    if payload.current_status is not None:
        task.current_status = payload.current_status
    if payload.current_update is not None:
        task.current_update = payload.current_update
    if payload.update_date is not None:
        task.update_date = payload.update_date
    else:
        task.update_date = date.today()
    if payload.state is not None:
        task.state = payload.state
    if payload.sub_state is not None:
        task.sub_state = payload.sub_state

    update_entry = TaskUpdate(
        task_id=task_id,
        update_date=task.update_date,
        current_status=task.current_status,
        current_update=task.current_update,
        state=task.state,
        sub_state=task.sub_state,
    )
    add_task_update(db, update_entry)
    return save_task(db, task)


def get_task_updates(db: Session, task_id: str):
    return get_task_updates_by_task_id(db, task_id)


def create_work_item(db: Session, payload: WorkItemCreate) -> Task:
    """Create a new work item from UI."""
    data = payload.model_dump(exclude_none=True)
    data.setdefault("state", "New")
    return _repo_create(db, data)


def delete_work_item(db: Session, task_id: str) -> bool:
    """Delete a work item. Returns False if not found."""
    return _repo_delete(db, task_id)


def update_work_item(db: Session, task_id: str, payload: WorkItemUpdate) -> Task:
    """Update editable fields of an existing work item."""
    task = get_task_by_id(db, task_id)
    if task is None:
        raise ValueError("Work item not found")
    data = payload.model_dump(exclude_none=True)
    for field, value in data.items():
        setattr(task, field, value)
    return save_task(db, task)


def update_task_status(db: Session, task_id: str, payload: TaskUpdateRequest) -> Task:
    task = get_task_by_id(db, task_id)
    if task is None:
        raise ValueError("Task not found")

    if payload.current_status is not None:
        task.current_status = payload.current_status
    if payload.current_update is not None:
        task.current_update = payload.current_update
    if payload.update_date is not None:
        task.update_date = payload.update_date
    else:
        task.update_date = date.today()
    if payload.state is not None:
        task.state = payload.state
    if payload.sub_state is not None:
        task.sub_state = payload.sub_state

    update_entry = TaskUpdate(
        task_id=task_id,
        update_date=task.update_date,
        current_status=task.current_status,
        current_update=task.current_update,
        state=task.state,
        sub_state=task.sub_state,
    )
    add_task_update(db, update_entry)
    return save_task(db, task)


def get_task_updates(db: Session, task_id: str):
    return get_task_updates_by_task_id(db, task_id)
