from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from ..models.user import ProjectRole

ROLE_PERMISSIONS = {
    "Admin": ["create", "update", "delete", "view"],
    "Member": ["update", "view"],
    "Viewer": ["view"],
}

def check_role_permission(db: Session, user_id: int, project_id: int, action: str):
    role = db.query(ProjectRole).filter(ProjectRole.user_id == user_id, ProjectRole.project_id == project_id).first()
    if not role:
        raise HTTPException(status_code=403, detail="No role assigned for this project")
    allowed = ROLE_PERMISSIONS.get(role.role, [])
    if action not in allowed:
        raise HTTPException(status_code=403, detail=f"Role '{role.role}' does not permit '{action}' action")
