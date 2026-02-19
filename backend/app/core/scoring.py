"""
RIFT 2026 Hackathon - Money Muling Detection Scoring Methodology
Suspicion Score: 0-100 (sorted descending in output)

ALGORITHM:
1. PATTERN DETECTION:
   - Cycle Detection (Graph DFS): Account in cycle of length 3-5
   - Smurfing Detection: 10+ senders/receivers in 72-hour window
   - Shell Networks: Chain of 3+ hops through low-activity accounts

2. EVIDENCE SCORING:
   Base scores for each pattern (0-100 scale):
   - Cycle Involvement: 85 (High - circular routing is rarely accidental)
   - Smurfing + Fast Redistribution: 75 (High - clear mule indicator)
   - Smurfing (spread over time): 45 (Medium - possibly merchant)
   - Shell Account in Chain: 60 (Medium-High - pass-through behavior)

3. TEMPORAL MULTIPLIERS:
   - <24h redistribution: ×1.3 (suspicious speed)
   - 24-96h redistribution: ×1.1 (still mule-like)
   - >96h: ×1.0 (normal timing)

4. FALSE POSITIVE CONTROL:
   ✅ Merchant Accounts (30+ in from diverse sources):
      - Must receive from 15+ unique senders (diverse customer base)
      - LOW outgoing (<5 recipients) = no redistribution
      - Capped at 35 points (cannot be flagged as fraud)
   
   ✅ Payroll Distributors (20+ out to diverse recipients):
      - Must go to 12+ unique recipients (employee base)
      - Regular, consistent timing patterns
      - Consistent transaction amounts
      - Capped at 30 points (cannot be flagged as fraud)
   
   ✅ High-Volume Legitimate Business:
      - Only flag if score exceeds 75 AND pattern is confirmed
      - Require multiple fraud indicators

5. FINAL CALCULATION:
   final_score = max(base_scores) + 0.2×(sum other scores) × temporal_multiplier
   capped at 100, but with false positive filtering applied
"""

from enum import Enum

class RiskWeights:
    # === PATTERN BASE SCORES (0-100 scale) ===
    CYCLE_INVOLVEMENT = 85.0        # Circular routing - strongest indicator
    SMURFING_FAST_REDI = 75.0       # Fan-in + <24h redistribution
    SMURFING_DELAYED_REDI = 55.0    # Fan-in + 24-96h redistribution
    SMURFING_SLOW_REDI = 40.0       # Fan-in but >96h (possibly merchant)
    SHELL_ACCOUNT = 60.0            # Pass-through with 2-3 transactions
    
    # === TEMPORAL MULTIPLIERS ===
    FAST_PASS_THROUGH = 1.3         # < 24 hours redistribution
    DELAYED_PASS_THROUGH = 1.1      # 24-96 hours is mule-like
    
    # === THRESHOLDS ===
    FAN_THRESHOLD = 10              # 10+ senders/receivers = fan pattern
    WINDOW_HOURS = 72               # 72-hour window for smurfing
    MAX_SHELL_TX = 3                # Max transactions to be "shell account"
    MERCHANT_VOLUME_THRESHOLD = 30  # High-volume merchant threshold
    MERCHANT_DIVERSITY_THRESHOLD = 15  # 15+ unique sources = diverse merchant
    PAYROLL_VOLUME_THRESHOLD = 20   # 20+ outgoing = payroll distributor
    PAYROLL_DIVERSITY_THRESHOLD = 12   # 12+ unique recipients = many employees
    
    # === SCORE BOUNDS ===
    MIN_SCORE = 0.0
    MAX_SCORE = 100.0
    MERCHANT_MAX_SCORE = 35.0       # Cap for legitimate merchants
    PAYROLL_MAX_SCORE = 30.0        # Cap for legitimate payroll accounts
    LEGITIMATE_BUSINESS_THRESHOLD = 75.0  # Must exceed this to flag legitimate business

class AccountType(Enum):
    SUSPICIOUS = "suspicious"       # Confirmed fraud ring
    MULE = "mule"                   # Pass-through account
    MERCHANT = "merchant"           # Legitimate high-volume business
    PAYROLL = "payroll"             # Legitimate distributor
    LEGIT_USER = "legit_user"       # Normal account
    SHELL = "shell"                 # Temporary pass-through

def calculate_final_score(
    base_scores: list, 
    multipliers: list, 
    account_type: str = "standard"
) -> float:
    """
    RIFT 2026 HACKATHON SCORING METHODOLOGY with ENHANCED FALSE POSITIVE CONTROL
    
    Args:
        base_scores: List of pattern detection scores
        multipliers: Temporal/behavioral multipliers
        account_type: 'merchant', 'payroll', 'shell', 'standard'
    
    Returns:
        float: Suspicion score 0-100 (higher = more suspicious)
    """
    if not base_scores:
        return 0.0
    
    # STEP 1: Foundation score (highest pattern match)
    primary_score = max(base_scores)
    
    # STEP 2: Add supporting evidence (20% weight for secondary patterns)
    supporting_signals = (sum(base_scores) - primary_score) * 0.2
    combined_score = primary_score + supporting_signals
    
    # STEP 3: Apply temporal multipliers
    temporal_multiplier = 1.0
    for m in multipliers:
        temporal_multiplier *= m
    
    final_score = combined_score * temporal_multiplier
    
    # STEP 4: FALSE POSITIVE CONTROL - RIFT COMPLIANCE
    # ===== MERCHANT PROTECTION =====
    if account_type == "merchant":
        # Merchants can show high-volume patterns but should NOT be flagged
        # Cap strictly at 35 to prevent false positives
        final_score = min(final_score, RiskWeights.MERCHANT_MAX_SCORE)
    
    # ===== PAYROLL PROTECTION =====
    elif account_type == "payroll":
        # Payroll accounts have legitimate reasons for fan-out patterns
        # Cap at 30 to prevent false positives
        final_score = min(final_score, RiskWeights.PAYROLL_MAX_SCORE)
    
    # ===== SHELL ACCOUNT (suspicious by nature) =====
    elif account_type == "shell":
        # Shell accounts pass money through quickly = legitimate fraud indicator
        # Don't suppress these - they're likely real mules
        pass
    
    # STEP 5: Normalize to 0-100 range
    final_score = min(RiskWeights.MAX_SCORE, max(RiskWeights.MIN_SCORE, round(final_score, 2)))
    
    return final_score

# Keywords to help identify merchants (for false positive control)
MERCHANT_KEYWORDS = [
    "SHOP", "STORE", "RETAIL", "AMZN", "PAYPAL", "STRIPE", 
    "TAX", "UTIL", "UTILITY", "BILLS", "MERCHANT", "BUSINESS", "VENDOR"
]