from typing import Dict, List, Optional, Set

import pandas as pd

from app.services.graph_service import GraphService


class UserRiskService:
    """
    Lightweight risk evaluator for pre-payment user checks.
    Reuses uploaded CSV data and existing graph detection logic.
    """

    CYCLE_WEIGHT = 40
    FLAGGED_CONNECTION_WEIGHT = 30
    HIGH_ACTIVITY_WEIGHT = 20
    NEW_ACCOUNT_WEIGHT = 10

    @staticmethod
    def _normalize_identifier(value: str) -> str:
        """
        Normalize user-entered account/UPI identifiers.
        Example: 'ACC-001@upi' -> 'acc001upi', 'ACC 001' -> 'acc001'.
        """
        text = str(value or "").strip().lower()
        return "".join(ch for ch in text if ch.isalnum())

    def __init__(self, df: pd.DataFrame, flagged_accounts: Optional[Set[str]] = None):
        self.df = df
        self.graph_service = GraphService(df)
        self.graph = self.graph_service.G
        self.flagged_accounts = flagged_accounts or set()
        self._cycles_cache: Optional[List[List[str]]] = None

        sender_counts = df["sender_id"].value_counts()
        receiver_counts = df["receiver_id"].value_counts()
        self.activity_counts = sender_counts.add(receiver_counts, fill_value=0)

        # Case-insensitive account resolution for user-entered UPI/account IDs.
        self.account_lookup = {
            str(account_id).strip().lower(): str(account_id)
            for account_id in (set(df["sender_id"]) | set(df["receiver_id"]))
        }

        # Normalized map for format-tolerant matching.
        self.normalized_lookup: Dict[str, Set[str]] = {}
        for canonical in self.account_lookup.values():
            normalized = self._normalize_identifier(canonical)
            if normalized:
                self.normalized_lookup.setdefault(normalized, set()).add(canonical)

        # Secondary alias map for UPI-like IDs: support lookup by local-part before '@'.
        self.alias_lookup: Dict[str, Set[str]] = {}
        for canonical in self.account_lookup.values():
            lowered = canonical.strip().lower()
            if "@" in lowered:
                alias = lowered.split("@", 1)[0]
                if alias:
                    self.alias_lookup.setdefault(alias, set()).add(canonical)

        # Normalized alias map (local-part only) for UPI-like inputs.
        self.normalized_alias_lookup: Dict[str, Set[str]] = {}
        for canonical in self.account_lookup.values():
            lowered = canonical.strip().lower()
            local_part = lowered.split("@", 1)[0]
            normalized_local = self._normalize_identifier(local_part)
            if normalized_local:
                self.normalized_alias_lookup.setdefault(normalized_local, set()).add(canonical)

    @staticmethod
    def build_no_history_response(account_id: str, no_dataset_loaded: bool = False) -> Dict:
        base_reason = "No historical data found. This may be a new account."
        if no_dataset_loaded:
            base_reason = "No historical dataset is loaded yet. This may be a new account."

        return {
            "receiver_id": account_id,
            "risk_score": 40,
            "risk_level": "Medium Risk",
            "reasons": [
                base_reason,
                "Proceed carefully with first-time recipients."
            ],
            "warning_message": "No historical data found. This may be a new account. Proceed carefully.",
            "graph_data": {"nodes": [], "edges": []},
            "risky_accounts": [],
            "signals": {
                "is_in_cycle": False,
                "flagged_connections": 0,
                "high_transaction_activity": False,
                "transaction_frequency_per_day": 0.0,
                "total_transactions": 0,
                "found_in_dataset": False,
            },
        }

    def _resolve_account_id(self, account_id: str) -> str:
        normalized = str(account_id).strip()
        lowered = normalized.lower()

        # Exact match first.
        if lowered in self.account_lookup:
            return self.account_lookup[lowered]

        # Alias fallback: if input has '@', try local-part match.
        alias = lowered.split("@", 1)[0] if "@" in lowered else lowered
        matches = list(self.alias_lookup.get(alias, set()))
        if len(matches) == 1:
            return matches[0]

        # Format-tolerant fallback: remove separators and symbols before matching.
        normalized_input = self._normalize_identifier(lowered)
        norm_matches = list(self.normalized_lookup.get(normalized_input, set()))
        if len(norm_matches) == 1:
            return norm_matches[0]

        normalized_alias = self._normalize_identifier(alias)
        norm_alias_matches = list(self.normalized_alias_lookup.get(normalized_alias, set()))
        if len(norm_alias_matches) == 1:
            return norm_alias_matches[0]

        return normalized

    def _get_cycles(self) -> List[List[str]]:
        if self._cycles_cache is None:
            self._cycles_cache = self.graph_service.detect_cycles()
        return self._cycles_cache

    def _is_in_cycle(self, account_id: str) -> bool:
        for cycle in self._get_cycles():
            if account_id in cycle:
                return True
        return False

    def _flagged_connections(self, account_id: str) -> int:
        if not self.graph.has_node(account_id):
            return 0

        neighbors = set(self.graph.predecessors(account_id)) | set(self.graph.successors(account_id))
        return sum(1 for neighbor in neighbors if neighbor in self.flagged_accounts)

    def _account_transactions(self, account_id: str) -> pd.DataFrame:
        sent = self.df[self.df["sender_id"] == account_id]
        received = self.df[self.df["receiver_id"] == account_id]
        return pd.concat([sent, received], ignore_index=True)

    def _transaction_frequency(self, account_transactions: pd.DataFrame) -> float:
        if account_transactions.empty:
            return 0.0

        tx_sorted = account_transactions.sort_values("timestamp")
        first_time = tx_sorted.iloc[0]["timestamp"]
        last_time = tx_sorted.iloc[-1]["timestamp"]
        span_days = max((last_time - first_time).total_seconds() / 86400, 1.0)
        return round(len(tx_sorted) / span_days, 2)

    def _is_high_activity(self, account_id: str, tx_count: int) -> bool:
        if len(self.activity_counts) == 0:
            return False

        threshold = max(5, int(self.activity_counts.quantile(0.75)))
        return tx_count >= threshold

    def _risk_level(self, score: int) -> str:
        if score <= 30:
            return "Safe"
        if score <= 60:
            return "Medium Risk"
        return "High Risk"

    def _build_risky_graph_payload(self, account_id: str, score: int) -> Dict:
        """Build a compact graph view containing only risky-connected accounts."""
        if not self.graph.has_node(account_id):
            return {
                "graph_data": {"nodes": [], "edges": []},
                "risky_accounts": [],
            }

        neighbors = set(self.graph.predecessors(account_id)) | set(self.graph.successors(account_id))
        risky_neighbors = {node for node in neighbors if node in self.flagged_accounts}
        risky_nodes = {account_id} | risky_neighbors

        # If part of a cycle, include cycle members to visualize risky loop context.
        for cycle in self._get_cycles():
            if account_id in cycle:
                risky_nodes.update(cycle)

        full_graph = self.graph_service.get_graph_json()
        filtered_nodes = [node for node in full_graph["nodes"] if node["id"] in risky_nodes]
        filtered_ids = {node["id"] for node in filtered_nodes}
        filtered_edges = [
            edge
            for edge in full_graph["edges"]
            if edge["source"] in filtered_ids and edge["target"] in filtered_ids
        ]

        risky_accounts = [
            {
                "account_id": node_id,
                "suspicion_score": score,
            }
            for node_id in filtered_ids
        ]

        return {
            "graph_data": {"nodes": filtered_nodes, "edges": filtered_edges},
            "risky_accounts": risky_accounts,
        }

    def assess_account(self, account_id: str) -> Dict:
        resolved_id = self._resolve_account_id(account_id)

        if not self.graph.has_node(resolved_id):
            return self.build_no_history_response(account_id)

        score = 0
        reasons: List[str] = []

        account_transactions = self._account_transactions(resolved_id)
        tx_count = len(account_transactions)
        tx_frequency = self._transaction_frequency(account_transactions)

        is_in_cycle = self._is_in_cycle(resolved_id)
        if is_in_cycle:
            score += self.CYCLE_WEIGHT
            reasons.append("Part of suspicious transaction cycle")

        flagged_connections = self._flagged_connections(resolved_id)
        if flagged_connections > 0:
            score += self.FLAGGED_CONNECTION_WEIGHT
            reasons.append(f"Connected to {flagged_connections} flagged account(s)")

        high_activity = self._is_high_activity(resolved_id, tx_count)
        if high_activity:
            score += self.HIGH_ACTIVITY_WEIGHT
            reasons.append(
                f"High transaction activity detected ({tx_count} transactions, {tx_frequency}/day)"
            )

        if tx_count <= 2:
            score += self.NEW_ACCOUNT_WEIGHT
            reasons.append("Limited historical footprint (new/low-history account)")

        normalized_score = max(0, min(100, int(round(score))))
        risk_level = self._risk_level(normalized_score)
        graph_payload = self._build_risky_graph_payload(resolved_id, normalized_score)

        warning_map = {
            "Safe": "This account shows low risk signals in available historical data.",
            "Medium Risk": "This account has moderate risk indicators. Verify recipient details before payment.",
            "High Risk": "This account shows patterns associated with fraudulent activity. Proceed with caution.",
        }

        if not reasons:
            reasons.append("No major risk indicators found in uploaded historical data")

        return {
            "receiver_id": resolved_id,
            "risk_score": normalized_score,
            "risk_level": risk_level,
            "reasons": reasons,
            "warning_message": warning_map[risk_level],
            "graph_data": graph_payload["graph_data"],
            "risky_accounts": graph_payload["risky_accounts"],
            "signals": {
                "is_in_cycle": is_in_cycle,
                "flagged_connections": flagged_connections,
                "high_transaction_activity": high_activity,
                "transaction_frequency_per_day": tx_frequency,
                "total_transactions": int(tx_count),
                "found_in_dataset": True,
            },
        }
