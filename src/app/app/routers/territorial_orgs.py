from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.dependencies import require_admin
from app.schemas import TerritorialOrgCreate, TerritorialOrgResponse

MOSCOW_TZ = ZoneInfo("Europe/Moscow")

router = APIRouter(prefix="/api/territorial-orgs", tags=["territorial-orgs"])


def _now() -> str:
    return datetime.now(MOSCOW_TZ).isoformat()


@router.get("", response_model=list[TerritorialOrgResponse])
def list_territorial_orgs():
    with get_db() as db:
        rows = db.execute(
            """
            SELECT t.id, t.name, t.sort_order,
                   COUNT(i.id) AS institution_count
            FROM territorial_orgs t
            LEFT JOIN institutions i ON i.territorial_org_id = t.id
            GROUP BY t.id
            ORDER BY t.sort_order, t.name
            """
        ).fetchall()
    return [
        TerritorialOrgResponse(
            id=r["id"],
            name=r["name"],
            sort_order=r["sort_order"],
            institution_count=r["institution_count"],
        )
        for r in rows
    ]


@router.post("", response_model=TerritorialOrgResponse, status_code=201)
def create_territorial_org(
    body: TerritorialOrgCreate,
    _role: str = Depends(require_admin),
):
    now = _now()
    with get_db() as db:
        cur = db.execute(
            "INSERT INTO territorial_orgs (name, sort_order, created_at, updated_at) "
            "VALUES (?, ?, ?, ?)",
            (body.name, body.sort_order, now, now),
        )
        org_id = cur.lastrowid
    return TerritorialOrgResponse(
        id=org_id,
        name=body.name,
        sort_order=body.sort_order,
        institution_count=0,
    )


@router.put("/{org_id}", response_model=TerritorialOrgResponse)
def update_territorial_org(
    org_id: int,
    body: TerritorialOrgCreate,
    _role: str = Depends(require_admin),
):
    now = _now()
    with get_db() as db:
        existing = db.execute(
            "SELECT id FROM territorial_orgs WHERE id = ?", (org_id,)
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Territorial org not found.")

        db.execute(
            "UPDATE territorial_orgs SET name = ?, sort_order = ?, updated_at = ? "
            "WHERE id = ?",
            (body.name, body.sort_order, now, org_id),
        )
        count_row = db.execute(
            "SELECT COUNT(*) AS cnt FROM institutions WHERE territorial_org_id = ?",
            (org_id,),
        ).fetchone()

    return TerritorialOrgResponse(
        id=org_id,
        name=body.name,
        sort_order=body.sort_order,
        institution_count=count_row["cnt"],
    )


@router.delete("/{org_id}", status_code=204)
def delete_territorial_org(
    org_id: int,
    _role: str = Depends(require_admin),
):
    with get_db() as db:
        existing = db.execute(
            "SELECT id FROM territorial_orgs WHERE id = ?", (org_id,)
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Territorial org not found.")

        has_institutions = db.execute(
            "SELECT COUNT(*) AS cnt FROM institutions WHERE territorial_org_id = ?",
            (org_id,),
        ).fetchone()
        if has_institutions["cnt"] > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete: territorial org still has institutions.",
            )

        db.execute("DELETE FROM territorial_orgs WHERE id = ?", (org_id,))
    return None
