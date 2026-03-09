import React, { useMemo } from 'react';
import { colors } from '../colors.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

/**
 * AIRiskAnalysis Component
 * Displays AI/ML fraud risk analysis dashboard
 * Shows:
 * - Risk score distribution chart
 * - High-risk transactions table
 * - Rule vs ML detection comparison
 * - Hybrid system statistics
 */

function AIRiskAnalysis({ analysisData }) {
  // Calculate statistics
  const stats = useMemo(() => {
    if (!analysisData || !analysisData.suspicious_accounts) {
      return {
        total_accounts: 0,
        ml_anomalies: 0,
        high_risk: 0,
        medium_risk: 0,
        low_risk: 0,
        avg_ai_score: 0,
        avg_combined_score: 0
      };
    }

    const accounts = analysisData.suspicious_accounts;
    
    return {
      total_accounts: accounts.length,
      ml_anomalies: accounts.filter(a => a.anomaly_flag === 1).length,
      // count using suspicion_score thresholds to match graph colors
      high_risk: accounts.filter(a => (a.suspicion_score || 0) >= 70).length,
      medium_risk: accounts.filter(a => {
        const s = a.suspicion_score || 0;
        return s >= 35 && s < 70;
      }).length,
      low_risk: accounts.filter(a => (a.suspicion_score || 0) < 35).length,
      avg_ai_score: (accounts.reduce((sum, a) => sum + (a.ai_risk_score || 0), 0) / accounts.length).toFixed(1),
      avg_combined_score: (accounts.reduce((sum, a) => sum + (a.combined_risk_score || 0), 0) / accounts.length).toFixed(1),
      detection_method: analysisData.summary?.detection_method || 'unknown'
    };
  }, [analysisData]);

  // Get high-risk accounts
  const highRiskAccounts = useMemo(() => {
    if (!analysisData || !analysisData.suspicious_accounts) return [];
    return analysisData.suspicious_accounts
      .filter(a => (a.suspicion_score || 0) >= 70)
      .sort((a, b) => b.combined_risk_score - a.combined_risk_score)
      .slice(0, 10);
  }, [analysisData]);

  // Get rule vs ML comparison data
  const comparisonData = useMemo(() => {
    if (!analysisData || !analysisData.suspicious_accounts) return { rule_only: 0, ml_only: 0, both: 0 };
    
    const accounts = analysisData.suspicious_accounts;
    
    const rule_only = accounts.filter(a => a.suspicion_score > 20 && a.anomaly_flag === 0).length;
    const ml_only = accounts.filter(a => a.suspicion_score <= 20 && a.anomaly_flag === 1).length;
    const both = accounts.filter(a => a.suspicion_score > 20 && a.anomaly_flag === 1).length;
    
    return { rule_only, ml_only, both };
  }, [analysisData]);


  return (
    <div
      className="rounded-xl p-8 mb-8 border-2"
      style={{
        backgroundColor: colors.softCream,
        background: `linear-gradient(135deg, rgba(90, 125, 154, 0.08) 0%, rgba(224, 122, 95, 0.06) 50%, rgba(255, 255, 255, 0.4) 100%)`,
        borderColor: 'rgba(90, 125, 154, 0.2)'
      }}
    >
      {/* Header */}
      <div className="mb-8">
        <h2 style={{ color: colors.mutedBlue }} className="text-2xl font-black mb-2 flex items-center gap-2">
          <FontAwesomeIcon icon={faRobot} /> AI Fraud Risk Analysis
        </h2>
        <p style={{ color: colors.darkSlateGray }} className="text-sm">
          Hybrid Detection System: {stats.detection_method === 'hybrid' ? <><FontAwesomeIcon icon={faCheckCircle} /> Rule-Based + AI ML</> : <><FontAwesomeIcon icon={faExclamationTriangle} /> Rule-Based Only</>}
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Total Suspicious Accounts */}
        <div style={{ background: `linear-gradient(135deg, rgba(90, 125, 154, 0.15) 0%, rgba(90, 125, 154, 0.08) 100%)`, borderLeft: `4px solid ${colors.mutedBlue}` }} className="p-4 rounded-lg border border-blue-200">
          <div style={{ color: colors.darkSlateGray }} className="text-xs font-bold mb-1">SUSPICIOUS ACCOUNTS</div>
          <div style={{ color: colors.mutedBlue }} className="text-2xl font-black">{stats.total_accounts}</div>
        </div>

        {/* ML Anomalies Detected */}
        <div style={{ background: `linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%)`, borderLeft: `4px solid ${colors.amberYellowBright}` }} className="p-4 rounded-lg border border-amber-200">
          <div style={{ color: colors.darkSlateGray }} className="text-xs font-bold mb-1">ML ANOMALIES</div>
          <div style={{ color: colors.amberYellowBright }} className="text-2xl font-black">{stats.ml_anomalies}</div>
        </div>

        {/* Average AI Score */}
        <div style={{ background: `linear-gradient(135deg, rgba(224, 122, 95, 0.15) 0%, rgba(224, 122, 95, 0.08) 100%)`, borderLeft: `4px solid ${colors.mutedCoral}` }} className="p-4 rounded-lg border border-orange-200">
          <div style={{ color: colors.darkSlateGray }} className="text-xs font-bold mb-1">AVG AI SCORE</div>
          <div style={{ color: colors.mutedCoral }} className="text-2xl font-black">{stats.avg_ai_score}%</div>
        </div>

        {/* Average Combined Score */}
        <div style={{ background: `linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)`, borderLeft: `4px solid ${colors.emeraldGreen}` }} className="p-4 rounded-lg border border-green-200">
          <div style={{ color: colors.darkSlateGray }} className="text-xs font-bold mb-1">COMBINED SCORE</div>
          <div style={{ color: colors.emeraldGreen }} className="text-2xl font-black">{stats.avg_combined_score}%</div>
        </div>
      </div>

      {/* Risk Distribution */}
      <div style={{ background: `linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(247, 243, 233, 0.6) 100%)`, border: `1px solid rgba(90, 125, 154, 0.15)` }} className="rounded-lg p-6 mb-8">
        <h3 style={{ color: colors.mutedBlue }} className="font-bold mb-4">Risk Level Distribution</h3>
        <div className="flex items-end gap-4 h-40">
          {/* High Risk */}
          <div className="flex-1">
            <div className="flex flex-col items-center h-full justify-end">
              <div
                style={{
                  backgroundColor: colors.mutedCoral,
                  height: `${(stats.high_risk / Math.max(stats.high_risk, stats.medium_risk, stats.low_risk, 1)) * 150}px`
                }}
                className="w-full rounded-t"
              ></div>
              <div style={{ color: colors.darkSlateGray }} className="text-xs font-bold mt-2">HIGH</div>
              <div style={{ color: colors.mutedCoral }} className="text-xl font-black">{stats.high_risk}</div>
            </div>
          </div>

          {/* Medium Risk */}
          <div className="flex-1">
            <div className="flex flex-col items-center h-full justify-end">
              <div
                style={{
                  backgroundColor: colors.amberYellowBright,
                  height: `${(stats.medium_risk / Math.max(stats.high_risk, stats.medium_risk, stats.low_risk, 1)) * 150}px`
                }}
                className="w-full rounded-t"
              ></div>
              <div style={{ color: colors.darkSlateGray }} className="text-xs font-bold mt-2">MEDIUM</div>
              <div style={{ color: colors.amberYellowBright }} className="text-xl font-black">{stats.medium_risk}</div>
            </div>
          </div>

          {/* Low Risk */}
          <div className="flex-1">
            <div className="flex flex-col items-center h-full justify-end">
              <div
                style={{
                  backgroundColor: colors.mutedBlue,
                  height: `${(stats.low_risk / Math.max(stats.high_risk, stats.medium_risk, stats.low_risk, 1)) * 150}px`
                }}
                className="w-full rounded-t"
              ></div>
              <div style={{ color: colors.darkSlateGray }} className="text-xs font-bold mt-2">LOW</div>
              <div style={{ color: colors.mutedBlue }} className="text-xl font-black">{stats.low_risk}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detection Method Comparison */}
      <div style={{ background: `linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(247, 243, 233, 0.6) 100%)`, border: `1px solid rgba(90, 125, 154, 0.15)` }} className="rounded-lg p-6 mb-8">
        <h3 style={{ color: colors.mutedBlue }} className="font-bold mb-4">⚖️ Rule-Based vs AI Detection Overlap</h3>
        <div className="grid grid-cols-3 gap-4">
          <div style={{ background: `linear-gradient(135deg, rgba(90, 125, 154, 0.15) 0%, rgba(90, 125, 154, 0.08) 100%)`, borderLeft: `4px solid ${colors.mutedBlue}`, border: `1px solid rgba(90, 125, 154, 0.2)` }} className="p-4 rounded-lg">
            <div style={{ color: colors.darkSlateGray }} className="text-xs font-bold">RULE-BASED ONLY</div>
            <div style={{ color: colors.mutedBlue }} className="text-3xl font-black mt-2">{comparisonData.rule_only}</div>
            <div style={{ color: colors.darkSlateGray }} className="text-xs mt-2">Detected by rules</div>
          </div>
          
          <div style={{ background: `linear-gradient(135deg, rgba(224, 122, 95, 0.15) 0%, rgba(224, 122, 95, 0.08) 100%)`, borderLeft: `4px solid ${colors.mutedCoral}`, border: `1px solid rgba(224, 122, 95, 0.2)` }} className="p-4 rounded-lg">
            <div style={{ color: colors.darkSlateGray }} className="text-xs font-bold">BOTH DETECTED</div>
            <div style={{ color: colors.mutedCoral }} className="text-3xl font-black mt-2">{comparisonData.both}</div>
            <div style={{ color: colors.darkSlateGray }} className="text-xs mt-2">High confidence</div>
          </div>

          <div style={{ background: `linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%)`, borderLeft: `4px solid ${colors.amberYellowBright}`, border: `1px solid rgba(245, 158, 11, 0.2)` }} className="p-4 rounded-lg">
            <div style={{ color: colors.darkSlateGray }} className="text-xs font-bold">ML ONLY</div>
            <div style={{ color: colors.amberYellowBright }} className="text-3xl font-black mt-2">{comparisonData.ml_only}</div>
            <div style={{ color: colors.darkSlateGray }} className="text-xs mt-2">AI detected anomalies</div>
          </div>
        </div>
      </div>

      {/* High-Risk Accounts Table */}
      {highRiskAccounts.length > 0 && (
        <div style={{ background: `linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(247, 243, 233, 0.6) 100%)`, border: `1px solid rgba(224, 122, 95, 0.2)` }} className="rounded-lg p-6">
          <h3 style={{ color: colors.mutedBlue }} className="font-bold mb-4">🔥 Top 10 High-Risk Accounts</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: `linear-gradient(135deg, rgba(224, 122, 95, 0.15) 0%, rgba(224, 122, 95, 0.08) 100%)`, borderBottom: `2px solid ${colors.mutedCoral}` }}>
                  <th style={{ color: colors.mutedBlue }} className="text-left p-3 font-bold">Account ID</th>
                  <th style={{ color: colors.mutedBlue }} className="text-left p-3 font-bold">Rule Score</th>
                  <th style={{ color: colors.mutedBlue }} className="text-left p-3 font-bold">AI Score</th>
                  <th style={{ color: colors.mutedBlue }} className="text-left p-3 font-bold">Combined</th>
                  <th style={{ color: colors.mutedBlue }} className="text-left p-3 font-bold">Anomaly</th>
                  <th style={{ color: colors.mutedBlue }} className="text-left p-3 font-bold">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {highRiskAccounts.map((account, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${colors.softCream}` }}>
                    {(() => {
                      const score = account.suspicion_score || 0;
                      const isHigh = score >= 70;
                      const isMedium = score >= 35 && score < 70;
                      const color = isHigh ? colors.crimsonRed : isMedium ? colors.amberYellowBright : colors.emeraldGreen;
                      const label = isHigh ? 'HIGH' : isMedium ? 'MEDIUM' : 'LOW';
                      return (
                        <>
                          <td style={{ color }} className="p-3 font-mono text-xs">{account.account_id}</td>
                          <td style={{ color: colors.darkSlateGray }} className="p-3">{score.toFixed(1)}</td>
                          <td style={{ color: colors.darkSlateGray }} className="p-3">{account.ai_risk_score.toFixed(1)}</td>
                          <td style={{ color: colors.darkSlateGray }} className="p-3 font-bold">{account.combined_risk_score.toFixed(1)}</td>
                          <td className="p-3">
                            {account.anomaly_flag === 1 ? (
                              <span style={{ backgroundColor: colors.mutedCoral, color: colors.white }} className="px-2 py-1 rounded text-xs font-bold">
                                YES
                              </span>
                            ) : (
                              <span style={{ backgroundColor: colors.softCream, color: colors.darkSlateGray }} className="px-2 py-1 rounded text-xs">
                                NO
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span
                              style={{
                                backgroundColor: color,
                                color: colors.white
                              }}
                              className="px-2 py-1 rounded text-xs font-bold"
                            >
                              {label}
                            </span>
                          </td>
                        </>
                      );
                    })()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIRiskAnalysis;
