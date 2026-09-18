"""Schemas for data upload and retrieval."""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime


class OperationalDataCreate(BaseModel):
    date: date
    factory_id: str = Field(..., min_length=1, max_length=50)
    electricity_kwh: float = Field(ge=0, default=0.0)
    natural_gas_m3: float = Field(ge=0, default=0.0)
    diesel_liters: float = Field(ge=0, default=0.0)
    production_units: float = Field(ge=0, default=0.0)
    waste_kg: float = Field(ge=0, default=0.0)
    water_m3: float = Field(ge=0, default=0.0)
    transport_km: float = Field(ge=0, default=0.0)
    employees_present: int = Field(ge=0, default=0)


class OperationalDataResponse(OperationalDataCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UploadResponse(BaseModel):
    message: str
    records_inserted: int
    factory_ids: List[str]


class DataSummary(BaseModel):
    total_records: int
    factory_ids: List[str]
    date_range: Optional[dict] = None
    averages: Optional[dict] = None