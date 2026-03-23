from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.dependencies import get_current_role
from app.schemas import ProgramItem

MOSCOW_TZ = ZoneInfo("Europe/Moscow")

router = APIRouter(prefix="/api/institutions", tags=["programs"])


def _now() -> str:
    return datetime.now(MOSCOW_TZ).isoformat()


@router.put("/{institution_id}/programs", response_model=list[ProgramItem])
def bulk_replace_programs(
    institution_id: int,
    body: list[ProgramItem],
    _role: str = Depends(get_current_role),
):
    now = _now()
    with get_db() as db:
        inst = db.execute(
            "SELECT id FROM institutions WHERE id = ?", (institution_id,)
        ).fetchone()
        if not inst:
            raise HTTPException(status_code=404, detail="Institution not found.")

        db.execute(
            "DELETE FROM programs WHERE institution_id = ?", (institution_id,)
        )

        for idx, prog in enumerate(body):
            sort = prog.sort_order if prog.sort_order else idx
            db.execute(
                "INSERT INTO programs "
                "(institution_id, code, specialty_name, program_type, "
                "fulltime, parttime, distance, sort_order, updated_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (institution_id, prog.code, prog.specialty_name, prog.program_type,
                 int(prog.fulltime), int(prog.parttime), int(prog.distance),
                 sort, now),
            )

    return body
