import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from zoneinfo import ZoneInfo

from app.auth import hash_password
from app.config import settings

MOSCOW_TZ = ZoneInfo("Europe/Moscow")

_SCHEMA_SQL = """
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS territorial_orgs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL,
    updated_at TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS institutions (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    territorial_org_id INTEGER NOT NULL REFERENCES territorial_orgs(id),
    full_name          TEXT    NOT NULL,
    short_name         TEXT    NOT NULL,
    created_at         TEXT    NOT NULL,
    updated_at         TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_institutions_to_id
    ON institutions(territorial_org_id);

CREATE TABLE IF NOT EXISTS contacts (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    institution_id INTEGER NOT NULL UNIQUE REFERENCES institutions(id) ON DELETE CASCADE,
    address        TEXT    DEFAULT '',
    phone          TEXT    DEFAULT '',
    fax            TEXT    DEFAULT '',
    email          TEXT    DEFAULT '',
    website        TEXT    DEFAULT '',
    updated_at     TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contacts_inst_id
    ON contacts(institution_id);

CREATE TABLE IF NOT EXISTS personnel (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    position       TEXT    NOT NULL,
    full_name      TEXT    NOT NULL,
    work_phone     TEXT    DEFAULT '',
    mobile_phone   TEXT    DEFAULT '',
    sort_order     INTEGER DEFAULT 0,
    updated_at     TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_personnel_inst_id
    ON personnel(institution_id);

CREATE TABLE IF NOT EXISTS programs (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    code           TEXT    NOT NULL,
    specialty_name TEXT    NOT NULL,
    program_type   TEXT    DEFAULT 'specialty',
    fulltime       INTEGER DEFAULT 0,
    parttime       INTEGER DEFAULT 0,
    distance       INTEGER DEFAULT 0,
    sort_order     INTEGER DEFAULT 0,
    updated_at     TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_programs_inst_id
    ON programs(institution_id);
"""

_FTS_SQL = """
CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
    institution_id UNINDEXED,
    content,
    tokenize='unicode61'
);
"""

_DEFAULT_ORGS = [
    ("1 Ростовское территориальное объединение", 1),
    ("2 Ростовское территориальное объединение", 2),
    ("Таганрогское территориальное объединение", 3),
    ("Каменск-Шахтинское территориальное объединение", 4),
    ("Шахтинское территориальное объединение", 5),
    ("Волгодонское территориальное объединение", 6),
    ("Новочеркасское территориальное объединение", 7),
]


def _now_moscow() -> str:
    return datetime.now(MOSCOW_TZ).isoformat()


def init_db() -> None:
    """Create tables, seed defaults on first run."""
    db_path = settings.database_path
    os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)

    conn = sqlite3.connect(db_path)
    conn.executescript(_SCHEMA_SQL)
    conn.executescript(_FTS_SQL)

    # Seed default passwords if absent
    cur = conn.execute("SELECT COUNT(*) FROM settings WHERE key='admin_password_hash'")
    if cur.fetchone()[0] == 0:
        now = _now_moscow()
        admin_hash = hash_password(settings.default_admin_password)
        editor_hash = hash_password(settings.default_editor_password)
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?)",
            ("admin_password_hash", admin_hash),
        )
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?)",
            ("editor_password_hash", editor_hash),
        )

        # Seed territorial organisations
        for name, sort_order in _DEFAULT_ORGS:
            conn.execute(
                "INSERT INTO territorial_orgs (name, sort_order, created_at, updated_at) "
                "VALUES (?, ?, ?, ?)",
                (name, sort_order, now, now),
            )
        conn.commit()

    conn.close()


@contextmanager
def get_db():
    """Yield an sqlite3 connection with Row factory and foreign keys enabled."""
    conn = sqlite3.connect(settings.database_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
