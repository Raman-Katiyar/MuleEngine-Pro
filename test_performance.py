#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RIFT 2026 Performance Testing Script
Tests: Processing time ≤ 30 seconds for 10K transactions
Usage: python test_performance.py <csv_file> [url]
"""

import requests
import time
import sys
import os
from datetime import datetime

# Fix Unicode encoding on Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

class PerformanceTestRunner:
    def __init__(self, api_url="http://localhost:8000"):
        self.api_url = api_url
        self.results = {}
    
    def test_api_connectivity(self):
        """Check if API is running"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=5)
            if response.status_code == 200:
                print("[OK] API is online and responding")
                return True
            else:
                print(f"[ERROR] API returned status {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            print(f"[ERROR] Cannot connect to API at {self.api_url}")
            print("[INFO] Ensure backend is running: python -m uvicorn app.main:app --reload")
            return False
        except Exception as e:
            print(f"[ERROR] Error connecting to API: {e}")
            return False
    
    def test_csv_file(self, csv_path):
        """Validate CSV file exists and is readable"""
        if not os.path.exists(csv_path):
            print(f"[ERROR] CSV file not found: {csv_path}")
            return False
        
        if not csv_path.endswith('.csv'):
            print(f"[ERROR] File is not a CSV: {csv_path}")
            return False
        
        file_size_mb = os.path.getsize(csv_path) / (1024 * 1024)
        print(f"[OK] CSV file valid ({file_size_mb:.2f} MB)")
        return True
    
    def run_analysis(self, csv_path):
        """Upload CSV and measure processing time"""
        print(f"\n[UPLOAD] Uploading {os.path.basename(csv_path)} for analysis...")
        
        try:
            with open(csv_path, 'rb') as f:
                files = {'file': f}
                
                # Measure total request time
                start_time = time.time()
                response = requests.post(
                    f"{self.api_url}/analyze",
                    files=files,
                    timeout=60  # 60 second timeout
                )
                total_time = time.time() - start_time
            
            if response.status_code != 200:
                print(f"[ERROR] API Error {response.status_code}: {response.text}")
                return None
            
            result = response.json()
            
            # Extract metrics
            processing_time = result.get('summary', {}).get('processing_time_seconds', 0)
            total_accounts = result.get('summary', {}).get('total_accounts_analyzed', 0)
            suspicious_accounts = result.get('summary', {}).get('suspicious_accounts_flagged', 0)
            fraud_rings = result.get('summary', {}).get('fraud_rings_detected', 0)
            graph_nodes = len(result.get('graph_data', {}).get('nodes', []))
            graph_edges = len(result.get('graph_data', {}).get('edges', []))
            
            self.results = {
                'total_time': total_time,
                'processing_time': processing_time,
                'total_accounts': total_accounts,
                'suspicious_accounts': suspicious_accounts,
                'fraud_rings': fraud_rings,
                'graph_nodes': graph_nodes,
                'graph_edges': graph_edges,
                'timestamp': datetime.now().isoformat()
            }
            
            return self.results
        
        except requests.exceptions.Timeout:
            print("[ERROR] Request timed out (>60s)")
            return None
        except Exception as e:
            print(f"[ERROR] Error during analysis: {e}")
            return None
    
    def print_results(self):
        """Print formatted test results"""
        if not self.results:
            print("[ERROR] No results to display")
            return
        
        print("\n" + "="*70)
        print("[RESULTS] PERFORMANCE TEST RESULTS - RIFT 2026")
        print("="*70)
        
        # Timing Results
        print(f"\n[TIMING] TIMING METRICS:")
        print(f"   Total HTTP Request Time:      {self.results['total_time']:.3f}s")
        print(f"   Backend Processing Time:      {self.results['processing_time']:.3f}s")
        
        # Data Analysis Results
        print(f"\n[ANALYSIS] DATA ANALYSIS:")
        print(f"   Total Accounts Analyzed:      {self.results['total_accounts']}")
        print(f"   Suspicious Accounts Flagged:  {self.results['suspicious_accounts']}")
        print(f"   Fraud Rings Detected:         {self.results['fraud_rings']}")
        
        # Graph Results
        print(f"\n[GRAPH] GRAPH VISUALIZATION:")
        print(f"   Graph Nodes:                  {self.results['graph_nodes']}")
        print(f"   Graph Edges:                  {self.results['graph_edges']}")
        
        # Requirement Check
        print(f"\n[REQUIREMENT] REQUIREMENT VERIFICATION:")
        requirement_met = self.results['total_time'] <= 30.0
        requirement_text = "PASS [OK]" if requirement_met else "FAIL [ERROR]"
        processing_time = self.results['processing_time']
        
        print(f"   Requirement: Upload -> Results <= 30 seconds")
        print(f"   Actual Time: {self.results['total_time']:.3f}s")
        print(f"   Status: {requirement_text}")
        print(f"   Margin: {30.0 - self.results['total_time']:.2f}s remaining")
        
        print("\n" + "="*70)
        
        # Performance Assessment
        if self.results['total_time'] < 5:
            print("[PERFORMANCE] EXCELLENT: Extremely fast processing!")
        elif self.results['total_time'] < 15:
            print("[PERFORMANCE] GOOD: Fast processing, well optimized")
        elif self.results['total_time'] < 30:
            print("[PERFORMANCE] ACCEPTABLE: Meets requirement")
        else:
            print("[PERFORMANCE] WARNING: Exceeds 30-second requirement")
        
        print("="*70 + "\n")
        
        return requirement_met

def main():
    if len(sys.argv) < 2:
        print("RIFT 2026 Performance Testing Script")
        print("\nUsage: python test_performance.py <csv_file> [api_url]")
        print("\nExample:")
        print("  python test_performance.py data/test_10k_transactions.csv")
        print("  python test_performance.py data/RIFT_Demo_Data.csv http://localhost:8000")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    api_url = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8000"
    
    print("="*70)
    print("[START] RIFT 2026 PERFORMANCE TEST")
    print("="*70)
    print(f"API URL: {api_url}")
    print(f"CSV File: {csv_file}")
    print("="*70 + "\n")
    
    # Create test runner
    test = PerformanceTestRunner(api_url)
    
    # Run checks
    print("[1/4] Checking API connectivity...")
    if not test.test_api_connectivity():
        print("\n[ERROR] Cannot proceed without API. Start backend first:")
        print("   cd backend && python -m uvicorn app.main:app --reload")
        sys.exit(1)
    
    print("\n[2/4] Validating CSV file...")
    if not test.test_csv_file(csv_file):
        sys.exit(1)
    
    print("\n[3/4] Running performance analysis...")
    if not test.run_analysis(csv_file):
        sys.exit(1)
    
    # Display results
    print("\n[4/4] Analyzing results...")
    requirement_met = test.print_results()
    
    # Exit with appropriate code
    sys.exit(0 if requirement_met else 1)

if __name__ == "__main__":
    main()
