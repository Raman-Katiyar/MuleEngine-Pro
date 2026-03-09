#!/usr/bin/env python3
"""
Integration Verification Script
Tests that all components are working correctly
"""

import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

def test_imports():
    """Test that all modules import correctly"""
    print(" Testing imports...")
    
    try:
        from app.ml.feature_engineer import FeatureEngineer
        print("   FeatureEngineer")
    except Exception as e:
        print(f"   FeatureEngineer: {e}")
        return False
    
    try:
        from app.ml.train_model import ModelTrainer
        print("   ModelTrainer")
    except Exception as e:
        print(f"   ModelTrainer: {e}")
        return False
    
    try:
        from app.ml.predict import MLPredictor
        print("   MLPredictor")
    except Exception as e:
        print(f"   MLPredictor: {e}")
        return False
    
    try:
        from app.ml.model_loader import MLModelLoader
        print("   MLModelLoader")
    except Exception as e:
        print(f"   MLModelLoader: {e}")
        return False
    
    try:
        from app.services.analysis_engine import AnalysisEngine
        print("   AnalysisEngine (with ML integration)")
    except Exception as e:
        print(f"   AnalysisEngine: {e}")
        return False
    
    return True


def test_model_files():
    """Test that model files exist"""
    print("\n Testing model files...")
    
    models_dir = Path(__file__).parent / "backend" / "models"
    
    required_files = [
        "fraud_model.pkl",
        "feature_scaler.pkl",
        "model_config.pkl"
    ]
    
    for file in required_files:
        file_path = models_dir / file
        if file_path.exists():
            size_mb = file_path.stat().st_size / (1024 * 1024)
            print(f"   {file} ({size_mb:.2f} MB)")
        else:
            print(f"   {file} (not found)")
            return False
    
    return True


def test_model_loading():
    """Test that model loads correctly"""
    print("\n Testing model loading...")
    
    try:
        from app.ml.model_loader import MLModelLoader
        
        loader = MLModelLoader()
        
        if loader.is_ready:
            print(f"   Model loaded successfully")
            print(f"     Features: {loader.config.get('n_features', 'unknown')}")
            print(f"     Feature count: {len(loader.feature_names)}")
            return True
        else:
            print(f"   Model not loaded")
            return False
    except Exception as e:
        print(f"   Error: {e}")
        return False


def test_feature_engineering():
    """Test feature engineering on sample data"""
    print("\n Testing feature engineering...")
    
    try:
        import pandas as pd
        from app.ml.feature_engineer import FeatureEngineer
        
        # Create sample data
        data = {
            'transaction_id': ['T1', 'T2', 'T3', 'T4', 'T5'],
            'sender_id': ['A', 'B', 'A', 'C', 'A'],
            'receiver_id': ['B', 'C', 'C', 'D', 'D'],
            'amount': [100, 200, 150, 300, 250],
            'timestamp': pd.to_datetime([
                '2024-01-01 10:00:00',
                '2024-01-01 11:00:00',
                '2024-01-01 12:00:00',
                '2024-01-01 13:00:00',
                '2024-01-01 14:00:00'
            ])
        }
        df = pd.DataFrame(data)
        
        features_df, feature_names = FeatureEngineer.engineer_features(df)
        
        print(f"   Features extracted: {len(feature_names)} features")
        print(f"     Sample size: {len(features_df)} accounts")
        print(f"     First few features: {feature_names[:5]}...")
        
        return True
    except Exception as e:
        print(f"   Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_prediction():
    """Test prediction on sample data"""
    print("\n Testing prediction...")
    
    try:
        import pandas as pd
        from app.ml.predict import MLPredictor
        
        # Create sample data
        data = {
            'transaction_id': [f'T{i}' for i in range(1, 21)],
            'sender_id': [f'A{i%5}' for i in range(20)],
            'receiver_id': [f'B{i%7}' for i in range(20)],
            'amount': [100 + i*10 for i in range(20)],
            'timestamp': pd.date_range('2024-01-01', periods=20, freq='h')
        }
        df = pd.DataFrame(data)
        
        predictor = MLPredictor()
        predictions = predictor.predict(df)
        
        print(f"   Predictions generated for {len(predictions)} accounts")
        
        if predictions:
            sample_acc = list(predictions.keys())[0]
            sample_pred = predictions[sample_acc]
            print(f"     Sample prediction for {sample_acc}:")
            print(f"       - fraud_probability: {sample_pred.get('fraud_probability', 'N/A'):.2f}")
            print(f"       - anomaly_flag: {sample_pred.get('anomaly_flag', 'N/A')}")
        
        return True
    except Exception as e:
        print(f"   Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_api_schemas():
    """Test that API schemas include ML fields"""
    print("\n Testing API schemas...")
    
    try:
        from app.models.schemas import SuspiciousAccount, AnalysisSummary
        
        # Check SuspiciousAccount has ML fields
        schema_fields = SuspiciousAccount.model_fields.keys()
        required_fields = [
            'ai_risk_score',
            'anomaly_flag',
            'final_risk_level',
            'combined_risk_score'
        ]
        
        for field in required_fields:
            if field in schema_fields:
                print(f"   SuspiciousAccount.{field}")
            else:
                print(f"   SuspiciousAccount.{field} (missing)")
                return False
        
        # Check AnalysisSummary has ML fields
        summary_fields = AnalysisSummary.model_fields.keys()
        summary_required = [
            'ml_anomalies_detected',
            'hybrid_system_active',
            'detection_method'
        ]
        
        for field in summary_required:
            if field in summary_fields:
                print(f"   AnalysisSummary.{field}")
            else:
                print(f"   AnalysisSummary.{field} (missing)")
                return False
        
        return True
    except Exception as e:
        print(f"   Error: {e}")
        return False


def main():
    print("=" * 60)
    print(" HYBRID AI FRAUD DETECTION - INTEGRATION VERIFICATION")
    print("=" * 60)
    
    tests = [
        ("Imports", test_imports),
        ("Model Files", test_model_files),
        ("Model Loading", test_model_loading),
        ("Feature Engineering", test_feature_engineering),
        ("Prediction", test_prediction),
        ("API Schemas", test_api_schemas),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n {name}: Unexpected error: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print(" VERIFICATION SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = " PASS" if result else " FAIL"
        print(f"{status}: {name}")
    
    print(f"\n Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n SUCCESS! System is ready to use!")
        print("\nNext steps:")
        print("1. Start backend: cd backend && python run.py")
        print("2. Start frontend: cd frontend && npm start")
        print("3. Upload CSV via web interface")
        return True
    else:
        print("\n Some tests failed. Check output above.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
