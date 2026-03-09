"""
Validation Script for Improved System
Tests all major enhancements to ensure they work correctly

Run this before demo:
    python tests/validate_improvements.py
"""

import sys
import time
import pandas as pd
import numpy as np
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src' / 'backend'))

def test_ml_ensemble():
    """Test 1: Verify ensemble ML is working"""
    print("\n TEST 1: ML Ensemble Detection")
    print("=" * 50)
    
    try:
        from app.ml.ml_service import MLAnomalyDetector
        from app.utils.csv_processor import CSVProcessor
        
        # Load sample data
        data_path = Path(__file__).parent.parent / 'data' / 'sample_transactions.csv'
        with open(data_path, 'rb') as f:
            df = CSVProcessor.parse_csv(f.read())
        
        # Run detector
        detector = MLAnomalyDetector()
        
        # Check feature count
        features_df, feature_names = detector.extract_anomaly_features(df)
        assert len(feature_names) == 12, f"Expected 12 features, got {len(feature_names)}"
        print(f" Enhanced features: {len(feature_names)} features extracted")
        print(f"   Features: {', '.join(feature_names[:6])}...")
        
        # Check ensemble detection
        scores = detector.detect_anomalies(df)
        assert len(scores) > 0, "No anomaly scores returned"
        print(f" Ensemble detection: {len(scores)} accounts scored")
        
        avg_score = np.mean(list(scores.values()))
        print(f"   Average anomaly score: {avg_score:.1f}/100")
        
        return True
    except Exception as e:
        print(f" FAILED: {e}")
        return False

def test_parallel_processing():
    """Test 2: Verify parallel pattern detection"""
    print("\n TEST 2: Parallel Processing Performance")
    print("=" * 50)
    
    try:
        from app.services.analysis_engine import AnalysisEngine
        from app.utils.csv_processor import CSVProcessor
        
        # Load sample data
        data_path = Path(__file__).parent.parent / 'data' / 'sample_transactions.csv'
        with open(data_path, 'rb') as f:
            df = CSVProcessor.parse_csv(f.read())
        
        # Measure time
        start_time = time.time()
        engine = AnalysisEngine(df)
        result = engine.run_full_analysis()
        elapsed = time.time() - start_time
        
        print(f" Analysis completed in {elapsed:.2f}s")
        print(f"   Suspicious accounts: {result.summary.suspicious_accounts_flagged}")
        print(f"   Fraud rings: {result.summary.fraud_rings_detected}")
        print(f"   Detection method: {result.summary.detection_method}")
        
        # Check if faster than 30s (baseline)
        assert elapsed < 30, f"Too slow: {elapsed:.2f}s"
        
        return True
    except Exception as e:
        print(f" FAILED: {e}")
        return False

def test_caching_system():
    """Test 3: Verify caching works"""
    print("\n TEST 3: Caching System")
    print("=" * 50)
    
    try:
        from app.services.analysis_engine import AnalysisEngine
        from app.utils.csv_processor import CSVProcessor
        
        # Load sample data
        data_path = Path(__file__).parent.parent / 'data' / 'sample_transactions.csv'
        with open(data_path, 'rb') as f:
            df = CSVProcessor.parse_csv(f.read())
        
        # First run (no cache)
        start1 = time.time()
        engine1 = AnalysisEngine(df)
        result1 = engine1.run_full_analysis()
        time1 = time.time() - start1
        
        # Second run (with cache)
        start2 = time.time()
        engine2 = AnalysisEngine(df)
        result2 = engine2.run_full_analysis()
        time2 = time.time() - start2
        
        print(f" First run: {time1:.2f}s")
        print(f" Second run: {time2:.2f}s")
        
        # Check if second run is faster (cache hit)
        speedup = ((time1 - time2) / time1) * 100
        print(f"   Speedup: {speedup:.1f}% faster with cache")
        
        # Cache should provide at least 20% speedup
        assert time2 < time1 * 0.8, "Cache not providing speedup"
        
        return True
    except Exception as e:
        print(f" FAILED: {e}")
        return False

def test_risk_scoring():
    """Test 4: Verify enhanced risk scoring"""
    print("\n TEST 4: Risk Scoring Enhancements")
    print("=" * 50)
    
    try:
        from app.core.scoring import RiskWeights, calculate_final_score
        
        # Test confidence-weighted scoring
        base_scores = [RiskWeights.CYCLE_INVOLVEMENT, RiskWeights.SMURFING_FAST_REDI]
        multipliers = [RiskWeights.FAST_PASS_THROUGH]
        
        # Test different account types
        standard_score = calculate_final_score(base_scores, multipliers, "standard")
        merchant_score = calculate_final_score(base_scores, multipliers, "merchant")
        payroll_score = calculate_final_score(base_scores, multipliers, "payroll")
        
        print(f" Standard account score: {standard_score}")
        print(f" Merchant account score: {merchant_score} (capped)")
        print(f" Payroll account score: {payroll_score} (capped)")
        
        # Verify capping works
        assert merchant_score <= RiskWeights.MERCHANT_MAX_SCORE, "Merchant cap not working"
        assert payroll_score <= RiskWeights.PAYROLL_MAX_SCORE, "Payroll cap not working"
        assert standard_score > merchant_score, "Standard should be higher than capped"
        
        print(f"    False positive protection: Working")
        
        return True
    except Exception as e:
        print(f" FAILED: {e}")
        return False

def test_data_validation():
    """Test 5: Data integrity checks"""
    print("\n TEST 5: Data Validation")
    print("=" * 50)
    
    try:
        from app.utils.csv_processor import CSVProcessor
        
        # Test valid CSV
        data_path = Path(__file__).parent.parent / 'data' / 'sample_transactions.csv'
        with open(data_path, 'rb') as f:
            df = CSVProcessor.parse_csv(f.read())
        
        # Check required columns
        required = ['transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp']
        for col in required:
            assert col in df.columns, f"Missing column: {col}"
        
        print(f" CSV validation: All required columns present")
        print(f"   Rows: {len(df)}")
        print(f"   Columns: {list(df.columns)}")
        
        # Check data types
        assert pd.api.types.is_numeric_dtype(df['amount']), "Amount should be numeric"
        assert pd.api.types.is_datetime64_any_dtype(df['timestamp']), "Timestamp should be datetime"
        
        print(f" Data types: Correctly parsed")
        
        return True
    except Exception as e:
        print(f" FAILED: {e}")
        return False

def main():
    """Run all validation tests"""
    print("\n" + "=" * 50)
    print(" IMPROVEMENT VALIDATION SUITE")
    print("=" * 50)
    
    tests = [
        ("ML Ensemble", test_ml_ensemble),
        ("Parallel Processing", test_parallel_processing),
        ("Caching System", test_caching_system),
        ("Risk Scoring", test_risk_scoring),
        ("Data Validation", test_data_validation)
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n {name} crashed: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print(" VALIDATION SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = " PASS" if result else " FAIL"
        print(f"{status}: {name}")
    
    print(f"\n Overall: {passed}/{total} tests passed ({(passed/total)*100:.0f}%)")
    
    if passed == total:
        print("\n ALL TESTS PASSED! System ready for demo! ")
        return 0
    else:
        print(f"\n  {total - passed} test(s) failed. Please review above.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
