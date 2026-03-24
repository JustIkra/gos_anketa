from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.dependencies import get_current_role
from app.schemas import PersonnelMember

MOSCOW_TZ = ZoneInfo("Europe/Moscow")

router = APIRouter(prefix="/api/institutions", tags=["personnel"])


def _now() -> str:
    return datetime.now(MOSCOW_TZ).isoformat()


@router.put("/{institution_id}/personnel", response_model=list[PersonnelMember])
def bulk_replace_personnel(
    institution_id: int,
    body: list[PersonnelMember],
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
            "DELETE FROM personnel WHERE institution_id = ?", (institution_id,)
        )

        for idx, member in enumerate(body):
            sort = member.sort_order if member.sort_order else idx
            db.execute(
                "INSERT INTO personnel "
                "(institution_id, position, full_name, work_phone, mobile_phone, "
                "email, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (institution_id, member.position, member.full_name,
                 member.work_phone, member.mobile_phone, member.email, sort, now),
            )

    return body
