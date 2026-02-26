# Scrum Update Tracking System

## Overview
This workspace contains a FastAPI backend, an Express.js API gateway, and an Expo app (web + mobile) for tracking scrum updates from Azure DevOps dumps.

## Backend (FastAPI)
1. Create a virtual environment.
2. Install dependencies from backend/requirements.txt.
3. Run the API:
   - `uvicorn app.main:app --reload`

The API runs on http://localhost:8000

### Backend MVC Structure
- Models: backend/app/models.py
- Controllers (routes): backend/app/controllers/
- Services: backend/app/services/
- Repositories: backend/app/repositories/

### Endpoints
- POST /import (CSV/JSON/Excel upload)
- GET /tasks
- GET /tasks/{task_id}/updates
- PATCH /tasks/{task_id}
- GET /workitems
- POST /workitems
- DELETE /workitems/{task_id}
- GET /reports/daily
- GET /reports/weekly
- GET /reports/monthly
- GET /export/excel

## Gateway (Express.js)
1. Install dependencies from gateway/package.json.
2. Set FASTAPI_URL in gateway/.env (default: http://localhost:8000).
3. Run the gateway:
   - `npm run dev`

The gateway runs on http://localhost:3000 and proxies to FastAPI.

## App (Expo Web + Mobile)
1. Install dependencies from mobile/package.json.
2. Run `npm run web` for web, or `npm run start` for mobile.

The Expo app uses the Express gateway at http://localhost:3000/api.

## Frontend (React + Vite) — Optional/Legacy
1. Install dependencies from frontend/package.json.
2. Run `npm run dev` from the frontend folder.
3. Open http://localhost:5173

This UI now points to the Express gateway at http://localhost:3000/api.

## Notes
- Criticality rules and delay flags are computed during import.
- You can extend analytics in backend/app/analytics.py.
