from pydantic import BaseModel
from typing import Optional

class RetrospectiveBase(BaseModel):
    summary: Optional[str] = None
    positives: Optional[str] = None
    negatives: Optional[str] = None
    needs_improve: Optional[str] = None
    actions: Optional[str] = None

class RetrospectiveCreate(RetrospectiveBase):
    pass

class RetrospectiveUpdate(BaseModel):
    summary: Optional[str] = None
    positives: Optional[str] = None
    negatives: Optional[str] = None
    needs_improve: Optional[str] = None
    actions: Optional[str] = None

class RetrospectiveOut(RetrospectiveBase):
    id: int
    sprint_id: int
    created_at: Optional[str]
    updated_at: Optional[str]

    class Config:
        orm_mode = True
