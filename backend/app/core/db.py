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
    """Safely add new columns to existing tables (PostgreSQL-compatible)."""
    inspector = inspect(engine)

    # Handle users table migrations
    if "users" in inspector.get_table_names():
        users_existing = {col["name"] for col in inspector.get_columns("users")}
        users_columns = {
            "password_hash": "ALTER TABLE users ADD COLUMN password_hash VARCHAR",
            "global_role": "ALTER TABLE users ADD COLUMN global_role VARCHAR DEFAULT 'Developer'",
            "is_active": "ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE",
        }
        with engine.begin() as conn:
            for col, sql in users_columns.items():
                if col not in users_existing:
                    print(f"Adding column {col} to users table...")
                    conn.execute(text(sql))

            # Update existing users to have Developer role if they don't have a role
            try:
                conn.execute(text("UPDATE users SET global_role = 'Developer' WHERE global_role IS NULL"))
                conn.execute(text("UPDATE users SET is_active = TRUE WHERE is_active IS NULL"))
            except:
                pass  # Ignore if columns don't exist yet

    # Handle project_roles table migrations
    if "project_roles" in inspector.get_table_names():
        roles_existing = {col["name"] for col in inspector.get_columns("project_roles")}
        roles_columns = {
            "assigned_at": "ALTER TABLE project_roles ADD COLUMN assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            "assigned_by": "ALTER TABLE project_roles ADD COLUMN assigned_by INTEGER REFERENCES users(id)",
        }
        with engine.begin() as conn:
            for col, sql in roles_columns.items():
                if col not in roles_existing:
                    print(f"Adding column {col} to project_roles table...")
                    conn.execute(text(sql))

    # Handle tasks table migrations
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
