"""Optimization endpoints - budget planning, action selection, simulation."""

import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.config import settings
from app.models.emission_result import EmissionResult
from app.models.reduction_action import ReductionAction
from app.models.optimization_history import OptimizationHistory
from app.schemas.optimize import (
    OptimizationRequest,
    OptimizationResult,
    SimulationRequest,
    SimulationResult,
)
from app.services.optimizer import Optimizer
from app.services.simulator import Simulator

router = APIRouter()
optimizer = Optimizer()
simulator = Simulator()


@router.post("/run", response_model=OptimizationResult)
async def run_optimization(request: OptimizationRequest, db: Session = Depends(get_db)):
    """Run budget optimization to find best emission reduction actions."""
    # Load available actions
    actions = db.query(ReductionAction).filter(
        ReductionAction.is_implemented == False,
        ~ReductionAction.action_id.in_(request.exclude_actions),
    ).all()

    if not actions:
        # Load from JSON if DB is empty
        actions = _load_actions_from_json(db, request.exclude_actions)

    if not actions:
        raise HTTPException(status_code=404, detail="No reduction actions available")

    # Get current emissions
    latest_emissions = (
        db.query(EmissionResult)
        .filter(EmissionResult.factory_id == request.factory_id)
        .order_by(EmissionResult.date.desc())
        .first()
    )

    baseline_daily = latest_emissions.total_emissions if latest_emissions else 15000.0

    result = optimizer.optimize(
        actions=actions,
        budget=request.budget_usd,
        target_reduction=request.target_reduction_pct,
        baseline_daily_emissions=baseline_daily,
    )

    # Save to history
    history = OptimizationHistory(
        factory_id=request.factory_id,
        budget_usd=request.budget_usd,
        target_reduction_pct=request.target_reduction_pct,
        achieved_reduction_pct=result["total_reduction_pct"],
        total_cost=result["total_cost"],
        selected_actions=[a["action_id"] for a in result["selected_actions"]],
        roi_estimate=result["roi_months"],
        optimization_method="knapsack",
    )
    db.add(history)
    db.commit()

    return OptimizationResult(
        factory_id=request.factory_id,
        budget_usd=request.budget_usd,
        total_cost=result["total_cost"],
        budget_remaining=result["budget_remaining"],
        total_reduction_pct=result["total_reduction_pct"],
        estimated_annual_savings_kg=result["annual_savings_kg"],
        roi_months=result["roi_months"],
        selected_actions=result["selected_actions"],
        timeline=result["timeline"],
        created_at=datetime.now(timezone.utc),
    )


@router.post("/simulate", response_model=SimulationResult)
async def simulate_changes(request: SimulationRequest, db: Session = Depends(get_db)):
    """Simulate the impact of operational changes on emissions."""
    latest_emissions = (
        db.query(EmissionResult)
        .filter(EmissionResult.factory_id == request.factory_id)
        .order_by(EmissionResult.date.desc())
        .first()
    )

    if not latest_emissions:
        raise HTTPException(
            status_code=404,
            detail=f"No emission data found for factory {request.factory_id}",
        )

    result = simulator.simulate(latest_emissions, request)
    return result


@router.get("/actions")
async def get_available_actions(db: Session = Depends(get_db)):
    """List all available reduction actions."""
    actions = db.query(ReductionAction).all()
    if not actions:
        actions = _load_actions_from_json(db, [])
    result = []
    for a in actions:
        ce = round(a.reduction_pct / a.cost_usd, 6) if a.cost_usd and a.cost_usd > 0 else 0.0
        result.append({
            "id": a.id,
            "action_id": a.action_id,
            "name": a.name,
            "category": a.category,
            "scope": a.scope,
            "reduction_pct": a.reduction_pct,
            "cost_usd": a.cost_usd,
            "payback_months": a.payback_months if a.payback_months is not None else 12,
            "implementation_weeks": a.implementation_weeks if a.implementation_weeks is not None else 4,
            "priority": a.priority or "medium",
            "difficulty": a.difficulty or "medium",
            "description": a.description or "",
            "cost_effectiveness": ce,
            "is_selected": a.is_selected,
            "is_implemented": a.is_implemented,
        })
    return result


@router.get("/history/{factory_id}")
async def get_optimization_history(factory_id: str, db: Session = Depends(get_db)):
    """Get optimization history for a factory."""
    history = (
        db.query(OptimizationHistory)
        .filter(OptimizationHistory.factory_id == factory_id)
        .order_by(OptimizationHistory.created_at.desc())
        .all()
    )
    return history


def _load_actions_from_json(db: Session, exclude: list) -> list:
    """Load reduction actions from JSON file into database."""
    import os

    json_path = os.path.join(settings.data_dir, "reduction_actions.json")
    try:
        with open(json_path, "r") as f:
            data = json.load(f)

        actions = []
        for item in data.get("actions", []):
            if item["id"] in exclude:
                continue
            action = ReductionAction(
                action_id=item["id"],
                name=item["name"],
                category=item["category"],
                scope=item["scope"],
                reduction_pct=item["reduction_pct"],
                cost_usd=item["cost_usd"],
                payback_months=item["payback_months"],
                implementation_weeks=item["implementation_weeks"],
                priority=item.get("priority", "medium"),
                difficulty=item.get("difficulty", "medium"),
                description=item.get("description", ""),
            )
            db.add(action)
            actions.append(action)

        db.commit()
        return actions
    except FileNotFoundError:
        return []