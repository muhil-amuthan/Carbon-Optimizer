"""Data management endpoints - upload, retrieve, manage operational data."""

import io
import pandas as pd
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models.operational_data import OperationalData
from app.schemas.data import (
    OperationalDataCreate,
    OperationalDataResponse,
    UploadResponse,
    DataSummary,
)

router = APIRouter()


@router.post("/upload-csv", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload operational data from a CSV file."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")

    required_cols = {"date", "factory_id", "electricity_kwh"}
    if not required_cols.issubset(set(df.columns)):
        raise HTTPException(
            status_code=400,
            detail=f"CSV must contain columns: {required_cols}. Found: {list(df.columns)}",
        )

    records_inserted = 0
    factory_ids = set()

    for _, row in df.iterrows():
        try:
            record = OperationalData(
                date=pd.to_datetime(row["date"]).date(),
                factory_id=str(row["factory_id"]),
                electricity_kwh=float(row.get("electricity_kwh", 0)),
                natural_gas_m3=float(row.get("natural_gas_m3", 0)),
                diesel_liters=float(row.get("diesel_liters", 0)),
                production_units=float(row.get("production_units", 0)),
                waste_kg=float(row.get("waste_kg", 0)),
                water_m3=float(row.get("water_m3", 0)),
                transport_km=float(row.get("transport_km", 0)),
                employees_present=int(row.get("employees_present", 0)),
            )
            db.add(record)
            factory_ids.add(str(row["factory_id"]))
            records_inserted += 1
        except Exception:
            continue

    db.commit()

    return UploadResponse(
        message="CSV uploaded successfully",
        records_inserted=records_inserted,
        factory_ids=list(factory_ids),
    )


@router.post("/manual", response_model=OperationalDataResponse)
async def add_manual_entry(entry: OperationalDataCreate, db: Session = Depends(get_db)):
    """Add a single operational data entry manually."""
    record = OperationalData(**entry.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/", response_model=List[OperationalDataResponse])
async def get_operational_data(
    factory_id: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Retrieve operational data with optional filters."""
    query = db.query(OperationalData)

    if factory_id:
        query = query.filter(OperationalData.factory_id == factory_id)
    if start_date:
        query = query.filter(OperationalData.date >= start_date)
    if end_date:
        query = query.filter(OperationalData.date <= end_date)

    query = query.order_by(OperationalData.date.desc())
    return query.offset(offset).limit(limit).all()


@router.get("/summary", response_model=DataSummary)
async def get_data_summary(db: Session = Depends(get_db)):
    """Get a summary of all operational data."""
    total = db.query(func.count(OperationalData.id)).scalar()
    factories = (
        db.query(OperationalData.factory_id).distinct().all()
    )
    factory_ids = [f[0] for f in factories]

    date_range = None
    averages = None

    if total > 0:
        min_date = db.query(func.min(OperationalData.date)).scalar()
        max_date = db.query(func.max(OperationalData.date)).scalar()
        date_range = {
            "start": str(min_date),
            "end": str(max_date),
        }

        avg_elec = db.query(func.avg(OperationalData.electricity_kwh)).scalar() or 0
        avg_gas = db.query(func.avg(OperationalData.natural_gas_m3)).scalar() or 0
        avg_diesel = db.query(func.avg(OperationalData.diesel_liters)).scalar() or 0
        averages = {
            "avg_electricity_kwh": round(avg_elec, 2),
            "avg_natural_gas_m3": round(avg_gas, 2),
            "avg_diesel_liters": round(avg_diesel, 2),
        }

    return DataSummary(
        total_records=total,
        factory_ids=factory_ids,
        date_range=date_range,
        averages=averages,
    )


@router.delete("/{record_id}")
async def delete_record(record_id: int, db: Session = Depends(get_db)):
    """Delete a specific operational data record."""
    record = db.query(OperationalData).filter(OperationalData.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
    return {"message": "Record deleted", "id": record_id}