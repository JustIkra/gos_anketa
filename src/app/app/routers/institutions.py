from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_db
from app.dependencies import require_admin
from app.schemas import (
    ContactInfo,
    InstitutionCreate,
    InstitutionDetail,
    InstitutionResponse,
    PersonnelMember,
    ProgramItem,
)

MOSCOW_TZ = ZoneInfo("Europe/Moscow")

router = APIRouter(prefix="/api/institutions", tags=["institutions"])


def _now() -> str:
    return datetime.now(MOSCOW_TZ).isoformat()


@router.get("", response_model=list[InstitutionResponse])
def list_institutions(
    to_id: int | None = Query(None, description="Filter by territorial org id"),
    q: str | None = Query(None, description="Search in full/short name"),
):
    clauses: list[str] = []
    params: list = []

    if to_id is not None:
        clauses.append("i.territorial_org_id = ?")
        params.append(to_id)
    if q:
        clauses.append("(i.full_name LIKE ? OR i.short_name LIKE ?)")
        like = f"%{q}%"
        params.extend([like, like])

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""

    sql = f"""
        SELECT i.id, i.territorial_org_id, t.name AS territorial_org_name,
               i.full_name, i.short_name
        FROM institutions i
        JOIN territorial_orgs t ON t.id = i.territorial_org_id
        {where}
        ORDER BY t.sort_order, i.short_name
    """
    with get_db() as db:
        rows = db.execute(sql, params).fetchall()

    return [
        InstitutionResponse(
            id=r["id"],
            territorial_org_id=r["territorial_org_id"],
            territorial_org_name=r["territorial_org_name"],
            full_name=r["full_name"],
            short_name=r["short_name"],
        )
        for r in rows
    ]


@router.get("/{institution_id}", response_model=InstitutionDetail)
def get_institution(institution_id: int):
    with get_db() as db:
        inst = db.execute(
            """
            SELECT i.id, i.territorial_org_id, t.name AS territorial_org_name,
                   i.full_name, i.short_name
            FROM institutions i
            JOIN territorial_orgs t ON t.id = i.territorial_org_id
            WHERE i.id = ?
            """,
            (institution_id,),
        ).fetchone()
        if not inst:
            raise HTTPException(status_code=404, detail="Institution not found.")

        contact_row = db.execute(
            "SELECT address, phone, fax, email, website "
            "FROM contacts WHERE institution_id = ?",
            (institution_id,),
        ).fetchone()

        personnel_rows = db.execute(
            "SELECT position, full_name, work_phone, mobile_phone, sort_order "
            "FROM personnel WHERE institution_id = ? ORDER BY sort_order",
            (institution_id,),
        ).fetchall()

        program_rows = db.execute(
            "SELECT code, specialty_name, program_type, fulltime, parttime, "
            "distance, sort_order "
            "FROM programs WHERE institution_id = ? ORDER BY sort_order",
            (institution_id,),
        ).fetchall()

    contacts = ContactInfo(**dict(contact_row)) if contact_row else ContactInfo()
    personnel = [
        PersonnelMember(**dict(r)) for r in personnel_rows
    ]
    programs = [
        ProgramItem(
            code=r["code"],
            specialty_name=r["specialty_name"],
            program_type=r["program_type"],
            fulltime=bool(r["fulltime"]),
            parttime=bool(r["parttime"]),
            distance=bool(r["distance"]),
            sort_order=r["sort_order"],
        )
        for r in program_rows
    ]

    return InstitutionDetail(
        id=inst["id"],
        territorial_org_id=inst["territorial_org_id"],
        territorial_org_name=inst["territorial_org_name"],
        full_name=inst["full_name"],
        short_name=inst["short_name"],
        contacts=contacts,
        personnel=personnel,
        programs=programs,
    )


@router.post("", response_model=InstitutionResponse, status_code=201)
def create_institution(
    body: InstitutionCreate,
    _role: str = Depends(require_admin),
):
    now = _now()
    with get_db() as db:
        # Verify territorial org exists
        to_row = db.execute(
            "SELECT id, name FROM territorial_orgs WHERE id = ?",
            (body.territorial_org_id,),
        ).fetchone()
        if not to_row:
            raise HTTPException(status_code=404, detail="Territorial org not found.")

        cur = db.execute(
            "INSERT INTO institutions "
            "(territorial_org_id, full_name, short_name, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (body.territorial_org_id, body.full_name, body.short_name, now, now),
        )
        inst_id = cur.lastrowid

        # Create empty contacts record
        db.execute(
            "INSERT INTO contacts (institution_id, updated_at) VALUES (?, ?)",
            (inst_id, now),
        )

    return InstitutionResponse(
        id=inst_id,
        territorial_org_id=body.territorial_org_id,
        territorial_org_name=to_row["name"],
        full_name=body.full_name,
        short_name=body.short_name,
    )


@router.put("/{institution_id}", response_model=InstitutionResponse)
def update_institution(
    institution_id: int,
    body: InstitutionCreate,
    _role: str = Depends(require_admin),
):
    now = _now()
    with get_db() as db:
        existing = db.execute(
            "SELECT id FROM institutions WHERE id = ?", (institution_id,)
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Institution not found.")

        to_row = db.execute(
            "SELECT id, name FROM territorial_orgs WHERE id = ?",
            (body.territorial_org_id,),
        ).fetchone()
        if not to_row:
            raise HTTPException(status_code=404, detail="Territorial org not found.")

        db.execute(
            "UPDATE institutions "
            "SET territorial_org_id = ?, full_name = ?, short_name = ?, updated_at = ? "
            "WHERE id = ?",
            (body.territorial_org_id, body.full_name, body.short_name, now, institution_id),
        )

    return InstitutionResponse(
        id=institution_id,
        territorial_org_id=body.territorial_org_id,
        territorial_org_name=to_row["name"],
        full_name=body.full_name,
        short_name=body.short_name,
    )


@router.delete("/{institution_id}", status_code=204)
def delete_institution(
    institution_id: int,
    _role: str = Depends(require_admin),
):
    with get_db() as db:
        existing = db.execute(
            "SELECT id FROM institutions WHERE id = ?", (institution_id,)
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Institution not found.")

        # Delete from search index first
        db.execute(
            "DELETE FROM search_index WHERE institution_id = ?", (institution_id,)
        )
        # CASCADE handles contacts, personnel, programs
        db.execute("DELETE FROM institutions WHERE id = ?", (institution_id,))
    return None
