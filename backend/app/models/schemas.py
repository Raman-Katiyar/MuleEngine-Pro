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
    """
    account_id: str
    suspicion_score: float = Field(..., description="Score from 0-100, higher is riskier")
    detected_patterns: List[str]
    ring_id: Optional[str] = None

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
    """
    total_accounts_analyzed: int
    suspicious_accounts_flagged: int
    fraud_rings_detected: int
    processing_time_seconds: float

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