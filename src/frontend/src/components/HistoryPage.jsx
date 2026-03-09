import React, { useEffect } from 'react';
import { colors } from '../colors.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faBullseye, faClock, faChartLine, faTimes, faArrowRight } from '@fortawesome/free-solid-svg-icons';

function HistoryPage({ history, onClose, onSelectHistory, isLoading = false }) {
  // ensure user always sees top when arriving
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleSelectAnalysis = (analysis) => {
    // Trigger parent to load the selected analysis (parent will navigate to results).
    // Do not call onClose here because it currently navigates back to `/` and
    // would override the navigation to `/results` performed by the parent.
    onSelectHistory(analysis);
  };

  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div 
        className="border-b-2 px-6 py-4 flex justify-between items-center"
        style={{ 
          backgroundColor: colors.mutedBlue,
          borderColor: colors.mutedCoral,
          color: colors.white
        }}
      >
        <div className="flex items-center gap-3">
          <FontAwesomeIcon icon={faHistory} className="text-2xl" />
          <h2 className="text-2xl font-black">Analysis History</h2>
        </div>
        <button
          onClick={onClose}
          className="text-2xl font-bold hover:opacity-80 transition-opacity"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: colors.mutedBlue }}>Loading history...</p>
          </div>
        ) : history && history.length > 0 ? (
          <div className="space-y-4">
            {history.map((analysis, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectAnalysis(analysis)}
                className="p-4 rounded-2xl border-2 cursor-pointer hover:shadow-lg transition-all hover:scale-102"
                style={{ 
                  borderColor: colors.mutedBlue,
                  backgroundColor: `rgba(90, 125, 154, 0.05)`,
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: colors.mutedBlue }}>
                      <FontAwesomeIcon icon={faChartLine} /> Analysis #{history.length - idx}
                    </h3>
                    <p className="text-xs mt-1" style={{ color: colors.darkSlateGray }}>
                      {formatDate(analysis.timestamp || new Date().toISOString())}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black" style={{ color: colors.amberYellowBright }}>
                      {analysis.summary?.fraud_rings_detected || 0}
                    </p>
                    <p className="text-xs" style={{ color: colors.darkSlateGray }}>
                      Fraud Rings
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `rgba(245, 158, 11, 0.1)` }}>
                    <p className="text-xs font-semibold" style={{ color: colors.amberYellowBright }}>
                      <FontAwesomeIcon icon={faBullseye} /> Suspicious Accounts
                    </p>
                    <p className="text-lg font-black" style={{ color: colors.amberYellowBright }}>
                      {analysis.summary?.suspicious_accounts_flagged || 0}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `rgba(90, 125, 154, 0.1)` }}>
                    <p className="text-xs font-semibold" style={{ color: colors.mutedBlue }}>
                      <FontAwesomeIcon icon={faClock} /> Processing Time
                    </p>
                    <p className="text-lg font-black" style={{ color: colors.mutedBlue }}>
                      {(analysis.summary?.processing_time_seconds || 0).toFixed(2)}s
                    </p>
                  </div>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `rgba(16, 185, 129, 0.1)` }}>
                    <p className="text-xs font-semibold" style={{ color: colors.emeraldGreen }}>
                      <FontAwesomeIcon icon={faChartLine} /> Transactions
                    </p>
                    <p className="text-lg font-black" style={{ color: colors.emeraldGreen }}>
                      {analysis.summary?.total_transactions || 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs" style={{ color: colors.darkSlateGray }}>
                    {analysis.summary?.patterns_detected?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {analysis.summary.patterns_detected.map((pattern, pidx) => (
                          <span
                            key={pidx}
                            className="px-2 py-1 rounded text-xs font-semibold text-white"
                            style={{ backgroundColor: colors.mutedBlue }}
                          >
                            {pattern.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p 
                    className="text-xs font-semibold px-3 py-1 rounded-lg flex items-center gap-1"
                    style={{ 
                      backgroundColor: colors.emeraldGreen,
                      color: colors.white
                    }}
                  >
                    Load <FontAwesomeIcon icon={faArrowRight} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg mb-2" style={{ color: colors.mutedBlue }}>
               No Analysis History
            </p>
            <p className="text-sm" style={{ color: colors.darkSlateGray }}>
              Run analysis on CSV files to see history here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryPage;
