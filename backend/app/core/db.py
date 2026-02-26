from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://postgres:password-1@localhost:5432/ScrumBoard"

engine = create_engine(
    DATABASE_URL,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)



from .base import Base

# Import all models so they are registered with Base
from ..models import *


if __name__ == "__main__":
    print("Creating all tables in the database...")
    # Debug: Print registered tables before creating them
    print("Registered tables in Base.metadata:", list(Base.metadata.tables.keys()))
    Base.metadata.create_all(bind=engine)
    print("Done.")


def run_migrations() -> None:
    """Safely add new columns to existing tables (SQLite-compatible)."""
    inspector = inspect(engine)
    # Only migrate if the tasks table already exists
    if "tasks" not in inspector.get_table_names():
        return
    existing = {col["name"] for col in inspector.get_columns("tasks")}
    new_columns = {
        "work_item_type":  "ALTER TABLE tasks ADD COLUMN work_item_type VARCHAR DEFAULT 'Task'",
        "parent_task_id": "ALTER TABLE tasks ADD COLUMN parent_task_id VARCHAR",
        "priority":       "ALTER TABLE tasks ADD COLUMN priority INTEGER DEFAULT 3",
        "story_points":   "ALTER TABLE tasks ADD COLUMN story_points REAL",
        "description":    "ALTER TABLE tasks ADD COLUMN description TEXT",
        "sprint":         "ALTER TABLE tasks ADD COLUMN sprint VARCHAR",
        "tags":           "ALTER TABLE tasks ADD COLUMN tags VARCHAR",
        "area_path":   "ALTER TABLE tasks ADD COLUMN area_path VARCHAR",
        "project_id":  "ALTER TABLE tasks ADD COLUMN project_id INTEGER",
        "sprint_id":   "ALTER TABLE tasks ADD COLUMN sprint_id INTEGER",
    }
    with engine.begin() as conn:
        for col, sql in new_columns.items():
            if col not in existing:
                conn.execute(text(sql))
