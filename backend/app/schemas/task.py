from datetime import date
from typing import Optional
from pydantic import BaseModel


class TaskBase(BaseModel):
    task_id: str
    work_item_type: Optional[str] = "Task"
    parent_task_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    state: Optional[str] = None
    sub_state: Optional[str] = None
    priority: Optional[int] = 3
    story_points: Optional[float] = None
    sprint: Optional[str] = None
    tags: Optional[str] = None
    area_path: Optional[str] = None
    iteration_path: Optional[str] = None
    activated_date: Optional[date] = None
    target_date: Optional[date] = None
    committed_date: Optional[date] = None
    release_date: Optional[date] = None
    closed_date: Optional[date] = None
    cycle_time: Optional[float] = None
    current_status: Optional[str] = None
    current_update: Optional[str] = None
    update_date: Optional[date] = None
    risk_item: Optional[str] = None
    carry_forward_reason: Optional[str] = None
    criticality: Optional[str] = None
    expected_timeline_min: Optional[int] = None
    expected_timeline_max: Optional[int] = None
    delayed: Optional[bool] = False


class TaskCreate(TaskBase):
    pass


class TaskRead(TaskBase):
    id: int

    class Config:
        from_attributes = True


class WorkItemCreate(BaseModel):
    """Payload for creating a brand-new work item from the UI."""
    title: str
    work_item_type: str = "Task"
    state: str = "New"
    assigned_to: Optional[str] = None
    priority: int = 3
    story_points: Optional[float] = None
    description: Optional[str] = None
    iteration_path: Optional[str] = None
    area_path: Optional[str] = None
    sprint: Optional[str] = None
    tags: Optional[str] = None
    parent_task_id: Optional[str] = None
    criticality: Optional[str] = None
    target_date: Optional[date] = None
    activated_date: Optional[date] = None


class WorkItemUpdate(BaseModel):
    """Payload for updating an existing work item from the UI (all fields optional)."""
    title: Optional[str] = None
    work_item_type: Optional[str] = None
    state: Optional[str] = None
    sub_state: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: Optional[int] = None
    story_points: Optional[float] = None
    description: Optional[str] = None
    iteration_path: Optional[str] = None
    area_path: Optional[str] = None
    sprint: Optional[str] = None
    tags: Optional[str] = None
    parent_task_id: Optional[str] = None
    criticality: Optional[str] = None
    target_date: Optional[date] = None
    activated_date: Optional[date] = None
