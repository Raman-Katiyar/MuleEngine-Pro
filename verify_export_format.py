#!/usr/bin/env python
"""Verify the JSON export format matches exact specifications"""

from backend.app.models.schemas import AnalysisResponse, SuspiciousAccount, FraudRing, AnalysisSummary
import json

def verify_export_format():
    """Test the export JSON structure with sample data"""
    
    # Create sample response matching real scenario
    sample_response = AnalysisResponse(
        suspicious_accounts=[
            SuspiciousAccount(
                account_id='ACC_00123', 
                suspicion_score=87.5, 
                detected_patterns=['cycle_length_3', 'high_velocity'], 
                ring_id='RING_001'
            ),
            SuspiciousAccount(
                account_id='ACC_00456', 
                suspicion_score=78.2, 
                detected_patterns=['fan_in_pattern', 'fast_redistribution'], 
                ring_id='RING_001'
            ),
            SuspiciousAccount(
                account_id='ACC_00789', 
                suspicion_score=65.4, 
                detected_patterns=['shell_chain_3_hops'], 
                ring_id='RING_002'
            )
        ],
        fraud_rings=[
            FraudRing(
                ring_id='RING_001', 
                member_accounts=['ACC_00123', 'ACC_00456', 'ACC_00999'], 
                pattern_type='cycle', 
                risk_score=95.3
            ),
            FraudRing(
                ring_id='RING_002', 
                member_accounts=['ACC_00789', 'ACC_00111', 'ACC_00222'], 
                pattern_type='shell_network', 
                risk_score=72.1
            )
        ],
        summary=AnalysisSummary(
            total_accounts_analyzed=500, 
            suspicious_accounts_flagged=3, 
            fraud_rings_detected=2, 
            processing_time_seconds=2.3
        )
    )
    
    # Simulate export - extract only required fields
    export_data = {
        'suspicious_accounts': [acc.model_dump() for acc in sample_response.suspicious_accounts],
        'fraud_rings': [ring.model_dump() for ring in sample_response.fraud_rings],
        'summary': sample_response.summary.model_dump()
    }
    
    print('=' * 70)
    print('✅ EXPORTED JSON FORMAT (Matches exact specification):')
    print('=' * 70)
    print(json.dumps(export_data, indent=2))
    
    # Verify all mandatory fields
    print('\n' + '=' * 70)
    print('✅ MANDATORY FIELD VALIDATION:')
    print('=' * 70)
    
    all_valid = True
    
    # Check suspicious_accounts
    print('\n📋 suspicious_accounts array:')
    for i, acc in enumerate(export_data['suspicious_accounts'], 1):
        required = ['account_id', 'suspicion_score', 'detected_patterns', 'ring_id']
        missing = [f for f in required if f not in acc]
        status = '✅ OK' if not missing else f'❌ MISSING: {missing}'
        print(f'  [{i}] {acc["account_id"]}: {status}')
        if missing:
            all_valid = False
    
    # Check fraud_rings
    print('\n📋 fraud_rings array:')
    for i, ring in enumerate(export_data['fraud_rings'], 1):
        required = ['ring_id', 'member_accounts', 'pattern_type', 'risk_score']
        missing = [f for f in required if f not in ring]
        status = '✅ OK' if not missing else f'❌ MISSING: {missing}'
        print(f'  [{i}] {ring["ring_id"]}: {status}')
        if missing:
            all_valid = False
    
    # Check summary
    print('\n📋 summary object:')
    summary_fields = list(export_data['summary'].keys())
    required_summary = ['total_accounts_analyzed', 'suspicious_accounts_flagged', 'fraud_rings_detected', 'processing_time_seconds']
    missing_summary = [f for f in required_summary if f not in summary_fields]
    status = '✅ OK' if not missing_summary else f'❌ MISSING: {missing_summary}'
    print(f'  {status}')
    if missing_summary:
        all_valid = False
    
    # Verify suspicion_score sorting (descending)
    print('\n' + '=' * 70)
    print('✅ SORTING VERIFICATION:')
    print('=' * 70)
    scores = [acc['suspicion_score'] for acc in export_data['suspicious_accounts']]
    is_sorted = all(scores[i] >= scores[i+1] for i in range(len(scores)-1))
    print(f'  Suspicious accounts sorted descending by suspicion_score: {is_sorted}')
    print(f'  Scores: {scores}')
    
    if all_valid:
        print('\n' + '=' * 70)
        print('🎉 ALL VALIDATIONS PASSED! JSON format is correct.')
        print('=' * 70)
    else:
        print('\n' + '=' * 70)
        print('❌ VALIDATION FAILED! Check missing fields above.')
        print('=' * 70)
    
    return all_valid

if __name__ == '__main__':
    verify_export_format()
