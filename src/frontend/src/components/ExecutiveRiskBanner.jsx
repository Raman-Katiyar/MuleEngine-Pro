import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldAlt, faExclamationCircle, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { colors } from '../colors.js';

/**
 * ExecutiveRiskBanner
 * Shows overall risk verdict at a glance for fraud analysts
 */
export default function ExecutiveRiskBanner({ analysisData }) {
  if (!analysisData || !analysisData.summary) return null;

  const suspicious = analysisData.suspicious_accounts || [];
  const rings = analysisData.fraud_rings || [];
  const highRiskCount = suspicious.filter(a => a.final_risk_level === 'High').length;
  const totalSuspicious = suspicious.length;

  // Calculate overall risk level based on data
  let riskLevel = 'LOW';
  let riskColor = colors.emeraldGreen;
  let riskBgColor = 'rgba(16, 185, 129, 0.1)';
  let riskBorder = colors.emeraldGreen;
  let riskIcon = faCheckCircle;

  if (highRiskCount > 0 || rings.length > 2) {
    riskLevel = 'HIGH';
    riskColor = colors.mutedCoral;
    riskBgColor = 'rgba(224, 122, 95, 0.15)';
    riskBorder = colors.mutedCoral;
    riskIcon = faExclamationCircle;
  } else if (totalSuspicious > 5 || rings.length > 0) {
    riskLevel = 'MEDIUM';
    riskColor = colors.amberYellowBright;
    riskBgColor = 'rgba(245, 158, 11, 0.15)';
    riskBorder = colors.amberYellowBright;
    riskIcon = faExclamationTriangle;
  }

  // Detect dominant pattern
  const patternCounts = {};
  suspicious.forEach(acc => {
    (acc.detected_patterns || []).forEach(p => {
      patternCounts[p] = (patternCounts[p] || 0) + 1;
    });
  });
  const dominantPattern = Object.entries(patternCounts).sort(([,a], [,b]) => b - a)[0]?.[0]?.replace(/_/g, ' ') || 'Mixed';

  return (
    <div 
      className="rounded-2xl p-8 mb-10 border-2 shadow-xl"
      style={{ 
        background: `linear-gradient(135deg, ${riskBgColor} 0%, rgba(255, 255, 255, 0.5) 100%)`,
        borderColor: riskBorder
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
        {/* Risk Verdict Circle */}
        <div className="flex flex-col items-center justify-center md:col-span-1">
          <div 
            className="relative w-28 h-28 rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform cursor-help"
            style={{ backgroundColor: riskColor, borderWidth: '4px', borderColor: riskBgColor }}
            title={`Overall Risk Level: ${riskLevel}. Based on ${highRiskCount} high-risk accounts and ${rings.length} fraud rings detected.`}
          >
            <div className="text-center">
              <FontAwesomeIcon icon={riskIcon} className="text-3xl text-white mb-2" />
              <div className="text-white font-black text-lg">{riskLevel}</div>
            </div>
          </div>
          <div className="text-xs font-semibold mt-2 text-center" style={{ color: riskColor }}>
            Risk Verdict
          </div>
        </div>

        {/* Key Metrics */}
        <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Fraud Rings */}
          <div 
            className="p-4 rounded-xl border border-opacity-20 cursor-help"
            style={{ backgroundColor: `rgba(224, 122, 95, 0.08)`, borderColor: colors.mutedCoral }}
            title="Number of coordinated fraud networks identified in the transaction graph"
          >
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.darkSlateGray }}>
              Fraud Rings Detected
            </div>
            <div className="text-3xl font-black mt-2" style={{ color: colors.mutedCoral }}>
              {rings.length}
            </div>
            <div className="text-xs mt-2" style={{ color: colors.darkSlateGray }}>
              {rings.length > 0 ? 'Coordinated groups found' : 'No rings detected'}
            </div>
          </div>

          {/* Flagged Accounts */}
          <div 
            className="p-4 rounded-xl border border-opacity-20 cursor-help"
            style={{ backgroundColor: `rgba(90, 125, 154, 0.08)`, borderColor: colors.mutedBlue }}
            title="Total number of accounts flagged as suspicious based on risk scoring"
          >
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.darkSlateGray }}>
              Flagged Accounts
            </div>
            <div className="text-3xl font-black mt-2" style={{ color: colors.mutedBlue }}>
              {totalSuspicious}
            </div>
            <div className="text-xs mt-2" style={{ color: colors.darkSlateGray }}>
              {highRiskCount} high-risk accounts
            </div>
          </div>

          {/* Dominant Pattern */}
          <div 
            className="p-4 rounded-xl border border-opacity-20 cursor-help"
            style={{ backgroundColor: `rgba(245, 158, 11, 0.08)`, borderColor: colors.amberYellowBright }}
            title="Most frequently detected fraud pattern in the dataset"
          >
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.darkSlateGray }}>
              Primary Pattern
            </div>
            <div className="text-base font-black mt-2 truncate" style={{ color: colors.amberYellowBright }}>
              {dominantPattern}
            </div>
            <div className="text-xs mt-2" style={{ color: colors.darkSlateGray }}>
              Most frequent threat
            </div>
          </div>
        </div>
      </div>

      {/* Risk Level Explanation */}
      <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
        <div className="flex items-start gap-3">
          <FontAwesomeIcon icon={faShieldAlt} className="mt-1" style={{ color: riskColor }} />
          <div>
            <p className="font-semibold text-sm" style={{ color: colors.mutedBlue }}>
              {riskLevel === 'HIGH' && '🔴 High Risk: Immediate investigation recommended'}
              {riskLevel === 'MEDIUM' && '🟠 Medium Risk: Further analysis advised'}
              {riskLevel === 'LOW' && '🟢 Low Risk: Minimal fraud indicators detected'}
            </p>
            <p className="text-xs mt-1" style={{ color: colors.darkSlateGray }}>
              {riskLevel === 'HIGH' && 'Multiple fraud patterns and coordinated activities detected. Recommend case escalation.'}
              {riskLevel === 'MEDIUM' && 'Some suspicious patterns detected but not conclusive. Review flagged accounts in detail.'}
              {riskLevel === 'LOW' && 'Transaction flow appears normal with minimal anomalies.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
