"""Grid IoT service - bridges grid data and ESP32 devices via MQTT."""

import json
import time
import random
from datetime import datetime
from typing import Dict, Optional


class GridService:
    """Service to manage grid carbon intensity data and IoT device commands."""

    def __init__(self):
        self.current_intensity: float = 450.0
        self.renewable_pct: float = 25.0
        self.threshold_low: float = 350.0
        self.threshold_high: float = 500.0
        self.device_states: Dict[str, str] = {}

    def get_current_grid_status(self) -> Dict:
        """Get simulated current grid status."""
        hour = datetime.now().hour

        # Simulate solar pattern
        if 6 <= hour <= 18:
            solar_factor = 1.0 - abs(hour - 12) / 6
        else:
            solar_factor = 0.0

        # Lower intensity during solar hours
        base_intensity = 500 - (solar_factor * 200)
        noise = random.uniform(-30, 30)
        self.current_intensity = max(200, base_intensity + noise)
        self.renewable_pct = 15 + solar_factor * 35 + random.uniform(-5, 5)

        return {
            "timestamp": datetime.now().isoformat(),
            "carbon_intensity_gco2_kwh": round(self.current_intensity, 1),
            "renewable_pct": round(self.renewable_pct, 1),
            "is_green_window": self.current_intensity < self.threshold_low,
            "is_red_window": self.current_intensity > self.threshold_high,
            "recommendation": self._get_recommendation(),
        }

    def _get_recommendation(self) -> str:
        if self.current_intensity < self.threshold_low:
            return "GREEN: Good time to run energy-intensive operations"
        elif self.current_intensity > self.threshold_high:
            return "RED: Defer non-essential loads if possible"
        else:
            return "AMBER: Normal grid conditions"

    def should_activate_device(self, device_id: str) -> bool:
        """Determine if a device should be ON based on grid conditions."""
        return self.current_intensity < self.threshold_low

    def set_device_state(self, device_id: str, state: str):
        """Track device state."""
        self.device_states[device_id] = state

    def get_device_states(self) -> Dict[str, str]:
        """Get all tracked device states."""
        return self.device_states


if __name__ == "__main__":
    service = GridService()
    while True:
        status = service.get_current_grid_status()
        print(json.dumps(status, indent=2))
        time.sleep(10)