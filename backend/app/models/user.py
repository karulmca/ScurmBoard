from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..core.base import Base
from datetime import datetime

class User(Base):
    """
    Represents a user in the system.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    settings = Column(Text, nullable=True)  # JSON blob for user settings
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ProjectRole(Base):
    """
    Role assignment for a user in a project.
    """
    __tablename__ = "project_roles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)  # e.g. Admin, Member, Viewer
    permissions = Column(Text, nullable=True)  # JSON string for granular permissions

    user = relationship("User", backref="project_roles")
    project = relationship("Project", backref="project_roles")
