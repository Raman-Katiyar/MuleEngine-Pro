import React from 'react';
import { colors } from '../colors.js';

const RingTable = ({ rings, apiUrl }) => {
  const handleDownloadJSON = async () => {
    try {
      console.log("📥 Downloading JSON results...");
      const response = await fetch(`${apiUrl}/export/json`);
      
      if (!response.ok) {
        throw new Error('Failed to download JSON');
      }
      
      // Get JSON data
      const data = await response.json();
      
      // Convert to JSON string and create blob
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mule_detection_results_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log("✅ JSON downloaded successfully");
    } catch (error) {
      console.error("❌ Download error:", error);
      alert("Failed to download JSON: " + error.message);
    }
  };

  if (!rings || rings.length === 0) {
    return (
      <div className="p-8 rounded-2xl border-2 text-center shadow-lg" style={{ backgroundColor: colors.softCream, borderColor: colors.mutedBlue }}>
        <p className="text-lg font-semibold" style={{ color: colors.mutedBlue }}>✨ No fraud rings detected in this dataset.</p>
        <p className="text-xs mt-2" style={{ color: colors.darkSlateGray }}>All transactions appear to be within normal patterns.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 shadow-lg overflow-hidden" style={{ backgroundColor: colors.softCream, borderColor: colors.mutedCoral }}>
      <div className="p-6 border-b-2 flex justify-between items-center" style={{ backgroundColor: colors.mutedCoral, borderColor: colors.mutedCoral }}>
        <h3 className="font-bold text-white">
          🚨 Detected Fraud Rings ({rings.length})
        </h3>
        <button
          onClick={handleDownloadJSON}
          className="text-white px-4 py-2 rounded-lg text-sm font-bold transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
          style={{ backgroundColor: colors.mutedBlue }}
        >
          📥 Download JSON
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs uppercase tracking-wider border-b-2" style={{ backgroundColor: '#F9F6F1', borderColor: colors.mutedBlue, color: colors.mutedBlue }}>
              <th className="px-6 py-4 font-black">Ring ID</th>
              <th className="px-6 py-4 font-black">Pattern Type</th>
              <th className="px-6 py-4 font-black">Members</th>
              <th className="px-6 py-4 font-black">Risk Score</th>
              <th className="px-6 py-4 font-black">Account IDs</th>
            </tr>
          </thead>
          <tbody>
            {rings.map((ring, idx) => (
              <tr key={ring.ring_id} className="border-b hover-bg transition-all" style={{ borderColor: colors.mutedCoral + '30', backgroundColor: idx % 2 === 0 ? 'white' : colors.softCream }}>
                <td className="px-6 py-5 font-mono text-sm font-black" style={{ color: colors.mutedCoral, backgroundColor: idx % 2 === 0 ? colors.softCream : 'white' }}>
                  {ring.ring_id}
                </td>
                <td className="px-6 py-5">
                  <span className="px-3 py-2 rounded-xl text-xs font-black border-2" style={{ backgroundColor: colors.softCream, color: colors.mutedCoral, borderColor: colors.mutedCoral }}>
                    {ring.pattern_type?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm font-bold" style={{ color: colors.mutedBlue }}>
                  {ring.member_accounts.length} nodes
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-lg" style={{ color: ring.risk_score > 80 ? colors.mutedCoral : colors.mutedBlue }}>
                      {ring.risk_score.toFixed(1)}
                    </span>
                    <div className="w-24 rounded-full h-3" style={{ backgroundColor: colors.lightGray }}>
                      <div 
                        className="h-3 rounded-full transition-all"
                        style={{ 
                          width: `${ring.risk_score}%`,
                          backgroundColor: ring.risk_score > 80 ? colors.mutedCoral : colors.mutedBlue
                        }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {ring.member_accounts.length <= 5 ? (
                      ring.member_accounts.map(acc => (
                        <span 
                          key={acc} 
                          className="px-3 py-1.5 rounded-lg border-2 font-mono font-bold hover:opacity-80 transition-opacity text-white"
                          style={{ backgroundColor: colors.mutedCoral, borderColor: colors.mutedCoral }}
                        >
                          {acc}
                        </span>
                      ))
                    ) : (
                      <>
                        {ring.member_accounts.slice(0, 5).map(acc => (
                          <span 
                            key={acc} 
                            className="px-3 py-1.5 rounded-lg border-2 font-mono font-bold hover:opacity-80 transition-opacity text-white"
                            style={{ backgroundColor: colors.mutedCoral, borderColor: colors.mutedCoral }}
                          >
                            {acc}
                          </span>
                        ))}
                        <span className="italic font-black px-2 py-1.5 rounded-lg border-2" style={{ color: colors.mutedBlue, borderColor: colors.mutedBlue, backgroundColor: colors.softCream }}>
                          +{ring.member_accounts.length - 5} more
                        </span>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 text-xs border-t-2 font-semibold" style={{ backgroundColor: colors.softCream, borderColor: colors.mutedCoral, color: colors.darkSlateGray }}>
        💡 RIFT 2026 Hackathon - Money Muling Detection | Patterns: Circular Fund Routing, Smurfing (Fan-in/out), Layered Shell Networks
      </div>
    </div>
  );
};

export default RingTable;