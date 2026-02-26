from sqlalchemy.orm import Session
from ..models.user import User, ProjectRole
from ..schemas.user import UserCreate, UserUpdate, ProjectRoleCreate, ProjectRoleUpdate

# User CRUD
def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, data: UserCreate):
    user = User(**data.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user(db: Session, user_id: int, data: UserUpdate):
    user = get_user(db, user_id)
    if not user:
        raise ValueError(f"User {user_id} not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    user = get_user(db, user_id)
    if not user:
        raise ValueError(f"User {user_id} not found")
    db.delete(user)
    db.commit()

# ProjectRole CRUD
def get_project_role(db: Session, user_id: int, project_id: int):
    return db.query(ProjectRole).filter(ProjectRole.user_id == user_id, ProjectRole.project_id == project_id).first()

def assign_role(db: Session, data: ProjectRoleCreate):
    role = ProjectRole(**data.model_dump())
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

def update_role(db: Session, role_id: int, data: ProjectRoleUpdate):
    role = db.query(ProjectRole).filter(ProjectRole.id == role_id).first()
    if not role:
        raise ValueError(f"Role {role_id} not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(role, k, v)
    db.commit()
    db.refresh(role)
    return role

def delete_role(db: Session, role_id: int):
    role = db.query(ProjectRole).filter(ProjectRole.id == role_id).first()
    if not role:
        raise ValueError(f"Role {role_id} not found")
    db.delete(role)
    db.commit()
