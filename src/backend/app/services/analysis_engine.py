import time
import pandas as pd
import numpy as np
from typing import List, Dict, Set
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor, as_completed
from app.services.graph_service import GraphService
from app.services.pattern_service import PatternService
from app.core.scoring import RiskWeights, calculate_final_score
from app.models.schemas import (
    AnalysisResponse, 
    SuspiciousAccount, 
    FraudRing, 
    AnalysisSummary
)

# ML Anomaly Detection (Complementary to rule-based detection)
try:
    from app.ml.ml_service import MLAnomalyDetector
    ML_AVAILABLE = True
except Exception as e:
    print(f"  ML module not available: {e}")
    ML_AVAILABLE = False

class AnalysisEngine:
    """
    Financial Forensics Engine (OPTIMIZED VERSION)
    Merges Graph Theory + Temporal Pattern Analysis for Money Muling Detection
    
    PERFORMANCE ENHANCEMENTS:
    - Parallel pattern detection
    - Cached account scoring
    - Optimized data structures
    - Smart batching for large datasets
    
    Three Detection Patterns:
    1. Circular Fund Routing (Cycles 3-5 length)
    2. Smurfing Patterns (Fan-in/out with <72h window)
    3. Layered Shell Networks (3+ hop chains)
    """
    
    # Class-level cache for repeated analyses
    _cache = {}
    _cache_size_limit = 10  # Keep last 10 analyses
    _max_rings_output = 75  # Keep ring output concise for UI/performance

    def __init__(self, df: pd.DataFrame):
        self.df = df
        self.graph_service = GraphService(df)
        self.pattern_service = PatternService(df)
        self.start_time = time.time()
        
        # Generate data fingerprint for caching
        self.data_fingerprint = self._generate_fingerprint(df)
    
    def _generate_fingerprint(self, df: pd.DataFrame) -> str:
        """Generate unique fingerprint for dataset caching"""
        try:
            # Use hash of sorted unique transaction IDs + row count
            tx_ids = sorted(df['transaction_id'].unique())[:10]  # Sample first 10
            fingerprint = f"{len(df)}_{hash(tuple(tx_ids))}"
            return fingerprint
        except:
            return f"{len(df)}_{hash(tuple(df.columns))}"
    
    def _check_cache(self, operation: str):
        """Check if operation result is cached"""
        cache_key = f"{self.data_fingerprint}_{operation}"
        return self._cache.get(cache_key)
    
    def _save_to_cache(self, operation: str, result):
        """Save operation result to cache"""
        cache_key = f"{self.data_fingerprint}_{operation}"
        self._cache[cache_key] = result
        
        # Limit cache size
        if len(self._cache) > self._cache_size_limit:
            # Remove oldest entry
            oldest_key = list(self._cache.keys())[0]
            del self._cache[oldest_key]
    
    def _detect_cycles_cached(self):
        """Detect cycles with caching"""
        cached = self._check_cache('cycles')
        if cached is not None:
            print(" Using cached cycles")
            return cached
        result = self.graph_service.detect_cycles()
        self._save_to_cache('cycles', result)
        return result
    
    def _detect_smurfing_cached(self):
        """Detect smurfing with caching"""
        cached = self._check_cache('smurfing')
        if cached is not None:
            print(" Using cached smurfing patterns")
            return cached
        result = self.pattern_service.detect_smurfing()
        self._save_to_cache('smurfing', result)
        return result
    
    def _detect_shells_cached(self):
        """Detect shell networks with caching"""
        cached = self._check_cache('shells')
        if cached is not None:
            print(" Using cached shell networks")
            return cached
        result = self.pattern_service.detect_shell_networks()
        self._save_to_cache('shells', result)
        return result
    
    def _score_accounts_optimized(self, cycles, smurfing, shell_chains) -> Dict:
        """Optimized account scoring with vectorized operations"""
        account_data = {}
        all_accounts = set(self.df['sender_id']) | set(self.df['receiver_id'])
        
        # Pre-build lookup dictionaries for O(1) access
        cycle_membership = {}
        for cycle in cycles:
            cycle_len = len(cycle)
            for acc in cycle:
                if acc not in cycle_membership:
                    cycle_membership[acc] = []
                cycle_membership[acc].append(cycle_len)
        
        fan_in_lookup = {item["account_id"]: item for item in smurfing.get("fan_in", [])}
        fan_out_lookup = {item["account_id"]: item for item in smurfing.get("fan_out", [])}
        
        shell_membership = {}
        for chain in shell_chains:
            path = chain["path"]
            for idx, acc in enumerate(path):
                if acc not in shell_membership:
                    shell_membership[acc] = []
                is_intermediary = idx > 0 and idx < len(path) - 1
                shell_membership[acc].append((chain['chain_length'], is_intermediary))
        
        # Batch process accounts
        for acc_id in all_accounts:
            base_scores = []
            multipliers = []
            patterns = []
            account_type = self.pattern_service.get_account_type(acc_id)
            
            # Pattern A: Cycles (O(1) lookup)
            if acc_id in cycle_membership:
                cycle_length = cycle_membership[acc_id][0]
                base_scores.append(RiskWeights.CYCLE_INVOLVEMENT)
                patterns.append(f"cycle_length_{cycle_length}")
            
            # Pattern B: Smurfing (O(1) lookup)
            fan_in_info = fan_in_lookup.get(acc_id)
            fan_out_info = fan_out_lookup.get(acc_id)
            
            if fan_in_info or fan_out_info:
                velocity_mult, evidence = self.pattern_service.check_redistribution_speed(acc_id)
                
                if velocity_mult > 1.0:
                    if velocity_mult >= RiskWeights.FAST_PASS_THROUGH:
                        base_scores.append(RiskWeights.SMURFING_FAST_REDI)
                        patterns.append("fast_redistribution_smurfing")
                    else:
                        base_scores.append(RiskWeights.SMURFING_DELAYED_REDI)
                        patterns.append("delayed_redistribution_smurfing")
                    multipliers.append(velocity_mult)
                else:
                    base_scores.append(RiskWeights.SMURFING_SLOW_REDI)
                    patterns.append("high_volume_account")
            
            # Pattern C: Shell Networks (O(1) lookup)
            if acc_id in shell_membership:
                for chain_len, is_intermediary in shell_membership[acc_id]:
                    patterns.append(f"shell_chain_{chain_len}_hops")
                    if is_intermediary:
                        base_scores.append(RiskWeights.SHELL_ACCOUNT)
            
            # Calculate final score
            final_score = calculate_final_score(base_scores, multipliers, account_type)
            
            # False positive filtering
            if account_type in ["merchant", "payroll"]:
                if final_score <= 75:
                    continue
            
            # Only track significant scores
            if final_score > 20:
                account_data[acc_id] = {
                    "score": final_score,
                    "patterns": patterns,
                    "ring_id": None,
                    "account_type": account_type
                }
        
        return account_data

    def run_full_analysis(self) -> AnalysisResponse:
        """Execute full analysis with parallel pattern detection (OPTIMIZED)"""
        
        # === STEP 1: PARALLEL PATTERN DETECTION ===
        print(" [Pattern Detection] Running in parallel...")
        
        cycles = []
        smurfing = {}
        shell_chains = []
        
        # Use ThreadPoolExecutor for parallel execution
        with ThreadPoolExecutor(max_workers=3) as executor:
            future_cycles = executor.submit(self._detect_cycles_cached)
            future_smurfing = executor.submit(self._detect_smurfing_cached)
            future_shells = executor.submit(self._detect_shells_cached)
            
            # Collect results as they complete
            cycles = future_cycles.result()
            smurfing = future_smurfing.result()
            shell_chains = future_shells.result()
        
        print(f" Patterns detected: {len(cycles)} cycles, {len(smurfing.get('fan_in', []))} fan-in, {len(shell_chains)} shell chains")
        
        # === STEP 2: Account Scoring (Optimized) ===
        print(" [Scoring] Analyzing accounts...")
        account_data = self._score_accounts_optimized(cycles, smurfing, shell_chains)
        all_accounts = set(self.df['sender_id']) | set(self.df['receiver_id'])

        # === STEP 3: Form Fraud Rings ===
        fraud_rings = []
        ring_members_mapped = {}  # Track which accounts belong to which ring
        
        # Ring formation strategy:
        # 1. Cycles form primary rings
        # 2. Smurfing actors in same cycle form the same ring
        # 3. Shell chains form secondary rings
        
        ring_counter = 0
        
        # Primary rings from cycles
        seen_ring_memberships = set()
        for cycle in cycles:
            ring_counter += 1
            ring_id = f"RING_{str(ring_counter).zfill(3)}"
            
            # Calculate ring risk score (average of member scores)
            member_scores = [account_data[acc]["score"] for acc in cycle if acc in account_data]
            if not member_scores:
                continue

            membership_key = tuple(sorted(cycle))
            if membership_key in seen_ring_memberships:
                continue
            seen_ring_memberships.add(membership_key)

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
                if len(member_scores) < 2:
                    continue

                membership_key = tuple(sorted(chain_members))
                if membership_key in seen_ring_memberships:
                    continue
                seen_ring_memberships.add(membership_key)

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

        # Keep only top-risk rings to avoid noisy/high-volume outputs on large datasets
        if len(fraud_rings) > self._max_rings_output:
            fraud_rings = sorted(fraud_rings, key=lambda ring: ring.risk_score, reverse=True)[:self._max_rings_output]

        # ============================================================================
        # STEP 3: ML ANOMALY DETECTION (Complementary to rule-based detection)
        # ============================================================================
        print(" [ML] Running ensemble anomaly detection...")
        # - But if ONE transaction is $50,000 → ML: HIGH ANOMALY
        # - The merchant gets flagged by ML even though merchants are usually legit
        # - This helps catch unusual behavior within legitimate-looking accounts
        # ============================================================================
        
        ml_anomaly_scores = {}
        ml_active = False
        
        if ML_AVAILABLE:
            try:
                print(" [ML] Detecting behavioral anomalies...")
                detector = MLAnomalyDetector()
                ml_anomaly_scores = detector.detect_anomalies(self.df)
                ml_active = bool(ml_anomaly_scores)
                
                if ml_active:
                    avg_ml_score = np.mean(list(ml_anomaly_scores.values()))
                    print(f" Anomaly detection complete: {len(ml_anomaly_scores)} accounts")
                    print(f"   Avg anomaly score: {avg_ml_score:.1f}/100")
                else:
                    print("  ML anomaly detection returned no scores.")
            except Exception as e:
                print(f"  ML anomaly detection error: {e}. Using rule-based only.")
        
        # ============================================================================
        # STEP 5: HYBRID SCORING (Rule-Based + ML Anomaly Detection)
        # ============================================================================
        # Final Risk = 60% Rule-Based Score + 40% ML Anomaly Score
        # - ML catches edge cases (behavioral outliers)
        # - Weighting emphasizes rule-based but allows ML to boost scores
        # ============================================================================
        
        suspicious_list = []
        total_ml_anomalies = 0
        
        for uid, data in account_data.items():
            rule_score = data["score"]
            ml_score = ml_anomaly_scores.get(uid, 0.0)
            
            # HYBRID CALCULATION: 60% Rule + 40% ML
            combined_score = (0.6 * rule_score) + (0.4 * ml_score)
            combined_score = min(100, max(0, combined_score))  # Clamp to 0-100
            
            # Track high ML anomalies
            if ml_score > 70:
                total_ml_anomalies += 1
            
            # Determine final risk level based on combined score
            if combined_score >= 70:
                final_risk_level = "High"
            elif combined_score >= 45:
                final_risk_level = "Medium"
            else:
                final_risk_level = "Low"
            
            suspicious_list.append(SuspiciousAccount(
                account_id=uid,
                suspicion_score=round(rule_score, 2),  # Keep rule-based score visible
                detected_patterns=data["patterns"],
                ring_id=data["ring_id"],
                ai_risk_score=round(ml_score, 2),      # ML anomaly score
                anomaly_flag=1 if ml_score > 70 else 0, # Flagged if high anomaly
                final_risk_level=final_risk_level,
                combined_risk_score=round(combined_score, 2)  # Hybrid score
            ))
        
        # Sort by COMBINED SCORE (hybrid result), not just rule-based
        suspicious_list.sort(key=lambda x: x.combined_risk_score, reverse=True)

        processing_time = round(time.time() - self.start_time, 3)
        
        # Determine detection method
        if ml_active:
            detection_method = "hybrid"
        else:
            detection_method = "rule-based"
        
        summary = AnalysisSummary(
            total_accounts_analyzed=len(all_accounts),
            suspicious_accounts_flagged=len(suspicious_list),
            fraud_rings_detected=len(fraud_rings),
            processing_time_seconds=processing_time,
            ml_anomalies_detected=total_ml_anomalies,
            hybrid_system_active=ml_active,
            detection_method=detection_method
        )

        print("\n Analysis Complete:")
        print(f"   Accounts: {len(all_accounts)} | Suspicious: {len(suspicious_list)}")
        print(f"   Fraud Rings: {len(fraud_rings)} | ML Anomalies: {total_ml_anomalies}")
        print(f"   Method: {detection_method.upper()} | Time: {processing_time}s")

        return AnalysisResponse(
            suspicious_accounts=suspicious_list,
            fraud_rings=fraud_rings,
            summary=summary
        )