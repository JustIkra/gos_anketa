from fastapi import APIRouter, HTTPException, Query

from app.database import get_db
from app.schemas import SearchResult

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=list[SearchResult])
def search(q: str = Query(..., min_length=1, description="Search query")):
    # Escape FTS5 special characters and build a prefix query
    # Replace double quotes to avoid breaking the query
    sanitised = q.replace('"', '""')
    fts_query = f'"{sanitised}"'

    with get_db() as db:
        rows = db.execute(
            """
            SELECT s.institution_id,
                   i.short_name AS institution_short_name,
                   t.name       AS territorial_org_name,
                   snippet(search_index, 1, '<b>', '</b>', '...', 40) AS matched_text
            FROM search_index s
            JOIN institutions i ON i.id = s.institution_id
            JOIN territorial_orgs t ON t.id = i.territorial_org_id
            WHERE search_index MATCH ?
            ORDER BY rank
            LIMIT 50
            """,
            (fts_query,),
        ).fetchall()

    if not rows:
        return []

    return [
        SearchResult(
            institution_id=r["institution_id"],
            institution_short_name=r["institution_short_name"],
            territorial_org_name=r["territorial_org_name"],
            matched_text=r["matched_text"],
        )
        for r in rows
    ]
