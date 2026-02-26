from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from ..core.dependencies import get_db
from ..schemas.user import UserCreate, UserUpdate, UserOut, ProjectRoleCreate, ProjectRoleUpdate, ProjectRoleOut
from ..services.user_service import (
    get_user, create_user, update_user, delete_user,
    get_project_role, assign_role, update_role, delete_role
)

router = APIRouter(prefix="", tags=["users"])

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

@router.delete("/roles/{role_id}", status_code=204)
def del_role(role_id: int, db: Session = Depends(get_db)):
    delete_role(db, role_id)
