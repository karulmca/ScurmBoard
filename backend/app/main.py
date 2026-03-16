from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.db import Base, engine, run_migrations
from .controllers.import_controller import router as import_router
from .controllers.report_controller import router as report_router
from .controllers.task_controller import router as task_router
from .controllers.project_controller import router as project_router
from .controllers.config_controller import router as config_router
from .controllers.retrospective_controller import router as retrospective_router
from .controllers.team_controller import router as team_router
from .controllers.user_controller import router as user_router

run_migrations()                        # add any new columns to existing DB
Base.metadata.create_all(bind=engine)  # create tables if they don't exist yet

app = FastAPI(title="Scrum Update Tracking System")

# ── CORS Configuration ──────────────────────────────────────────────
CORS_ORIGINS = [
    "http://localhost:3000",   # API Gateway
    "http://localhost:5173",   # Vite dev server (frontend)
    "http://localhost:5174",   # Vite dev server (frontend - alternate port)
    "http://localhost:8081",   # Expo web
    "http://localhost:19006",  # Expo web (older)
    "http://10.0.2.2:3000",    # Android emulator
    "http://10.0.2.2:5173",    # Android emulator (frontend)
    "http://10.0.2.2:5174",    # Android emulator (frontend - alternate port)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    expose_headers=["Content-Range", "X-Content-Range"],
    max_age=3600,
)

app.include_router(import_router)
app.include_router(task_router)
app.include_router(report_router)
app.include_router(project_router)
app.include_router(config_router)
app.include_router(retrospective_router)
app.include_router(team_router)
app.include_router(user_router)
