import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faRobot, faBrain, faCalculator } from '@fortawesome/free-solid-svg-icons';
import { colors, getRiskColor } from '../colors.js';

export default function ExplainableAIPanel({ suspicious_accounts = [] }) {
  const [expandedAccounts, setExpandedAccounts] = useState(new Set());

  const toggleExpanded = (accountId) => {
    const newSet = new Set(expandedAccounts);
    if (newSet.has(accountId)) {
      newSet.delete(accountId);
    } else {
      newSet.add(accountId);
    }
    setExpandedAccounts(newSet);
  };

  // Show all flagged accounts (sorted by combined risk)
  const topAccounts = [...suspicious_accounts]
    .sort((a, b) => (b.combined_risk_score || 0) - (a.combined_risk_score || 0));

  if (topAccounts.length === 0) return null;

  const getRiskReasonText = (account) => {
    const reasons = [];
    const patterns = account.detected_patterns || [];
    
    if (patterns.includes('circular_routing')) {
      reasons.push('Circular routing detected - funds flowing in loops');
    }
    if (patterns.includes('smurfing')) {
      reasons.push('Smurfing pattern - multiple small transactions');
    }
    if (patterns.includes('shell_account')) {
      reasons.push('Shell account behavior - minimal activity');
    }
    if ((account.suspicion_score || 0) > 80) {
      reasons.push('High transaction volume anomaly');
    }
    if ((account.ai_risk_score || 0) > 75) {
      reasons.push('ML model detected behavioral anomaly');
    }
    
    return reasons.length > 0 ? reasons : ['Flagged by analysis system'];
  };

  // remove local risk logic - use shared palette from colors.js
  // (maintained separately for this panel earlier)

  return (
    <div className="space-y-3">
      {topAccounts.map((account) => {
        const isExpanded = expandedAccounts.has(account.account_id);
        const ruleScore = account.suspicion_score || 0;
        const mlScore = account.ai_risk_score || 0;
        const combinedScore = account.combined_risk_score || 0;
        const reasons = getRiskReasonText(account);

        // determine panel color based on suspicion score (same as graph/ring cards)
        const panelColor = getRiskColor(ruleScore);
        const panelBg = `${panelColor}22`;

        return (
          <div
            key={account.account_id}
            className="rounded-lg border-2 overflow-hidden transition-all"
            style={{
              borderColor: panelColor,
              background: `linear-gradient(135deg, ${panelBg} 0%, rgba(255, 255, 255, 0.4) 100%)`
            }}
          >
            {/* Summary Row */}
            <button
              onClick={() => toggleExpanded(account.account_id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: panelColor }}>
                    {account.account_id}
                  </p>
                  <p className="text-xs mt-1" style={{ color: colors.darkSlateGray }}>
                    {reasons[0]}
                  </p>
                </div>
              </div>

              {/* Risk Score Badges */}
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xs font-bold" style={{ color: panelColor }}>
                    {combinedScore.toFixed(1)}/100
                  </div>
                  <div className="text-[10px]" style={{ color: colors.darkSlateGray }}>
                    Combined
                  </div>
                </div>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`text-sm transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                  style={{ color: panelColor }}
                />
              </div>
            </button>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="px-4 py-4 border-t-2" style={{ borderColor: panelColor, background: 'rgba(255, 255, 255, 0.5)' }}>
                {/* Risk Score Breakdown */}
                <div className="mb-4">
                  <h4 className="text-xs font-bold mb-3" style={{ color: colors.mutedBlue }}>
                    📊 Risk Score Breakdown
                  </h4>
                  <div className="space-y-2">
                    {/* Rule-Based Score */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-2" style={{ color: colors.mutedBlue }}>
                          <FontAwesomeIcon icon={faCalculator} className="text-xs" />
                          Rule-Based Score
                        </span>
                        <span className="font-bold" style={{ color: getRiskColor(ruleScore) }}>
                          {ruleScore.toFixed(1)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(ruleScore, 100)}%`,
                            backgroundColor: getRiskColor(ruleScore)
                          }}
                        />
                      </div>
                    </div>

                    {/* ML Score */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-2" style={{ color: colors.mutedBlue }}>
                          <FontAwesomeIcon icon={faBrain} className="text-xs" />
                          AI/ML Score
                        </span>
                        <span className="font-bold" style={{ color: getRiskColor(mlScore) }}>
                          {mlScore.toFixed(1)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(mlScore, 100)}%`,
                            backgroundColor: getRiskColor(mlScore)
                          }}
                        />
                      </div>
                    </div>

                    {/* Combined Score */}
                    <div className="mt-2 p-2 rounded" style={{ backgroundColor: `${getRiskColor(combinedScore)}15` }}>
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="flex items-center gap-2" style={{ color: getRiskColor(combinedScore) }}>
                          <FontAwesomeIcon icon={faRobot} className="text-xs" />
                          Combined Score
                        </span>
                        <span style={{ color: getRiskColor(combinedScore) }}>
                          {combinedScore.toFixed(1)}/100
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Reasons */}
                <div>
                  <h4 className="text-xs font-bold mb-2" style={{ color: colors.mutedBlue }}>
                    🧠 Why Flagged
                  </h4>
                  <ul className="space-y-1">
                    {reasons.map((reason, idx) => (
                      <li key={idx} className="text-xs flex items-start gap-2" style={{ color: colors.darkSlateGray }}>
                        <span style={{ color: getRiskColor(combinedScore) }}>•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Detected Patterns */}
                {account.detected_patterns && account.detected_patterns.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-bold mb-2" style={{ color: colors.mutedBlue }}>
                      🔍 Detected Patterns
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {account.detected_patterns.map((pattern, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-[10px] font-semibold rounded text-white"
                          style={{ backgroundColor: getRiskColor(combinedScore) }}
                        >
                          {pattern.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
