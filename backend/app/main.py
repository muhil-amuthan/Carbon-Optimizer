"""Carbon Optimizer - FastAPI Application Entry Point."""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routers import data, emissions, ai, optimize, grid
from app.services.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: create tables and seed initial demo data on startup."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Carbon Optimizer API",
    description="AI-powered carbon emission tracking, analysis, and optimization platform",
    version="1.0.0",
    lifespan=lifespan,
)

cors_origins = settings.cors_origins_list
allow_all = "*" in cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else cors_origins,
    allow_origin_regex=None if allow_all else r"https://.*\.vercel\.app",
    allow_credentials=not allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router, prefix="/api/data", tags=["Data Management"])
app.include_router(emissions.router, prefix="/api/emissions", tags=["Emissions"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI & Analytics"])
app.include_router(optimize.router, prefix="/api/optimize", tags=["Optimization"])
app.include_router(grid.router, prefix="/api/grid", tags=["Grid & IoT"])


@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "database": "connected"}


# ─── All-In-One Unified Local Host SPA Mount ─────────────────────────────────
# Mounts the compiled frontend so the full dashboard & APIs run together on port 8000
frontend_dist = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
)

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve SPA client routes and static assets."""
        if full_path.startswith("api/"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail=f"API endpoint '/{full_path}' not found")

        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"error": "Frontend build not found"}
else:
    @app.get("/", tags=["Health"])
    async def root():
        return {
            "service": "Carbon Optimizer API",
            "version": "1.0.0",
            "status": "operational",
        }