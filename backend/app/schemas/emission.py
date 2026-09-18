"""Schemas for emission calculations and results."""

from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict
from datetime import date, datetime


class EmissionBreakdown(BaseModel):
    scope1_natural_gas: float = 0.0
    scope1_diesel: float = 0.0
    scope1_total: float = 0.0
    scope2_electricity: float = 0.0
    scope2_total: float = 0.0
    scope3_waste: float = 0.0
    scope3_water: float = 0.0
    scope3_transport: float = 0.0
    scope3_total: float = 0.0
    total_emissions: float = 0.0
    emission_intensity: float = 0.0


class EmissionResultResponse(EmissionBreakdown):
    id: int
    date: date
    factory_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EmissionSummary(BaseModel):
    factory_id: str
    period: str
    total_emissions_kg: float
    scope1_total: float
    scope2_total: float
    scope3_total: float
    avg_daily_emissions: float
    avg_intensity: float
    trend: List[Dict]


class AnomalyResult(BaseModel):
    date: date
    factory_id: str
    actual_emissions: float
    expected_emissions: float
    deviation_pct: float
    is_anomaly: bool
    severity: str


class AnomalyResponse(BaseModel):
    factory_id: str
    anomalies: List[AnomalyResult]
    total_anomalies: int
    analysis_period: str