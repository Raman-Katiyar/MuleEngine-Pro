#!/usr/bin/env python3
"""
Generate realistic test data for RIFT 2026 performance testing
Creates 10K transactions with various patterns (normal, suspicious, mule networks)
"""

import csv
import random
from datetime import datetime, timedelta
import uuid

# Configuration
NUM_TRANSACTIONS = 10000
OUTPUT_FILE = "data/test_10k_transactions.csv"

# Account types we'll generate
MERCHANTS = [f"MERCHANT_{i:04d}" for i in range(50)]  # 50 merchant accounts
PAYROLL = [f"PAYROLL_{i:04d}" for i in range(30)]     # 30 payroll accounts
MULE_NETWORK = [f"MULE_{i:04d}" for i in range(100)]  # 100 mule accounts
NORMAL_ACCOUNTS = [f"ACC_{i:06d}" for i in range(500)]  # 500 normal accounts

# Combine all account types
ALL_ACCOUNTS = MERCHANTS + PAYROLL + MULE_NETWORK + NORMAL_ACCOUNTS

# Start date for transactions
START_DATE = datetime(2024, 2, 1, 0, 0, 0)

def generate_amount():
    """Generate realistic transaction amount"""
    weights = [0.6, 0.25, 0.1, 0.05]  # Small, Medium, Large, Suspicious
    choice = random.choices([1, 2, 3, 4], weights=weights)[0]
    
    if choice == 1:
        return round(random.uniform(10, 100), 2)  # Small transfer
    elif choice == 2:
        return round(random.uniform(100, 500), 2)  # Medium transfer
    elif choice == 3:
        return round(random.uniform(500, 2000), 2)  # Large transfer
    else:
        return round(random.uniform(2000, 10000), 2)  # Suspicious amount

def generate_transaction_id(index):
    """Generate unique transaction ID"""
    return f"TXN{index:08d}"

def generate_normal_payment(index, current_date):
    """Generate normal merchant or payroll payment"""
    sender = random.choice(MERCHANTS + PAYROLL)
    receiver = random.choice(NORMAL_ACCOUNTS)
    amount = generate_amount()
    
    return {
        'transaction_id': generate_transaction_id(index),
        'sender_id': sender,
        'receiver_id': receiver,
        'amount': amount,
        'timestamp': current_date.strftime('%Y-%m-%d %H:%M:%S')
    }

def generate_mule_ring(index, current_date):
    """Generate suspicious money mule ring pattern (circular routing)"""
    ring_size = random.randint(3, 8)
    ring_accounts = random.sample(MULE_NETWORK, ring_size)
    
    # Create circular transfer within the ring
    sender = ring_accounts[0]
    receiver = ring_accounts[1]
    amount = round(random.uniform(500, 5000), 2)
    
    return {
        'transaction_id': generate_transaction_id(index),
        'sender_id': sender,
        'receiver_id': receiver,
        'amount': amount,
        'timestamp': current_date.strftime('%Y-%m-%d %H:%M:%S')
    }

def generate_smurfing(index, current_date, account=None):
    """Generate suspicious smurfing pattern (many small transactions from same account)"""
    if not account:
        account = random.choice(MULE_NETWORK)
    
    receiver = random.choice(NORMAL_ACCOUNTS)
    amount = round(random.uniform(900, 1100), 2)  # Just under $1000 to avoid detection
    
    return {
        'transaction_id': generate_transaction_id(index),
        'sender_id': account,
        'receiver_id': receiver,
        'amount': amount,
        'timestamp': current_date.strftime('%Y-%m-%d %H:%M:%S')
    }

def generate_layering(index, current_date):
    """Generate suspicious layering pattern (shell company transactions)"""
    sender = random.choice(MULE_NETWORK)
    receiver = random.choice(MULE_NETWORK)
    amount = round(random.uniform(1000, 8000), 2)
    
    return {
        'transaction_id': generate_transaction_id(index),
        'sender_id': sender,
        'receiver_id': receiver,
        'amount': amount,
        'timestamp': current_date.strftime('%Y-%m-%d %H:%M:%S')
    }

def main():
    print(f"🔄 Generating {NUM_TRANSACTIONS} realistic transactions...")
    print(f"📁 Output: {OUTPUT_FILE}")
    print(f"📊 Pattern distribution:")
    print(f"   - 70% Normal payments")
    print(f"   - 10% Circular routing (mule rings)")
    print(f"   - 10% Smurfing patterns")
    print(f"   - 10% Layering (shell networks)")
    print()
    
    transactions = []
    current_date = START_DATE
    smurf_accounts = {}  # Track smurfing accounts
    
    for i in range(NUM_TRANSACTIONS):
        rand = random.random()
        
        if rand < 0.70:  # 70% normal
            txn = generate_normal_payment(i, current_date)
        elif rand < 0.80:  # 10% mule rings
            txn = generate_mule_ring(i, current_date)
        elif rand < 0.90:  # 10% smurfing
            # Keep same mule account for multiple smurfing transactions
            if not smurf_accounts or random.random() < 0.3:
                smurf_account = random.choice(MULE_NETWORK)
                smurf_accounts[smurf_account] = True
            else:
                smurf_account = random.choice(list(smurf_accounts.keys()))
            
            txn = generate_smurfing(i, current_date, smurf_account)
        else:  # 10% layering
            txn = generate_layering(i, current_date)
        
        transactions.append(txn)
        
        # Increment time by 5-15 minutes for next transaction
        current_date += timedelta(minutes=random.randint(5, 15))
        
        # Progress indicator
        if (i + 1) % 1000 == 0:
            print(f"   ✓ Generated {i + 1}/{NUM_TRANSACTIONS} transactions")
    
    # Write to CSV
    print(f"\n📝 Writing to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp'])
        writer.writeheader()
        writer.writerows(transactions)
    
    # Verification
    file_size_mb = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)
    print(f"✅ Data generation complete!")
    print(f"📊 File: {OUTPUT_FILE} ({file_size_mb:.2f} MB)")
    print(f"📈 Total transactions: {len(transactions)}")
    print(f"\n🧪 Ready for performance testing!")
    print(f"   Run: python test_performance.py {OUTPUT_FILE}")

if __name__ == "__main__":
    import os
    main()
