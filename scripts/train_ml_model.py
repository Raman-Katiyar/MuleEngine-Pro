#!/usr/bin/env python3
"""
ML Model Training Script
Run this script to train the Isolation Forest model on transaction data.

Usage:
    python train_ml_model.py
    python train_ml_model.py --data path/to/data.csv
    python train_ml_model.py --contamination 0.05
"""

import sys
import os
import argparse
import pandas as pd
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from app.utils.csv_processor import CSVProcessor
from app.ml.train_model import ModelTrainer


def find_csv_files(data_dir: Path):
    """Find all CSV files in data directory"""
    csv_files = list(data_dir.glob("*.csv"))
    return sorted(csv_files)


def load_and_combine_data(data_files):
    """Load and combine multiple CSV files"""
    dfs = []
    
    for file_path in data_files:
        print(f" Loading: {file_path.name}")
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            df = CSVProcessor.parse_csv(content)
            dfs.append(df)
            print(f"    {len(df)} transactions loaded")
        except Exception as e:
            print(f"    Error loading {file_path.name}: {e}")
    
    if not dfs:
        raise ValueError(" No valid CSV files found!")
    
    # Combine all data
    combined_df = pd.concat(dfs, ignore_index=True)
    print(f"\n Combined {len(dfs)} files: {len(combined_df)} total transactions")
    
    return combined_df


def main():
    parser = argparse.ArgumentParser(
        description="Train ML model for fraud detection"
    )
    parser.add_argument(
        '--data',
        type=str,
        help='Path to CSV file or directory with CSV files'
    )
    parser.add_argument(
        '--contamination',
        type=float,
        default=0.05,
        help='Expected proportion of anomalies (default: 0.05)'
    )
    
    args = parser.parse_args()
    
    # Determine data source
    if args.data:
        data_path = Path(args.data)
    else:
        # Use default data directory
        data_path = Path(__file__).parent / "data"
    
    if not data_path.exists():
        print(f" Data path not found: {data_path}")
        return False
    
    print(f" Training ML Model for Fraud Detection")
    print(f"=" * 60)
    
    # Load data
    if data_path.is_file():
        print(f" Loading single file: {data_path.name}")
        with open(data_path, 'rb') as f:
            content = f.read()
        df = CSVProcessor.parse_csv(content)
    else:
        print(f" Loading from directory: {data_path}")
        csv_files = find_csv_files(data_path)
        if not csv_files:
            print(f" No CSV files found in {data_path}")
            return False
        print(f"   Found {len(csv_files)} CSV files")
        df = load_and_combine_data(csv_files)
    
    if df.empty:
        print(" No valid data to train on!")
        return False
    
    print(f"\n Dataset Statistics:")
    print(f"   Total transactions: {len(df)}")
    print(f"   Unique senders: {df['sender_id'].nunique()}")
    print(f"   Unique receivers: {df['receiver_id'].nunique()}")
    print(f"   Total unique accounts: {df['sender_id'].nunique() + df['receiver_id'].nunique()}")
    print(f"   Amount range: ${df['amount'].min():.2f} - ${df['amount'].max():.2f}")
    print(f"   Amount mean: ${df['amount'].mean():.2f}")
    
    print(f"\n Training Model...")
    print(f"   Contamination rate: {args.contamination * 100:.1f}%")
    
    try:
        # Train and save model
        model, scaler, feature_names = ModelTrainer.train_and_save(
            df, 
            contamination=args.contamination
        )
        
        print(f"\n MODEL TRAINING SUCCESSFUL!")
        print(f"   Model type: Isolation Forest")
        print(f"   Features: {len(feature_names)}")
        print(f"   Training accounts: {len(scaler.mean_)}")
        print(f"\n Files saved to: {ModelTrainer.MODEL_DIR}")
        print(f"   - fraud_model.pkl")
        print(f"   - feature_scaler.pkl")
        print(f"   - model_config.pkl")
        
        return True
    
    except Exception as e:
        print(f"\n Training failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
