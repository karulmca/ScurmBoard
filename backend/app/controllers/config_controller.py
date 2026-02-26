import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.dependencies import get_db
from ..core.config_defaults import DEFAULTS
from ..models.config import AppConfig

router = APIRouter(prefix="", tags=["config"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_config(db: Session, org_id: Optional[int] = None) -> dict:
    """
    Build config dict: start with system defaults, overlay with global (org_id=NULL)
    overrides, then overlay with org-specific overrides if org_id provided.
    """
    result = {k: v for k, v in DEFAULTS.items()}

    # Load all relevant rows in one query
    rows = db.query(AppConfig).filter(
        (AppConfig.org_id == None) | (AppConfig.org_id == org_id)
    ).all()

    # Apply global overrides first, then org-specific
    for scope in [None, org_id]:
        for row in rows:
            if row.org_id == scope:
                try:
                    result[row.config_key] = json.loads(row.value)
                except json.JSONDecodeError:
                    pass

    return result


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/config")
def get_config(org_id: Optional[int] = None, db: Session = Depends(get_db)):
    """
    Return the effective config for an org (or system defaults if no org_id).
    """
    return _get_config(db, org_id)


class ConfigUpsertRequest(BaseModel):
    org_id:     Optional[int] = None
    config_key: str
    value:      object   # any JSON-serialisable value


@router.post("/config", status_code=200)
def upsert_config(data: ConfigUpsertRequest, db: Session = Depends(get_db)):
    """
    Create or update a single config key. Pass org_id=null to set a global override.
    """
    if data.config_key not in DEFAULTS:
        raise HTTPException(status_code=400, detail=f"Unknown config key: {data.config_key}")

    row = db.query(AppConfig).filter(
        AppConfig.config_key == data.config_key,
        AppConfig.org_id == data.org_id,
    ).first()

    serialised = json.dumps(data.value, ensure_ascii=False)
    if row:
        row.value = serialised
    else:
        row = AppConfig(org_id=data.org_id, config_key=data.config_key, value=serialised)
        db.add(row)

    db.commit()
    return {"status": "ok", "config_key": data.config_key, "value": data.value}


@router.delete("/config/{config_key}", status_code=204)
def reset_config(config_key: str, org_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Delete an override — reverts the key to the system default."""
    row = db.query(AppConfig).filter(
        AppConfig.config_key == config_key,
        AppConfig.org_id == org_id,
    ).first()
    if row:
        db.delete(row)
        db.commit()


@router.get("/config/defaults")
def get_defaults():
    """Return the raw system defaults (no overrides)."""
    return DEFAULTS
