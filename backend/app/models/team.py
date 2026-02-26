from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from ..core.base import Base


class Team(Base):
    """
    A named team that can be assigned to projects.
    Users belong to teams; teams are mapped to projects.
    """
    __tablename__ = "teams"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False, unique=True)
    description = Column(Text, nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    memberships    = relationship("TeamMembership",    cascade="all, delete-orphan", back_populates="team")
    project_teams  = relationship("ProjectTeam",       cascade="all, delete-orphan", back_populates="team")


class TeamMembership(Base):
    """
    Many-to-many: users ↔ teams.
    """
    __tablename__ = "team_memberships"
    __table_args__ = (UniqueConstraint("team_id", "user_id", name="uq_team_user"),)

    id      = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role    = Column(String, nullable=True)   # optional role within team: Lead, Dev, QA …

    team = relationship("Team", back_populates="memberships")
    user = relationship("User", backref="team_memberships")


class ProjectTeam(Base):
    """
    Many-to-many: projects ↔ teams.
    Only users in an assigned team can view the project board.
    """
    __tablename__ = "project_teams"
    __table_args__ = (UniqueConstraint("project_id", "team_id", name="uq_project_team"),)

    id         = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    team_id    = Column(Integer, ForeignKey("teams.id",   ondelete="CASCADE"), nullable=False)

    team    = relationship("Team",    back_populates="project_teams")
    project = relationship("Project", backref="project_teams")
