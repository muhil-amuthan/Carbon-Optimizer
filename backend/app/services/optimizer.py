"""Budget optimizer - knapsack-based action selection for emission reduction.

Supports:
- Greedy cost-effectiveness selection (fast, approximate)
- True 0/1 knapsack dynamic programming (exact, budget-limited)
- Scope-aware action filtering (scope1 / scope2 / scope3)
- Annual budget planning with quarterly allocation
- ROI-ranked quick-win selection
"""

from __future__ import annotations

from typing import Dict, List, Optional


class Optimizer:
    """Optimise emission reduction actions within a budget constraint."""

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _score_action(action) -> float:
        """Compute a composite priority score for an action."""
        cost_effectiveness = action.reduction_pct / action.cost_usd if action.cost_usd > 0 else 0.0
        priority_weight    = {"high": 3, "medium": 2, "low": 1}.get(action.priority,   1)
        difficulty_weight  = {"easy": 3, "medium": 2, "hard": 1}.get(action.difficulty, 1)
        return cost_effectiveness * priority_weight * difficulty_weight

    @staticmethod
    def _action_to_dict(action, score: float, cost_effectiveness: float) -> Dict:
        return {
            "action_id":            action.action_id,
            "name":                 action.name,
            "category":             action.category,
            "scope":                action.scope,
            "reduction_pct":        action.reduction_pct,
            "cost_usd":             action.cost_usd,
            "payback_months":       action.payback_months,
            "implementation_weeks": action.implementation_weeks,
            "priority":             action.priority,
            "difficulty":           action.difficulty,
            "description":          action.description,
            "cost_effectiveness":   round(cost_effectiveness, 6),
        }

    def _build_result(
        self,
        selected: List[Dict],
        budget: float,
        baseline_daily_emissions: float,
    ) -> Dict:
        """Assemble the standard result dict from selected actions."""
        total_cost      = sum(a["cost_usd"]      for a in selected)
        total_reduction = min(sum(a["reduction_pct"] for a in selected), 100.0)

        annual_baseline = baseline_daily_emissions * 365
        annual_savings  = annual_baseline * (total_reduction / 100)

        avg_payback = (
            sum(a["payback_months"] for a in selected) / len(selected)
            if selected else 0.0
        )
        timeline = self._build_timeline(selected)

        return {
            "total_cost":          round(total_cost,      2),
            "budget_remaining":    round(budget - total_cost, 2),
            "total_reduction_pct": round(total_reduction, 2),
            "annual_savings_kg":   round(annual_savings,  2),
            "roi_months":          round(avg_payback,     1),
            "selected_actions":    selected,
            "timeline":            timeline,
        }

    # ------------------------------------------------------------------
    # Greedy optimiser (fast, approximate)
    # ------------------------------------------------------------------

    def optimize(
        self,
        actions: list,
        budget: float,
        target_reduction: Optional[float],
        baseline_daily_emissions: float,
    ) -> Dict:
        """Greedy knapsack: select actions in descending cost-effectiveness order.

        Args:
            actions: List of ReductionAction ORM/Pydantic objects.
            budget: Maximum spend in USD.
            target_reduction: Optional early-stop reduction % target.
            baseline_daily_emissions: Used to estimate annual CO₂ savings.

        Returns:
            Standard optimisation result dict.
        """
        scored = sorted(
            [
                {
                    "action":             a,
                    "score":              self._score_action(a),
                    "cost_effectiveness": a.reduction_pct / a.cost_usd if a.cost_usd > 0 else 0.0,
                }
                for a in actions
            ],
            key=lambda x: x["score"],
            reverse=True,
        )

        selected: List[Dict] = []
        total_cost      = 0.0
        total_reduction = 0.0

        for item in scored:
            a = item["action"]
            if total_cost + a.cost_usd <= budget:
                total_cost      += a.cost_usd
                total_reduction += a.reduction_pct
                selected.append(self._action_to_dict(a, item["score"], item["cost_effectiveness"]))

                if target_reduction and total_reduction >= target_reduction:
                    break

        return self._build_result(selected, budget, baseline_daily_emissions)

    # ------------------------------------------------------------------
    # DP (0/1 knapsack) optimiser — exact solution
    # ------------------------------------------------------------------

    def dp_optimize(
        self,
        actions: list,
        budget: float,
        baseline_daily_emissions: float,
        granularity: int = 1000,
    ) -> Dict:
        """Exact 0/1 knapsack DP to maximise total reduction within budget.

        Costs are discretised to ``granularity`` integer slots to keep
        the DP tractable for typical action counts (≤ 50).

        Args:
            actions: List of ReductionAction objects.
            budget: Maximum spend in USD.
            baseline_daily_emissions: Used to estimate annual CO₂ savings.
            granularity: Number of DP budget slots (higher = more precise).

        Returns:
            Standard optimisation result dict.
        """
        if not actions or budget <= 0:
            return self._build_result([], budget, baseline_daily_emissions)

        # Discretise costs
        scale   = granularity / budget
        cap     = granularity
        costs_d = [max(1, round(a.cost_usd * scale)) for a in actions]
        values  = [a.reduction_pct for a in actions]
        n       = len(actions)

        # Standard 0/1 knapsack DP
        dp = [0.0] * (cap + 1)
        kept = [[False] * (cap + 1) for _ in range(n)]

        for i in range(n):
            c = costs_d[i]
            v = values[i]
            for w in range(cap, c - 1, -1):
                if dp[w - c] + v > dp[w]:
                    dp[w] = dp[w - c] + v
                    kept[i][w] = True

        # Back-track to find selected actions
        selected_indices = []
        w = cap
        for i in range(n - 1, -1, -1):
            if kept[i][w]:
                selected_indices.append(i)
                w -= costs_d[i]

        selected: List[Dict] = []
        for i in selected_indices:
            a = actions[i]
            ce = a.reduction_pct / a.cost_usd if a.cost_usd > 0 else 0.0
            selected.append(self._action_to_dict(a, self._score_action(a), ce))

        return self._build_result(selected, budget, baseline_daily_emissions)

    # ------------------------------------------------------------------
    # Scope-filtered optimisation
    # ------------------------------------------------------------------

    def filter_by_scope(
        self,
        actions: list,
        scopes: Optional[List[str]] = None,
        exclude_actions: Optional[List[str]] = None,
    ) -> list:
        """Filter actions to only include specified GHG scopes.

        Args:
            actions: Full action list.
            scopes: List of scopes to include, e.g. ``["scope1", "scope2"]``.
                    ``None`` means keep all.
            exclude_actions: Action IDs to unconditionally exclude.

        Returns:
            Filtered action list.
        """
        result = list(actions)
        if exclude_actions:
            result = [a for a in result if a.action_id not in exclude_actions]
        if scopes:
            result = [a for a in result if a.scope in scopes]
        return result

    # ------------------------------------------------------------------
    # Annual budget planner
    # ------------------------------------------------------------------

    def plan_budget(
        self,
        actions: list,
        annual_budget: float,
        baseline_daily_emissions: float,
    ) -> Dict:
        """Allocate an annual budget across four quarters.

        Strategy:
        - Q1 (30%): Easy / high-priority quick wins
        - Q2 (30%): Medium difficulty high-priority items
        - Q3 (25%): Hard/long-lead items
        - Q4 (15%): Reserve / monitoring

        Args:
            actions: Full available action list.
            annual_budget: Total annual budget in USD.
            baseline_daily_emissions: Used to estimate annual CO₂ savings.

        Returns:
            Dict with quarterly allocation plans and cumulative projections.
        """
        q1_budget = annual_budget * 0.30
        q2_budget = annual_budget * 0.30
        q3_budget = annual_budget * 0.25
        q4_budget = annual_budget * 0.15

        # Q1: easy actions only
        q1_actions = [a for a in actions if a.difficulty == "easy"]
        q1_result  = self.optimize(q1_actions, q1_budget, None, baseline_daily_emissions)

        # Q2: medium difficulty, exclude already-selected
        q1_ids    = {a["action_id"] for a in q1_result["selected_actions"]}
        q2_actions = [a for a in actions if a.difficulty in ("medium",) and a.action_id not in q1_ids]
        q2_result  = self.optimize(q2_actions, q2_budget, None, baseline_daily_emissions)

        # Q3: hard actions, exclude previously selected
        q2_ids    = {a["action_id"] for a in q2_result["selected_actions"]}
        q3_actions = [
            a for a in actions
            if a.difficulty == "hard" and a.action_id not in q1_ids | q2_ids
        ]
        q3_result  = self.optimize(q3_actions, q3_budget, None, baseline_daily_emissions)

        quarterly_allocation = [
            {
                "quarter":          "Q1",
                "budget_usd":       round(q1_budget,  2),
                "focus":            "Quick wins (easy difficulty)",
                "selected_actions": q1_result["selected_actions"],
                "reduction_pct":    q1_result["total_reduction_pct"],
                "spend_usd":        q1_result["total_cost"],
            },
            {
                "quarter":          "Q2",
                "budget_usd":       round(q2_budget,  2),
                "focus":            "Medium difficulty improvements",
                "selected_actions": q2_result["selected_actions"],
                "reduction_pct":    q2_result["total_reduction_pct"],
                "spend_usd":        q2_result["total_cost"],
            },
            {
                "quarter":          "Q3",
                "budget_usd":       round(q3_budget,  2),
                "focus":            "Major capital projects",
                "selected_actions": q3_result["selected_actions"],
                "reduction_pct":    q3_result["total_reduction_pct"],
                "spend_usd":        q3_result["total_cost"],
            },
            {
                "quarter":          "Q4",
                "budget_usd":       round(q4_budget,  2),
                "focus":            "Monitoring, fine-tuning, and reserve",
                "selected_actions": [],
                "reduction_pct":    0.0,
                "spend_usd":        0.0,
            },
        ]

        cumulative = 0.0
        for q in quarterly_allocation:
            cumulative = min(100.0, cumulative + q["reduction_pct"])
            q["cumulative_reduction_pct"] = round(cumulative, 2)

        total_annual_savings = baseline_daily_emissions * 365 * (cumulative / 100)

        return {
            "annual_budget":              round(annual_budget, 2),
            "quarterly_allocation":       quarterly_allocation,
            "projected_total_reduction":  round(cumulative,           2),
            "projected_annual_savings_kg": round(total_annual_savings, 2),
        }

    # ------------------------------------------------------------------
    # ROI-first quick-win selector
    # ------------------------------------------------------------------

    def select_quick_wins(
        self,
        actions: list,
        top_n: int = 5,
    ) -> List[Dict]:
        """Return the top-N actions ranked purely by payback period (ROI).

        Args:
            actions: Full action list.
            top_n: Number of actions to return.

        Returns:
            Sorted list of action dicts (shortest payback first).
        """
        sorted_actions = sorted(actions, key=lambda a: a.payback_months)
        return [
            self._action_to_dict(
                a,
                self._score_action(a),
                a.reduction_pct / a.cost_usd if a.cost_usd > 0 else 0.0,
            )
            for a in sorted_actions[:top_n]
        ]

    # ------------------------------------------------------------------
    # Timeline builder
    # ------------------------------------------------------------------

    def _build_timeline(self, selected_actions: List[Dict]) -> List[Dict]:
        """Build a sequential implementation timeline from selected actions."""
        priority_order   = {"high": 0, "medium": 1, "low": 2}
        difficulty_order = {"easy": 0, "medium": 1, "hard": 2}

        sorted_actions = sorted(
            selected_actions,
            key=lambda x: (
                priority_order.get(x["priority"],   1),
                difficulty_order.get(x["difficulty"], 1),
            ),
        )

        timeline: List[Dict] = []
        current_week    = 0
        cumulative_redn = 0.0

        for action in sorted_actions:
            cumulative_redn += action["reduction_pct"]
            timeline.append(
                {
                    "action_id":            action["action_id"],
                    "name":                 action["name"],
                    "start_week":           current_week,
                    "end_week":             current_week + action["implementation_weeks"],
                    "duration_weeks":       action["implementation_weeks"],
                    "cumulative_reduction": round(min(cumulative_redn, 100.0), 2),
                }
            )
            current_week += action["implementation_weeks"]

        return timeline
