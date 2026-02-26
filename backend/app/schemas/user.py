from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr
    settings: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    settings: Optional[str] = None

class UserOut(UserBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class ProjectRoleBase(BaseModel):
    user_id: int
    project_id: int
    role: str
    permissions: Optional[str] = None

class ProjectRoleCreate(ProjectRoleBase):
    pass

class ProjectRoleUpdate(BaseModel):
    role: Optional[str] = None
    permissions: Optional[str] = None

class ProjectRoleOut(ProjectRoleBase):
    id: int
    class Config:
        from_attributes = True
