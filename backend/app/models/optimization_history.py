"""Optimization history model - tracks optimization runs."""

from sqlalchemy import Column, Integer, Float, String, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base


class OptimizationHistory(Base):
    __tablename__ = "optimization_history"

    id = Column(Integer, primary_key=True, index=True)
    factory_id = Column(String(50), nullable=False, index=True)
    budget_usd = Column(Float, nullable=False)
    target_reduction_pct = Column(Float, nullable=True)
    achieved_reduction_pct = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    selected_actions = Column(JSON, nullable=False)
    roi_estimate = Column(Float, default=0.0)
    optimization_method = Column(String(50), default="knapsack")

    created_at = Column(DateTime(timezone=True), server_default=func.now())