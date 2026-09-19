"""Grid data model - stores power grid carbon intensity data."""

import os
import sys

# Ensure backend root is in sys.path when script is executed directly
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from sqlalchemy import Column, Integer, Float, String, DateTime
from sqlalchemy.sql import func
from app.database import Base


class GridData(Base):
    __tablename__ = "grid_data"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    region = Column(String(50), nullable=False, index=True)
    solar_mw = Column(Float, default=0.0)
    wind_mw = Column(Float, default=0.0)
    hydro_mw = Column(Float, default=0.0)
    nuclear_mw = Column(Float, default=0.0)
    coal_mw = Column(Float, default=0.0)
    gas_mw = Column(Float, default=0.0)
    total_demand_mw = Column(Float, default=0.0)
    carbon_intensity = Column(Float, default=0.0)
    renewable_pct = Column(Float, default=0.0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


if __name__ == "__main__":
    print(f"GridData model loaded successfully: table='{GridData.__tablename__}'")