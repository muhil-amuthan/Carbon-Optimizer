"""Database initialization and seeding helper."""

import os
import json
import logging
import pandas as pd
from datetime import date
from sqlalchemy.orm import Session

from app.config import settings
from app.models.operational_data import OperationalData
from app.models.emission_result import EmissionResult
from app.models.grid_data import GridData
from app.models.reduction_action import ReductionAction
from app.services.carbon_calculator import CarbonCalculator

logger = logging.getLogger("carbon_optimizer.seed")


def seed_database(db: Session):
    """Seed initial demo datasets into SQLite database if empty."""
    try:
        calculator = CarbonCalculator()

        # 1. Seed Reduction Actions
        actions_count = db.query(ReductionAction).count()
        if actions_count == 0:
            actions_path = os.path.join(settings.data_dir, "reduction_actions.json")
            if os.path.exists(actions_path):
                with open(actions_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                for item in data.get("actions", []):
                    action = ReductionAction(
                        action_id=item["id"],
                        name=item["name"],
                        category=item["category"],
                        scope=item["scope"],
                        reduction_pct=item["reduction_pct"],
                        cost_usd=item["cost_usd"],
                        payback_months=item.get("payback_months", 12),
                        implementation_weeks=item.get("implementation_weeks", 4),
                        priority=item.get("priority", "medium"),
                        difficulty=item.get("difficulty", "medium"),
                        description=item.get("description", ""),
                    )
                    db.add(action)
                db.commit()
                logger.info("Seeded reduction actions successfully")

        # 2. Seed Grid Data
        grid_count = db.query(GridData).count()
        if grid_count == 0:
            grid_csv = os.path.join(settings.data_dir, "sample_npp_grid.csv")
            if os.path.exists(grid_csv):
                df_grid = pd.read_csv(grid_csv)
                for _, row in df_grid.iterrows():
                    grid = GridData(
                        timestamp=pd.to_datetime(row["timestamp"]),
                        region=str(row.get("region", "REGION_A")),
                        solar_mw=float(row.get("solar_mw", 0)),
                        wind_mw=float(row.get("wind_mw", 0)),
                        hydro_mw=float(row.get("hydro_mw", 0)),
                        nuclear_mw=float(row.get("nuclear_mw", 0)),
                        coal_mw=float(row.get("coal_mw", 0)),
                        gas_mw=float(row.get("gas_mw", 0)),
                        total_demand_mw=float(row.get("total_demand_mw", 0)),
                        carbon_intensity=float(row.get("carbon_intensity_gco2_kwh", 0)),
                        renewable_pct=float(row.get("renewable_pct", 0)),
                    )
                    db.add(grid)
                db.commit()
                logger.info("Seeded grid data successfully")

        # 3. Seed Operational Data and calculate emissions
        op_count = db.query(OperationalData).count()
        if op_count < 10:
            factory_csv = os.path.join(settings.data_dir, "sample_factory_6months.csv")
            if os.path.exists(factory_csv):
                df = pd.read_csv(factory_csv)
                # Seed for both FACTORY_A (default frontend plant) and FAC001 (e2e tests)
                for target_fac in ["FACTORY_A", "FAC001"]:
                    existing_for_fac = db.query(OperationalData).filter(OperationalData.factory_id == target_fac).count()
                    if existing_for_fac < 10:
                        for _, row in df.iterrows():
                            rec_date = pd.to_datetime(row["date"]).date()
                            rec = OperationalData(
                                date=rec_date,
                                factory_id=target_fac,
                                electricity_kwh=float(row.get("electricity_kwh", 0)),
                                natural_gas_m3=float(row.get("natural_gas_m3", 0)),
                                diesel_liters=float(row.get("diesel_liters", 0)),
                                production_units=float(row.get("production_units", 0)),
                                waste_kg=float(row.get("waste_kg", 0)),
                                water_m3=float(row.get("water_m3", 0)),
                                transport_km=float(row.get("transport_km", 0)),
                                employees_present=int(row.get("employees_present", 0)),
                            )
                            db.add(rec)
                            db.flush()

                            # Calculate corresponding emission result
                            breakdown = calculator.calculate(rec)
                            emission = EmissionResult(
                                operational_data_id=rec.id,
                                date=rec.date,
                                factory_id=target_fac,
                                **breakdown,
                            )
                            db.add(emission)
                db.commit()
                logger.info("Seeded operational and emission results successfully")

    except Exception as e:
        db.rollback()
        logger.warning(f"Database seeding notice: {e}")
