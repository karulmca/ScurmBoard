from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from ..models.organization import Organization, Project, Sprint
from ..schemas.project import (
    OrganizationCreate, OrganizationUpdate,
    ProjectCreate, ProjectUpdate,
    SprintCreate, SprintUpdate,
)
from ..repositories.project_repository import (
    get_organizations, get_organization, get_org_by_slug,
    get_projects, get_project, get_project_by_key,
    get_sprints, get_sprint, get_active_sprint,
)

from ..services.team_member_service import (
    list_team_members, add_team_member, update_team_member, delete_team_member
)

# ── Helpers ───────────────────────────────────────────────────────────────────

def _sprint_dict(s: Sprint) -> dict:
    return {
        "id": s.id,
        "project_id": s.project_id,
        "name": s.name,
        "goal": s.goal,
        "start_date": str(s.start_date) if s.start_date else None,
        "end_date": str(s.end_date) if s.end_date else None,
        "state": s.state,
        "capacity": s.capacity,
        "velocity": s.velocity,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


def _project_dict(p: Project, sprints: list) -> dict:
    active = next((s for s in sprints if s.state == "active"), None)
    return {
        "id": p.id,
        "name": p.name,
        "key": p.key,
        "description": p.description,
        "methodology": p.methodology,
        "state": p.state,
        "lead": p.lead,
        "color": p.color,
        "icon": p.icon,
        "sprint_duration": p.sprint_duration,
        "org_id": p.org_id,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "sprint_count": len(sprints),
        "active_sprint": active.name if active else None,
    }


# ── Organization ──────────────────────────────────────────────────────────────

def list_organizations(db: Session):
    return get_organizations(db)


def create_organization(db: Session, data: OrganizationCreate):
    if get_org_by_slug(db, data.slug):
        raise ValueError(f"Organization with slug '{data.slug}' already exists")
    org = Organization(**data.model_dump())
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


def update_organization(db: Session, org_id: int, data: OrganizationUpdate):
    org = get_organization(db, org_id)
    if not org:
        raise ValueError(f"Organization {org_id} not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(org, k, v)
    org.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(org)
    return org


def delete_organization(db: Session, org_id: int):
    org = get_organization(db, org_id)
    if not org:
        raise ValueError(f"Organization {org_id} not found")
    db.delete(org)
    db.commit()


# ── Project ───────────────────────────────────────────────────────────────────

def list_projects(db: Session, org_id: Optional[int] = None):
    projects = get_projects(db, org_id)
    return [_project_dict(p, get_sprints(db, p.id)) for p in projects]


def create_project(db: Session, data: ProjectCreate):
    key = data.key.upper()
    if get_project_by_key(db, key):
        raise ValueError(f"Project with key '{key}' already exists")
    payload = data.model_dump()
    payload["key"] = key
    p = Project(**payload)
    db.add(p)
    db.commit()
    db.refresh(p)
    return _project_dict(p, [])


def get_project_detail(db: Session, project_id: int):
    p = get_project(db, project_id)
    if not p:
        raise ValueError(f"Project {project_id} not found")
    sprints = get_sprints(db, project_id)
    d = _project_dict(p, sprints)
    d["sprints"] = [_sprint_dict(s) for s in sprints]
    return d


def update_project(db: Session, project_id: int, data: ProjectUpdate):
    p = get_project(db, project_id)
    if not p:
        raise ValueError(f"Project {project_id} not found")
    updates = data.model_dump(exclude_unset=True)
    if "key" in updates:
        updates["key"] = updates["key"].upper()
    for k, v in updates.items():
        setattr(p, k, v)
    p.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(p)
    return _project_dict(p, get_sprints(db, p.id))


def delete_project(db: Session, project_id: int):
    p = get_project(db, project_id)
    if not p:
        raise ValueError(f"Project {project_id} not found")
    db.delete(p)
    db.commit()


# ── Sprint ────────────────────────────────────────────────────────────────────

def list_sprints(db: Session, project_id: int):
    return get_sprints(db, project_id)


def create_sprint(db: Session, project_id: int, data: SprintCreate):
    if not get_project(db, project_id):
        raise ValueError(f"Project {project_id} not found")
    s = Sprint(project_id=project_id, **data.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def update_sprint(db: Session, sprint_id: int, data: SprintUpdate):
    s = get_sprint(db, sprint_id)
    if not s:
        raise ValueError(f"Sprint {sprint_id} not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(s, k, v)
    s.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(s)
    return s


def activate_sprint(db: Session, sprint_id: int):
    """Activate a sprint; auto-completes any previously active sprint in same project."""
    s = get_sprint(db, sprint_id)
    if not s:
        raise ValueError(f"Sprint {sprint_id} not found")
    active = get_active_sprint(db, s.project_id)
    if active and active.id != sprint_id:
        active.state = "completed"
    s.state = "active"
    db.commit()
    db.refresh(s)
    return s


def complete_sprint(db: Session, sprint_id: int):
    s = get_sprint(db, sprint_id)
    if not s:
        raise ValueError(f"Sprint {sprint_id} not found")
    s.state = "completed"
    db.commit()
    db.refresh(s)
    return s


def delete_sprint(db: Session, sprint_id: int):
    s = get_sprint(db, sprint_id)
    if not s:
        raise ValueError(f"Sprint {sprint_id} not found")
    db.delete(s)
    db.commit()
