from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from ..core.dependencies import get_db
from ..schemas.team import TeamCreate, TeamUpdate, AddUserToTeam
from ..services import team_service

router = APIRouter(prefix="", tags=["teams"])


# ── Teams CRUD ────────────────────────────────────────────────────────────────
@router.get("/teams")
def get_teams(db: Session = Depends(get_db)):
    return team_service.list_teams(db)


@router.get("/teams/{team_id}")
def get_team(team_id: int, db: Session = Depends(get_db)):
    team = team_service.get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return {
        "id": team.id,
        "name": team.name,
        "description": team.description,
        "member_count": len(team.memberships),
    }


@router.post("/teams", status_code=201)
def create_team(data: TeamCreate = Body(...), db: Session = Depends(get_db)):
    try:
        team = team_service.create_team(db, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"id": team.id, "name": team.name, "description": team.description, "member_count": 0}


@router.patch("/teams/{team_id}")
def update_team(team_id: int, data: TeamUpdate = Body(...), db: Session = Depends(get_db)):
    try:
        team = team_service.update_team(db, team_id, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"id": team.id, "name": team.name, "description": team.description, "member_count": len(team.memberships)}


@router.delete("/teams/{team_id}", status_code=204)
def delete_team(team_id: int, db: Session = Depends(get_db)):
    try:
        team_service.delete_team(db, team_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── Team members ──────────────────────────────────────────────────────────────
@router.get("/teams/{team_id}/members")
def get_team_members(team_id: int, db: Session = Depends(get_db)):
    return team_service.list_team_members(db, team_id)


@router.post("/teams/{team_id}/members", status_code=201)
def add_member(team_id: int, payload: AddUserToTeam = Body(...), db: Session = Depends(get_db)):
    try:
        return team_service.add_user_to_team(db, team_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/teams/{team_id}/members/{user_id}", status_code=204)
def remove_member(team_id: int, user_id: int, db: Session = Depends(get_db)):
    try:
        team_service.remove_user_from_team(db, team_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── Project ↔ Team mapping ────────────────────────────────────────────────────
@router.get("/projects/{project_id}/teams")
def get_project_teams(project_id: int, db: Session = Depends(get_db)):
    return team_service.get_project_teams(db, project_id)


@router.post("/projects/{project_id}/teams/{team_id}", status_code=201)
def assign_team(project_id: int, team_id: int, db: Session = Depends(get_db)):
    try:
        return team_service.assign_team_to_project(db, project_id, team_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/projects/{project_id}/teams/{team_id}", status_code=204)
def unassign_team(project_id: int, team_id: int, db: Session = Depends(get_db)):
    try:
        team_service.unassign_team_from_project(db, project_id, team_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── Access check ──────────────────────────────────────────────────────────────
@router.get("/projects/{project_id}/access/{user_id}")
def check_access(project_id: int, user_id: int, db: Session = Depends(get_db)):
    allowed = team_service.can_user_access_project(db, user_id, project_id)
    return {"allowed": allowed, "user_id": user_id, "project_id": project_id}
