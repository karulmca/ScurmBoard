from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, Float, Boolean, DateTime, Text
from ..core.base import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, unique=True, index=True, nullable=False)

    # Work item classification
    work_item_type = Column(String, index=True, default="Task", nullable=True)  # Epic, Feature, User Story, Task, Bug
    parent_task_id = Column(String, index=True, nullable=True)

    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    assigned_to = Column(String, index=True, nullable=True)
    state = Column(String, index=True, nullable=True)
    sub_state = Column(String, nullable=True)
    priority = Column(Integer, default=3, nullable=True)  # 1=Critical 2=High 3=Medium 4=Low
    story_points = Column(Float, nullable=True)
    sprint = Column(String, index=True, nullable=True)
    tags = Column(String, nullable=True)
    area_path = Column(String, nullable=True)
    iteration_path = Column(String, index=True, nullable=True)
    activated_date = Column(Date, nullable=True)
    target_date = Column(Date, nullable=True)
    committed_date = Column(Date, nullable=True)
    release_date = Column(Date, nullable=True)
    closed_date = Column(Date, nullable=True)
    cycle_time = Column(Float, nullable=True)
    current_status = Column(String, nullable=True)
    current_update = Column(String, nullable=True)
    update_date = Column(Date, nullable=True)
    risk_item = Column(String, nullable=True)
    carry_forward_reason = Column(String, nullable=True)
    criticality = Column(String, index=True, nullable=True)
    expected_timeline_min = Column(Integer, nullable=True)
    expected_timeline_max = Column(Integer, nullable=True)
    delayed = Column(Boolean, default=False)
    project_id = Column(Integer, nullable=True, index=True)   # FK to projects.id (soft)
    sprint_id  = Column(Integer, nullable=True, index=True)   # FK to sprints.id (soft)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TaskUpdate(Base):
    __tablename__ = "task_updates"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, index=True, nullable=False)
    update_date = Column(Date, nullable=False)
    current_status = Column(String, nullable=True)
    current_update = Column(String, nullable=True)
    state = Column(String, nullable=True)
    sub_state = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
