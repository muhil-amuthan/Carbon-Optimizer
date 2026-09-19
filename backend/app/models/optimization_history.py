"""Optimization history model - tracks optimization runs."""

import os
import sys

# Ensure backend root is in sys.path when script is executed directly
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

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


if __name__ == "__main__":
    print(f"OptimizationHistory model loaded successfully: table='{OptimizationHistory.__tablename__}'")