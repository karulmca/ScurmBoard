from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

class GlobalRole(str, Enum):
    SUPER_ADMIN = "Super Admin"
    ADMIN = "Admin"
    PROJECT_MANAGER = "Project Manager"
    SCRUM_MASTER = "Scrum Master"
    ARCHITECT = "Architect"
    LEAD = "Lead"
    DEVELOPER = "Developer"
    QA = "QA"
    BUSINESS_ANALYST = "Business Analyst"
    BUSINESS = "Business"

class ProjectRoleType(str, Enum):
    OWNER = "Owner"
    ADMIN = "Admin"
    SCRUM_MASTER = "Scrum Master"
    DEVELOPER = "Developer"
    QA = "QA"
    VIEWER = "Viewer"

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    global_role: Optional[GlobalRole] = GlobalRole.DEVELOPER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    global_role: Optional[GlobalRole] = None
    settings: Optional[str] = None
    is_active: Optional[bool] = None

class UserOut(UserBase):
    id: int
    global_role: GlobalRole
    settings: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class ProjectRoleBase(BaseModel):
    user_id: int
    project_id: int
    role: ProjectRoleType
    permissions: Optional[str] = None

class ProjectRoleCreate(ProjectRoleBase):
    pass

class ProjectRoleUpdate(BaseModel):
    role: Optional[ProjectRoleType] = None
    permissions: Optional[str] = None

class ProjectRoleOut(ProjectRoleBase):
    id: int
    assigned_at: Optional[datetime] = None
    assigned_by: Optional[int] = None
    class Config:
        from_attributes = True
