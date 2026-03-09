"""
Prediction Module
Makes fraud risk predictions on transaction data using trained models

Output per account:
- fraud_probability: 0-100 (AI model confidence)
- risk_score: 0-100 (normalized anomaly score)
- anomaly_flag: binary (1=anomalous, 0=normal)
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
import warnings

from .feature_engineer import FeatureEngineer
from .model_loader import MLModelLoader


class MLPredictor:
    """
    Makes fraud predictions on transaction data.
    Combines Isolation Forest anomaly scores with probability calibration.
    """

    def __init__(self):
        """Initialize predictor with loaded models"""
        self.loader = MLModelLoader()
        
        if not self.loader.is_ready:
            print("  ML models not ready. Running in degraded mode.")
    
    def predict(self, df: pd.DataFrame) -> Dict[str, Dict[str, float]]:
        """
        Predict fraud risk for all accounts in dataframe.
        
        Args:
            df: Transaction dataframe with required columns
            
        Returns:
            Dictionary mapping account_id -> {fraud_probability, risk_score, anomaly_flag}
        """
        
        if not self.loader.is_ready:
            print("  Models not loaded, returning default scores")
            return self._get_default_predictions(df)
        
        print(f" Making ML predictions for {df['sender_id'].nunique() + df['receiver_id'].nunique()} accounts...")
        
        try:
            # Step 1: Extract features
            features_df, feature_names = FeatureEngineer.engineer_features(df)
            
            # Step 2: Ensure feature order matches training
            model_features = self.loader.feature_names
            features_df = features_df[model_features].fillna(0)
            
            # Step 3: Scale features
            X_scaled = self.loader.scaler.transform(features_df)
            
            # Step 4: Get anomaly scores and predictions
            anomaly_scores = self.loader.model.score_samples(X_scaled)
            predictions = self.loader.model.predict(X_scaled)
            
            # Step 5: Convert to probabilities and risk scores
            predictions_dict = {}
            
            for account_id, score in zip(features_df.index, anomaly_scores):
                # Anomaly score is negative for anomalies, positive for normal
                # Convert to 0-100 scale
                risk_score = self._score_to_probability(score)
                
                # Binary anomaly flag
                anomaly_flag = 1 if predictions[list(features_df.index).index(account_id)] == -1 else 0
                
                predictions_dict[account_id] = {
                    'fraud_probability': risk_score,     # 0-100
                    'risk_score': risk_score,             # Same as fraud_probability
                    'anomaly_flag': anomaly_flag,         # 0 or 1
                    'raw_anomaly_score': float(score)     # Raw score for debugging
                }
            
            # Print statistics
            flagged = sum(1 for p in predictions_dict.values() if p['anomaly_flag'] == 1)
            print(f" Predictions complete: {flagged} anomalous accounts detected")
            
            return predictions_dict
        
        except Exception as e:
            print(f" Error during prediction: {e}")
            return self._get_default_predictions(df)
    
    def predict_single_account(self, account_id: str, df: pd.DataFrame) -> Dict[str, float]:
        """
        Predict fraud risk for a single account.
        
        Args:
            account_id: Account to predict for
            df: Full transaction dataframe
            
        Returns:
            Dictionary with fraud_probability, risk_score, anomaly_flag
        """
        
        if not self.loader.is_ready:
            return {
                'fraud_probability': 0.0,
                'risk_score': 0.0,
                'anomaly_flag': 0
            }
        
        try:
            # Extract features for this account
            features = FeatureEngineer.extract_account_features(account_id, df)
            
            # Ensure feature order
            model_features = self.loader.feature_names
            features_array = np.array([features[f] for f in model_features]).reshape(1, -1)
            
            # Scale
            X_scaled = self.loader.scaler.transform(features_array)
            
            # Predict
            anomaly_score = self.loader.model.score_samples(X_scaled)[0]
            prediction = self.loader.model.predict(X_scaled)[0]
            
            # Convert to probability
            risk_score = self._score_to_probability(anomaly_score)
            anomaly_flag = 1 if prediction == -1 else 0
            
            return {
                'fraud_probability': risk_score,
                'risk_score': risk_score,
                'anomaly_flag': anomaly_flag,
                'raw_anomaly_score': float(anomaly_score)
            }
        
        except Exception as e:
            print(f"  Error predicting for account {account_id}: {e}")
            return {
                'fraud_probability': 0.0,
                'risk_score': 0.0,
                'anomaly_flag': 0
            }
    
    @staticmethod
    def _score_to_probability(anomaly_score: float) -> float:
        """
        Convert Isolation Forest anomaly score to 0-100 probability scale.
        
        Isolation Forest returns negative scores for anomalies, positive for normal.
        We need to convert to 0-100 where 100 = high fraud risk.
        
        Args:
            anomaly_score: Raw score from Isolation Forest
            
        Returns:
            Probability 0-100
        """
        # Sigmoid-like transformation
        # anomaly_score typically in range [-0.5, 0.5]
        # We'll use the formula: probability = 100 * sigmoid(score * 10)
        
        # Simple linear scaling for interpretability
        # Scores from -1 (definitely normal) to +1 (definitely anomaly)
        # Map to 0-100
        
        # Strategy: Use negative score (more negative = more anomalous)
        # So we invert and scale
        
        # Empirically, anomaly_score ranges roughly from -0.5 to 0.1
        # We'll normalize to 0-100
        
        # Simpler approach: (1 - sigmoid(score)) * 100
        sigmoid_value = 1 / (1 + np.exp(-anomaly_score * 10))
        probability = (1 - sigmoid_value) * 100  # Invert so negative scores → high probability
        
        return max(0, min(100, probability))  # Clamp to [0, 100]
    
    @staticmethod
    def _get_default_predictions(df: pd.DataFrame) -> Dict[str, Dict[str, float]]:
        """
        Return default predictions when model is not available.
        Use simple heuristics based on transaction patterns.
        
        Args:
            df: Transaction dataframe
            
        Returns:
            Default predictions dict
        """
        
        all_accounts = set(df['sender_id'].unique()) | set(df['receiver_id'].unique())
        predictions = {}
        
        for account_id in all_accounts:
            # Simple heuristic: accounts with many unique connections = higher risk
            out_connections = df[df['sender_id'] == account_id]['receiver_id'].nunique()
            in_connections = df[df['receiver_id'] == account_id]['sender_id'].nunique()
            
            risk_score = min(100, (out_connections + in_connections) * 5)
            anomaly_flag = 1 if risk_score > 50 else 0
            
            predictions[account_id] = {
                'fraud_probability': risk_score,
                'risk_score': risk_score,
                'anomaly_flag': anomaly_flag,
                'raw_anomaly_score': 0.0
            }
        
        return predictions
