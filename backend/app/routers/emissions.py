"""Emission calculation and reporting endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models.operational_data import OperationalData
from app.models.emission_result import EmissionResult
from app.schemas.emission import EmissionResultResponse, EmissionSummary
from app.services.carbon_calculator import CarbonCalculator

router = APIRouter()
calculator = CarbonCalculator()


@router.post("/calculate", response_model=List[EmissionResultResponse])
async def calculate_emissions(
    factory_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    """Calculate emissions for all operational data of a factory."""
    query = db.query(OperationalData).filter(
        OperationalData.factory_id == factory_id
    )
    if start_date:
        query = query.filter(OperationalData.date >= start_date)
    if end_date:
        query = query.filter(OperationalData.date <= end_date)

    records = query.order_by(OperationalData.date).all()

    if not records:
        raise HTTPException(
            status_code=404,
            detail=f"No operational data found for factory {factory_id}",
        )

    results = []
    for record in records:
        # Check if already calculated
        existing = (
            db.query(EmissionResult)
            .filter(
                EmissionResult.operational_data_id == record.id,
            )
            .first()
        )
        if existing:
            results.append(existing)
            continue

        breakdown = calculator.calculate(record)
        emission = EmissionResult(
            operational_data_id=record.id,
            date=record.date,
            factory_id=record.factory_id,
            **breakdown,
        )
        db.add(emission)
        results.append(emission)

    db.commit()
    for r in results:
        db.refresh(r)

    return results


@router.get("/results", response_model=List[EmissionResultResponse])
async def get_emission_results(
    factory_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
):
    """Retrieve stored emission results."""
    query = db.query(EmissionResult)

    if factory_id:
        query = query.filter(EmissionResult.factory_id == factory_id)
    if start_date:
        query = query.filter(EmissionResult.date >= start_date)
    if end_date:
        query = query.filter(EmissionResult.date <= end_date)

    return query.order_by(EmissionResult.date.desc()).limit(limit).all()


@router.get("/summary/{factory_id}", response_model=EmissionSummary)
async def get_emission_summary(factory_id: str, db: Session = Depends(get_db)):
    """Get a comprehensive emission summary for a factory."""
    results = (
        db.query(EmissionResult)
        .filter(EmissionResult.factory_id == factory_id)
        .order_by(EmissionResult.date)
        .all()
    )

    if not results:
        raise HTTPException(
            status_code=404,
            detail=f"No emission data found for factory {factory_id}",
        )

    total = sum(r.total_emissions for r in results)
    s1 = sum(r.scope1_total for r in results)
    s2 = sum(r.scope2_total for r in results)
    s3 = sum(r.scope3_total for r in results)

    trend = [
        {
            "date": str(r.date),
            "total": round(r.total_emissions, 2),
            "scope1": round(r.scope1_total, 2),
            "scope2": round(r.scope2_total, 2),
            "scope3": round(r.scope3_total, 2),
            "intensity": round(r.emission_intensity, 4),
        }
        for r in results
    ]

    period = f"{results[0].date} to {results[-1].date}"

    return EmissionSummary(
        factory_id=factory_id,
        period=period,
        total_emissions_kg=round(total, 2),
        scope1_total=round(s1, 2),
        scope2_total=round(s2, 2),
        scope3_total=round(s3, 2),
        avg_daily_emissions=round(total / len(results), 2),
        avg_intensity=round(
            sum(r.emission_intensity for r in results) / len(results), 4
        ),
        trend=trend,
    )


@router.get("/factors")
async def get_emission_factors():
    """Return the emission factors used in calculations."""
    return calculator.get_factors()