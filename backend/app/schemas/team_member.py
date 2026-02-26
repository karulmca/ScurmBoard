from pydantic import BaseModel, EmailStr
from typing import Optional

class TeamMemberBase(BaseModel):
    name: str
    email: EmailStr
    role: Optional[str] = None

class TeamMemberCreate(TeamMemberBase):
    pass

class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None

class TeamMemberOut(TeamMemberBase):
    id: int
    project_id: int

    class Config:
        orm_mode = True
