from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import (
    auth,
    contacts,
    import_data,
    institutions,
    personnel,
    programs,
    search,
    territorial_orgs,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Gos Anketa API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow everything for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(territorial_orgs.router)
app.include_router(institutions.router)
app.include_router(contacts.router)
app.include_router(personnel.router)
app.include_router(programs.router)
app.include_router(search.router)
app.include_router(import_data.router)


@app.get("/api/health", tags=["health"])
def health_check():
    return {"status": "ok"}
