"""AI and analytics endpoints - anomaly detection, forecasting."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.emission_result import EmissionResult
from app.schemas.emission import AnomalyResponse
from app.services.ai_engine import AIEngine

router = APIRouter()
ai_engine = AIEngine()


@router.get("/anomalies/{factory_id}", response_model=AnomalyResponse)
async def detect_anomalies(
    factory_id: str,
    sensitivity: float = Query(2.0, ge=1.0, le=5.0, description="Z-score threshold"),
    db: Session = Depends(get_db),
):
    """Detect anomalies in emission data using statistical analysis."""
    results = (
        db.query(EmissionResult)
        .filter(EmissionResult.factory_id == factory_id)
        .order_by(EmissionResult.date)
        .all()
    )

    if len(results) < 5:
        raise HTTPException(
            status_code=400,
            detail="Need at least 5 data points for anomaly detection",
        )

    anomalies = ai_engine.detect_anomalies(results, sensitivity)

    period = f"{results[0].date} to {results[-1].date}"

    return AnomalyResponse(
        factory_id=factory_id,
        anomalies=anomalies,
        total_anomalies=len([a for a in anomalies if a.is_anomaly]),
        analysis_period=period,
    )


@router.get("/forecast/{factory_id}")
async def forecast_emissions(
    factory_id: str,
    periods: int = Query(30, ge=7, le=365, description="Days to forecast"),
    db: Session = Depends(get_db),
):
    """Forecast future emissions using trend analysis."""
    results = (
        db.query(EmissionResult)
        .filter(EmissionResult.factory_id == factory_id)
        .order_by(EmissionResult.date)
        .all()
    )

    if len(results) < 10:
        raise HTTPException(
            status_code=400,
            detail="Need at least 10 data points for forecasting",
        )

    forecast = ai_engine.forecast_emissions(results, periods)

    return {
        "factory_id": factory_id,
        "forecast_periods": periods,
        "forecast": forecast,
    }


@router.get("/insights/{factory_id}")
async def get_insights(factory_id: str, db: Session = Depends(get_db)):
    """Generate AI-powered insights about emissions."""
    results = (
        db.query(EmissionResult)
        .filter(EmissionResult.factory_id == factory_id)
        .order_by(EmissionResult.date)
        .all()
    )

    if not results:
        raise HTTPException(
            status_code=404, detail="No emission data found"
        )

    insights = ai_engine.generate_insights(results)
    return {"factory_id": factory_id, "insights": insights}