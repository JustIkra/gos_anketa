import os
import tempfile

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query

from app.dependencies import require_admin
from app.services.import_service import import_archive, import_docx_to_institution

router = APIRouter(prefix="/api/import", tags=["import"])


@router.post("/archive")
async def upload_archive(
    file: UploadFile = File(...),
    territorial_org_name: str | None = Query(None),
    _role: str = Depends(require_admin),
):
    if not file.filename or not file.filename.lower().endswith(".7z"):
        raise HTTPException(
            status_code=400,
            detail="Only .7z archives are accepted.",
        )

    with tempfile.TemporaryDirectory() as tmpdir:
        archive_path = os.path.join(tmpdir, file.filename)
        contents = await file.read()
        with open(archive_path, "wb") as f:
            f.write(contents)

        result = import_archive(archive_path, territorial_org_name)

    return result


@router.post("/docx")
async def upload_docx(
    file: UploadFile = File(...),
    institution_id: int = Query(...),
    _role: str = Depends(require_admin),
):
    if not file.filename or not file.filename.lower().endswith(".docx"):
        raise HTTPException(
            status_code=400,
            detail="Only .docx files are accepted.",
        )

    with tempfile.TemporaryDirectory() as tmpdir:
        docx_path = os.path.join(tmpdir, file.filename)
        contents = await file.read()
        with open(docx_path, "wb") as f:
            f.write(contents)

        try:
            import_docx_to_institution(docx_path, institution_id)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc))
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Import failed: {exc}")

    return {"detail": "DOCX imported successfully."}
