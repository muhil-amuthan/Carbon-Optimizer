"""Schemas for optimization and simulation."""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime


class OptimizationRequest(BaseModel):
    factory_id: str
    budget_usd: float = Field(gt=0)
    target_reduction_pct: Optional[float] = Field(None, ge=0, le=100)
    exclude_actions: List[str] = []


class ActionRecommendation(BaseModel):
    action_id: str
    name: str
    category: str
    scope: str
    reduction_pct: float
    cost_usd: float
    payback_months: int
    implementation_weeks: int
    priority: str
    difficulty: str
    description: str
    cost_effectiveness: float  # reduction per dollar


class OptimizationResult(BaseModel):
    factory_id: str
    budget_usd: float
    total_cost: float
    budget_remaining: float
    total_reduction_pct: float
    estimated_annual_savings_kg: float
    roi_months: float
    selected_actions: List[ActionRecommendation]
    timeline: List[Dict]
    created_at: datetime


class SimulationRequest(BaseModel):
    factory_id: str
    electricity_change_pct: float = Field(ge=-100, le=100, default=0)
    gas_change_pct: float = Field(ge=-100, le=100, default=0)
    diesel_change_pct: float = Field(ge=-100, le=100, default=0)
    waste_change_pct: float = Field(ge=-100, le=100, default=0)
    renewable_energy_pct: float = Field(ge=0, le=100, default=0)
    production_change_pct: float = Field(ge=-100, le=200, default=0)


class SimulationResult(BaseModel):
    factory_id: str
    baseline_emissions: float
    simulated_emissions: float
    change_pct: float
    change_absolute: float
    breakdown: Dict[str, Dict[str, float]]


class BudgetPlan(BaseModel):
    factory_id: str
    annual_budget: float
    quarterly_allocation: List[Dict]
    priority_actions: List[ActionRecommendation]
    expected_reduction_timeline: List[Dict]


class GridOptimalWindow(BaseModel):
    start_time: str
    end_time: str
    avg_carbon_intensity: float
    renewable_pct: float
    recommendation: str