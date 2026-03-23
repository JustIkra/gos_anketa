from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import bcrypt
from jose import JWTError, jwt

from app.config import settings

MOSCOW_TZ = ZoneInfo("Europe/Moscow")

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(role: str) -> str:
    now = datetime.now(MOSCOW_TZ)
    expire = now + timedelta(hours=settings.access_token_expire_hours)
    payload = {
        "role": role,
        "iat": now,
        "exp": expire,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError as exc:
        raise ValueError(f"Invalid token: {exc}") from exc
