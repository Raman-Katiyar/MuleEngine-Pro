from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# --- INPUT SCHEMAS ---

class TransactionInput(BaseModel):
    """
    Represents a single row from the uploaded CSV.
    Matches the mandatory columns: transaction_id, sender_id, receiver_id, amount, timestamp.
    """
    transaction_id: str
    sender_id: str
    receiver_id: str
    amount: float
    timestamp: datetime

# --- OUTPUT SCHEMAS (STRICT AUTO-TEST COMPLIANCE) ---

class SuspiciousAccount(BaseModel):
    """
    Details for individual flagged accounts.
    Combines rule-based detection with ML/AI risk scoring.
    """
    account_id: str
    suspicion_score: float = Field(..., description="Rule-based score from 0-100")
    detected_patterns: List[str]
    ring_id: Optional[str] = None
    # AI/ML Fields
    ai_risk_score: float = Field(default=0.0, description="ML anomaly score 0-100")
    anomaly_flag: int = Field(default=0, description="ML anomaly flag 0 or 1")
    final_risk_level: str = Field(default="Low", description="Combined risk: Low/Medium/High")
    combined_risk_score: float = Field(default=0.0, description="Average of rule + ML scores")

class FraudRing(BaseModel):
    """
    Details for a group of accounts acting in coordination.
    """
    ring_id: str
    member_accounts: List[str]
    pattern_type: str
    risk_score: float

class AnalysisSummary(BaseModel):
    """
    High-level metrics for the processing run.
    Includes rule-based and ML/AI detection statistics.
    """
    total_accounts_analyzed: int
    suspicious_accounts_flagged: int
    fraud_rings_detected: int
    processing_time_seconds: float
    total_transactions: int = Field(default=0, description="Total number of transactions analyzed")
    # ML/AI Fields
    ml_anomalies_detected: int = Field(default=0, description="Accounts flagged by ML model")
    hybrid_system_active: bool = Field(default=False, description="Whether ML system is enabled")
    detection_method: str = Field(default="rule-based", description="rule-based, hybrid, or ml-only")

class AnalysisResponse(BaseModel):
    """
    The final JSON output format required by the project specifications.
    """
    suspicious_accounts: List[SuspiciousAccount]
    fraud_rings: List[FraudRing]
    summary: AnalysisSummary

# --- GRAPH UI SCHEMAS ---

class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # 'account' or 'merchant'
    risk_score: float

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    amount: float
    timestamp: str

class GraphData(BaseModel):
    """
    Used by Cytoscape.js to render the interactive network.
    """
    nodes: List[GraphNode]
    edges: List[GraphEdge]