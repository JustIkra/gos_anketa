"""Import institution data from DOCX / 7z archives into the database."""

import os
import re
import subprocess
import tempfile
from datetime import datetime
from zoneinfo import ZoneInfo

import py7zr

from app.database import get_db
from app.services.docx_parser import parse_docx

MOSCOW_TZ = ZoneInfo("Europe/Moscow")


def _now() -> str:
    return datetime.now(MOSCOW_TZ).isoformat()


def rebuild_search_index(db, institution_id: int) -> None:
    """Rebuild FTS search index entry for a single institution."""
    inst = db.execute(
        "SELECT full_name, short_name FROM institutions WHERE id = ?",
        (institution_id,),
    ).fetchone()
    if not inst:
        return

    parts = [inst["full_name"], inst["short_name"]]

    contact = db.execute(
        "SELECT address, phone, fax, email, website FROM contacts "
        "WHERE institution_id = ?",
        (institution_id,),
    ).fetchone()
    if contact:
        parts.extend([
            contact["address"], contact["phone"], contact["fax"],
            contact["email"], contact["website"],
        ])

    personnel = db.execute(
        "SELECT position, full_name, work_phone, mobile_phone "
        "FROM personnel WHERE institution_id = ?",
        (institution_id,),
    ).fetchall()
    for p in personnel:
        parts.extend([p["position"], p["full_name"], p["work_phone"], p["mobile_phone"]])

    programs = db.execute(
        "SELECT code, specialty_name FROM programs WHERE institution_id = ?",
        (institution_id,),
    ).fetchall()
    for pr in programs:
        parts.extend([pr["code"], pr["specialty_name"]])

    content = " ".join(p for p in parts if p)

    # Remove old entry and insert new
    db.execute(
        "DELETE FROM search_index WHERE institution_id = ?", (institution_id,)
    )
    db.execute(
        "INSERT INTO search_index (institution_id, content) VALUES (?, ?)",
        (institution_id, content),
    )


def _insert_parsed_institution(db, territorial_org_id: int, parsed) -> int:
    """Insert a ParsedInstitution into the database. Returns new institution id."""
    now = _now()

    cur = db.execute(
        "INSERT INTO institutions "
        "(territorial_org_id, full_name, short_name, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?)",
        (territorial_org_id, parsed.full_name, parsed.short_name, now, now),
    )
    inst_id = cur.lastrowid

    # Contacts
    c = parsed.contacts
    db.execute(
        "INSERT INTO contacts "
        "(institution_id, address, phone, fax, email, website, updated_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (inst_id, c.get("address", ""), c.get("phone", ""), c.get("fax", ""),
         c.get("email", ""), c.get("website", ""), now),
    )

    # Personnel
    for idx, p in enumerate(parsed.personnel):
        db.execute(
            "INSERT INTO personnel "
            "(institution_id, position, full_name, work_phone, mobile_phone, "
            "sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (inst_id, p.get("position", ""), p.get("full_name", ""),
             p.get("work_phone", ""), p.get("mobile_phone", ""), idx, now),
        )

    # Programs
    for idx, pr in enumerate(parsed.programs):
        db.execute(
            "INSERT INTO programs "
            "(institution_id, code, specialty_name, program_type, fulltime, "
            "parttime, distance, sort_order, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (inst_id, pr.get("code", ""), pr.get("specialty_name", ""),
             pr.get("program_type", "specialty"),
             int(pr.get("fulltime", False)), int(pr.get("parttime", False)),
             int(pr.get("distance", False)),
             pr.get("sort_order", idx), now),
        )

    rebuild_search_index(db, inst_id)
    return inst_id


def import_archive(
    file_path: str,
    territorial_org_name: str | None = None,
) -> dict:
    """Extract a .7z archive, parse all DOCX files inside, insert into DB.

    If territorial_org_name is provided, assign all institutions to that org.
    Otherwise, try to guess from the archive filename or use the first org.
    Returns summary dict with counts.
    """
    with get_db() as db:
        # Resolve territorial org
        if territorial_org_name:
            row = db.execute(
                "SELECT id FROM territorial_orgs WHERE name = ?",
                (territorial_org_name,),
            ).fetchone()
            if not row:
                # Try partial match
                row = db.execute(
                    "SELECT id FROM territorial_orgs WHERE name LIKE ? "
                    "ORDER BY sort_order LIMIT 1",
                    (f"%{territorial_org_name}%",),
                ).fetchone()
            to_id = row["id"] if row else None
        else:
            to_id = None

        if to_id is None:
            # Try to guess from filename
            basename = os.path.basename(file_path)
            row = db.execute(
                "SELECT id FROM territorial_orgs WHERE name LIKE ? "
                "ORDER BY sort_order LIMIT 1",
                (f"%{basename.split('.')[0].strip()}%",),
            ).fetchone()
            if row:
                to_id = row["id"]
            else:
                # Fall back to first org
                row = db.execute(
                    "SELECT id FROM territorial_orgs ORDER BY sort_order LIMIT 1"
                ).fetchone()
                to_id = row["id"] if row else 1

        # Extract archive
        with tempfile.TemporaryDirectory() as tmpdir:
            with py7zr.SevenZipFile(file_path, mode="r") as archive:
                archive.extractall(path=tmpdir)

            # Find all docx files
            docx_files = []
            for root, _dirs, files in os.walk(tmpdir):
                for fname in files:
                    if fname.lower().endswith(".docx") and not fname.startswith("~"):
                        docx_files.append(os.path.join(root, fname))

            imported = 0
            errors = []
            for docx_path in sorted(docx_files):
                try:
                    parsed = parse_docx(docx_path)
                    if not parsed.full_name and not parsed.short_name:
                        errors.append(f"Пропущен (пустое название): {os.path.basename(docx_path)}")
                        continue
                    if not parsed.contacts.get("address") and not parsed.personnel:
                        errors.append(f"Пропущен (нет таблиц): {os.path.basename(docx_path)}")
                        continue
                    _insert_parsed_institution(db, to_id, parsed)
                    imported += 1
                except Exception as exc:
                    errors.append(f"{os.path.basename(docx_path)}: {exc}")

    return {
        "imported": imported,
        "total_files": len(docx_files),
        "errors": errors,
    }


def import_docx_to_institution(file_path: str, institution_id: int) -> None:
    """Parse a DOCX file and update an existing institution with its data."""
    parsed = parse_docx(file_path)
    now = _now()

    with get_db() as db:
        inst = db.execute(
            "SELECT id FROM institutions WHERE id = ?", (institution_id,)
        ).fetchone()
        if not inst:
            raise ValueError(f"Institution {institution_id} not found.")

        # Update institution names if parsed names are non-empty
        if parsed.full_name or parsed.short_name:
            updates = []
            params = []
            if parsed.full_name:
                updates.append("full_name = ?")
                params.append(parsed.full_name)
            if parsed.short_name:
                updates.append("short_name = ?")
                params.append(parsed.short_name)
            updates.append("updated_at = ?")
            params.append(now)
            params.append(institution_id)
            db.execute(
                f"UPDATE institutions SET {', '.join(updates)} WHERE id = ?",
                params,
            )

        # Upsert contacts
        c = parsed.contacts
        existing_contact = db.execute(
            "SELECT id FROM contacts WHERE institution_id = ?", (institution_id,)
        ).fetchone()
        if existing_contact:
            db.execute(
                "UPDATE contacts SET address=?, phone=?, fax=?, email=?, website=?, "
                "updated_at=? WHERE institution_id=?",
                (c.get("address", ""), c.get("phone", ""), c.get("fax", ""),
                 c.get("email", ""), c.get("website", ""), now, institution_id),
            )
        else:
            db.execute(
                "INSERT INTO contacts "
                "(institution_id, address, phone, fax, email, website, updated_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (institution_id, c.get("address", ""), c.get("phone", ""),
                 c.get("fax", ""), c.get("email", ""), c.get("website", ""), now),
            )

        # Replace personnel
        db.execute(
            "DELETE FROM personnel WHERE institution_id = ?", (institution_id,)
        )
        for idx, p in enumerate(parsed.personnel):
            db.execute(
                "INSERT INTO personnel "
                "(institution_id, position, full_name, work_phone, mobile_phone, "
                "sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (institution_id, p.get("position", ""), p.get("full_name", ""),
                 p.get("work_phone", ""), p.get("mobile_phone", ""), idx, now),
            )

        # Replace programs
        db.execute(
            "DELETE FROM programs WHERE institution_id = ?", (institution_id,)
        )
        for idx, pr in enumerate(parsed.programs):
            db.execute(
                "INSERT INTO programs "
                "(institution_id, code, specialty_name, program_type, fulltime, "
                "parttime, distance, sort_order, updated_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (institution_id, pr.get("code", ""), pr.get("specialty_name", ""),
                 pr.get("program_type", "specialty"),
                 int(pr.get("fulltime", False)), int(pr.get("parttime", False)),
                 int(pr.get("distance", False)),
                 pr.get("sort_order", idx), now),
            )

        rebuild_search_index(db, institution_id)


def _doc_to_text(file_path: str) -> str:
    """Convert a .doc file to plain text using antiword."""
    result = subprocess.run(
        ["antiword", "-w", "0", file_path],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"antiword failed: {result.stderr}")
    return result.stdout


def import_registry(file_path: str) -> dict:
    """Import the territorial orgs registry (.doc) with institutions.

    Parses antiword output which contains TO headers and pipe-delimited
    table rows: |number|full_name|short_name|

    Returns summary dict.
    """
    text = _doc_to_text(file_path)
    lines = text.split("\n")

    to_header_re = re.compile(r"территориальное объединение", re.IGNORECASE)
    # Match table rows: |number|full_name|short_name|
    table_row_re = re.compile(r"^\|?\s*(\d{1,3})\s*\|(.+?)\|(.+?)\|")
    # Continuation row for multiline cells: |  |text|  |
    continuation_re = re.compile(r"^\|\s*\|(.+?)\|(.+?)\|")

    groups: list[tuple[str, list[tuple[str, str]]]] = []
    current_to: str | None = None
    current_institutions: list[tuple[str, str]] = []

    for line in lines:
        stripped = line.strip()

        # Check for TO header (not inside a table row)
        if to_header_re.search(stripped) and "|" not in stripped:
            if current_to is not None:
                groups.append((current_to, current_institutions))
            # Normalize whitespace in TO name
            current_to = " ".join(stripped.split())
            current_institutions = []
            continue

        if current_to is None:
            continue

        # Check for table data row
        m = table_row_re.match(line.lstrip())
        if m:
            full_name = m.group(2).strip()
            short_name = m.group(3).strip()
            current_institutions.append((full_name, short_name))
            continue

        # Check for continuation row (multiline cell)
        m = continuation_re.match(line.lstrip())
        if m and current_institutions:
            extra_full = m.group(1).strip()
            extra_short = m.group(2).strip()
            prev_full, prev_short = current_institutions[-1]
            if extra_full:
                prev_full = prev_full + " " + extra_full
            if extra_short:
                prev_short = prev_short + " " + extra_short
            current_institutions[-1] = (prev_full.strip(), prev_short.strip())

    if current_to is not None:
        groups.append((current_to, current_institutions))

    # Insert into DB
    now = _now()
    imported = 0
    skipped = 0
    to_created = 0

    with get_db() as db:
        for to_name, institutions in groups:
            # Find or create territorial org
            row = db.execute(
                "SELECT id FROM territorial_orgs WHERE name = ?", (to_name,),
            ).fetchone()
            if not row:
                # Try partial match
                row = db.execute(
                    "SELECT id FROM territorial_orgs WHERE name LIKE ?",
                    (f"%{to_name.strip()}%",),
                ).fetchone()
            if row:
                to_id = row["id"]
            else:
                max_sort = db.execute(
                    "SELECT COALESCE(MAX(sort_order), 0) as m FROM territorial_orgs"
                ).fetchone()["m"]
                cur = db.execute(
                    "INSERT INTO territorial_orgs (name, sort_order, created_at, updated_at) "
                    "VALUES (?, ?, ?, ?)",
                    (to_name, max_sort + 1, now, now),
                )
                to_id = cur.lastrowid
                to_created += 1

            for full_name, short_name in institutions:
                # Check if institution already exists
                existing = db.execute(
                    "SELECT id FROM institutions WHERE short_name = ? "
                    "AND territorial_org_id = ?",
                    (short_name, to_id),
                ).fetchone()
                if existing:
                    skipped += 1
                    continue

                cur = db.execute(
                    "INSERT INTO institutions "
                    "(territorial_org_id, full_name, short_name, created_at, updated_at) "
                    "VALUES (?, ?, ?, ?, ?)",
                    (to_id, full_name, short_name, now, now),
                )
                inst_id = cur.lastrowid
                # Create empty contacts
                db.execute(
                    "INSERT INTO contacts "
                    "(institution_id, address, phone, fax, email, website, updated_at) "
                    "VALUES (?, '', '', '', '', '', ?)",
                    (inst_id, now),
                )
                rebuild_search_index(db, inst_id)
                imported += 1

    return {
        "imported": imported,
        "skipped": skipped,
        "to_created": to_created,
        "total_groups": len(groups),
        "message": f"Импортировано {imported} учреждений, "
                   f"пропущено {skipped} (уже существуют), "
                   f"создано ТО: {to_created}",
    }
