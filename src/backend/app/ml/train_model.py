"""
Model Training Module
Trains Isolation Forest for anomaly detection on transaction data

Algorithm: Isolation Forest
- Unsupervised learning (no fraud labels required)
- Works well for anomaly detection in high-dimensional data
- Computationally efficient
- Isolates anomalies by random selection features and split values
- Anomalies: require fewer splits to isolate = easier to separate
"""

import pandas as pd
import numpy as np
import joblib
import os
from pathlib import Path
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from typing import Tuple

from .feature_engineer import FeatureEngineer


class ModelTrainer:
    """
    Trains Isolation Forest model on transaction data.
    Saves trained model and scaler for inference.
    """

    MODEL_DIR = Path(__file__).parent.parent.parent / "models"
    MODEL_FILE = MODEL_DIR / "fraud_model.pkl"
    SCALER_FILE = MODEL_DIR / "feature_scaler.pkl"
    CONFIG_FILE = MODEL_DIR / "model_config.pkl"

    @staticmethod
    def ensure_model_dir():
        """Create models directory if it doesn't exist"""
        ModelTrainer.MODEL_DIR.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def train(df: pd.DataFrame, contamination: float = 0.05) -> Tuple[IsolationForest, StandardScaler, list]:
        """
        Train Isolation Forest model on transaction data.
        
        Args:
            df: Transaction dataframe with required columns
            contamination: Expected proportion of anomalies (0.05 = 5%)
            
        Returns:
            model: Trained IsolationForest
            scaler: StandardScaler fitted on features
            feature_names: List of feature names used
        """
        
        print(" Starting Model Training...")
        print(f"   Dataset size: {len(df)} transactions")
        
        # Step 1: Feature Engineering
        features_df, feature_names = FeatureEngineer.engineer_features(df)
        
        print(f" Features extracted: {len(feature_names)} features, {len(features_df)} accounts")
        print(f"   Features: {feature_names[:10]}... (and {len(feature_names)-10} more)")
        
        # Step 2: Feature Scaling (important for Isolation Forest)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(features_df)
        
        print(f" Features scaled: mean={X_scaled.mean():.4f}, std={X_scaled.std():.4f}")
        
        # Step 3: Train Isolation Forest
        print(f" Training Isolation Forest with contamination={contamination}...")
        model = IsolationForest(
            contamination=contamination,  # Expected anomaly rate
            random_state=42,              # For reproducibility
            n_estimators=100,             # Number of trees
            max_samples='auto',           # Sample size for each tree
            n_jobs=-1                     # Use all CPU cores
        )
        
        # Fit model
        model.fit(X_scaled)
        
        # Get anomaly scores
        anomaly_scores = model.score_samples(X_scaled)
        predictions = model.predict(X_scaled)
        
        # Analyze results
        n_anomalies = np.sum(predictions == -1)
        n_normal = np.sum(predictions == 1)
        
        print(f" Model Training Complete!")
        print(f"   Normal accounts: {n_normal}")
        print(f"   Anomalous accounts: {n_anomalies}")
        print(f"   Anomaly rate: {n_anomalies / len(predictions) * 100:.2f}%")
        print(f"   Anomaly score range: [{anomaly_scores.min():.4f}, {anomaly_scores.max():.4f}]")
        
        return model, scaler, feature_names

    @staticmethod
    def save_model(model: IsolationForest, scaler: StandardScaler, feature_names: list) -> None:
        """
        Save trained model, scaler, and configuration to disk.
        
        Args:
            model: Trained Isolation Forest model
            scaler: StandardScaler fitted on training data
            feature_names: List of feature names used during training
        """
        
        ModelTrainer.ensure_model_dir()
        
        # Save model
        joblib.dump(model, ModelTrainer.MODEL_FILE)
        print(f" Model saved: {ModelTrainer.MODEL_FILE}")
        
        # Save scaler
        joblib.dump(scaler, ModelTrainer.SCALER_FILE)
        print(f" Scaler saved: {ModelTrainer.SCALER_FILE}")
        
        # Save config (feature names)
        config = {
            'feature_names': feature_names,
            'n_features': len(feature_names),
            'model_type': 'IsolationForest'
        }
        joblib.dump(config, ModelTrainer.CONFIG_FILE)
        print(f" Config saved: {ModelTrainer.CONFIG_FILE}")

    @staticmethod
    def train_and_save(df: pd.DataFrame, contamination: float = 0.05) -> Tuple[IsolationForest, StandardScaler, list]:
        """
        Train model and save it to disk in one step.
        
        Args:
            df: Transaction dataframe
            contamination: Expected anomaly rate
            
        Returns:
            model, scaler, feature_names
        """
        
        model, scaler, feature_names = ModelTrainer.train(df, contamination)
        ModelTrainer.save_model(model, scaler, feature_names)
        
        return model, scaler, feature_names
