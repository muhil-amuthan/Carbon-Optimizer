"""Grid and IoT endpoints - power grid data, carbon intensity, scheduling."""

import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.grid_data import GridData
from app.schemas.optimize import GridOptimalWindow
from app.services.scheduler import GridScheduler

router = APIRouter()
scheduler = GridScheduler()


@router.post("/upload-grid-data")
async def upload_grid_data(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload grid power mix / carbon intensity data."""
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")

    records = 0
    for _, row in df.iterrows():
        try:
            grid = GridData(
                timestamp=pd.to_datetime(row["timestamp"]),
                region=str(row.get("region", "DEFAULT")),
                solar_mw=float(row.get("solar_mw", 0)),
                wind_mw=float(row.get("wind_mw", 0)),
                hydro_mw=float(row.get("hydro_mw", 0)),
                nuclear_mw=float(row.get("nuclear_mw", 0)),
                coal_mw=float(row.get("coal_mw", 0)),
                gas_mw=float(row.get("gas_mw", 0)),
                total_demand_mw=float(row.get("total_demand_mw", 0)),
                carbon_intensity=float(row.get("carbon_intensity_gco2_kwh", 0)),
                renewable_pct=float(row.get("renewable_pct", 0)),
            )
            db.add(grid)
            records += 1
        except Exception:
            continue

    db.commit()
    return {"message": "Grid data uploaded", "records_inserted": records}


@router.get("/current")
async def get_current_grid(
    region: str = Query("REGION_A"),
    db: Session = Depends(get_db),
):
    """Get the latest grid data for a region."""
    latest = (
        db.query(GridData)
        .filter(GridData.region == region)
        .order_by(GridData.timestamp.desc())
        .first()
    )

    if not latest:
        return {
            "region": region,
            "carbon_intensity": 450.0,
            "renewable_pct": 25.0,
            "status": "simulated",
            "message": "No real grid data available, returning defaults",
        }

    return {
        "region": latest.region,
        "timestamp": str(latest.timestamp),
        "carbon_intensity": latest.carbon_intensity,
        "renewable_pct": latest.renewable_pct,
        "solar_mw": latest.solar_mw,
        "wind_mw": latest.wind_mw,
        "coal_mw": latest.coal_mw,
        "gas_mw": latest.gas_mw,
        "total_demand_mw": latest.total_demand_mw,
        "status": "live",
    }


@router.get("/optimal-window", response_model=GridOptimalWindow)
async def get_optimal_window(
    region: str = Query("REGION_A"),
    db: Session = Depends(get_db),
):
    """Find the optimal low-carbon time window for energy-intensive operations."""
    grid_data = (
        db.query(GridData)
        .filter(GridData.region == region)
        .order_by(GridData.timestamp)
        .all()
    )

    if not grid_data:
        return GridOptimalWindow(
            start_time="11:00",
            end_time="15:00",
            avg_carbon_intensity=350.0,
            renewable_pct=40.0,
            recommendation="Default recommendation: schedule heavy loads during midday solar peak",
        )

    return scheduler.find_optimal_window(grid_data)


@router.get("/history")
async def get_grid_history(
    region: str = Query("REGION_A"),
    limit: int = Query(48, le=500),
    db: Session = Depends(get_db),
):
    """Get historical grid data for charting."""
    data = (
        db.query(GridData)
        .filter(GridData.region == region)
        .order_by(GridData.timestamp.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "timestamp": str(d.timestamp),
            "carbon_intensity": d.carbon_intensity,
            "renewable_pct": d.renewable_pct,
            "solar_mw": d.solar_mw,
            "wind_mw": d.wind_mw,
            "coal_mw": d.coal_mw,
        }
        for d in reversed(data)
    ]


@router.post("/mqtt/trigger")
async def trigger_mqtt_command(
    device_id: str,
    action: str = Query(..., regex="^(ON|OFF|SCHEDULE)$"),
):
    """Send a command to an ESP32 device via MQTT (simulated)."""
    return {
        "device_id": device_id,
        "action": action,
        "status": "command_sent",
        "message": f"MQTT command '{action}' sent to device '{device_id}' (simulated)",
    }