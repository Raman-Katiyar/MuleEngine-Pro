"""
Feature Engineering Module
Extracts ML features from transaction data for fraud detection

Features extracted:
1. Transaction Amount Features: mean, std, min, max, total amounts
2. Frequency Features: transaction count, unique connections
3. Temporal Features: time gaps, velocity metrics
4. Pattern Features: fan-in/fan-out ratios, reciprocal transactions
5. Risk Indicators: amount changes, burst patterns
"""

import pandas as pd
import numpy as np
from typing import Tuple, Dict, List
from datetime import timedelta


class FeatureEngineer:
    """
    Extracts ML features from transaction dataframe.
    Works with accounts as observation units.
    """

    @staticmethod
    def engineer_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
        """
        Engineer features for each account (sender and receiver).
        
        Args:
            df: Transaction dataframe with columns [transaction_id, sender_id, receiver_id, amount, timestamp]
            
        Returns:
            features_df: DataFrame with rows=accounts, columns=features
            feature_names: List of engineered feature names
        """
        
        # Get all unique accounts
        all_accounts = set(df['sender_id'].unique()) | set(df['receiver_id'].unique())
        
        features_data = {}
        
        print(f" Extracting ML features for {len(all_accounts)} accounts...")
        
        for account_id in all_accounts:
            features = {}
            
            # === OUTGOING TRANSACTIONS (Sender Analysis) ===
            outgoing = df[df['sender_id'] == account_id].copy()
            if len(outgoing) > 0:
                features['out_count'] = len(outgoing)
                features['out_unique_recipients'] = outgoing['receiver_id'].nunique()
                features['out_amount_mean'] = outgoing['amount'].mean()
                features['out_amount_std'] = outgoing['amount'].std() if len(outgoing) > 1 else 0
                features['out_amount_total'] = outgoing['amount'].sum()
                features['out_amount_max'] = outgoing['amount'].max()
                features['out_amount_min'] = outgoing['amount'].min()
            else:
                features['out_count'] = 0
                features['out_unique_recipients'] = 0
                features['out_amount_mean'] = 0
                features['out_amount_std'] = 0
                features['out_amount_total'] = 0
                features['out_amount_max'] = 0
                features['out_amount_min'] = 0
            
            # === INCOMING TRANSACTIONS (Receiver Analysis) ===
            incoming = df[df['receiver_id'] == account_id].copy()
            if len(incoming) > 0:
                features['in_count'] = len(incoming)
                features['in_unique_senders'] = incoming['sender_id'].nunique()
                features['in_amount_mean'] = incoming['amount'].mean()
                features['in_amount_std'] = incoming['amount'].std() if len(incoming) > 1 else 0
                features['in_amount_total'] = incoming['amount'].sum()
                features['in_amount_max'] = incoming['amount'].max()
                features['in_amount_min'] = incoming['amount'].min()
            else:
                features['in_count'] = 0
                features['in_unique_senders'] = 0
                features['in_amount_mean'] = 0
                features['in_amount_std'] = 0
                features['in_amount_total'] = 0
                features['in_amount_max'] = 0
                features['in_amount_min'] = 0
            
            # === BALANCE & FLOW FEATURES ===
            total_received = features['in_amount_total']
            total_sent = features['out_amount_total']
            
            features['balance_flow'] = total_received - total_sent
            features['ratio_send_to_receive'] = total_sent / total_received if total_received > 0 else 0
            features['ratio_connections'] = (
                (features['out_unique_recipients'] + features['in_unique_senders']) / 
                (features['out_count'] + features['in_count']) 
                if (features['out_count'] + features['in_count']) > 0 else 0
            )
            
            # === TEMPORAL VELOCITY FEATURES ===
            all_transactions = pd.concat([
                outgoing[['timestamp']].assign(direction='out'),
                incoming[['timestamp']].assign(direction='in')
            ])
            
            if len(all_transactions) > 1:
                all_transactions = all_transactions.sort_values('timestamp')
                time_gaps = all_transactions['timestamp'].diff().dt.total_seconds() / 3600  # Convert to hours
                
                features['avg_time_gap_hours'] = time_gaps[1:].mean()
                features['max_time_gap_hours'] = time_gaps[1:].max()
                features['min_time_gap_hours'] = time_gaps[1:].min()
                features['transaction_rate_per_hour'] = (
                    (features['in_count'] + features['out_count']) / 
                    (time_gaps[1:].sum() if time_gaps[1:].sum() > 0 else 1)
                )
            else:
                features['avg_time_gap_hours'] = 0
                features['max_time_gap_hours'] = 0
                features['min_time_gap_hours'] = 0
                features['transaction_rate_per_hour'] = 0
            
            # === BURST DETECTION ===
            if len(all_transactions) > 0:
                # Time window: 24 hours
                features['transactions_in_24h'] = len(all_transactions)
                
                # Check for large transactions
                all_amounts = pd.concat([
                    outgoing[['amount']],
                    incoming[['amount']]
                ])
                features['has_large_transaction'] = 1 if (all_amounts['amount'] > all_amounts['amount'].quantile(0.95)).any() else 0
                features['amount_variance'] = all_amounts['amount'].var()
            else:
                features['transactions_in_24h'] = 0
                features['has_large_transaction'] = 0
                features['amount_variance'] = 0
            
            # === RECIPROCAL TRANSACTION DETECTION ===
            reciprocal_count = 0
            for idx, row in outgoing.iterrows():
                counterparty = row['receiver_id']
                reverse = incoming[incoming['sender_id'] == counterparty]
                if len(reverse) > 0:
                    reciprocal_count += len(reverse)
            
            features['reciprocal_transaction_count'] = reciprocal_count
            features['has_reciprocal_patterns'] = 1 if reciprocal_count > 0 else 0
            
            # === RISK AGGREGATION ===
            risk_indicators = 0
            if features['out_count'] > 10 and features['out_unique_recipients'] > 8:
                risk_indicators += 1  # High fan-out
            if features['in_count'] > 10 and features['in_unique_senders'] > 8:
                risk_indicators += 1  # High fan-in
            if features['transaction_rate_per_hour'] > 1:
                risk_indicators += 1  # Rapid transaction velocity
            if features['has_reciprocal_patterns'] == 1:
                risk_indicators += 1  # Reciprocal transactions
            if features['has_large_transaction'] == 1:
                risk_indicators += 1  # Large transaction outliers
            
            features['risk_indicator_count'] = risk_indicators
            
            features_data[account_id] = features
        
        # Convert to DataFrame
        features_df = pd.DataFrame.from_dict(features_data, orient='index')
        features_df.index.name = 'account_id'
        
        # Sort by account_id for consistency
        features_df = features_df.sort_index()
        
        # Fill any NaN values
        features_df = features_df.fillna(0)
        
        feature_names = list(features_df.columns)
        
        print(f" Extracted {len(feature_names)} features for {len(features_df)} accounts")
        print(f"   Features: {feature_names}")
        
        return features_df, feature_names

    @staticmethod
    def extract_account_features(account_id: str, df: pd.DataFrame) -> Dict[str, float]:
        """
        Extract features for a single account during inference.
        
        Args:
            account_id: The account to extract features for
            df: The transaction dataframe
            
        Returns:
            Dictionary of features
        """
        features = {}
        
        # Outgoing transactions
        outgoing = df[df['sender_id'] == account_id]
        features['out_count'] = len(outgoing)
        features['out_unique_recipients'] = outgoing['receiver_id'].nunique() if len(outgoing) > 0 else 0
        features['out_amount_mean'] = outgoing['amount'].mean() if len(outgoing) > 0 else 0
        features['out_amount_std'] = outgoing['amount'].std() if len(outgoing) > 1 else 0
        features['out_amount_total'] = outgoing['amount'].sum()
        features['out_amount_max'] = outgoing['amount'].max() if len(outgoing) > 0 else 0
        features['out_amount_min'] = outgoing['amount'].min() if len(outgoing) > 0 else 0
        
        # Incoming transactions
        incoming = df[df['receiver_id'] == account_id]
        features['in_count'] = len(incoming)
        features['in_unique_senders'] = incoming['sender_id'].nunique() if len(incoming) > 0 else 0
        features['in_amount_mean'] = incoming['amount'].mean() if len(incoming) > 0 else 0
        features['in_amount_std'] = incoming['amount'].std() if len(incoming) > 1 else 0
        features['in_amount_total'] = incoming['amount'].sum()
        features['in_amount_max'] = incoming['amount'].max() if len(incoming) > 0 else 0
        features['in_amount_min'] = incoming['amount'].min() if len(incoming) > 0 else 0
        
        # Balance features
        total_received = features['in_amount_total']
        total_sent = features['out_amount_total']
        
        features['balance_flow'] = total_received - total_sent
        features['ratio_send_to_receive'] = total_sent / total_received if total_received > 0 else 0
        features['ratio_connections'] = (
            (features['out_unique_recipients'] + features['in_unique_senders']) / 
            (features['out_count'] + features['in_count']) 
            if (features['out_count'] + features['in_count']) > 0 else 0
        )
        
        # Temporal features
        all_transactions = pd.concat([
            outgoing[['timestamp']].assign(direction='out'),
            incoming[['timestamp']].assign(direction='in')
        ]) if len(outgoing) > 0 or len(incoming) > 0 else pd.DataFrame()
        
        if len(all_transactions) > 1:
            all_transactions = all_transactions.sort_values('timestamp')
            time_gaps = all_transactions['timestamp'].diff().dt.total_seconds() / 3600
            
            features['avg_time_gap_hours'] = time_gaps[1:].mean()
            features['max_time_gap_hours'] = time_gaps[1:].max()
            features['min_time_gap_hours'] = time_gaps[1:].min()
            features['transaction_rate_per_hour'] = (
                (features['in_count'] + features['out_count']) / 
                (time_gaps[1:].sum() if time_gaps[1:].sum() > 0 else 1)
            )
        else:
            features['avg_time_gap_hours'] = 0
            features['max_time_gap_hours'] = 0
            features['min_time_gap_hours'] = 0
            features['transaction_rate_per_hour'] = 0
        
        # Burst detection
        if len(all_transactions) > 0:
            features['transactions_in_24h'] = len(all_transactions)
            all_amounts = pd.concat([outgoing[['amount']], incoming[['amount']]]) if len(outgoing) > 0 or len(incoming) > 0 else pd.DataFrame()
            features['has_large_transaction'] = 1 if len(all_amounts) > 0 and (all_amounts['amount'] > all_amounts['amount'].quantile(0.95)).any() else 0
            features['amount_variance'] = all_amounts['amount'].var() if len(all_amounts) > 0 else 0
        else:
            features['transactions_in_24h'] = 0
            features['has_large_transaction'] = 0
            features['amount_variance'] = 0
        
        # Reciprocal transactions
        reciprocal_count = 0
        for idx, row in outgoing.iterrows():
            counterparty = row['receiver_id']
            reverse = incoming[incoming['sender_id'] == counterparty]
            if len(reverse) > 0:
                reciprocal_count += len(reverse)
        
        features['reciprocal_transaction_count'] = reciprocal_count
        features['has_reciprocal_patterns'] = 1 if reciprocal_count > 0 else 0
        
        # Risk indicators
        risk_indicators = 0
        if features['out_count'] > 10 and features['out_unique_recipients'] > 8:
            risk_indicators += 1
        if features['in_count'] > 10 and features['in_unique_senders'] > 8:
            risk_indicators += 1
        if features['transaction_rate_per_hour'] > 1:
            risk_indicators += 1
        if features['has_reciprocal_patterns'] == 1:
            risk_indicators += 1
        if features['has_large_transaction'] == 1:
            risk_indicators += 1
        
        features['risk_indicator_count'] = risk_indicators
        
        return features
