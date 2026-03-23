from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import create_access_token, hash_password, verify_password
from app.database import get_db
from app.dependencies import require_admin
from app.schemas import ChangePasswordRequest, LoginRequest, LoginResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest):
    with get_db() as db:
        admin_row = db.execute(
            "SELECT value FROM settings WHERE key='admin_password_hash'"
        ).fetchone()
        editor_row = db.execute(
            "SELECT value FROM settings WHERE key='editor_password_hash'"
        ).fetchone()

    if admin_row and verify_password(body.password, admin_row["value"]):
        token = create_access_token("admin")
        return LoginResponse(token=token, role="admin")

    if editor_row and verify_password(body.password, editor_row["value"]):
        token = create_access_token("editor")
        return LoginResponse(token=token, role="editor")

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid password.",
    )


@router.post("/change-password")
def change_password(
    body: ChangePasswordRequest,
    _role: str = Depends(require_admin),
):
    if body.role not in ("admin", "editor"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'admin' or 'editor'.",
        )

    new_hash = hash_password(body.new_password)
    key = f"{body.role}_password_hash"

    with get_db() as db:
        db.execute(
            "UPDATE settings SET value = ? WHERE key = ?",
            (new_hash, key),
        )

    return {"detail": f"Password for '{body.role}' has been changed."}
