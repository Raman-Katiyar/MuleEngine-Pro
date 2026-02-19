import time
import pandas as pd
from typing import List, Dict, Set
from app.services.graph_service import GraphService
from app.services.pattern_service import PatternService
from app.core.scoring import RiskWeights, calculate_final_score
from app.models.schemas import (
    AnalysisResponse, 
    SuspiciousAccount, 
    FraudRing, 
    AnalysisSummary
)

class AnalysisEngine:
    """
    RIFT 2026 HACKATHON - Financial Forensics Engine
    Merges Graph Theory + Temporal Pattern Analysis for Money Muling Detection
    
    Three Detection Patterns:
    1. Circular Fund Routing (Cycles 3-5 length)
    2. Smurfing Patterns (Fan-in/out with <72h window)
    3. Layered Shell Networks (3+ hop chains)
    """

    def __init__(self, df: pd.DataFrame):
        self.df = df
        self.graph_service = GraphService(df)
        self.pattern_service = PatternService(df)
        self.start_time = time.time()

    def run_full_analysis(self) -> AnalysisResponse:
        """Execute full analysis: detect patterns, score accounts, form rings"""
        
        # === STEP 1: Pattern Detection ===
        print("🔍 [1/4] Detecting circular fund routing...")
        cycles = self.graph_service.detect_cycles()
        
        print("🔍 [2/4] Detecting smurfing patterns (fan-in/out)...")
        smurfing = self.pattern_service.detect_smurfing()
        
        print("🔍 [3/4] Detecting layered shell networks...")
        shell_chains = self.pattern_service.detect_shell_networks()
        
        # === STEP 2: Account Scoring ===
        print("📊 [4/4] Scoring accounts and forming rings...")
        account_data = {}
        all_accounts = set(self.df['sender_id']) | set(self.df['receiver_id'])
        
        for acc_id in all_accounts:
            base_scores = []
            multipliers = []
            patterns = []
            account_type = self.pattern_service.get_account_type(acc_id)
            
            # ===== PATTERN A: CIRCULAR FUND ROUTING (Cycles) =====
            in_cycle = any(acc_id in cycle for cycle in cycles)
            if in_cycle:
                cycle_length = next(len(c) for c in cycles if acc_id in c)
                base_scores.append(RiskWeights.CYCLE_INVOLVEMENT)
                patterns.append(f"cycle_length_{cycle_length}")
            
            # ===== PATTERN B: SMURFING (Fan-In / Fan-Out) =====
            fan_in_info = None
            fan_out_info = None
            
            # Check Fan-In
            for item in smurfing.get("fan_in", []):
                if item["account_id"] == acc_id:
                    fan_in_info = item
                    break
            
            # Check Fan-Out
            for item in smurfing.get("fan_out", []):
                if item["account_id"] == acc_id:
                    fan_out_info = item
                    break
            
            # Score smurfing based on redistribution speed
            if fan_in_info or fan_out_info:
                velocity_mult, evidence = self.pattern_service.check_redistribution_speed(acc_id)
                
                # RIFT Spec: Only flag if combined with velocity
                if velocity_mult > 1.0:
                    if velocity_mult >= RiskWeights.FAST_PASS_THROUGH:
                        base_scores.append(RiskWeights.SMURFING_FAST_REDI)
                        patterns.append("fast_redistribution_smurfing")
                    else:
                        base_scores.append(RiskWeights.SMURFING_DELAYED_REDI)
                        patterns.append("delayed_redistribution_smurfing")
                    multipliers.append(velocity_mult)
                else:
                    # Spread over time - likely merchant
                    base_scores.append(RiskWeights.SMURFING_SLOW_REDI)
                    patterns.append("high_volume_account")
            
            # ===== PATTERN C: LAYERED SHELL NETWORKS =====
            in_shell_chain = False
            for chain in shell_chains:
                if acc_id in chain["path"]:
                    in_shell_chain = True
                    patterns.append(f"shell_chain_{chain['chain_length']}_hops")
                    if acc_id in chain["path"][1:-1]:  # Intermediary
                        base_scores.append(RiskWeights.SHELL_ACCOUNT)
            
            # ===== FINAL SCORE CALCULATION =====
            final_score = calculate_final_score(base_scores, multipliers, account_type)
            
            # ===== FALSE POSITIVE FILTERING =====
            # RIFT COMPLIANCE: Do NOT flag merchants or payroll accounts
            if account_type in ["merchant", "payroll"]:
                # These are legitimate high-volume accounts
                # Only flag if score exceeds very high threshold (>75)
                if final_score <= 75:
                    continue
            
            # RIFT Spec: Only track significant scores (>20 to catch real fraud)
            if final_score > 20:
                account_data[acc_id] = {
                    "score": final_score,
                    "patterns": patterns,
                    "ring_id": None,
                    "account_type": account_type
                }

        # === STEP 3: Form Fraud Rings ===
        fraud_rings = []
        ring_members_mapped = {}  # Track which accounts belong to which ring
        
        # Ring formation strategy:
        # 1. Cycles form primary rings
        # 2. Smurfing actors in same cycle form the same ring
        # 3. Shell chains form secondary rings
        
        ring_counter = 0
        
        # Primary rings from cycles
        for cycle in cycles:
            ring_counter += 1
            ring_id = f"RING_{str(ring_counter).zfill(3)}"
            
            # Calculate ring risk score (average of member scores)
            member_scores = [account_data[acc]["score"] for acc in cycle if acc in account_data]
            ring_risk_score = sum(member_scores) / len(member_scores) if member_scores else 0
            ring_risk_score = min(100, round(ring_risk_score, 2))
            
            # Assign all members to this ring
            for acc in cycle:
                if acc in account_data:
                    account_data[acc]["ring_id"] = ring_id
                ring_members_mapped[acc] = ring_id
            
            fraud_rings.append(FraudRing(
                ring_id=ring_id,
                member_accounts=cycle,
                pattern_type="circular_fund_routing",
                risk_score=ring_risk_score
            ))
        
        # Additional rings from shell chains (if not already in cycle ring)
        for chain_idx, chain in enumerate(shell_chains):
            # Check if chain members are already in a ring
            chain_members = chain["path"]
            if not any(member in ring_members_mapped for member in chain_members):
                ring_counter += 1
                ring_id = f"RING_{str(ring_counter).zfill(3)}"
                
                member_scores = [account_data[acc]["score"] for acc in chain_members if acc in account_data]
                ring_risk_score = sum(member_scores) / len(member_scores) if member_scores else 0
                ring_risk_score = min(100, round(ring_risk_score, 2))
                
                for acc in chain_members:
                    if acc in account_data:
                        account_data[acc]["ring_id"] = ring_id
                    ring_members_mapped[acc] = ring_id
                
                fraud_rings.append(FraudRing(
                    ring_id=ring_id,
                    member_accounts=chain_members,
                    pattern_type="layered_shell_network",
                    risk_score=ring_risk_score
                ))

        # === STEP 4: Format Output ===
        suspicious_list = [
            SuspiciousAccount(
                account_id=uid,
                suspicion_score=data["score"],
                detected_patterns=data["patterns"],
                ring_id=data["ring_id"]
            ) for uid, data in account_data.items()
        ]
        
        # RIFT Spec: MUST be sorted descending by suspicion_score
        suspicious_list.sort(key=lambda x: x.suspicion_score, reverse=True)

        processing_time = round(time.time() - self.start_time, 3)
        
        summary = AnalysisSummary(
            total_accounts_analyzed=len(all_accounts),
            suspicious_accounts_flagged=len(suspicious_list),
            fraud_rings_detected=len(fraud_rings),
            processing_time_seconds=processing_time
        )

        print(f"\n✅ Analysis Complete:")
        print(f"   Accounts: {len(all_accounts)} | Suspicious: {len(suspicious_list)}")
        print(f"   Fraud Rings: {len(fraud_rings)} | Time: {processing_time}s")

        return AnalysisResponse(
            suspicious_accounts=suspicious_list,
            fraud_rings=fraud_rings,
            summary=summary
        )