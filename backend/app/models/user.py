from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from ..core.base import Base
from datetime import datetime
import enum

class GlobalRole(enum.Enum):
    """Global system roles with hierarchical permissions"""
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

class ProjectRoleType(enum.Enum):
    """Project-specific roles"""
    OWNER = "Owner"
    ADMIN = "Admin"
    SCRUM_MASTER = "Scrum Master"
    DEVELOPER = "Developer"
    QA = "QA"
    VIEWER = "Viewer"

class User(Base):
    """
    Represents a user in the system.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    password_hash = Column(String, nullable=False)
    global_role = Column(Enum(GlobalRole), default=GlobalRole.DEVELOPER, nullable=False)
    settings = Column(Text, nullable=True)  # JSON blob for user settings
    is_active = Column(String, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project_roles = relationship("ProjectRole", back_populates="user", foreign_keys="ProjectRole.user_id")

class ProjectRole(Base):
    """
    Role assignment for a user in a project.
    """
    __tablename__ = "project_roles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(ProjectRoleType), default=ProjectRoleType.DEVELOPER, nullable=False)
    permissions = Column(Text, nullable=True)  # JSON string for granular permissions
    assigned_at = Column(DateTime, default=datetime.utcnow)
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Who assigned this role

    # Relationships
    user = relationship("User", back_populates="project_roles", foreign_keys=[user_id])
    project = relationship("Project", backref="project_roles")
    assigner = relationship("User", foreign_keys=[assigned_by])
