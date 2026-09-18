"""Carbon emission calculator using IPCC/EPA emission factors."""

import json
import os
from typing import Dict
from app.config import settings


class CarbonCalculator:
    """Calculate carbon emissions from operational data using standard factors."""

    def __init__(self):
        self.factors = self._load_factors()

    def _load_factors(self) -> Dict:
        """Load emission factors from JSON file."""
        factors_path = os.path.join(settings.data_dir, "emission_factors.json")
        try:
            with open(factors_path, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            # Default factors if file not found
            return {
                "electricity": {"grid_default": 0.716},
                "natural_gas": {"combustion": 2.0},
                "diesel": {"combustion": 2.68},
                "waste": {"landfill": 0.58},
                "water": {"treatment_and_supply": 0.344},
                "transport": {"truck_diesel": 0.14},
            }

    def calculate(self, record) -> Dict:
        """
        Calculate emissions for a single operational data record.
        Returns a dictionary of all emission components.
        """
        # Scope 1: Direct emissions
        scope1_gas = record.natural_gas_m3 * self.factors["natural_gas"]["combustion"]
        scope1_diesel = record.diesel_liters * self.factors["diesel"]["combustion"]
        scope1_total = scope1_gas + scope1_diesel

        # Scope 2: Indirect (purchased electricity)
        scope2_elec = record.electricity_kwh * self.factors["electricity"]["grid_default"]
        scope2_total = scope2_elec

        # Scope 3: Other indirect
        scope3_waste = record.waste_kg * self.factors["waste"]["landfill"]
        scope3_water = record.water_m3 * self.factors["water"]["treatment_and_supply"]
        scope3_transport = record.transport_km * self.factors["transport"]["truck_diesel"]
        scope3_total = scope3_waste + scope3_water + scope3_transport

        total = scope1_total + scope2_total + scope3_total

        # Emission intensity (per production unit)
        intensity = 0.0
        if record.production_units and record.production_units > 0:
            intensity = total / record.production_units

        return {
            "scope1_natural_gas": round(scope1_gas, 4),
            "scope1_diesel": round(scope1_diesel, 4),
            "scope1_total": round(scope1_total, 4),
            "scope2_electricity": round(scope2_elec, 4),
            "scope2_total": round(scope2_total, 4),
            "scope3_waste": round(scope3_waste, 4),
            "scope3_water": round(scope3_water, 4),
            "scope3_transport": round(scope3_transport, 4),
            "scope3_total": round(scope3_total, 4),
            "total_emissions": round(total, 4),
            "emission_intensity": round(intensity, 6),
        }

    def calculate_with_grid_intensity(self, record, grid_intensity: float) -> Dict:
        """
        Calculate emissions using real-time grid carbon intensity
        instead of the default factor.
        """
        result = self.calculate(record)
        # Recalculate scope 2 with actual grid intensity
        scope2_elec = record.electricity_kwh * (grid_intensity / 1000)  # g to kg
        scope2_total = scope2_elec
        total = result["scope1_total"] + scope2_total + result["scope3_total"]

        intensity = 0.0
        if record.production_units and record.production_units > 0:
            intensity = total / record.production_units

        result.update({
            "scope2_electricity": round(scope2_elec, 4),
            "scope2_total": round(scope2_total, 4),
            "total_emissions": round(total, 4),
            "emission_intensity": round(intensity, 6),
        })
        return result

    def get_factors(self) -> Dict:
        """Return the emission factors being used."""
        return self.factors