import React, { useState } from 'react';
import FileUpload from './components/FileUpload.jsx';
import StatsSummary from './components/StatsSummary.jsx';
import GraphView from './components/GraphView.jsx';
import RingTable from './components/RingTable.jsx';
import { colors } from './colors.js';

function App() {
  const [analysisData, setAnalysisData] = useState(null);
  const [graphData, setGraphData] = useState(null);
  
  // In production on Render, REACT_APP_API_URL is injected. Defaults to backend service URL.
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const handleAnalysis = (data) => {
    console.log("📊 Analysis Response Received:", data); 
    console.log("Graph Data Check:", { 
      hasGraphData: !!data.graph_data,
      nodes: data.graph_data?.nodes?.length || 0,
      edges: data.graph_data?.edges?.length || 0
    });
    
    setAnalysisData(data);
    
    if (data?.graph_data) {
      console.log("✓ Setting graph data from response.graph_data");
      setGraphData(data.graph_data);
    } 
    else if (data?.graph) {
      console.log("✓ Setting graph data from response.graph");
      setGraphData(data.graph);
    }
    else {
      console.warn("⚠️ No graph data found in response!");
      setGraphData({ nodes: [], edges: [] });
    }
  };

  return (
    <div style={{ backgroundColor: colors.softCream }} className="min-h-screen">
      {/* Header */}
      <nav style={{ backgroundColor: colors.mutedBlue }} className="border-b shadow-lg sticky top-0 z-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black" style={{ color: colors.white }}>
                🚨 MuleEngine Pro
              </h1>
              <p className="text-xs mt-1 ml-12" style={{ color: colors.amberYellowBright }}>Money Muling Detection</p>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold" style={{ color: colors.darkSlateGray }}>🔒 Financial Crime Detection</p>
              <p style={{ color: colors.darkSlateGray }}>AI-Powered Graph Analysis</p>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12 pb-16">
        {!analysisData ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-5xl font-black mb-4" style={{ color: colors.mutedBlue }}>Financial Forensics Engine</h2>
              <p className="text-xl mb-8 font-semibold" style={{ color: colors.darkSlateGray }}>
                Detect Money Muling Rings through AI-Powered Graph Analysis
              </p>
              
              <div className="grid grid-cols-3 gap-6 mb-10 p-8 rounded-2xl border-2" style={{ backgroundColor: colors.softCream, borderColor: colors.mutedBlue }}>
                <div className="text-center hover:scale-110 transition-transform">
                  <div className="text-3xl font-black" style={{ color: colors.mutedBlue }}>3</div>
                  <div className="text-xs mt-2 font-semibold" style={{ color: colors.darkSlateGray }}>Detection Patterns</div>
                </div>
                <div className="text-center hover:scale-110 transition-transform">
                  <div className="text-2xl font-black" style={{ color: colors.mutedCoral }}>Graph + AI</div>
                  <div className="text-xs mt-2 font-semibold" style={{ color: colors.darkSlateGray }}>Analysis</div>
                </div>
                <div className="text-center hover:scale-110 transition-transform">
                  <div className="text-3xl font-black" style={{ color: colors.mutedBlue }}>&lt;30s</div>
                  <div className="text-xs mt-2 font-semibold" style={{ color: colors.darkSlateGray }}>⚡ Processing</div>
                </div>
              </div>
            </div>
            
            <FileUpload onAnalysisComplete={handleAnalysis} />
            
            <div className="mt-10 p-6 rounded-2xl border-2 text-sm" style={{ backgroundColor: colors.softCream, borderColor: colors.mutedBlue }}>
              <p className="font-bold mb-3" style={{ color: colors.mutedBlue }}>📋 Expected CSV Columns:</p>
              <code className="text-xs bg-white p-4 rounded-lg border-2 block mb-3 font-mono" style={{ borderColor: colors.mutedBlue, color: colors.mutedBlue }}>
                transaction_id, sender_id, receiver_id, amount, timestamp
              </code>
              <p className="text-xs" style={{ color: colors.darkSlateGray }}>📅 Timestamp Format: YYYY-MM-DD HH:MM:SS</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Summary Stats */}
            <StatsSummary summary={analysisData?.summary || {}} />
            
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Graph Visualization */}
                <div className="rounded-2xl border-2 shadow-lg overflow-hidden" style={{ backgroundColor: colors.softCream, borderColor: colors.emeraldGreen }}>
                  <div className="p-6 border-b-2" style={{ backgroundColor: colors.mutedBlue, borderColor: colors.emeraldGreen }}>
                    <h2 className="font-bold text-lg text-white">🔗 Transaction Network Graph</h2>
                    <p className="text-xs text-white mt-2">🟢 No Risk | 🟡 Low Risk | 🔴 High Risk</p>
                  </div>
                  <GraphView 
                    graphData={graphData || {nodes: [], edges: []}} 
                    suspiciousAccounts={analysisData?.suspicious_accounts || []} 
                  />
                </div>
                
                {/* Fraud Ring Table */}
                <RingTable 
                  rings={analysisData?.fraud_rings || []} 
                  apiUrl={apiUrl}
                />
              </div>
              
              {/* Sidebar: Suspicious Accounts */}
              <div className="space-y-6">
                {/* Top Flagged Accounts */}
                <div className="p-6 rounded-2xl border-2 shadow-lg" style={{ backgroundColor: colors.softCream, borderColor: colors.mutedCoral }}>
                  <h3 className="font-bold mb-4 border-b-2 pb-3 text-lg" style={{ borderColor: colors.mutedCoral, color: colors.mutedCoral }}>
                    🎯 Top Flagged Accounts
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {(analysisData?.suspicious_accounts || []).slice(0, 15).map((acc, idx) => (
                      <div key={acc.account_id} className="p-3 rounded-xl border-2 hover:shadow-lg transition-all" style={{ backgroundColor: '#FFF5F0', borderColor: colors.mutedCoral }}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono text-xs font-bold" style={{ color: colors.mutedCoral }}>{idx + 1}. {acc.account_id}</span>
                          <span className="text-xs font-black text-white px-2.5 py-1 rounded-lg" style={{ backgroundColor: colors.mutedCoral }}>
                            {acc.suspicion_score.toFixed(1)}/100
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {acc.detected_patterns?.slice(0, 2).map((p, i) => (
                            <span key={i} className="text-[10px] text-white px-2 py-1 rounded-lg font-semibold" style={{ backgroundColor: colors.mutedCoral }}>
                              {p.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                        {acc.ring_id && (
                          <div className="text-[10px] mt-2 font-mono" style={{ color: colors.mutedBlue }}>Ring: <span className="font-black" style={{ color: colors.mutedBlue }}>{acc.ring_id}</span></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Analysis Info */}
                <div className="p-6 rounded-2xl border-2 shadow-lg" style={{ backgroundColor: colors.softCream, borderColor: colors.mutedBlue }}>
                  <h3 className="font-bold mb-3 text-sm" style={{ color: colors.mutedBlue }}>ℹ️ Analysis Time: <span className="font-black" style={{ color: colors.mutedCoral }}>{analysisData?.summary?.processing_time_seconds?.toFixed(2)}s</span></h3>
                  <ul className="text-xs space-y-2 font-semibold" style={{ color: colors.mutedBlue }}>
                    <li>✅ Circular Fund Routing Detection</li>
                    <li>✅ Smurfing Pattern Detection (Fan-in/out)</li>
                    <li>✅ Shell Network Analysis</li>
                    <li>✅ False Positive Filtering</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t text-center py-8 text-xs mt-16" style={{ backgroundColor: colors.mutedBlue, borderColor: colors.mutedBlue, color: colors.softCream }}>
        <p className="font-semibold" style={{ color: colors.softCream }}>Created by: The Logic Legends || Money Muling Detection Challenge</p>
        <p className="text-[10px] mt-2" style={{ color: colors.softCream }}>Graph-Based Financial Crime Analysis Engine</p>
      </footer>
    </div>
  );
}

export default App;