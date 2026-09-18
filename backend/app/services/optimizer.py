"""Budget optimizer - knapsack-based action selection for emission reduction."""

from typing import List, Dict, Optional


class Optimizer:
    """Optimize emission reduction actions within a budget constraint."""

    def optimize(
        self,
        actions: list,
        budget: float,
        target_reduction: Optional[float],
        baseline_daily_emissions: float,
    ) -> Dict:
        """
        Use a greedy knapsack approach to select the best combination
        of reduction actions within the given budget.
        """
        # Calculate cost-effectiveness for each action
        scored_actions = []
        for a in actions:
            cost_effectiveness = a.reduction_pct / a.cost_usd if a.cost_usd > 0 else 0
            priority_weight = {"high": 3, "medium": 2, "low": 1}.get(a.priority, 1)
            difficulty_weight = {"easy": 3, "medium": 2, "hard": 1}.get(a.difficulty, 1)

            score = cost_effectiveness * priority_weight * difficulty_weight

            scored_actions.append(
                {
                    "action": a,
                    "score": score,
                    "cost_effectiveness": cost_effectiveness,
                }
            )

        # Sort by score (descending)
        scored_actions.sort(key=lambda x: x["score"], reverse=True)

        # Greedy selection
        selected = []
        total_cost = 0.0
        total_reduction = 0.0

        for item in scored_actions:
            a = item["action"]
            if total_cost + a.cost_usd <= budget:
                total_cost += a.cost_usd
                total_reduction += a.reduction_pct

                selected.append(
                    {
                        "action_id": a.action_id,
                        "name": a.name,
                        "category": a.category,
                        "scope": a.scope,
                        "reduction_pct": a.reduction_pct,
                        "cost_usd": a.cost_usd,
                        "payback_months": a.payback_months,
                        "implementation_weeks": a.implementation_weeks,
                        "priority": a.priority,
                        "difficulty": a.difficulty,
                        "description": a.description,
                        "cost_effectiveness": round(item["cost_effectiveness"], 6),
                    }
                )

                if target_reduction and total_reduction >= target_reduction:
                    break

        # Cap total reduction at 100%
        total_reduction = min(total_reduction, 100.0)

        # Calculate annual savings
        annual_baseline = baseline_daily_emissions * 365
        annual_savings = annual_baseline * (total_reduction / 100)

        # Calculate average ROI
        if selected:
            avg_payback = sum(a["payback_months"] for a in selected) / len(selected)
        else:
            avg_payback = 0

        # Build implementation timeline
        timeline = self._build_timeline(selected)

        return {
            "total_cost": round(total_cost, 2),
            "budget_remaining": round(budget - total_cost, 2),
            "total_reduction_pct": round(total_reduction, 2),
            "annual_savings_kg": round(annual_savings, 2),
            "roi_months": round(avg_payback, 1),
            "selected_actions": selected,
            "timeline": timeline,
        }

    def _build_timeline(self, selected_actions: List[Dict]) -> List[Dict]:
        """Build a sequential implementation timeline."""
        timeline = []
        current_week = 0

        # Sort by priority then difficulty
        priority_order = {"high": 0, "medium": 1, "low": 2}
        difficulty_order = {"easy": 0, "medium": 1, "hard": 2}

        sorted_actions = sorted(
            selected_actions,
            key=lambda x: (priority_order.get(x["priority"], 1), difficulty_order.get(x["difficulty"], 1)),
        )

        for action in sorted_actions:
            timeline.append(
                {
                    "action_id": action["action_id"],
                    "name": action["name"],
                    "start_week": current_week,
                    "end_week": current_week + action["implementation_weeks"],
                    "duration_weeks": action["implementation_weeks"],
                    "cumulative_reduction": sum(
                        a["reduction_pct"]
                        for a in sorted_actions[: sorted_actions.index(action) + 1]
                    ),
                }
            )
            current_week += action["implementation_weeks"]

        return timeline