import React from 'react';
import { colors } from '../colors.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faExclamationTriangle, faBullseye, faBolt, faChartBar } from '@fortawesome/free-solid-svg-icons';

const StatCard = ({ label, value, subtext, colorClass, icon, gradient, delay, tooltip }) => (
  <div 
    className="rounded-3xl p-8 shadow-lg card-hover border-2 overflow-hidden relative group transition-all duration-300 cursor-help"
    style={{ 
      borderColor: colors.mutedBlue,
      animation: `fadeInUp 0.6s ease-out ${delay}s both`,
      background: `linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(247, 243, 233, 0.8) 100%)`
    }}
    title={tooltip}
  >
    {/* Background Glow Effect */}
    <div 
      className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
      style={{ backgroundColor: colors.mutedBlue }}
    />
    
    {/* Background SVG Pattern */}
    <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden rounded-3xl">
      <svg viewBox="0 0 300 300" className="w-full h-full">
        <defs>
          <pattern id={`statPattern-${label}`} x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
            <circle cx="25" cy="25" r="20" fill="none" stroke={colors.mutedBlue} strokeWidth="0.5" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="300" height="300" fill={`url(#statPattern-${label})`} />
      </svg>
    </div>
    
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: colors.mutedBlue }}>
            {label}
          </p>
        </div>
        <span className="text-4xl transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
          {icon}
        </span>
      </div>
      
      <div className={`text-5xl font-black mb-3 drop-shadow-lg ${colorClass} transition-all duration-300 group-hover:scale-110 origin-left`}>
        {value}
      </div>
      
      <p className="text-xs font-medium leading-relaxed" style={{ color: colors.darkSlateGray }}>
        {subtext}
      </p>

      {/* Bottom Accent Bar */}
      <div 
        className="mt-4 h-1 rounded-full w-0 group-hover:w-full transition-all duration-300"
        style={{ backgroundColor: colors.mutedBlue }}
      />
    </div>
  </div>
);

const StatsSummary = ({ summary }) => {
  if (!summary) return null;

  // safe defaults to avoid runtime errors when fields are missing
  const totalAccounts = Number.isFinite(summary.total_accounts_analyzed) ? summary.total_accounts_analyzed : (summary.total_accounts_analyzed ?? 0);
  const flagged = Number.isFinite(summary.suspicious_accounts_flagged) ? summary.suspicious_accounts_flagged : (summary.suspicious_accounts_flagged ?? 0);
  const rings = Number.isFinite(summary.fraud_rings_detected) ? summary.fraud_rings_detected : (summary.fraud_rings_detected ?? 0);
  const procTime = Number.isFinite(summary.processing_time_seconds) ? summary.processing_time_seconds : (summary.processing_time_seconds ?? 0);

  const stats = [
    {
      label: "Accounts Analyzed",
      value: (totalAccounts || 0).toLocaleString(),
      subtext: "Total unique entities in graph",
      colorClass: "text-blue-600",
      icon: <FontAwesomeIcon icon={faUsers} />,
      delay: 0.1,
      tooltip: "Total number of unique accounts processed in the analysis"
    },
    {
      label: "Flagged Accounts",
      value: flagged || 0,
      subtext: "Exhibiting high-risk patterns",
      colorClass: "text-orange-600",
      icon: <FontAwesomeIcon icon={faExclamationTriangle} />,
      delay: 0.2,
      tooltip: "Accounts requiring further investigation based on risk scores"
    },
    {
      label: "Fraud Rings",
      value: rings || 0,
      subtext: "Coordinated group activities",
      colorClass: "text-red-600",
      icon: <FontAwesomeIcon icon={faBullseye} />,
      delay: 0.3,
      tooltip: "Number of coordinated fraud networks detected"
    },
    {
      label: "Processing Time",
      value: `${(procTime || 0).toFixed(2)}s`,
      subtext: "Graph traversal & scoring latency",
      colorClass: "text-cyan-600",
      icon: <FontAwesomeIcon icon={faBolt} />,
      delay: 0.4,
      tooltip: "Time taken to analyze and score all transactions"
    }
  ];

  return (
    <div>
      {/* Section Header */}
      <div className="mb-12">
        <h2 className="text-3xl font-black mb-2 flex items-center gap-2" style={{ color: colors.mutedBlue }}>
          <FontAwesomeIcon icon={faChartBar} /> Analysis Summary
        </h2>
        <p className="text-sm" style={{ color: colors.darkSlateGray }}>
          Key metrics from your transaction analysis
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <StatCard 
            key={idx}
            {...stat}
          />
        ))}
      </div>
    </div>
  );
};

export default StatsSummary;