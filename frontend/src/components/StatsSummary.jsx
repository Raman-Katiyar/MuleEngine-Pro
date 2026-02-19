import React from 'react';
import { colors } from '../colors.js';

const StatCard = ({ label, value, subtext, colorClass, icon, gradient }) => (
  <div className="rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-2" style={{ backgroundColor: colors.softCream, borderColor: colors.mutedBlue }}>
    <div className="flex items-start justify-between mb-4">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: colors.mutedBlue }}>{label}</p>
      <span className="text-3xl">{icon}</span>
    </div>
    <div className={`text-4xl font-black mb-2 drop-shadow-lg ${colorClass}`}>
      {value}
    </div>
    <p className="text-xs font-medium" style={{ color: colors.darkSlateGray }}>{subtext}</p>
  </div>
);

const StatsSummary = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
      <StatCard 
        label="Accounts Analyzed" 
        value={summary.total_accounts_analyzed.toLocaleString()} 
        subtext="Total unique entities in graph"
        colorClass="text-blue-600"
        icon="👥"
        gradient="from-blue-100 to-blue-50"
      />
      
      <StatCard 
        label="Flagged Accounts" 
        value={summary.suspicious_accounts_flagged} 
        subtext="Exhibiting high-risk patterns"
        colorClass="text-orange-600"
        icon="⚠️"
        gradient="from-orange-100 to-orange-50"
      />
      
      <StatCard 
        label="Fraud Rings" 
        value={summary.fraud_rings_detected} 
        subtext="Coordinated group activities"
        colorClass="text-red-600"
        icon="🎯"
        gradient="from-red-100 to-red-50"
      />
      
      <StatCard 
        label="Processing Time" 
        value={`${summary.processing_time_seconds}s`} 
        subtext="Graph traversal & scoring latency"
        colorClass="text-blue-600"
        icon="⚡"
        gradient="from-cyan-100 to-cyan-50"
      />
    </div>
  );
};

export default StatsSummary;