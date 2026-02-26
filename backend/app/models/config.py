"""
AppConfig – per-organisation configuration table.
Stores JSON blobs keyed by (org_id, config_key).
org_id=None means global/system default.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from ..core.base import Base


class AppConfig(Base):
    __tablename__ = "app_configs"

    id         = Column(Integer, primary_key=True, index=True)
    org_id     = Column(Integer, nullable=True, index=True)   # NULL = global default
    config_key = Column(String, nullable=False, index=True)   # e.g. "work_item_types"
    value      = Column(Text, nullable=False)                 # JSON array/object string
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
