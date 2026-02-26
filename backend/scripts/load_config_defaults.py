"""
Script to bulk load static config defaults into the app_configs table.
Run this after migrating to PostgreSQL to pre-populate config values.
"""
import json
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.app.core.config_defaults import DEFAULTS
from backend.app.models.config import AppConfig

DATABASE_URL = "postgresql://postgres:password-1@localhost:5432/ScrumBoard"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def main():
    session = SessionLocal()
    for key, value in DEFAULTS.items():
        exists = session.query(AppConfig).filter_by(config_key=key, org_id=None).first()
        if not exists:
            row = AppConfig(org_id=None, config_key=key, value=json.dumps(value, ensure_ascii=False))
            session.add(row)
    session.commit()
    session.close()
    print("Loaded static config defaults into app_configs table.")

if __name__ == "__main__":
    main()
