import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faCircle, faBullseye, faRobot, faUsers } from '@fortawesome/free-solid-svg-icons';
import { colors, getRiskColor } from '../colors.js';

// Import new and existing components
import ExecutiveRiskBanner from './ExecutiveRiskBanner.jsx';
import StatsSummary from './StatsSummary.jsx';
import RingTable from './RingTable.jsx';
import GraphView from './GraphView.jsx';
import AIRiskAnalysis from './AIRiskAnalysis.jsx';
import CollapsibleSection from './CollapsibleSection.jsx';
import ExplainableAIPanel from './ExplainableAIPanel.jsx';

export default function ResultsPage({ analysisData, graphData, apiUrl }) {
  const [graphFilters, setGraphFilters] = useState('all'); // all, high, medium

  if (!analysisData) {
    return (
      <div className="p-8 text-center" style={{ color: colors.mutedBlue }}>
        <p className="text-lg font-bold">No analysis data available.</p>
      </div>
    );
  }

  const suspicious_accounts = analysisData.suspicious_accounts || [];
  const high_risk_accounts = suspicious_accounts.filter(a => (a.suspicion_score || 0) >= 70);

  return (
    <div data-section="results" className="space-y-12 animate-in fade-in duration-500 relative z-10">
      {/* ============================================
          1. EXECUTIVE RISK VERDICT BANNER
         ============================================ */}
      <ExecutiveRiskBanner analysisData={analysisData} />

      {/* ============================================
          2. ANALYSIS SUMMARY CARDS
         ============================================ */}
      <section>
        <StatsSummary summary={analysisData?.summary || {}} />
      </section>

      {/* ============================================
          3. DETECTED FRAUD RINGS (FULL WIDTH)
         ============================================ */}
      {analysisData.fraud_rings && analysisData.fraud_rings.length > 0 && (
        <section>
          <RingTable
            rings={analysisData.fraud_rings || []}
            suspicious_accounts={suspicious_accounts}
            summary={analysisData?.summary || {}}
            apiUrl={apiUrl}
          />
        </section>
      )}

      {/* ============================================
          4. TRANSACTION NETWORK GRAPH
         ============================================ */}
      <section className="rounded-2xl border-2 shadow-lg overflow-hidden" style={{
        borderColor: colors.emeraldGreen,
        background: `linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(255, 255, 255, 0.4) 100%)`
      }}>
        <div className="p-6 border-b-2 flex items-center justify-between" style={{
          borderColor: colors.emeraldGreen,
          backgroundColor: colors.mutedBlue
        }}>
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faChartLine} /> Transaction Network Graph
            </h2>
            <p className="text-xs text-white mt-2 opacity-90">
              Visual relationship map of all flagged accounts
            </p>
          </div>

          {/* Graph Filter */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-white font-semibold">Filter:</span>
            {['all', 'high', 'medium'].map(filter => (
              <button
                key={filter}
                onClick={() => setGraphFilters(filter)}
                className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                  graphFilters === filter
                    ? 'shadow-lg scale-105'
                    : 'opacity-60 hover:opacity-90'
                }`}
                style={{
                  backgroundColor: graphFilters === filter ? colors.mutedBlue : 'rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
              >
                {filter === 'all' && 'All'}
                {filter === 'high' && 'High Risk'}
                {filter === 'medium' && 'Medium'}
              </button>
            ))}
          </div>
        </div>

        {/* Graph Legend */}
        <div className="px-6 py-4 flex items-center justify-center gap-6 border-b" style={{ background: 'rgba(255, 255, 255, 0.3)' }}>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <FontAwesomeIcon icon={faCircle} style={{ color: 'green' }} /> No Risk
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <FontAwesomeIcon icon={faCircle} style={{ color: colors.amberYellowBright }} /> Low Risk
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <FontAwesomeIcon icon={faCircle} style={{ color: colors.mutedCoral }} /> High Risk
          </div>
        </div>

        {/* Graph Component */}
        <div className="p-6" style={{ minHeight: '600px' }}>
          <GraphView
            graphData={graphData || { nodes: [], edges: [] }}
            suspiciousAccounts={suspicious_accounts}
            filter={graphFilters}
          />
        </div>
      </section>

      {/* ============================================
          5. TOP FLAGGED ACCOUNTS (FULL WIDTH)
         ============================================ */}
      {suspicious_accounts.length > 0 && (
        <section className="rounded-2xl border-2 shadow-lg overflow-hidden" style={{
          borderColor: colors.mutedBlue,
          background: `linear-gradient(135deg, rgba(90, 125, 154, 0.08) 0%, rgba(255, 255, 255, 0.4) 100%)`
        }}>
          <div className="p-8 border-b-2" style={{ borderColor: colors.mutedBlue, backgroundColor: colors.mutedBlue }}>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faUsers} /> Top Flagged Accounts
            </h2>
            <p className="text-sm text-white mt-2 opacity-90">
              {suspicious_accounts.length} suspicious account{suspicious_accounts.length !== 1 ? 's' : ''} identified
              {high_risk_accounts.length > 0 && ` • ${high_risk_accounts.length} HIGH RISK`}
            </p>
          </div>

          <div className="p-8">
            {/* Account Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suspicious_accounts.slice(0, 15).map((acc, idx) => {
                // Use suspicion_score for consistency with graph colors
                const suspicionScore = acc.suspicion_score || 0;
                const isHighRisk = suspicionScore >= 70;
                const isMediumRisk = suspicionScore >= 35 && suspicionScore < 70;
                const isLowRisk = suspicionScore < 35;

                const riskColor = isHighRisk ? colors.crimsonRed :
                                  isMediumRisk ? colors.amberYellow :
                                  colors.emeraldGreen;

                const bgColor = isHighRisk ? 'rgba(220, 38, 38, 0.15)' :
                                isMediumRisk ? 'rgba(217, 119, 6, 0.15)' :
                                'rgba(16, 185, 129, 0.1)';

                const riskLabel = isHighRisk ? 'HIGH' :
                                  isMediumRisk ? 'MEDIUM' :
                                  'LOW';

                return (
                  <div
                    key={acc.account_id}
                    className="p-4 rounded-xl border-2 hover:shadow-lg transition-all"
                    style={{
                      backgroundColor: bgColor,
                      borderColor: riskColor,
                      borderWidth: isHighRisk ? '2px' : '1px',
                      boxShadow: isHighRisk ? `inset 0 0 12px ${riskColor}20` : 'none'
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-sm truncate" style={{ color: riskColor }}>
                          {acc.account_id}
                        </p>
                        <p className="text-xs mt-1" style={{ color: colors.darkSlateGray }}>
                          {acc.activity_count || 0} transactions
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-white px-2.5 py-1 rounded" style={{ backgroundColor: riskColor }}>
                          {riskLabel}
                        </div>
                        <div className="text-xs font-black mt-1" style={{ color: riskColor }}>
                          {(suspicionScore || 0).toFixed(1)}/100
                        </div>
                      </div>
                    </div>

                    {/* Patterns */}
                    {acc.detected_patterns && acc.detected_patterns.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {acc.detected_patterns.slice(0, 2).map((p, i) => (
                          <span
                            key={i}
                            className="text-[10px] text-white px-2 py-0.5 rounded font-semibold"
                            style={{ backgroundColor: riskColor }}
                          >
                            {p.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {acc.detected_patterns.length > 2 && (
                          <span className="text-[10px] px-2 py-0.5" style={{ color: riskColor }}>
                            +{acc.detected_patterns.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Ring Info */}
                    {acc.ring_id && (
                      <div className="text-[10px] mt-2 p-1 rounded" style={{ backgroundColor: `${riskColor}20`, color: riskColor }}>
                        Ring: <span className="font-bold">{acc.ring_id}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {suspicious_accounts.length > 15 && (
              <div className="mt-4 text-center text-sm" style={{ color: colors.darkSlateGray }}>
                +{suspicious_accounts.length - 15} more accounts
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============================================
          6. ADVANCED AI ANALYSIS (COLLAPSIBLE)
         ============================================ */}
      <CollapsibleSection
        title="Advanced AI Analysis"
        subtitle="For analysts: Detailed ML model insights and detection comparison"
        icon={faRobot}
        defaultOpen={false}
      >
        <AIRiskAnalysis analysisData={analysisData} />
      </CollapsibleSection>

      {/* ============================================
          7. EXPLAINABLE AI PANEL
         ============================================ */}
      {suspicious_accounts.length > 0 && (
        <section className="rounded-2xl border-2 shadow-lg overflow-hidden" style={{
          borderColor: colors.amberYellowBright,
          background: `linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(255, 255, 255, 0.4) 100%)`
        }}>
          <div className="p-8 border-b-2" style={{
            borderColor: colors.amberYellowBright,
            backgroundColor: colors.amberYellowBright
          }}>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              Why Were These Accounts Flagged?
            </h2>
            <p className="text-sm text-white mt-2 opacity-90">
              Explainable AI: Click any account to see detailed risk breakdown
            </p>
          </div>

          <div className="p-8">
            <ExplainableAIPanel suspicious_accounts={suspicious_accounts} />
          </div>
        </section>
      )}
    </div>
  );
}
