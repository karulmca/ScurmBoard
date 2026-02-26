from sqlalchemy.orm import Session
from ..models.team import Team, TeamMembership, ProjectTeam
from ..models.user import User
from ..schemas.team import TeamCreate, TeamUpdate, AddUserToTeam


# ── Teams CRUD ────────────────────────────────────────────────────────────────
def list_teams(db: Session):
    teams = db.query(Team).order_by(Team.name).all()
    result = []
    for t in teams:
        result.append({
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "member_count": len(t.memberships),
        })
    return result


def get_team(db: Session, team_id: int):
    return db.query(Team).filter(Team.id == team_id).first()


def create_team(db: Session, data: TeamCreate):
    team = Team(**data.model_dump())
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


def update_team(db: Session, team_id: int, data: TeamUpdate):
    team = get_team(db, team_id)
    if not team:
        raise ValueError(f"Team {team_id} not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(team, k, v)
    db.commit()
    db.refresh(team)
    return team


def delete_team(db: Session, team_id: int):
    team = get_team(db, team_id)
    if not team:
        raise ValueError(f"Team {team_id} not found")
    db.delete(team)
    db.commit()


# ── Team members ──────────────────────────────────────────────────────────────
def list_team_members(db: Session, team_id: int):
    memberships = (
        db.query(TeamMembership)
        .filter(TeamMembership.team_id == team_id)
        .all()
    )
    result = []
    for m in memberships:
        user = db.query(User).filter(User.id == m.user_id).first()
        if user:
            result.append({
                "user_id":   user.id,
                "name":      user.name,
                "email":     user.email,
                "team_role": m.role,
            })
    return result


def add_user_to_team(db: Session, team_id: int, payload: AddUserToTeam):
    """
    Add an existing user (by user_id) or create a new one (by name+email)
    and attach them to the team.
    """
    team = get_team(db, team_id)
    if not team:
        raise ValueError(f"Team {team_id} not found")

    if payload.user_id:
        user = db.query(User).filter(User.id == payload.user_id).first()
        if not user:
            raise ValueError(f"User {payload.user_id} not found")
    elif payload.name and payload.email:
        # Create the user if email doesn't exist yet
        user = db.query(User).filter(User.email == payload.email).first()
        if not user:
            user = User(name=payload.name, email=payload.email)
            db.add(user)
            db.flush()
    else:
        raise ValueError("Provide user_id or both name and email")

    # Check not already a member
    existing = (
        db.query(TeamMembership)
        .filter(TeamMembership.team_id == team_id, TeamMembership.user_id == user.id)
        .first()
    )
    if existing:
        # update role if provided
        if payload.team_role is not None:
            existing.role = payload.team_role
            db.commit()
        return {"user_id": user.id, "name": user.name, "email": user.email, "team_role": existing.role}

    membership = TeamMembership(team_id=team_id, user_id=user.id, role=payload.team_role)
    db.add(membership)
    db.commit()
    return {"user_id": user.id, "name": user.name, "email": user.email, "team_role": membership.role}


def remove_user_from_team(db: Session, team_id: int, user_id: int):
    membership = (
        db.query(TeamMembership)
        .filter(TeamMembership.team_id == team_id, TeamMembership.user_id == user_id)
        .first()
    )
    if not membership:
        raise ValueError(f"User {user_id} is not a member of team {team_id}")
    db.delete(membership)
    db.commit()


# ── Project ↔ Team mapping ────────────────────────────────────────────────────
def get_project_teams(db: Session, project_id: int):
    rows = db.query(ProjectTeam).filter(ProjectTeam.project_id == project_id).all()
    return [
        {"project_id": r.project_id, "team_id": r.team_id, "team_name": r.team.name}
        for r in rows
    ]


def assign_team_to_project(db: Session, project_id: int, team_id: int):
    team = get_team(db, team_id)
    if not team:
        raise ValueError(f"Team {team_id} not found")
    existing = (
        db.query(ProjectTeam)
        .filter(ProjectTeam.project_id == project_id, ProjectTeam.team_id == team_id)
        .first()
    )
    if existing:
        return {"project_id": project_id, "team_id": team_id, "team_name": team.name}
    pt = ProjectTeam(project_id=project_id, team_id=team_id)
    db.add(pt)
    db.commit()
    return {"project_id": project_id, "team_id": team_id, "team_name": team.name}


def unassign_team_from_project(db: Session, project_id: int, team_id: int):
    pt = (
        db.query(ProjectTeam)
        .filter(ProjectTeam.project_id == project_id, ProjectTeam.team_id == team_id)
        .first()
    )
    if not pt:
        raise ValueError(f"Team {team_id} not assigned to project {project_id}")
    db.delete(pt)
    db.commit()


def can_user_access_project(db: Session, user_id: int, project_id: int) -> bool:
    """
    Returns True if:
     - No teams are assigned to the project (open access), OR
     - The user belongs to at least one team assigned to the project.
    """
    assigned_teams = (
        db.query(ProjectTeam).filter(ProjectTeam.project_id == project_id).all()
    )
    if not assigned_teams:
        return True  # no restriction
    team_ids = {pt.team_id for pt in assigned_teams}
    membership = (
        db.query(TeamMembership)
        .filter(
            TeamMembership.user_id == user_id,
            TeamMembership.team_id.in_(team_ids),
        )
        .first()
    )
    return membership is not None
