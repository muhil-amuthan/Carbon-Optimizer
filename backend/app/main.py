"""Carbon Optimizer - FastAPI Application Entry Point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base
from app.routers import data, emissions, ai, optimize, grid


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: create tables on startup."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Carbon Optimizer API",
    description="AI-powered carbon emission tracking, analysis, and optimization platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router, prefix="/api/data", tags=["Data Management"])
app.include_router(emissions.router, prefix="/api/emissions", tags=["Emissions"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI & Analytics"])
app.include_router(optimize.router, prefix="/api/optimize", tags=["Optimization"])
app.include_router(grid.router, prefix="/api/grid", tags=["Grid & IoT"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "Carbon Optimizer API",
        "version": "1.0.0",
        "status": "operational",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "database": "connected"}