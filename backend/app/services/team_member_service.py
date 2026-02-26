from sqlalchemy.orm import Session
from ..models.team_member import TeamMember
from ..models.organization import Project
from ..schemas.team_member import TeamMemberCreate, TeamMemberUpdate

# List team members for a project
def list_team_members(db: Session, project_id: int):
    return db.query(TeamMember).filter(TeamMember.project_id == project_id).all()

# Add a team member to a project
def add_team_member(db: Session, project_id: int, data: TeamMemberCreate):
    if not db.query(Project).filter(Project.id == project_id).first():
        raise ValueError(f"Project {project_id} not found")
    member = TeamMember(project_id=project_id, **data.model_dump())
    db.add(member)
    db.commit()
    db.refresh(member)
    return member

# Update a team member
def update_team_member(db: Session, project_id: int, member_id: int, data: TeamMemberUpdate):
    member = db.query(TeamMember).filter(TeamMember.id == member_id, TeamMember.project_id == project_id).first()
    if not member:
        raise ValueError(f"Team member {member_id} not found in project {project_id}")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(member, k, v)
    db.commit()
    db.refresh(member)
    return member

# Delete a team member
def delete_team_member(db: Session, project_id: int, member_id: int):
    member = db.query(TeamMember).filter(TeamMember.id == member_id, TeamMember.project_id == project_id).first()
    if not member:
        raise ValueError(f"Team member {member_id} not found in project {project_id}")
    db.delete(member)
    db.commit()
