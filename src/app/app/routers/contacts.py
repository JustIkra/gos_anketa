from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.dependencies import get_current_role
from app.schemas import ContactInfo

MOSCOW_TZ = ZoneInfo("Europe/Moscow")

router = APIRouter(prefix="/api/institutions", tags=["contacts"])


def _now() -> str:
    return datetime.now(MOSCOW_TZ).isoformat()


@router.put("/{institution_id}/contacts", response_model=ContactInfo)
def upsert_contacts(
    institution_id: int,
    body: ContactInfo,
    _role: str = Depends(get_current_role),
):
    now = _now()
    with get_db() as db:
        inst = db.execute(
            "SELECT id FROM institutions WHERE id = ?", (institution_id,)
        ).fetchone()
        if not inst:
            raise HTTPException(status_code=404, detail="Institution not found.")

        existing = db.execute(
            "SELECT id FROM contacts WHERE institution_id = ?", (institution_id,)
        ).fetchone()

        if existing:
            db.execute(
                "UPDATE contacts SET address=?, phone=?, fax=?, email=?, website=?, "
                "updated_at=? WHERE institution_id=?",
                (body.address, body.phone, body.fax, body.email, body.website,
                 now, institution_id),
            )
        else:
            db.execute(
                "INSERT INTO contacts "
                "(institution_id, address, phone, fax, email, website, updated_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (institution_id, body.address, body.phone, body.fax, body.email,
                 body.website, now),
            )

    return body
