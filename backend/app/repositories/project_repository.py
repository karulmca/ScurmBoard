from typing import List, Optional
from sqlalchemy.orm import Session

from ..models.organization import Organization, Project, Sprint


# ── Organization ──────────────────────────────────────────────────────────────

def get_organizations(db: Session) -> List[Organization]:
    return db.query(Organization).order_by(Organization.name).all()


def get_organization(db: Session, org_id: int) -> Optional[Organization]:
    return db.query(Organization).filter(Organization.id == org_id).first()


def get_org_by_slug(db: Session, slug: str) -> Optional[Organization]:
    return db.query(Organization).filter(Organization.slug == slug).first()


# ── Project ───────────────────────────────────────────────────────────────────

def get_projects(db: Session, org_id: Optional[int] = None) -> List[Project]:
    q = db.query(Project)
    if org_id:
        q = q.filter(Project.org_id == org_id)
    return q.order_by(Project.name).all()


def get_project(db: Session, project_id: int) -> Optional[Project]:
    return db.query(Project).filter(Project.id == project_id).first()


def get_project_by_key(db: Session, key: str) -> Optional[Project]:
    return db.query(Project).filter(Project.key == key).first()


# ── Sprint ────────────────────────────────────────────────────────────────────

def get_sprints(db: Session, project_id: int) -> List[Sprint]:
    return (
        db.query(Sprint)
        .filter(Sprint.project_id == project_id)
        .order_by(Sprint.start_date.asc().nullsfirst(), Sprint.created_at.asc())
        .all()
    )


def get_sprint(db: Session, sprint_id: int) -> Optional[Sprint]:
    return db.query(Sprint).filter(Sprint.id == sprint_id).first()


def get_active_sprint(db: Session, project_id: int) -> Optional[Sprint]:
    return (
        db.query(Sprint)
        .filter(Sprint.project_id == project_id, Sprint.state == "active")
        .first()
    )
