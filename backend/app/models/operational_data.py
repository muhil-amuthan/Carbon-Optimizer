"""Operational data model - stores factory input data."""

import os
import sys

# Ensure backend root is in sys.path when script is executed directly
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from sqlalchemy import Column, Integer, Float, String, Date, DateTime
from sqlalchemy.sql import func
from app.database import Base


class OperationalData(Base):
    __tablename__ = "operational_data"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    factory_id = Column(String(50), nullable=False, index=True)
    electricity_kwh = Column(Float, default=0.0)
    natural_gas_m3 = Column(Float, default=0.0)
    diesel_liters = Column(Float, default=0.0)
    production_units = Column(Float, default=0.0)
    waste_kg = Column(Float, default=0.0)
    water_m3 = Column(Float, default=0.0)
    transport_km = Column(Float, default=0.0)
    employees_present = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


if __name__ == "__main__":
    print(f"OperationalData model loaded successfully: table='{OperationalData.__tablename__}'")