#!/usr/bin/env python3
"""
RIFT 2026 Performance Scaling Test
Tests processing speed with different dataset sizes
"""

import requests
import time
import csv
import random
import os
from datetime import datetime, timedelta

API_URL = "http://localhost:8000"
DATA_DIR = "data"

def generate_test_csv(num_transactions, filename):
    """Generate test CSV with specified number of transactions"""
    print(f"  Generating {num_transactions} transactions...", end=" ", flush=True)
    
    merchants = [f"MERCHANT_{i:04d}" for i in range(20)]
    payroll = [f"PAYROLL_{i:04d}" for i in range(10)]
    mule = [f"MULE_{i:04d}" for i in range(50)]
    normal = [f"ACC_{i:06d}" for i in range(200)]
    
    all_accounts = merchants + payroll + mule + normal
    
    start_date = datetime(2024, 2, 1, 0, 0, 0)
    
    with open(filename, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp'])
        writer.writeheader()
        
        current_date = start_date
        for i in range(num_transactions):
            writer.writerow({
                'transaction_id': f'TXN{i:08d}',
                'sender_id': random.choice(all_accounts),
                'receiver_id': random.choice(all_accounts),
                'amount': round(random.uniform(10, 5000), 2),
                'timestamp': current_date.strftime('%Y-%m-%d %H:%M:%S')
            })
            current_date += timedelta(minutes=random.randint(5, 15))
    
    file_size_kb = os.path.getsize(filename) / 1024
    print(f"OK ({file_size_kb:.1f} KB)")
    return filename

def test_dataset(num_transactions):
    """Test processing time for a specific dataset size"""
    test_file = os.path.join(DATA_DIR, f'test_{num_transactions}_tx.csv')
    
    # Generate test file
    generate_test_csv(num_transactions, test_file)
    
    # Upload and measure time
    print(f"  Testing {num_transactions} transactions...", end=" ", flush=True)
    start_time = time.time()
    
    try:
        with open(test_file, 'rb') as f:
            files = {'file': f}
            response = requests.post(
                f"{API_URL}/analyze",
                files=files,
                timeout=60
            )
        
        total_time = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            backend_time = result.get('summary', {}).get('processing_time_seconds', 0)
            print(f"OK - Total: {total_time:.3f}s, Backend: {backend_time:.3f}s")
            return total_time, backend_time
        else:
            print(f"ERROR {response.status_code}")
            return None, None
    
    except Exception as e:
        print(f"ERROR: {e}")
        return None, None
    finally:
        # Cleanup test file
        if os.path.exists(test_file):
            os.remove(test_file)

def main():
    print("\n" + "="*70)
    print("[PERFORMANCE] RIFT 2026 SCALING TEST")
    print("="*70)
    print(f"API: {API_URL}")
    print(f"Testing multiple dataset sizes...\n")
    
    # Test different dataset sizes
    test_sizes = [50, 100, 500, 1000, 2000, 5000, 10000]
    
    results = []
    print("[Dataset] Processing Time Results:")
    print("-" * 70)
    print(f"{'Transactions':<15} {'Total Time':<15} {'Backend Time':<15} {'Per TX (ms)':<15}")
    print("-" * 70)
    
    for size in test_sizes:
        total_time, backend_time = test_dataset(size)
        
        if total_time is not None:
            per_tx = (total_time * 1000) / size
            results.append({
                'size': size,
                'total_time': total_time,
                'backend_time': backend_time,
                'per_tx': per_tx
            })
            print(f"{size:<15} {total_time:<15.3f}s {backend_time:<15.3f}s {per_tx:<15.3f}ms")
    
    # Summary
    print("\n" + "="*70)
    print("[SUMMARY] Performance Analysis")
    print("="*70)
    
    if results:
        avg_per_tx = sum(r['per_tx'] for r in results) / len(results)
        max_time = max(r['total_time'] for r in results)
        
        print(f"\nTest Results:")
        print(f"  Datasets Tested:        {len(results)}")
        print(f"  Average per TX:         {avg_per_tx:.3f}ms")
        print(f"  Max Processing Time:    {max_time:.3f}s")
        print(f"  Slowest Dataset:        {max([r for r in results if r['total_time'] == max_time], {}).get('size')} transactions")
        
        # Check 30s requirement
        if max_time <= 30:
            print(f"  30s Requirement:        PASS [OK] (margin: {30 - max_time:.1f}s)")
        else:
            print(f"  30s Requirement:        FAIL (over by {max_time - 30:.1f}s)")
    
    print("\n" + "="*70)

if __name__ == "__main__":
    main()
