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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(import_router)
app.include_router(task_router)
app.include_router(report_router)
app.include_router(project_router)
app.include_router(config_router)
app.include_router(retrospective_router)
app.include_router(team_router)
app.include_router(user_router)
