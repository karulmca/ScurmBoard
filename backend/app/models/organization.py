from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..core.base import Base


class Organization(Base):
    """
    Top-level tenant – represents a company or business unit.
    Multiple projects can belong to one org.
    """
    __tablename__ = "organizations"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False)
    slug        = Column(String, unique=True, index=True, nullable=False)   # URL-friendly identifier
    logo_url    = Column(String, nullable=True)
    theme_color = Column(String, default="#0078d4")
    settings    = Column(Text, nullable=True)    # JSON blob for extra config
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Project(Base):
    """
    A scrum/kanban project within an organisation.
    Holds sprints, work items and configuration.
    """
    __tablename__ = "projects"

    id              = Column(Integer, primary_key=True, index=True)
    org_id          = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    name            = Column(String, nullable=False)
    key             = Column(String, unique=True, index=True, nullable=False)  # e.g. "PROJ"
    description     = Column(Text, nullable=True)
    methodology     = Column(String, default="Scrum")   # Scrum | Kanban | SAFe | XP
    state           = Column(String, default="active")  # active | archived | planning
    lead            = Column(String, nullable=True)     # lead person name / email
    color           = Column(String, default="#0078d4") # accent colour
    icon            = Column(String, default="📁")      # emoji icon
    sprint_duration = Column(Integer, default=14)       # default sprint length in days
    created_at      = Column(DateTime, default=datetime.utcnow)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship: team members
    team_members = relationship(
        "TeamMember",
        primaryjoin="Project.id==TeamMember.project_id",
        cascade="all, delete-orphan",
        backref="project"
    )


class Sprint(Base):
    """
    A time-boxed iteration within a project.
    Only one sprint per project can be 'active' at a time.
    """
    __tablename__ = "sprints"

    id         = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name       = Column(String, nullable=False)
    goal       = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date   = Column(Date, nullable=True)
    state      = Column(String, default="planning")  # planning | active | completed
    capacity   = Column(Float, nullable=True)        # planned story points
    velocity   = Column(Float, nullable=True)        # actual completed story points
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
