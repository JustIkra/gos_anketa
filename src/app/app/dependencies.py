from fastapi import Depends, Header, HTTPException, status

from app.auth import decode_token


def get_current_role(authorization: str = Header(...)) -> str:
    """Extract the role from a Bearer JWT in the Authorization header."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected 'Bearer <token>'.",
        )
    token = authorization[len("Bearer "):]
    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        )
    role = payload.get("role")
    if not role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token does not contain a role.",
        )
    return role


def require_admin(role: str = Depends(get_current_role)) -> str:
    """Raise 403 unless the caller is an admin."""
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return role
