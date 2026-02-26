from datetime import date
from typing import Optional
from pydantic import BaseModel


class TaskUpdateRequest(BaseModel):
    current_status: Optional[str] = None
    current_update: Optional[str] = None
    update_date: Optional[date] = None
    state: Optional[str] = None
    sub_state: Optional[str] = None


class TaskUpdateRead(TaskUpdateRequest):
    id: int
    task_id: str

    class Config:
        from_attributes = True
