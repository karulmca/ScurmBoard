from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from ..core.dependencies import get_db
from ..schemas.retrospective import RetrospectiveCreate, RetrospectiveUpdate, RetrospectiveOut
from ..services.retrospective_service import (
    get_retrospective, create_retrospective, update_retrospective, delete_retrospective
)

router = APIRouter(prefix="", tags=["retrospectives"])

@router.get("/sprints/{sprint_id}/retrospective", response_model=RetrospectiveOut)
def get_sprint_retrospective(sprint_id: int, db: Session = Depends(get_db)):
    retro = get_retrospective(db, sprint_id)
    if not retro:
        raise HTTPException(status_code=404, detail="Retrospective not found")
    return retro

@router.post("/sprints/{sprint_id}/retrospective", response_model=RetrospectiveOut, status_code=201)
def post_sprint_retrospective(sprint_id: int, data: RetrospectiveCreate = Body(...), db: Session = Depends(get_db)):
    return create_retrospective(db, sprint_id, data)

@router.patch("/sprints/{sprint_id}/retrospective", response_model=RetrospectiveOut)
def patch_sprint_retrospective(sprint_id: int, data: RetrospectiveUpdate = Body(...), db: Session = Depends(get_db)):
    return update_retrospective(db, sprint_id, data)

@router.delete("/sprints/{sprint_id}/retrospective", status_code=204)
def del_sprint_retrospective(sprint_id: int, db: Session = Depends(get_db)):
    delete_retrospective(db, sprint_id)
