from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models.task import Task, TaskUpdate


def get_all_tasks(db: Session):
    """Return all tasks ordered by id."""
    return db.query(Task).order_by(Task.id).all()


def get_task_by_id(db: Session, task_id: str) -> Task | None:
    """Return a single task by its string task_id, or None."""
    return db.query(Task).filter(Task.task_id == task_id).first()


def get_task_updates_by_task_id(db: Session, task_id: str) -> list[TaskUpdate]:
    """Return all update history entries for a task, newest first."""
    return (
        db.query(TaskUpdate)
        .filter(TaskUpdate.task_id == task_id)
        .order_by(TaskUpdate.update_date.desc(), TaskUpdate.id.desc())
        .all()
    )


def save_task(db: Session, task: Task) -> Task:
    """Persist pending changes on an already-tracked task and refresh it."""
    db.commit()
    db.refresh(task)
    return task


def add_task_update(db: Session, update_entry: TaskUpdate) -> None:
    """Persist a new TaskUpdate history record."""
    db.add(update_entry)
    db.commit()


def get_work_items(
    db: Session,
    work_item_type: str | None = None,
    state: str | None = None,
    assigned_to: str | None = None,
    sprint: str | None = None,
    search: str | None = None,
) -> list[Task]:
    """Return tasks with optional filters."""
    q = db.query(Task)
    if work_item_type:
        q = q.filter(Task.work_item_type == work_item_type)
    if state:
        q = q.filter(Task.state == state)
    if assigned_to:
        q = q.filter(Task.assigned_to == assigned_to)
    if sprint:
        q = q.filter(Task.sprint == sprint)
    if search:
        like = f"%{search}%"
        q = q.filter(
            Task.title.ilike(like) | Task.task_id.ilike(like)
        )
    return q.order_by(Task.id).all()


def get_children(db: Session, parent_task_id: str) -> list[Task]:
    """Return direct children of a work item."""
    return db.query(Task).filter(Task.parent_task_id == parent_task_id).all()


def create_work_item(db: Session, data: dict) -> Task:
    """Insert a new work item; auto-generate task_id if absent."""
    task_id = data.get("task_id")
    if not task_id:
        prefixes = {
            "Epic": "EPIC",
            "Feature": "FEAT",
            "User Story": "US",
            "Task": "TASK",
            "Bug": "BUG",
        }
        prefix = prefixes.get(data.get("work_item_type", "Task"), "WI")
        next_id = (db.query(func.max(Task.id)).scalar() or 0) + 1
        task_id = f"{prefix}-{next_id}"
    task = Task(task_id=task_id)
    for field, value in data.items():
        if field != "task_id" and hasattr(task, field):
            setattr(task, field, value)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def delete_work_item(db: Session, task_id: str) -> bool:
    """Delete a work item by task_id. Returns True if found and deleted."""
    task = db.query(Task).filter(Task.task_id == task_id).first()
    if task is None:
        return False
    db.delete(task)
    db.commit()
    return True
