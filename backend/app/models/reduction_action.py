"""Reduction action model - stores available and selected actions."""

from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base


class ReductionAction(Base):
    __tablename__ = "reduction_actions"

    id = Column(Integer, primary_key=True, index=True)
    action_id = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)
    scope = Column(String(10), nullable=False)
    reduction_pct = Column(Float, nullable=False)
    cost_usd = Column(Float, nullable=False)
    payback_months = Column(Integer, nullable=False)
    implementation_weeks = Column(Integer, nullable=False)
    priority = Column(String(20), default="medium")
    difficulty = Column(String(20), default="medium")
    description = Column(String(500))
    is_selected = Column(Boolean, default=False)
    is_implemented = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())