from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..core.dependencies import get_db
from ..schemas.project import (
    OrganizationCreate, OrganizationUpdate, OrganizationRead,
    ProjectCreate, ProjectUpdate,
    SprintCreate, SprintUpdate, SprintRead,
    ProjectRoleCreate, ProjectRoleUpdate, ProjectRoleOut,
)
from ..schemas.team_member import TeamMemberCreate, TeamMemberUpdate, TeamMemberOut
from ..services.project_service import (
    # ...existing code...
    list_team_members, add_team_member, update_team_member, delete_team_member
)
from ..services.project_service import (
    list_organizations, create_organization, update_organization, delete_organization,
    list_projects, create_project, get_project_detail, update_project, delete_project,
    list_sprints, create_sprint, update_sprint, activate_sprint, complete_sprint, delete_sprint,
)

router = APIRouter(prefix="", tags=["projects"])


# ── Organizations ─────────────────────────────────────────────────────────────

@router.get("/organizations", response_model=list[OrganizationRead])
def get_orgs(db: Session = Depends(get_db)):
    return list_organizations(db)


@router.post("/organizations", status_code=201)
def post_org(data: OrganizationCreate, db: Session = Depends(get_db)):
    try:
        return create_organization(db, data)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.patch("/organizations/{org_id}")
def patch_org(org_id: int, data: OrganizationUpdate, db: Session = Depends(get_db)):
    try:
        return update_organization(db, org_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/organizations/{org_id}", status_code=204)
def del_org(org_id: int, db: Session = Depends(get_db)):
    try:
        delete_organization(db, org_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


# ── Projects ──────────────────────────────────────────────────────────────────
from fastapi import Body
from ..core.permissions import check_role_permission

# ── Team Members ──────────────────────────────────────────────────────────────
@router.get("/projects/{project_id}/team_members", response_model=list[TeamMemberOut])
def get_team_members(project_id: int, db: Session = Depends(get_db)):
    return list_team_members(db, project_id)

@router.post("/projects/{project_id}/team_members", response_model=TeamMemberOut, status_code=201)
def post_team_member(project_id: int, data: TeamMemberCreate = Body(...), db: Session = Depends(get_db)):
    return add_team_member(db, project_id, data)

@router.patch("/projects/{project_id}/team_members/{member_id}", response_model=TeamMemberOut)
def patch_team_member(project_id: int, member_id: int, data: TeamMemberUpdate = Body(...), db: Session = Depends(get_db)):
    return update_team_member(db, project_id, member_id, data)

@router.delete("/projects/{project_id}/team_members/{member_id}", status_code=204)
def del_team_member(project_id: int, member_id: int, db: Session = Depends(get_db)):
    delete_team_member(db, project_id, member_id)

@router.get("/projects")
def get_projects(org_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    return list_projects(db, org_id)


@router.post("/projects", status_code=201)
def post_project(data: ProjectCreate, db: Session = Depends(get_db), user_id: int = 1):
    check_role_permission(db, user_id, data.org_id, "create")
    try:
        return create_project(db, data)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.get("/projects/{project_id}")
def get_project(project_id: int, db: Session = Depends(get_db)):
    try:
        return get_project_detail(db, project_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.patch("/projects/{project_id}")
def patch_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db), user_id: int = 1):
    check_role_permission(db, user_id, project_id, "update")
    try:
        return update_project(db, project_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/projects/{project_id}", status_code=204)
def del_project(project_id: int, db: Session = Depends(get_db), user_id: int = 1):
    check_role_permission(db, user_id, project_id, "delete")
    try:
        delete_project(db, project_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


# ── Sprints ───────────────────────────────────────────────────────────────────

@router.get("/projects/{project_id}/sprints", response_model=list[SprintRead])
def get_project_sprints(project_id: int, db: Session = Depends(get_db)):
    return list_sprints(db, project_id)


@router.post("/projects/{project_id}/sprints", response_model=SprintRead, status_code=201)
def post_sprint(project_id: int, data: SprintCreate, db: Session = Depends(get_db)):
    try:
        return create_sprint(db, project_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.patch("/sprints/{sprint_id}", response_model=SprintRead)
def patch_sprint(sprint_id: int, data: SprintUpdate, db: Session = Depends(get_db)):
    try:
        return update_sprint(db, sprint_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/sprints/{sprint_id}/activate", response_model=SprintRead)
def do_activate(sprint_id: int, db: Session = Depends(get_db)):
    try:
        return activate_sprint(db, sprint_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/sprints/{sprint_id}/complete", response_model=SprintRead)
def do_complete(sprint_id: int, db: Session = Depends(get_db)):
    try:
        return complete_sprint(db, sprint_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/sprints/{sprint_id}", status_code=204)
def del_sprint(sprint_id: int, db: Session = Depends(get_db)):
    try:
        delete_sprint(db, sprint_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


# ── Roles ─────────────────────────────────────────────────────────────────────
from ..models.user import ProjectRole as ProjectRoleModel

@router.get("/projects/{project_id}/roles/{user_id}", response_model=ProjectRoleOut)
def get_role(project_id: int, user_id: int, db: Session = Depends(get_db)):
    role = db.query(ProjectRoleModel).filter(
        ProjectRoleModel.project_id == project_id,
        ProjectRoleModel.user_id == user_id,
    ).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role

@router.post("/projects/{project_id}/roles", response_model=ProjectRoleOut, status_code=201)
def assign_role(project_id: int, data: ProjectRoleCreate, db: Session = Depends(get_db)):
    existing = db.query(ProjectRoleModel).filter(
        ProjectRoleModel.project_id == project_id,
        ProjectRoleModel.user_id == data.user_id,
    ).first()
    if existing:
        existing.role = data.role
        if data.permissions is not None:
            existing.permissions = data.permissions
        db.commit()
        db.refresh(existing)
        return existing
    role = ProjectRoleModel(
        user_id=data.user_id,
        project_id=project_id,
        role=data.role,
        permissions=data.permissions,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

@router.patch("/roles/{role_id}", response_model=ProjectRoleOut)
def update_role(role_id: int, data: ProjectRoleUpdate, db: Session = Depends(get_db)):
    role = db.query(ProjectRoleModel).filter(ProjectRoleModel.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    if data.role is not None:
        role.role = data.role
    if data.permissions is not None:
        role.permissions = data.permissions
    db.commit()
    db.refresh(role)
    return role
