from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..core.dependencies import get_db
from ..services.ingestion_service import import_ado_dump

router = APIRouter(prefix="", tags=["import"])


@router.post("/import")
async def import_ado(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    try:
        ingested = import_ado_dump(content, file.filename, db)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return {"ingested": ingested}
