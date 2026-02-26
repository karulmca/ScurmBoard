from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..core.base import Base
from datetime import datetime

class Retrospective(Base):
    """
    Retrospective for a sprint, linked to Sprint.
    """
    __tablename__ = "retrospectives"

    id = Column(Integer, primary_key=True, index=True)
    sprint_id = Column(Integer, ForeignKey("sprints.id", ondelete="CASCADE"), nullable=False)
    summary = Column(Text, nullable=True)
    positives = Column(Text, nullable=True)  # What went well
    negatives = Column(Text, nullable=True)  # What didn't go well
    needs_improve = Column(Text, nullable=True)  # What needs to improve
    actions = Column(Text, nullable=True)    # Action items
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sprint = relationship("Sprint", backref="retrospective")
