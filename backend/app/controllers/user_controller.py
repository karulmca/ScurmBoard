from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List
from ..core.dependencies import get_db
from ..schemas.user import UserCreate, UserUpdate, UserOut, UserLogin, Token, ProjectRoleCreate, ProjectRoleUpdate, ProjectRoleOut
from ..models.user import User, GlobalRole
from ..services.user_service import (
    list_users, get_user, create_user, create_super_admin, update_user, delete_user, authenticate_user,
    get_project_role, assign_role, update_role, delete_role, can_user_perform_action
)
from ..core.security import create_access_token

router = APIRouter(prefix="", tags=["users"])

@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserCreate = Body(...), db: Session = Depends(get_db)):
    """Register a new user."""
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return create_user(db, data)

@router.post("/login", response_model=Token)
def login(data: UserLogin = Body(...), db: Session = Depends(get_db)):
    """Login user and return access token."""
    from ..models.user import User
    user = authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/users", response_model=List[UserOut])
def get_users(db: Session = Depends(get_db)):
    return list_users(db)

@router.get("/users/{user_id}", response_model=UserOut)
def get_user_detail(user_id: int, db: Session = Depends(get_db)):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/users", response_model=UserOut, status_code=201)
def post_user(data: UserCreate = Body(...), db: Session = Depends(get_db)):
    return create_user(db, data)

@router.patch("/users/{user_id}", response_model=UserOut)
def patch_user(user_id: int, data: UserUpdate = Body(...), db: Session = Depends(get_db)):
    return update_user(db, user_id, data)

@router.delete("/users/{user_id}", status_code=204)
def del_user(user_id: int, db: Session = Depends(get_db)):
    delete_user(db, user_id)

@router.get("/projects/{project_id}/roles/{user_id}", response_model=ProjectRoleOut)
def get_role(project_id: int, user_id: int, db: Session = Depends(get_db)):
    role = get_project_role(db, user_id, project_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role

@router.post("/projects/{project_id}/roles", response_model=ProjectRoleOut, status_code=201)
def post_role(project_id: int, data: ProjectRoleCreate = Body(...), db: Session = Depends(get_db)):
    return assign_role(db, data)

@router.patch("/roles/{role_id}", response_model=ProjectRoleOut)
def patch_role(role_id: int, data: ProjectRoleUpdate = Body(...), db: Session = Depends(get_db)):
    return update_role(db, role_id, data)

@router.post("/setup-super-admin", response_model=UserOut)
def setup_super_admin(db: Session = Depends(get_db)):
    """Create the default Super Admin user (one-time setup)"""
    admin = create_super_admin(db)
    return admin

# Role management endpoints
@router.get("/roles/global")
def get_global_roles():
    """Get all available global roles"""
    return [{"name": role.value, "value": role.name} for role in GlobalRole]

@router.get("/roles/project")
def get_project_roles():
    """Get all available project roles"""
    from ..models.user import ProjectRoleType
    return [{"name": role.value, "value": role.name} for role in ProjectRoleType]

@router.get("/users/{user_id}/permissions")
def get_user_permissions(user_id: int, project_id: int = None, db: Session = Depends(get_db)):
    """Get permissions for a user"""
    from ..services.user_service import get_user_permissions
    permissions = get_user_permissions(db, user_id, project_id)
    return [{"name": perm.value, "value": perm.name} for perm in permissions]

@router.post("/users/{user_id}/check-permission")
def check_user_permission(user_id: int, action: str, project_id: int = None, db: Session = Depends(get_db)):
    """Check if user can perform an action"""
    can_perform = can_user_perform_action(db, user_id, action, project_id)
    return {"can_perform": can_perform, "action": action, "user_id": user_id, "project_id": project_id}
