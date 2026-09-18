"""Grid-aware scheduler — find optimal low-carbon windows for energy-intensive operations.

Supports:
- Best 4-hour window selection (lowest carbon intensity)
- Full 24-hour window ranking
- Weekly operation schedule generation
- Shift-plan recommendations for industrial loads
- Carbon savings estimation vs. worst-hour baseline
"""

from __future__ import annotations

from typing import Dict, List, Optional

from app.schemas.optimize import GridOptimalWindow


class GridScheduler:
    """Find optimal low-carbon scheduling windows using grid data."""

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _aggregate_hourly(grid_data: list) -> Dict[int, Dict]:
        """Average carbon intensity and renewable % by hour-of-day.

        Args:
            grid_data: List of GridData ORM objects.

        Returns:
            ``{hour: {avg_intensity, avg_renewable}}`` dict.
        """
        buckets: Dict[int, Dict[str, list]] = {}
        for d in grid_data:
            hour = d.timestamp.hour
            if hour not in buckets:
                buckets[hour] = {"intensities": [], "renewables": []}
            buckets[hour]["intensities"].append(d.carbon_intensity)
            buckets[hour]["renewables"].append(d.renewable_pct)

        return {
            hour: {
                "avg_intensity": sum(v["intensities"]) / len(v["intensities"]),
                "avg_renewable": sum(v["renewables"])  / len(v["renewables"]),
            }
            for hour, v in buckets.items()
        }

    def _best_window(
        self,
        hourly_avg: Dict[int, Dict],
        window_size: int = 4,
    ) -> Dict:
        """Find the ``window_size``-hour contiguous window with lowest avg intensity."""
        hours = sorted(hourly_avg.keys())
        n     = len(hours)

        best_start    = hours[0]
        best_avg      = float("inf")
        best_renewable = 0.0

        for i in range(n):
            window_hours = [hours[(i + j) % n] for j in range(window_size)]
            window_avg   = sum(hourly_avg[h]["avg_intensity"] for h in window_hours) / window_size
            window_ren   = sum(hourly_avg[h]["avg_renewable"]  for h in window_hours) / window_size

            if window_avg < best_avg:
                best_avg      = window_avg
                best_start    = window_hours[0]
                best_renewable = window_ren

        end_hour = (best_start + window_size) % 24
        return {
            "start_hour":        best_start,
            "end_hour":          end_hour,
            "avg_intensity":     round(best_avg,      1),
            "avg_renewable_pct": round(best_renewable, 1),
        }

    # ------------------------------------------------------------------
    # Primary API: find optimal window
    # ------------------------------------------------------------------

    def find_optimal_window(
        self,
        grid_data: list,
        window_size: int = 4,
    ) -> GridOptimalWindow:
        """Return the lowest-carbon ``window_size``-hour block in the grid data.

        Args:
            grid_data: List of GridData records (from database or IoT).
            window_size: Duration of the operation window in hours (default 4).

        Returns:
            ``GridOptimalWindow`` with timing and recommendation text.
        """
        if not grid_data:
            return GridOptimalWindow(
                start_time="11:00",
                end_time="15:00",
                avg_carbon_intensity=350.0,
                renewable_pct=40.0,
                recommendation="Default: schedule during midday solar peak",
            )

        hourly_avg = self._aggregate_hourly(grid_data)

        if not hourly_avg:
            return GridOptimalWindow(
                start_time="11:00",
                end_time="15:00",
                avg_carbon_intensity=350.0,
                renewable_pct=40.0,
                recommendation="Insufficient data for optimisation",
            )

        best = self._best_window(hourly_avg, window_size)
        s    = best["start_hour"]
        e    = best["end_hour"]
        avg  = best["avg_intensity"]
        ren  = best["avg_renewable_pct"]

        # Savings vs a 500 gCO2/kWh reference peak
        savings_pct = max(0, (500 - avg) / 500 * 100)

        recommendation = (
            f"Schedule energy-intensive operations between {s:02d}:00 and {e:02d}:00 "
            f"when grid carbon intensity averages {avg:.0f} gCO2/kWh "
            f"and renewable share is {ren:.1f}%. "
            f"This could reduce Scope 2 emissions by up to {savings_pct:.0f}% vs peak hours."
        )

        return GridOptimalWindow(
            start_time=f"{s:02d}:00",
            end_time=f"{e:02d}:00",
            avg_carbon_intensity=avg,
            renewable_pct=ren,
            recommendation=recommendation,
        )

    # ------------------------------------------------------------------
    # Rank all 24 windows
    # ------------------------------------------------------------------

    def rank_all_windows(
        self,
        grid_data: list,
        window_size: int = 4,
    ) -> List[Dict]:
        """Rank every possible ``window_size``-hour block by carbon intensity.

        Args:
            grid_data: List of GridData records.
            window_size: Window size in hours.

        Returns:
            List of window dicts sorted ascending by avg carbon intensity
            (best first).  Each dict includes ``start_hour``, ``end_hour``,
            ``avg_carbon_intensity``, ``avg_renewable_pct``, and ``rank``.
        """
        if not grid_data:
            return []

        hourly_avg = self._aggregate_hourly(grid_data)
        hours      = sorted(hourly_avg.keys())
        n          = len(hours)

        windows: List[Dict] = []
        for i in range(n):
            wh   = [hours[(i + j) % n] for j in range(window_size)]
            w_avg = sum(hourly_avg[h]["avg_intensity"] for h in wh) / window_size
            w_ren = sum(hourly_avg[h]["avg_renewable"]  for h in wh) / window_size
            windows.append(
                {
                    "start_hour":           wh[0],
                    "end_hour":             (wh[0] + window_size) % 24,
                    "start_time":           f"{wh[0]:02d}:00",
                    "end_time":             f"{(wh[0] + window_size) % 24:02d}:00",
                    "avg_carbon_intensity": round(w_avg, 1),
                    "avg_renewable_pct":    round(w_ren, 1),
                }
            )

        windows.sort(key=lambda x: x["avg_carbon_intensity"])
        for rank, w in enumerate(windows, 1):
            w["rank"] = rank

        return windows

    # ------------------------------------------------------------------
    # Weekly schedule
    # ------------------------------------------------------------------

    def generate_weekly_schedule(
        self,
        grid_data: list,
        daily_operation_hours: int = 8,
        off_peak_preference: bool = True,
    ) -> Dict:
        """Generate a 7-day weekly operation schedule.

        Assigns daily operation windows based on the grid's best hours.
        Days of the week are labelled Mon–Sun.  If ``off_peak_preference``
        is True, windows shifted to off-peak hours (usually night) are
        preferred when intensities are similar.

        Args:
            grid_data: Grid records to analyse.
            daily_operation_hours: Hours of operation needed per day.
            off_peak_preference: Prefer night-time windows.

        Returns:
            Dict with a list of ``daily_schedule`` entries and a weekly
            summary including estimated total carbon savings.
        """
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        if not grid_data:
            window = GridOptimalWindow(
                start_time="22:00",
                end_time="06:00",
                avg_carbon_intensity=320.0,
                renewable_pct=45.0,
                recommendation="Default: schedule overnight",
            )
            return {
                "daily_schedule": [
                    {"day": d, "start_time": "22:00", "end_time": "06:00",
                     "avg_carbon_intensity": 320.0, "renewable_pct": 45.0}
                    for d in days
                ],
                "weekly_avg_intensity":  320.0,
                "weekly_avg_renewable":  45.0,
                "note":                  "Using default schedule — no grid data provided",
            }

        hourly_avg = self._aggregate_hourly(grid_data)
        windows    = self.rank_all_windows(grid_data, window_size=daily_operation_hours)

        if not windows:
            return {"daily_schedule": [], "note": "Insufficient data"}

        # Off-peak bonus: prefer windows starting 20:00–06:00
        def score(w: Dict) -> float:
            base = w["avg_carbon_intensity"]
            if off_peak_preference:
                s = w["start_hour"]
                if s >= 20 or s < 6:
                    base -= 20  # bonus for off-peak hours
            return base

        best_window = min(windows, key=score)

        daily_schedule = [
            {
                "day":                 day,
                "start_time":         best_window["start_time"],
                "end_time":           best_window["end_time"],
                "avg_carbon_intensity": best_window["avg_carbon_intensity"],
                "renewable_pct":      best_window["avg_renewable_pct"],
            }
            for day in days
        ]

        return {
            "daily_schedule":        daily_schedule,
            "operation_hours_per_day": daily_operation_hours,
            "weekly_avg_intensity":  best_window["avg_carbon_intensity"],
            "weekly_avg_renewable":  best_window["avg_renewable_pct"],
        }

    # ------------------------------------------------------------------
    # Carbon savings estimator
    # ------------------------------------------------------------------

    def estimate_carbon_savings(
        self,
        grid_data: list,
        electricity_kwh_per_hour: float,
        window_size: int = 4,
    ) -> Dict:
        """Estimate CO₂ savings from operating in the optimal vs. worst window.

        Args:
            grid_data: Grid records.
            electricity_kwh_per_hour: Average load in kWh/hour.
            window_size: Operation duration in hours.

        Returns:
            Dict with baseline, optimal, and saved kgCO₂ values.
        """
        if not grid_data:
            return {
                "optimal_kg_co2":  0.0,
                "worst_kg_co2":    0.0,
                "savings_kg_co2":  0.0,
                "savings_pct":     0.0,
            }

        windows = self.rank_all_windows(grid_data, window_size=window_size)
        if not windows:
            return {"error": "No ranked windows available"}

        best_intensity  = windows[0]["avg_carbon_intensity"]   # gCO2/kWh
        worst_intensity = windows[-1]["avg_carbon_intensity"]

        total_kwh  = electricity_kwh_per_hour * window_size

        optimal_kg = total_kwh * (best_intensity  / 1000)
        worst_kg   = total_kwh * (worst_intensity / 1000)
        saved_kg   = worst_kg - optimal_kg
        saved_pct  = saved_kg / worst_kg * 100 if worst_kg > 0 else 0.0

        return {
            "optimal_window_start":  windows[0]["start_time"],
            "optimal_window_end":    windows[0]["end_time"],
            "optimal_intensity_g_kwh": best_intensity,
            "worst_intensity_g_kwh": worst_intensity,
            "total_kwh":             round(total_kwh, 2),
            "optimal_kg_co2":        round(optimal_kg, 3),
            "worst_kg_co2":          round(worst_kg,   3),
            "savings_kg_co2":        round(saved_kg,   3),
            "savings_pct":           round(saved_pct,  2),
        }
