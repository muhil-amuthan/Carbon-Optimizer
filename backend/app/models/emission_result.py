"""Emission results model - stores calculated emissions."""

from sqlalchemy import Column, Integer, Float, String, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class EmissionResult(Base):
    __tablename__ = "emission_results"

    id = Column(Integer, primary_key=True, index=True)
    operational_data_id = Column(Integer, ForeignKey("operational_data.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    factory_id = Column(String(50), nullable=False, index=True)

    # Scope 1: Direct emissions
    scope1_natural_gas = Column(Float, default=0.0)
    scope1_diesel = Column(Float, default=0.0)
    scope1_total = Column(Float, default=0.0)

    # Scope 2: Indirect (electricity)
    scope2_electricity = Column(Float, default=0.0)
    scope2_total = Column(Float, default=0.0)

    # Scope 3: Other indirect
    scope3_waste = Column(Float, default=0.0)
    scope3_water = Column(Float, default=0.0)
    scope3_transport = Column(Float, default=0.0)
    scope3_total = Column(Float, default=0.0)

    # Totals
    total_emissions = Column(Float, default=0.0)
    emission_intensity = Column(Float, default=0.0)  # per production unit

    created_at = Column(DateTime(timezone=True), server_default=func.now())