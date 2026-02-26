import json
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from ..models.user import ProjectRole

DEFAULT_ROLE_PERMISSIONS = {
    "Admin": {
        "tasks": ["create", "update", "delete", "view"],
        "sprints": ["create", "update", "delete", "view"],
        "retrospectives": ["create", "update", "delete", "view"],
        "team": ["add", "update", "delete", "view"],
        "settings": ["update", "view"],
    },
    "Member": {
        "tasks": ["update", "view"],
        "sprints": ["view"],
        "retrospectives": ["view"],
        "team": ["view"],
        "settings": ["view"],
    },
    "Viewer": {
        "tasks": ["view"],
        "sprints": ["view"],
        "retrospectives": ["view"],
        "team": ["view"],
        "settings": ["view"],
    },
}

def check_granular_permission(db: Session, user_id: int, project_id: int, section: str, action: str):
    role = db.query(ProjectRole).filter(ProjectRole.user_id == user_id, ProjectRole.project_id == project_id).first()
    if not role:
        raise HTTPException(status_code=403, detail="No role assigned for this project")
    perms = DEFAULT_ROLE_PERMISSIONS.get(role.role, {})
    if role.permissions:
        try:
            custom = json.loads(role.permissions)
            perms.update(custom)
        except Exception:
            pass
    allowed = perms.get(section, [])
    if action not in allowed:
        raise HTTPException(status_code=403, detail=f"Role '{role.role}' does not permit '{action}' in '{section}'")
