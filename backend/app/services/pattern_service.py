import pandas as pd
from typing import List, Dict, Set, Tuple
from datetime import timedelta
from app.core.scoring import RiskWeights
import networkx as nx

class PatternService:
    """
    Analyzes temporal behavior and volume-based patterns.
    RIFT 2026 Hackathon Spec - Money Muling Detection
    Patterns: Cycles, Smurfing, Shell Networks
    """

    def __init__(self, df: pd.DataFrame):
        self.df = df
        self.df_sorted = df.sort_values('timestamp')

    def detect_smurfing(self) -> Dict[str, List[Dict]]:
        """
        MANDATORY PATTERN 2: Smurfing / Fan-In / Fan-Out (RIFT Spec)
        Requirement: 10+ senders -> 1 receiver within 72 hours
        Returns: List with account_id and evidence (transaction count, time window)
        """
        results = {
            "fan_in": [],
            "fan_out": [],
            "is_merchant_trap": []  # Accounts with high volume but legitimate pattern
        }
        
        # === FAN-IN DETECTION (Multiple senders to one receiver) ===
        fan_in_groups = self.df.groupby('receiver_id')
        for receiver, group in fan_in_groups:
            unique_senders = group['sender_id'].nunique()
            
            if unique_senders >= RiskWeights.FAN_THRESHOLD:
                group_sorted = group.sort_values('timestamp')
                time_span = group_sorted['timestamp'].max() - group_sorted['timestamp'].min()
                
                # Convert pandas/numpy timedelta to Python timedelta for total_seconds()
                time_span_seconds = pd.Timedelta(time_span).total_seconds() if hasattr(time_span, 'item') else time_span.total_seconds()
                
                # Check 72-hour window
                if time_span_seconds <= RiskWeights.WINDOW_HOURS * 3600:
                    # HIGH RISK: Many senders within short time window
                    results["fan_in"].append({
                        "account_id": receiver,
                        "sender_count": unique_senders,
                        "time_window_hours": time_span_seconds / 3600,
                        "transaction_count": len(group),
                        "avg_amount": group['amount'].mean()
                    })
                else:
                    # MERCHANT TRAP: High volume but spread over time = legitimate merchant
                    results["is_merchant_trap"].append(receiver)
        
        # === FAN-OUT DETECTION (One sender to multiple receivers) ===
        fan_out_groups = self.df.groupby('sender_id')
        for sender, group in fan_out_groups:
            unique_receivers = group['receiver_id'].nunique()
            
            if unique_receivers >= RiskWeights.FAN_THRESHOLD:
                group_sorted = group.sort_values('timestamp')
                time_span = group_sorted['timestamp'].max() - group_sorted['timestamp'].min()
                
                # Convert pandas/numpy timedelta to Python timedelta for total_seconds()
                time_span_seconds = pd.Timedelta(time_span).total_seconds() if hasattr(time_span, 'item') else time_span.total_seconds()
                
                if time_span_seconds <= RiskWeights.WINDOW_HOURS * 3600:
                    # HIGH RISK
                    results["fan_out"].append({
                        "account_id": sender,
                        "receiver_count": unique_receivers,
                        "time_window_hours": time_span_seconds / 3600,
                        "transaction_count": len(group),
                        "avg_amount": group['amount'].mean()
                    })
                else:
                    # Merchant or payroll distributor = legitimate
                    results["is_merchant_trap"].append(sender)
        
        return results

    def detect_shell_networks(self) -> List[Dict]:
        """
        MANDATORY PATTERN 3: Layered Shell Networks (OPTIMIZED).
        Criteria: Chain of 3+ hops where intermediate accounts have only 2-3 total transactions
        OPTIMIZATION: Uses iterative BFS instead of recursive DFS to avoid stack overflow
        and exponential time complexity on large graphs.
        """
        shell_accounts = []
        
        # Count total transactions per account (in + out)
        account_activity = {}
        for _, row in self.df.iterrows():
            account_activity[row['sender_id']] = account_activity.get(row['sender_id'], 0) + 1
            account_activity[row['receiver_id']] = account_activity.get(row['receiver_id'], 0) + 1
        
        # Find shell accounts: 2-3 total transactions only
        shell_candidates = {
            acc: count for acc, count in account_activity.items()
            if count >= 2 and count <= RiskWeights.MAX_SHELL_TX
        }
        
        # Build graph to find chains
        G = nx.DiGraph()
        for _, row in self.df.iterrows():
            G.add_edge(row['sender_id'], row['receiver_id'])
        
        # OPTIMIZATION: Use BFS with limited depth + sampling instead of exhaustive DFS
        chains = []
        max_depth = 5
        max_chains = 500  # Limit total chains to prevent exponential explosion
        
        # Sample starting nodes (don't check all nodes on large graphs)
        sample_size = min(len(G.nodes()), 100)
        import random
        start_nodes = random.sample(list(G.nodes()), min(sample_size, len(G.nodes())))
        
        for start_node in start_nodes:
            if len(chains) >= max_chains:
                break
            
            # BFS instead of DFS - more efficient
            queue = [(start_node, [start_node])]
            visited_in_search = {start_node}
            
            while queue and len(chains) < max_chains:
                current, path = queue.pop(0)
                
                if len(path) >= 4:  # Min 4 nodes = 3 hops
                    if any(node in shell_candidates for node in path[1:-1]):
                        chains.append({
                            "path": path,
                            "chain_length": len(path) - 1,
                            "shell_count": sum(1 for n in path[1:-1] if n in shell_candidates)
                        })
                        continue  # Don't extend chains that already qualify
                
                # Only extend if we haven't reached max depth
                if len(path) < max_depth:
                    for next_node in list(G.successors(current))[:5]:  # Limit branching factor
                        if next_node not in visited_in_search:
                            visited_in_search.add(next_node)
                            queue.append((next_node, path + [next_node]))
        
        return chains

    def check_redistribution_speed(self, account_id: str) -> Tuple[float, str]:
        """
        RIFT Spec: Check how quickly money leaves after arriving
        Returns: (multiplier, evidence_type)
        Methods: Fast (<24h), Delayed (24-96h), Normal (>96h)
        """
        in_tx = self.df_sorted[self.df_sorted['receiver_id'] == account_id]
        out_tx = self.df_sorted[self.df_sorted['sender_id'] == account_id]
        
        if in_tx.empty or out_tx.empty:
            return 1.0, "no_pass_through"
        
        # Get first incoming and first outgoing
        first_in = in_tx.iloc[0]['timestamp']
        first_out = out_tx.iloc[0]['timestamp']
        
        # Only flag if outgoing is AFTER incoming
        if first_out <= first_in:
            return 1.0, "no_suspicious_delay"
        
        time_to_out = first_out - first_in
        
        if timedelta(0) < time_to_out <= timedelta(hours=24):
            return RiskWeights.FAST_PASS_THROUGH, "fast_redistribution_<24h"
        elif timedelta(hours=24) < time_to_out <= timedelta(hours=96):
            return RiskWeights.DELAYED_PASS_THROUGH, "delayed_redistribution_24-96h"
        
        return 1.0, "normal_timing"

    def get_account_type(self, account_id: str) -> str:
        """
        RIFT 2026 HACKATHON - False Positive Control
        Classifies accounts to prevent flagging legitimate merchants and payroll accounts
        
        MERCHANT CRITERIA:
        - High incoming volume (30+ transactions) from diverse sources (15+ unique senders)
        - Low outgoing (<=5 unique recipients) = receiving payments, not redistributing
        - Consistent transaction pattern (merchant velocity check)
        
        PAYROLL CRITERIA:
        - High outgoing volume (20+ transactions) to many unique recipients (12+ unique)
        - Consistent, predictable timing (low variance in transaction times)
        - Regular periodicity (payments on specific intervals)
        
        Returns: 'merchant' | 'payroll' | 'shell' | 'standard'
        """
        in_degree = len(self.df[self.df['receiver_id'] == account_id])
        out_degree = len(self.df[self.df['sender_id'] == account_id])
        unique_in = self.df[self.df['receiver_id'] == account_id]['sender_id'].nunique()
        unique_out = self.df[self.df['sender_id'] == account_id]['receiver_id'].nunique()
        
        # ===== TYPE 1: MERCHANT ACCOUNT =====
        # High IN (30+), diverse senders (15+), but low OUT (<= 5 recipients)
        if in_degree >= 30 and unique_in >= 15 and unique_out <= 5:
            if self._is_merchant_velocity(account_id, "receiver"):
                return "merchant"
        
        # Also flag as merchant if has significant incoming volume even without outgoing
        if in_degree >= 25 and unique_in >= 12:
            if self._has_diverse_sources(account_id):
                return "merchant"
        
        # ===== TYPE 2: PAYROLL DISTRIBUTOR =====
        # High OUT (20+), diverse recipients (12+), regular timing pattern
        if out_degree >= 20 and unique_out >= 12:
            if self._is_payroll_pattern(account_id):
                return "payroll"
        
        # Alternative payroll: High OUT even if recipients are fewer, but pattern is regular
        if out_degree >= 15 and unique_out >= 8:
            if self._is_payroll_pattern(account_id) and self._has_consistent_amounts(account_id):
                return "payroll"
        
        # ===== TYPE 3: SHELL ACCOUNT =====
        # Very low activity (2-3 total transactions) = suspicious pass-through
        if (in_degree + out_degree) <= RiskWeights.MAX_SHELL_TX:
            return "shell"
        
        return "standard"
    
    def _is_merchant_velocity(self, account_id: str, role: str) -> bool:
        """Check merchant velocity: consistent non-suspicious transaction spacing"""
        if role == "receiver":
            txs = self.df[self.df['receiver_id'] == account_id].sort_values('timestamp')
        else:
            txs = self.df[self.df['sender_id'] == account_id].sort_values('timestamp')
        
        if len(txs) < 5:
            return False
        
        timestamps = txs['timestamp'].values
        intervals = []
        for i in range(1, len(timestamps)):
            # Convert numpy timedelta64 to seconds
            td = pd.Timedelta(timestamps[i] - timestamps[i-1]).total_seconds()
            interval = td / 3600
            intervals.append(interval)
        
        if len(intervals) >= 4:
            avg_interval = sum(intervals) / len(intervals)
            variance = sum((x - avg_interval) ** 2 for x in intervals) / len(intervals)
            std_dev = variance ** 0.5
            
            if avg_interval > 0:
                cov = std_dev / avg_interval
                return cov < 1.5
        
        return True
    
    def _is_payroll_pattern(self, account_id: str) -> bool:
        """Detect payroll patterns: regular periodic transfers to employees"""
        txs = self.df[self.df['sender_id'] == account_id].sort_values('timestamp')
        
        if len(txs) < 8:
            return False
        
        timestamps = txs['timestamp'].values
        intervals = []
        for i in range(1, len(timestamps)):
            # Convert numpy timedelta64 to seconds
            td = pd.Timedelta(timestamps[i] - timestamps[i-1]).total_seconds()
            interval = td / 3600
            intervals.append(interval)
        
        if len(intervals) >= 3:
            common_intervals = [24, 48, 72, 168]
            
            for target in common_intervals:
                matching = sum(1 for i in intervals if abs(i - target) < target * 0.3)
                if matching >= len(intervals) * 0.6:
                    return True
            
            avg_interval = sum(intervals) / len(intervals)
            variance = sum((x - avg_interval) ** 2 for x in intervals) / len(intervals)
            std_dev = variance ** 0.5
            
            if avg_interval > 0:
                cov = std_dev / avg_interval
                return cov < 1.2
        
        return False
    
    def _has_diverse_sources(self, account_id: str) -> bool:
        """Check if merchants receive from diverse sources"""
        incoming = self.df[self.df['receiver_id'] == account_id]
        unique_sources = incoming['sender_id'].nunique()
        total_txs = len(incoming)
        
        if total_txs > 0:
            concentration = unique_sources / total_txs
            return concentration > 0.4
        
        return False
    
    def _has_consistent_amounts(self, account_id: str) -> bool:
        """Check if payroll accounts transfer consistent amounts"""
        txs = self.df[self.df['sender_id'] == account_id]
        
        if len(txs) < 5:
            return False
        
        amounts = txs['amount'].values
        avg_amount = sum(amounts) / len(amounts)
        
        variance = sum((x - avg_amount) ** 2 for x in amounts) / len(amounts)
        std_dev = variance ** 0.5
        
        if avg_amount > 0:
            cov = std_dev / avg_amount
            return cov < 0.5
        
        return False