"""
ML Service for Fraud Detection
=========================================
ROLE: Advanced Anomaly Detection Layer
- Acts COMPLEMENTARY to rule-based detection
- Detects BEHAVIORAL ANOMALIES (not patterns)
- Uses unsupervised learning (Isolation Forest)
- Fast, lightweight, and interpretable

IMPORTANT DISTINCTION:
- RULE-BASED: Finds known fraud patterns (cycles, smurfing, shells)
- ML ANOMALY: Finds unusual account behavior (outliers, statistical anomalies)

For example:
- A merchant account with 100 transactions of $100 → Rule-based: Normal
- But if ONE transaction is $50,000 → ML: ANOMALY (statistical outlier)
"""

import pandas as pd
import numpy as np
from typing import Dict, Tuple
from pathlib import Path

try:
    from sklearn.ensemble import IsolationForest, RandomForestClassifier
    from sklearn.svm import OneClassSVM
    from sklearn.preprocessing import StandardScaler, RobustScaler
    from sklearn.covariance import EllipticEnvelope
    import joblib
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


class MLAnomalyDetector:
    """
    Detects behavioral anomalies in transaction accounts.
    NOT designed to replace rule-based detection, but to SUPPLEMENT it.
    
    Key Features:
    - Unsupervised learning (no fraud labels needed)
    - Fast inference (<1ms per account)
    - Clear 0-100 anomaly score
    - Statistical approach (not pattern-based)
    """
    
    MODEL_PATH = Path(__file__).parent.parent.parent / "models"
    MODEL_FILE = MODEL_PATH / "anomaly_model.pkl"
    SCALER_FILE = MODEL_PATH / "anomaly_scaler.pkl"
    
    def __init__(self):
        """Initialize detector and load pre-trained model if available"""
        self.model = None
        self.scaler = None
        self.feature_names = None
        self._load_model()
    
    def _load_model(self):
        """Load pre-trained model from disk if available"""
        if not SKLEARN_AVAILABLE:
            print("  scikit-learn not available. ML anomaly detection disabled.")
            return
        
        try:
            if self.MODEL_FILE.exists() and self.SCALER_FILE.exists():
                self.model = joblib.load(self.MODEL_FILE)
                self.scaler = joblib.load(self.SCALER_FILE)
                self.feature_names = [
                    'transaction_count', 'unique_connections', 'amount_mean',
                    'amount_std', 'amount_ratio', 'velocity'
                ]
                print(" ML anomaly model loaded")
            else:
                print("  No pre-trained model found. Using training mode.")
        except Exception as e:
            print(f"  Error loading model: {e}. Using training mode.")
    
    def extract_anomaly_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, list]:
        """
        Extract BEHAVIORAL features for anomaly detection (ENHANCED VERSION).
        
        IMPORTANT: These are DIFFERENT from rule-based features.
        - Rule-based looks for patterns
        - ML looks for statistical outliers
        
        Features (12 total - doubled from 6):
        1. transaction_count: Total transactions (volume)
        2. unique_connections: Unique counterparties (network breadth)
        3. amount_mean: Average transaction amount
        4. amount_std: Std dev of amounts (consistency)
        5. amount_ratio: Ratio of max/mean (outlier detection)
        6. velocity: Transactions per time period (speed)
        7. amount_skewness: Distribution skewness (unusual patterns)
        8. burst_indicator: Transaction clustering metric
        9. balance_asymmetry: Incoming vs outgoing ratio
        10. time_concentration: Temporal clustering score
        11. amount_entropy: Transaction amount diversity
        12. network_density: Connection efficiency metric
        """
        
        all_accounts = set(df['sender_id'].unique()) | set(df['receiver_id'].unique())
        features_list = []
        account_ids = []
        
        for account_id in all_accounts:
            # Get all transactions for this account (both sending and receiving)
            sent = df[df['sender_id'] == account_id]
            received = df[df['receiver_id'] == account_id]
            all_txns = pd.concat([sent, received])
            
            if len(all_txns) == 0:
                continue
            
            # Feature 1: Transaction count (raw volume)
            f_count = len(all_txns)
            
            # Feature 2: Unique connections (unique counterparties)
            unique_connections = len(
                set(sent['receiver_id'].unique()) | set(received['sender_id'].unique())
            )
            
            # Feature 3: Average transaction amount
            f_mean = all_txns['amount'].mean()
            
            # Feature 4: Amount standard deviation (consistency)
            f_std = all_txns['amount'].std() if len(all_txns) > 1 else 0
            
            # Feature 5: Amount ratio (max/mean) - detects outliers
            f_max = all_txns['amount'].max()
            f_ratio = f_max / f_mean if f_mean > 0 else 0
            
            # Feature 6: Velocity (transactions per day)
            date_range = (all_txns['timestamp'].max() - all_txns['timestamp'].min()).days
            f_velocity = f_count / max(date_range, 1)  # Avoid division by zero
            
            # === NEW ADVANCED FEATURES ===
            
            # Feature 7: Amount Skewness (distribution asymmetry)
            amounts = all_txns['amount'].values
            if len(amounts) > 2:
                f_skewness = ((amounts - f_mean) ** 3).mean() / (f_std ** 3) if f_std > 0 else 0
            else:
                f_skewness = 0
            
            # Feature 8: Burst Indicator (transaction clustering)
            all_txns_sorted = all_txns.sort_values('timestamp')
            if len(all_txns_sorted) > 1:
                time_gaps = all_txns_sorted['timestamp'].diff().dt.total_seconds() / 3600
                time_gaps = time_gaps[1:]  # Remove first NaN
                avg_gap = time_gaps.mean() if len(time_gaps) > 0 else 1
                short_gaps = (time_gaps < avg_gap * 0.3).sum() if len(time_gaps) > 0 else 0
                f_burst = short_gaps / len(time_gaps) if len(time_gaps) > 0 else 0
            else:
                f_burst = 0
            
            # Feature 9: Balance Asymmetry (in vs out ratio)
            in_total = received['amount'].sum() if len(received) > 0 else 0
            out_total = sent['amount'].sum() if len(sent) > 0 else 0
            total_flow = in_total + out_total
            f_balance_asym = abs(in_total - out_total) / total_flow if total_flow > 0 else 0
            
            # Feature 10: Time Concentration (temporal clustering)
            if len(all_txns_sorted) > 2:
                timestamps = pd.to_datetime(all_txns_sorted['timestamp'])
                hours = timestamps.dt.hour.values
                hour_variance = np.var(hours)
                f_time_concentration = 1 - (hour_variance / 144)  # Normalize to 0-1
            else:
                f_time_concentration = 0
            
            # Feature 11: Amount Entropy (transaction diversity)
            if len(amounts) > 1:
                # Bin amounts into 10 categories
                bins = 10
                hist, _ = np.histogram(amounts, bins=bins)
                probs = hist / hist.sum()
                probs = probs[probs > 0]  # Remove zero probabilities
                f_entropy = -np.sum(probs * np.log2(probs)) if len(probs) > 0 else 0
            else:
                f_entropy = 0
            
            # Feature 12: Network Density (connection efficiency)
            total_connections = len(sent) + len(received)
            f_network_density = unique_connections / total_connections if total_connections > 0 else 0
            
            features_list.append([
                f_count,
                unique_connections,
                f_mean,
                f_std,
                f_ratio,
                f_velocity,
                f_skewness,
                f_burst,
                f_balance_asym,
                f_time_concentration,
                f_entropy,
                f_network_density
            ])
            account_ids.append(account_id)
        
        features_df = pd.DataFrame(
            features_list,
            columns=['transaction_count', 'unique_connections', 'amount_mean',
                    'amount_std', 'amount_ratio', 'velocity',
                    'amount_skewness', 'burst_indicator', 'balance_asymmetry',
                    'time_concentration', 'amount_entropy', 'network_density'],
            index=account_ids
        )
        
        # Handle NaN values
        features_df = features_df.fillna(0).replace([np.inf, -np.inf], 0)
        
        return features_df, self.feature_names or features_df.columns.tolist()
    
    def detect_anomalies(self, df: pd.DataFrame) -> Dict[str, float]:
        """
        Detect behavioral anomalies using ENSEMBLE approach (ENHANCED).
        Combines 3 methods for robust detection:
        1. Isolation Forest (outlier detection)
        2. One-Class SVM (boundary detection)
        3. Statistical Z-Score (threshold-based)
        
        Returns:
            Dict[account_id] -> anomaly_score (0-100, where 100 = most anomalous)
        """
        
        if not SKLEARN_AVAILABLE:
            print("  scikit-learn not available. Returning neutral scores.")
            return {}
        
        try:
            # Extract features
            features_df, _ = self.extract_anomaly_features(df)
            
            if len(features_df) == 0:
                return {}
            
            # If dataset too small, use statistical approach
            if len(features_df) < 10:
                return self._statistical_anomaly_scores(features_df)
            
            # === ENSEMBLE ANOMALY DETECTION ===
            
            # Scale features using RobustScaler (better for outliers)
            scaler = RobustScaler()
            X_scaled = scaler.fit_transform(features_df)
            
            # Method 1: Isolation Forest
            iso_forest = IsolationForest(
                contamination=0.15,  # Expect 15% anomalies
                random_state=42,
                n_estimators=150,  # More trees = better detection
                max_samples='auto'
            )
            iso_scores = iso_forest.fit(X_scaled).score_samples(X_scaled)
            
            # Method 2: One-Class SVM (if enough data)
            if len(features_df) >= 20:
                try:
                    svm = OneClassSVM(
                        nu=0.15,  # Expected outlier ratio
                        kernel='rbf',
                        gamma='auto'
                    )
                    svm_scores = svm.fit(X_scaled).score_samples(X_scaled)
                except Exception as e:
                    print(f"  One-Class SVM failed: {e}. Using only Isolation Forest.")
                    svm_scores = iso_scores  # Fallback
            else:
                svm_scores = iso_scores  # Not enough data for SVM
            
            # Method 3: Statistical Z-Score approach
            stat_scores = self._statistical_anomaly_scores(features_df)
            stat_scores_array = np.array([stat_scores.get(acc, 0) for acc in features_df.index])
            
            # Normalize all methods to 0-100 scale
            def normalize_scores(scores):
                min_s, max_s = scores.min(), scores.max()
                if max_s == min_s:
                    return np.full_like(scores, 50.0)
                # Invert: lower score = higher anomaly
                return 100 * (1 - (scores - min_s) / (max_s - min_s))
            
            iso_normalized = normalize_scores(iso_scores)
            svm_normalized = normalize_scores(svm_scores)
            stat_normalized = stat_scores_array
            
            # Ensemble: Weighted average (40% Iso + 30% SVM + 30% Stat)
            ensemble_scores = (
                0.40 * iso_normalized +
                0.30 * svm_normalized +
                0.30 * stat_normalized
            )
            
            # Build result dictionary
            scores_normalized = {}
            for account_id, score in zip(features_df.index, ensemble_scores):
                scores_normalized[account_id] = max(0, min(100, float(score)))
            
            print(f" Ensemble anomaly detection: Iso+SVM+Stat (n={len(features_df)})")
            return scores_normalized
        
        except Exception as e:
            print(f" Error in anomaly detection: {e}")
            import traceback
            traceback.print_exc()
            return {}
    
    def _statistical_anomaly_scores(self, features_df: pd.DataFrame) -> Dict[str, float]:
        """
        Statistical anomaly detection using Z-scores (enhanced fallback).
        Uses multi-dimensional anomaly distance and percentile normalization.
        """
        if len(features_df) == 0:
            return {}

        scores = {}

        z_scores = (features_df - features_df.mean()) / features_df.std().replace(0, 1)
        anomaly_distances = np.sqrt((z_scores ** 2).sum(axis=1))

        p25, p50, p75, p95 = np.percentile(anomaly_distances, [25, 50, 75, 95])
        max_distance = float(np.max(anomaly_distances))

        for account_id, distance in zip(features_df.index, anomaly_distances):
            if distance >= p95:
                score = 80 + (distance - p95) / (max_distance - p95 + 1e-6) * 20
            elif distance >= p75:
                score = 60 + (distance - p75) / (p95 - p75 + 1e-6) * 20
            elif distance >= p50:
                score = 40 + (distance - p50) / (p75 - p50 + 1e-6) * 20
            else:
                score = (distance / (p50 + 1e-6)) * 40

            scores[account_id] = float(np.clip(score, 0, 100))

        return scores
    
    def train_model(self, df: pd.DataFrame, contamination: float = 0.05):
        """
        Train Isolation Forest model on transaction data.
        
        Args:
            df: Transaction DataFrame
            contamination: Expected proportion of anomalies (5% default)
        """
        
        if not SKLEARN_AVAILABLE:
            print(" scikit-learn not available. Cannot train model.")
            return
        
        print(f" Training ML anomaly detector (contamination={contamination*100:.1f}%)...")
        
        try:
            # Extract features
            features_df, feature_names = self.extract_anomaly_features(df)
            
            if len(features_df) < 10:
                print("  Not enough accounts to train model properly.")
                return
            
            # Scale features
            self.scaler = StandardScaler()
            X_scaled = self.scaler.fit_transform(features_df)
            
            # Train Isolation Forest
            self.model = IsolationForest(
                contamination=contamination,
                random_state=42,
                n_estimators=50,
                n_jobs=-1
            )
            self.model.fit(X_scaled)
            
            # Save model
            self.MODEL_PATH.mkdir(parents=True, exist_ok=True)
            joblib.dump(self.model, self.MODEL_FILE)
            joblib.dump(self.scaler, self.SCALER_FILE)
            
            self.feature_names = feature_names
            
            print(f" Model trained on {len(features_df)} accounts")
            print(f"   Saved to: {self.MODEL_FILE}")
        
        except Exception as e:
            print(f" Error training model: {e}")
