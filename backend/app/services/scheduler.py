"""Grid-aware scheduler - find optimal times for energy-intensive operations."""

from typing import List, Dict
from app.schemas.optimize import GridOptimalWindow


class GridScheduler:
    """Find optimal low-carbon windows using grid data."""

    def find_optimal_window(self, grid_data: list) -> GridOptimalWindow:
        """
        Analyze grid data to find the time window with lowest carbon intensity.
        """
        if not grid_data:
            return GridOptimalWindow(
                start_time="11:00",
                end_time="15:00",
                avg_carbon_intensity=350.0,
                renewable_pct=40.0,
                recommendation="Default: schedule during midday solar peak",
            )

        # Group by hour and find the lowest carbon intensity period
        hourly = {}
        for d in grid_data:
            hour = d.timestamp.hour
            if hour not in hourly:
                hourly[hour] = {"intensities": [], "renewables": []}
            hourly[hour]["intensities"].append(d.carbon_intensity)
            hourly[hour]["renewables"].append(d.renewable_pct)

        # Average by hour
        hourly_avg = {}
        for hour, data in hourly.items():
            hourly_avg[hour] = {
                "avg_intensity": sum(data["intensities"]) / len(data["intensities"]),
                "avg_renewable": sum(data["renewables"]) / len(data["renewables"]),
            }

        if not hourly_avg:
            return GridOptimalWindow(
                start_time="11:00",
                end_time="15:00",
                avg_carbon_intensity=350.0,
                renewable_pct=40.0,
                recommendation="Insufficient data for optimization",
            )

        # Find the 4-hour window with lowest average intensity
        best_start = 0
        best_avg = float("inf")
        best_renewable = 0.0

        hours = sorted(hourly_avg.keys())
        for i in range(len(hours)):
            window_hours = [hours[(i + j) % len(hours)] for j in range(4)]
            window_avg = sum(hourly_avg[h]["avg_intensity"] for h in window_hours) / 4
            window_renewable = sum(hourly_avg[h]["avg_renewable"] for h in window_hours) / 4

            if window_avg < best_avg:
                best_avg = window_avg
                best_start = window_hours[0]
                best_renewable = window_renewable

        end_hour = (best_start + 4) % 24

        recommendation = (
            f"Schedule energy-intensive operations between {best_start:02d}:00 and {end_hour:02d}:00 "
            f"when grid carbon intensity averages {best_avg:.0f} gCO2/kWh "
            f"and renewable share is {best_renewable:.1f}%. "
            f"This could reduce Scope 2 emissions by up to {((500 - best_avg) / 500 * 100):.0f}% vs peak hours."
        )

        return GridOptimalWindow(
            start_time=f"{best_start:02d}:00",
            end_time=f"{end_hour:02d}:00",
            avg_carbon_intensity=round(best_avg, 1),
            renewable_pct=round(best_renewable, 1),
            recommendation=recommendation,
        )