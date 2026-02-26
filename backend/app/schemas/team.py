from pydantic import BaseModel, EmailStr
from typing import Optional, List


# ── Team ──────────────────────────────────────────────────────────────────────
class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class TeamOut(TeamBase):
    id: int
    member_count: Optional[int] = 0
    class Config:
        from_attributes = True


# ── TeamMembership ────────────────────────────────────────────────────────────
class TeamMembershipBase(BaseModel):
    user_id: int
    role: Optional[str] = None

class TeamMembershipCreate(TeamMembershipBase):
    pass

class TeamMemberOut(BaseModel):
    """User info + membership role, returned when listing team members."""
    user_id: int
    name: str
    email: str
    team_role: Optional[str] = None
    class Config:
        from_attributes = True


# ── ProjectTeam ───────────────────────────────────────────────────────────────
class ProjectTeamOut(BaseModel):
    project_id: int
    team_id: int
    team_name: Optional[str] = None
    class Config:
        from_attributes = True


# ── Payload to add a user to a team ──────────────────────────────────────────
class AddUserToTeam(BaseModel):
    """
    Either supply an existing user_id, or provide name+email to create a new user.
    """
    user_id: Optional[int] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    team_role: Optional[str] = None
