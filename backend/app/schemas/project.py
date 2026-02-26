from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel


# ── Organization ──────────────────────────────────────────────────────────────

class OrganizationCreate(BaseModel):
    name:        str
    slug:        str
    logo_url:    Optional[str] = None
    theme_color: Optional[str] = "#0078d4"
    settings:    Optional[str] = None


class OrganizationUpdate(BaseModel):
    name:        Optional[str] = None
    slug:        Optional[str] = None
    logo_url:    Optional[str] = None
    theme_color: Optional[str] = None
    settings:    Optional[str] = None


class OrganizationRead(BaseModel):
    id:          int
    name:        str
    slug:        str
    logo_url:    Optional[str] = None
    theme_color: Optional[str] = None
    settings:    Optional[str] = None
    created_at:  datetime

    class Config:
        from_attributes = True


# ── Sprint ────────────────────────────────────────────────────────────────────

class SprintCreate(BaseModel):
    name:       str
    goal:       Optional[str]   = None
    start_date: Optional[date]  = None
    end_date:   Optional[date]  = None
    state:      Optional[str]   = "planning"
    capacity:   Optional[float] = None
    velocity:   Optional[float] = None


class SprintUpdate(BaseModel):
    name:       Optional[str]   = None
    goal:       Optional[str]   = None
    start_date: Optional[date]  = None
    end_date:   Optional[date]  = None
    state:      Optional[str]   = None
    capacity:   Optional[float] = None
    velocity:   Optional[float] = None


class SprintRead(BaseModel):
    id:         int
    project_id: int
    name:       str
    goal:       Optional[str]   = None
    start_date: Optional[date]  = None
    end_date:   Optional[date]  = None
    state:      Optional[str]   = None
    capacity:   Optional[float] = None
    velocity:   Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Project ───────────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name:            str
    key:             str
    description:     Optional[str] = None
    methodology:     Optional[str] = "Scrum"
    state:           Optional[str] = "active"
    lead:            Optional[str] = None
    color:           Optional[str] = "#0078d4"
    icon:            Optional[str] = "📁"
    sprint_duration: Optional[int] = 14
    org_id:          Optional[int] = None


class ProjectUpdate(BaseModel):
    name:            Optional[str] = None
    key:             Optional[str] = None
    description:     Optional[str] = None
    methodology:     Optional[str] = None
    state:           Optional[str] = None
    lead:            Optional[str] = None
    color:           Optional[str] = None
    icon:            Optional[str] = None
    sprint_duration: Optional[int] = None
    org_id:          Optional[int] = None


class ProjectRead(BaseModel):
    id:              int
    name:            str
    key:             str
    description:     Optional[str] = None
    methodology:     Optional[str] = None
    state:           Optional[str] = None
    lead:            Optional[str] = None
    color:           Optional[str] = None
    icon:            Optional[str] = None
    sprint_duration: Optional[int] = None
    org_id:          Optional[int] = None
    created_at:      datetime
    sprint_count:    int            = 0
    active_sprint:   Optional[str] = None

    class Config:
        from_attributes = True


class ProjectDetailRead(ProjectRead):
    sprints: List[SprintRead] = []


# ── ProjectRole ───────────────────────────────────────────────────────────────

class ProjectRoleCreate(BaseModel):
    user_id:    int
    project_id: int
    role:        str
    permissions: Optional[str] = None


class ProjectRoleUpdate(BaseModel):
    role:        Optional[str] = None
    permissions: Optional[str] = None


class ProjectRoleOut(BaseModel):
    id:         int
    user_id:    int
    project_id: int
    role:       str
    permissions: Optional[str] = None

    class Config:
        from_attributes = True
