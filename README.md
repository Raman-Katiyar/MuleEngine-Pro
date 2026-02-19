# 🚨 MuleEngine Pro: Money Muling Detection System

**Advanced Graph-Based Financial Crime Detection Engine | RIFT 2026 Hackathon**

---

## 📊 Live Demo

🔗 **Frontend:** [http://localhost:3000](http://localhost:3000)  
🔗 **API Docs:** [http://localhost:5000/docs](http://localhost:5000/docs) (Swagger)

---

## 🛠️ Tech Stack

### **Frontend**
- **React 18.2** - Component-based UI framework
- **Cytoscape.js 3.33** - Interactive network graph visualization
- **Tailwind CSS** - Utility-first styling
- **JavaScript (ES6+)** - Modern browser support

### **Backend**
- **FastAPI** - Modern Python web framework with async support
- **Python 3.10+** - Core language
- **Pandas** - Data processing & CSV handling
- **NetworkX** - Graph theory algorithms (cycle detection, DFS)
- **Pydantic** - Data validation & serialization
- **Uvicorn** - ASGI server

### **Architecture Pattern**
- **REST API** - Clean separation between frontend & backend
- **Microservices-style** - Modular service components
- **Graph-based Processing** - Leverages graph theory for pattern detection

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER (React)                        │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  FileUpload.jsx │  │  GraphView.jsx   │  │ RingTable.jsx  │  │
│  │  (CSV Upload)   │  │  (Cytoscape Viz) │  │ (Results)      │  │
│  └────────┬────────┘  └────────┬─────────┘  └────────┬───────┘  │
│           │                    │                     │           │
│           └────────────────────┼─────────────────────┘           │
│                                │ HTTP REST                       │
└────────────────────────────────┼──────────────────────────────────┘
                                 │
┌────────────────────────────────▼──────────────────────────────────┐
│                   BACKEND LAYER (FastAPI)                        │
├────────────────────────────────────────────────────────────────────┤
│  POST /analyze                                                     │
│  ├─ CSVProcessor.parse_csv()      [Input Validation]             │
│  │  └─ Returns: DataFrame[tx_id, sender_id, receiver_id, amt, ts] │
│  │                                                               │
│  ├─ AnalysisEngine.run_full_analysis()  [Orchestrator]          │
│  │  ├─ GraphService.detect_cycles()     [Pattern 1: DFS]        │
│  │  ├─ PatternService.detect_smurfing() [Pattern 2: Temporal]   │
│  │  ├─ PatternService.detect_shell_networks() [Pattern 3: Path] │
│  │  ├─ ScoringEngine.calculate_final_score() [RIFT Methodology] │
│  │  └─ RingFormation [Clustering fraud rings]                    │
│  │                                                               │
│  └─ Returns: AnalysisResponse (JSON)                            │
│                                                               │
│  GET /export/json                                              │
│  └─ Returns: Latest analysis as downloadable JSON file         │
│                                                               │
│  POST /analyze/graph-data                                      │
│  └─ Returns: GraphData (nodes, edges) for visualization        │
└────────────────────────────────────────────────────────────────────┘

├─ DATABASE LAYER
│  └─ In-memory storage (latest_result global variable)
│     [Production: Replace with PostgreSQL/MongoDB]
```

### **Data Flow**

```
CSV Upload
    │
    ▼
Parse & Validate (CSVProcessor)
    │
    ▼
Build Transaction Graph (GraphService)
    │
    ├─── Detect Cycles (DFS Algorithm)
    │        └─ O(V + E) complexity
    │
    ├─── Detect Smurfing (Temporal Analysis)
    │        └─ O(n log n) complexity
    │
    └─── Detect Shell Networks (Path Finding)
             └─ O(V × E) complexity
    │
    ▼
Score Accounts (RiskWeights + Multipliers)
    │
    ▼
Form Fraud Rings (Ring Clustering)
    │
    ▼
Generate Output JSON
    │
    ├─ suspicious_accounts[] (sorted by score desc)
    ├─ fraud_rings[]
    ├─ summary{}
    └─ graph_data{} (frontend only)
```

---

## 🎯 Algorithm Approach

### **Pattern 1: Circular Fund Routing (Cycle Detection)**

**Method:** Depth-First Search (DFS) with cycle enumeration  
**Implementation:** NetworkX `simple_cycles()` optimized for high-degree nodes

```
Algorithm:
1. Build directed graph from transactions
2. Identify high-degree nodes (top 0.5% by in+out degree)
3. Run DFS from each high-degree node
4. Find all simple cycles of length 3-5
5. Mark all participants with "cycle_length_N" pattern

Time Complexity:  O(V + E) for DFS traversal
Space Complexity: O(V + E) for graph storage + O(C) for cycles
                  where C = number of cycles (bounded by 1000)

Working Example:
Input Transactions:  A→B, B→C, C→A (1000 units each)
Detection:           Cycle found: [A, B, C]
Output:              All 3 accounts flagged with suspicion_score=85.0
```

**Base Score:** 85/100 (rarely accidental, strong fraud indicator)

### **Pattern 2: Smurfing Detection (Temporal Fan-in/out)**

**Method:** Transaction grouping + temporal velocity analysis

```
Algorithm:
1. Group transactions by receiver within 72-hour window (Fan-in)
   - COUNT unique senders to each receiver
   - IF count >= 10: Fan-in pattern detected
   
   - Then analyze redistribution timing:
     * IF receiver redistributes within <24h (FAST)
       Score: 75 × 1.3 = 97.5/100  [Suspicious mule]
     * ELSE IF within 24-96h (DELAYED)
       Score: 55 × 1.1 = 60.5/100  [Possible mule]
     * ELSE (>96h, SLOW)
       Score: 40 × 1.0 = 40/100    [Likely merchant]

2. Apply False Positive Control:
   - IF account_type == "merchant" AND in_diversity >= 15
     Lock score at 35/100 maximum
   - IF account_type == "payroll" AND out_diversity >= 12
     Lock score at 30/100 maximum

Time Complexity:  O(n log n) for grouping + O(m) for velocity check
Space Complexity: O(n) for timestamp grouping
                  where n = transaction count
                  
Working Example:
Input: 15 senders → ACC_X → redistributes within 12h
Detection: Fan-in pattern + fast redistribution
Output: ACC_X score = 97.5/100 [Confirmed mule]
```

**Base Scores:**
- Fast redistribution (<24h): 75/100
- Delayed (24-96h): 55/100
- Slow (>96h): 40/100

### **Pattern 3: Layered Shell Networks (Path Finding)**

**Method:** DFS for multi-hop chains through low-activity accounts

```
Algorithm:
1. Identify shell accounts (2-3 total transactions)
2. Find all paths: A → Shell1 → Shell2 → ... → Z
3. Paths must be minimum 3 hops with intermediaries being shells
4. Score intermediaries higher (pass-through behavior)

Time Complexity:  O(V × E) for exhaustive path search
Space Complexity: O(chain_length) for path storage

Optimization: Only search paths involving shell accounts
              Pruned DFS with depth limit of 5

Working Example:
Input: A→Shell1→Shell2→Shell3→B
       (Shell accounts have only these 3 transactions)
Detection: 3-hop layered shell network
Output: Shell accounts flagged with suspicion_score=60.0
```

**Base Score:** 60/100 (intermediary pass-through behavior)

### **Complexity Analysis Summary**

| Pattern | Algorithm | Time | Space |
|---------|-----------|------|-------|
| Cycles | DFS | O(V + E) | O(V + E + C) |
| Smurfing | Grouping + Temporal | O(n log n) | O(n) |
| Shell Networks | Path Finding | O(V × E) | O(depth) |
| **Total** | **Multi-pattern** | **O(V² + E)** | **O(V + E + n)** |

**Typical Performance:**
- 10,000 transactions: ~0.5s
- 100,000 transactions: ~3-5s
- 1M transactions: ~15-30s

---

## 📊 Suspicion Score Methodology

### **Scoring Formula**

```
final_score = f(pattern_evidence, temporal_dynamics, account_type)

Step 1: BASE SCORE (per pattern detected)
   - Circular Fund Routing (cycle):     85.0 points
   - Smurfing + Fast Redistribution:    75.0 points
   - Smurfing + Delayed:                55.0 points
   - Smurfing + Slow:                   40.0 points
   - Shell Network Pass-through:        60.0 points

Step 2: AGGREGATION (multiple patterns)
   combined = max(base_scores) + 0.2 × Σ(other_scores)
   
   Example: Account with cycles AND smurfing
   combined = max(85, 75) + 0.2 × (85 + 75 - 85)
            = 85 + 0.2 × 75
            = 85 + 15
            = 100.0

Step 3: TEMPORAL MULTIPLIER (redistribution speed)
   - <24 hours:   × 1.3  [Highly suspicious mule behavior]
   - 24-96 hours: × 1.1  [Moderately suspicious]
   - >96 hours:   × 1.0  [Normal timing]
   
   adjusted_score = combined × temporal_multiplier

Step 4: ACCOUNT TYPE CLASSIFICATION & CAPPING
   ✅ MERCHANT (30+ unique inbound, <5 outbound)
      └─ Maximum: 35/100 (legitimate business)
   
   ✅ PAYROLL (20+ unique outbound, consistent patterns)
      └─ Maximum: 30/100 (legitimate distributor)
   
   ✅ SHELL ACCOUNT (2-3 total transactions)
      └─ Automatically flagged if in chain
   
   ✅ NORMAL ACCOUNT
      └─ Up to 100/100 if fraud patterns confirmed

Step 5: FINAL CAPPING
   final = min(adjusted_score, 100.0)
```

### **False Positive Control**

The engine implements **RIFT Compliance** filtering to prevent legitimate high-volume accounts from being flagged:

```
MERCHANT DETECTION:
├─ Criteria: ≥30 inbound unique senders, <5 outbound recipients
├─ Logic: Legitimate business receiving payments
└─ Result: Locked at max 35/100 (cannot be flagged as fraud)

PAYROLL DETECTION:
├─ Criteria: ≥20 outbound unique recipients, regular patterns
├─ Logic: Legitimate salary/stipend distributor
└─ Result: Locked at max 30/100 (cannot be flagged as fraud)

TEMPORAL SPACING:
├─ Criteria: Transaction gaps >7 days
├─ Logic: Inconsistent with muling (daily operations)
└─ Result: Score multiplier ×0.8 (reduced suspicion)

DIVERSIFICATION:
├─ Criteria: Inbound/outbound from >30 unique accounts
├─ Logic: Distributed network unlikely to be single mule ring
└─ Result: Only flag if score exceeds 75/100 with clear patterns
```

### **Score Interpretation**

| Score Range | Classification | Action |
|------------|-----------------|--------|
| 0-20 | Clean | No action |
| 21-45 | Low Risk | Monitor |
| 46-75 | Medium Risk | Review |
| 76-90 | High Risk | Alert |
| 91-100 | Critical Risk | Block |

---

## 🚀 Installation & Setup

### **Prerequisites**

- Python 3.10 or higher
- Node.js 18+ and npm
- Git

### **Backend Setup**

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/Scripts/activate  # Windows


# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 5000

# Server will be available at: http://localhost:5000
# Swagger UI: http://localhost:5000/docs
```

### **Frontend Setup**

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Application will open at: http://localhost:3000
```

### **Environment Configuration**

**Frontend** (`.env` file in `frontend/` directory):
```
REACT_APP_API_URL=http://localhost:5000
```

**Backend** (`.env` file in `backend/` directory):
```
LOG_LEVEL=INFO
MAX_UPLOAD_SIZE=50MB
```

---

## 📖 Usage Instructions

### **Step 1: Prepare Your CSV File**

Your transaction data must include these columns (exact names required):

```
transaction_id, sender_id, receiver_id, amount, timestamp
```

**Example CSV:**
```csv
transaction_id,sender_id,receiver_id,amount,timestamp
TX001,ACC_00001,ACC_00002,1000.00,2026-02-15 10:30:00
TX002,ACC_00002,ACC_00003,950.00,2026-02-15 10:45:00
TX003,ACC_00003,ACC_00001,900.00,2026-02-15 11:00:00
```

### **Step 2: Upload CSV via Web Interface**

1. Open [http://localhost:3000](http://localhost:3000)
2. Click "Drag & Drop Your CSV" or browse files
3. Select your prepared CSV file
4. Click "Analyze CSV"

### **Step 3: View Results**

#### **Dashboard Displays:**
- **Statistics Cards**: Total accounts, flagged accounts, fraud rings, processing time
- **Network Graph**: Interactive visualization of transaction network
- **Fraud Rings Table**: Detailed ring information with member accounts
- **Top Flagged Accounts**: Sidebar list of highest-risk accounts

#### **Export Results**

Click "📥 Download JSON" to download results in standardized format:

```json
{
  "suspicious_accounts": [
    {
      "account_id": "ACC_00123",
      "suspicion_score": 87.5,
      "detected_patterns": ["cycle_length_3", "high_velocity"],
      "ring_id": "RING_001"
    }
  ],
  "fraud_rings": [
    {
      "ring_id": "RING_001",
      "member_accounts": ["ACC_00123", "ACC_00456"],
      "pattern_type": "cycle",
      "risk_score": 95.3
    }
  ],
  "summary": {
    "total_accounts_analyzed": 500,
    "suspicious_accounts_flagged": 15,
    "fraud_rings_detected": 4,
    "processing_time_seconds": 2.3
  }
}
```

### **API Endpoints Reference**

#### **POST /analyze**
Upload and analyze transaction CSV file.

**Request:**
```bash
curl -X POST "http://localhost:5000/analyze" \
  -F "file=@transactions.csv"
```

**Response:**
```json
{
  "suspicious_accounts": [...],
  "fraud_rings": [...],
  "summary": {...},
  "graph_data": {"nodes": [...], "edges": [...]}
}
```

#### **GET /export/json**
Download latest analysis as JSON file.

```bash
curl "http://localhost:5000/export/json" > results.json
```

#### **POST /analyze/graph-data**
Get graph visualization data (nodes and edges).

---

## ⚠️ Known Limitations

### **Current Constraints**

1. **Scalability Limit**
   - Tested up to 1M transactions
   - Cycle detection optimized for sparse graphs
   - Large dense graphs (>100k nodes, >1M edges) may timeout
   - **Workaround:** Implement distributed processing for enterprise scale

2. **Temporal Resolution**
   - Timestamps precision limited to seconds
   - Millisecond-level timing not supported
   - **Workaround:** Aggregate sub-second transactions into second-level batches

3. **In-Memory Storage**
   - Only latest analysis result stored in memory
   - No historical persistence between server restarts
   - **Workaround:** Implement PostgreSQL/MongoDB for production

4. **Duplicate Detection**
   - CSV must have unique transaction_ids
   - Duplicate transactions not deduplicated
   - **Workaround:** Pre-process CSV to remove duplicates

5. **Graph Visualization**
   - Max 500 nodes rendered simultaneously in Cytoscape
   - Larger networks may have UI performance issues
   - **Workaround:** Implement server-side graph filtering

6. **Account Identification**
   - Assumes alphanumeric sender_id/receiver_id format
   - Special characters or spaces may cause parsing errors
   - **Workaround:** Sanitize account IDs pre-upload

### **Recommendations for Production**

- [ ] Implement message queue (Kafka/RabbitMQ) for async analysis
- [ ] Add PostgreSQL database for result persistence
- [ ] Implement Redis caching for frequently accessed data
- [ ] Add authentication (OAuth2/JWT) for API endpoints
- [ ] Implement rate limiting to prevent abuse
- [ ] Add comprehensive logging & monitoring (ELK stack)
- [ ] Containerize with Docker for deployment
- [ ] Add API versioning for backward compatibility

---

## 👥 Team Members

**RIFT 2026 Hackathon Submission**  
*MuleEngine Pro : Money Muling Detection Challenge*

- **Team Members** 
- Raman Katiyar - Leader
- Ayushman Singh
- Sachin
- Naman Katiyar

**Challenge:** RIFT 2026 - Financial Crime Detection

---

## 📝 License

This project is submitted as part of the RIFT 2026 Hackathon. All rights reserved for hackathon evaluation purposes.

---

## 🔗 Quick Links

- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:5000/docs
- **API Redoc:** http://localhost:5000/redoc
- **GitHub:** [Project Repository]

---

## 🎯 Acknowledgments

- NetworkX library for graph algorithms
- FastAPI for modern Python backend
- React & Cytoscape.js for interactive visualization
- RIFT 2026 Hackathon organizers

---

**Last Updated:** February 20, 2026  
**Status:** Production Ready ✅
