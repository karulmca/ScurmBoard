from sqlalchemy.orm import Session
from ..models.retrospective import Retrospective
from ..models.organization import Sprint
from ..schemas.retrospective import RetrospectiveCreate, RetrospectiveUpdate

# Get retrospective for a sprint
def get_retrospective(db: Session, sprint_id: int):
    return db.query(Retrospective).filter(Retrospective.sprint_id == sprint_id).first()

# Create retrospective for a sprint
def create_retrospective(db: Session, sprint_id: int, data: RetrospectiveCreate):
    if not db.query(Sprint).filter(Sprint.id == sprint_id).first():
        raise ValueError(f"Sprint {sprint_id} not found")
    retro = Retrospective(sprint_id=sprint_id, **data.model_dump())
    db.add(retro)
    db.commit()
    db.refresh(retro)
    return retro

# Update retrospective
def update_retrospective(db: Session, sprint_id: int, data: RetrospectiveUpdate):
    retro = db.query(Retrospective).filter(Retrospective.sprint_id == sprint_id).first()
    if not retro:
        raise ValueError(f"Retrospective for sprint {sprint_id} not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(retro, k, v)
    db.commit()
    db.refresh(retro)
    return retro

# Delete retrospective
def delete_retrospective(db: Session, sprint_id: int):
    retro = db.query(Retrospective).filter(Retrospective.sprint_id == sprint_id).first()
    if not retro:
        raise ValueError(f"Retrospective for sprint {sprint_id} not found")
    db.delete(retro)
    db.commit()
