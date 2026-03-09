"""
Model Loader Module
Handles loading and managing trained models for inference
"""

import joblib
from pathlib import Path
from typing import Tuple, Optional, Dict
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


class MLModelLoader:
    """
    Singleton pattern for loading and caching trained models.
    Ensures models are loaded once and reused.
    """
    
    _instance = None
    _model = None
    _scaler = None
    _config = None
    
    MODEL_DIR = Path(__file__).parent.parent.parent / "models"
    MODEL_FILE = MODEL_DIR / "fraud_model.pkl"
    SCALER_FILE = MODEL_DIR / "feature_scaler.pkl"
    CONFIG_FILE = MODEL_DIR / "model_config.pkl"

    def __new__(cls):
        """Implement singleton pattern"""
        if cls._instance is None:
            cls._instance = super(MLModelLoader, cls).__new__(cls)
            cls._instance._load_models()
        return cls._instance

    def _load_models(self) -> None:
        """Load models from disk into memory"""
        try:
            if not self.MODEL_FILE.exists():
                print(f"  Model file not found: {self.MODEL_FILE}")
                print(f"    Run training script first to create models")
                return
            
            print(f" Loading ML models...")
            
            # Load model
            self._model = joblib.load(self.MODEL_FILE)
            print(f" Fraud model loaded: {self.MODEL_FILE}")
            
            # Load scaler
            if self.SCALER_FILE.exists():
                self._scaler = joblib.load(self.SCALER_FILE)
                print(f" Scaler loaded: {self.SCALER_FILE}")
            else:
                print(f"  Scaler not found, creating default")
                self._scaler = StandardScaler()
            
            # Load config
            if self.CONFIG_FILE.exists():
                self._config = joblib.load(self.CONFIG_FILE)
                print(f" Config loaded: {self.CONFIG_FILE}")
                print(f"   Features: {self._config.get('n_features', 'unknown')}")
            
        except Exception as e:
            print(f" Error loading models: {e}")
            self._model = None
            self._scaler = None
            self._config = None

    @property
    def model(self) -> Optional[IsolationForest]:
        """Get loaded model"""
        return self._model

    @property
    def scaler(self) -> Optional[StandardScaler]:
        """Get loaded scaler"""
        return self._scaler

    @property
    def config(self) -> Optional[Dict]:
        """Get model configuration"""
        return self._config

    @property
    def is_ready(self) -> bool:
        """Check if models are loaded and ready"""
        return self._model is not None and self._scaler is not None

    @property
    def feature_names(self) -> list:
        """Get feature names used by model"""
        if self._config:
            return self._config.get('feature_names', [])
        return []

    def reload(self) -> None:
        """Force reload models from disk"""
        print(f" Reloading ML models...")
        self._model = None
        self._scaler = None
        self._config = None
        self._load_models()
