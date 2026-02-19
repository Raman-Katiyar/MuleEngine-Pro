import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { colors, getRiskColor } from '../colors.js';

const GraphView = ({ graphData, suspiciousAccounts = [] }) => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Agar data nahi hai toh rukh jao
    if (!containerRef.current || !graphData || !graphData.nodes || graphData.nodes.length === 0) {
      console.log("GraphView: Waiting for data...", { graphData });
      return;
    }

    // Use a small timeout to ensure DOM is fully mounted
    const initTimer = setTimeout(() => {
      if (!containerRef.current) return;

      console.log("GraphView: Drawing graph", { 
        nodes: graphData.nodes.length, 
        edges: graphData.edges.length,
        nodesData: graphData.nodes 
      });

      try {
        // Destroy previous Cytoscape instance if it exists
        if (cyRef.current) {
          cyRef.current.destroy();
          cyRef.current = null;
        }

        // Format nodes for Cytoscape
        const nodes = graphData.nodes.map(n => {
          const nodeId = String(n.id || n.label).trim();
          const accountDetail = suspiciousAccounts.find(a => String(a.account_id) === nodeId);
          const suspicionScore = accountDetail?.suspicion_score || 0;
          
          // Determine risk level based on score
          let riskLevel = 'no-risk';
          if (suspicionScore >= 70) {
            riskLevel = 'high-risk';
          } else if (suspicionScore >= 35) {
            riskLevel = 'low-risk';
          }
          
          return {
            data: { 
              id: nodeId,
              label: nodeId,
              score: suspicionScore
            },
            classes: riskLevel
          };
        });

        // Format edges for Cytoscape
        const edges = (graphData.edges || [])
          .map((e, idx) => {
            // e is like { id, source, target, amount }
            const source = String(e.source || '').trim();
            const target = String(e.target || '').trim();
            
            if (!source || !target) {
              console.warn(`⚠️ Invalid edge at index ${idx}:`, e);
              return null;
            }
            
            return {
              data: { 
                source: source,
                target: target,
                id: e.id || `edge-${idx}`
              }
            };
          })
          .filter(e => e !== null); // Only include valid edges

        console.log("📊 Formatted elements:", { nodes: nodes.length, edges: edges.length });

        // Initialize Cytoscape
        cyRef.current = cytoscape({
          container: containerRef.current,
          elements: {
            nodes: nodes,
            edges: edges
          },
          style: [
            {
              selector: 'core',
              style: {
                'background-color': colors.softCream
              }
            },
            {
              selector: 'node',
              style: {
                'label': 'data(label)',
                'width': 100,
                'height': 100,
                'background-color': colors.emeraldGreen,
                'color': colors.softCream,
                'font-size': '10px',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-weight': 'bold',
                'border-width': 3,
                'border-color': colors.emeraldGreen,
                'overlay-padding': 15,
                'text-wrap': 'wrap',
                'text-max-width': 85,
                'background-opacity': 1,
                'padding': '10px'
              }
            },
            {
              selector: 'node.high-risk',
              style: {
                'background-color': colors.crimsonRed,
                'border-color': colors.crimsonRed,
                'width': 130,
                'height': 130
              }
            },
            {
              selector: 'node.low-risk',
              style: {
                'background-color': colors.amberYellow,
                'border-color': colors.amberYellow,
                'width': 115,
                'height': 115
              }
            },
            {
              selector: 'node.no-risk',
              style: {
                'background-color': colors.emeraldGreen,
                'border-color': colors.emeraldGreen,
                'width': 100,
                'height': 100
              }
            },
            {
              selector: 'edge',
              style: {
                'width': 2,
                'line-color': colors.mutedBlue,
                'target-arrow-color': colors.mutedBlue,
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'control-point-step-size': 40
              }
            },
            {
              selector: 'edge:hover',
              style: {
                'line-color': colors.mutedBlueBright,
                'target-arrow-color': colors.mutedBlueBright,
                'width': 3
              }
            }
          ],
          layout: { 
            name: 'cose',
            directed: true,
            animate: false,
            animationDuration: 500,
            avoidOverlap: true,
            padding: 50,
            nodeSpacing: 10,
            numIter: 1000,
            initialTemp: 1000,
            coolingFactor: 0.99
          }
        });

        // Add event listeners for node interactions
        cyRef.current.on('mouseover', 'node', (event) => {
          const nodeId = event.target.id();
          const nodePos = event.target.renderedPosition();
          const containerRect = containerRef.current.getBoundingClientRect();
          
          setHoveredNode(nodeId);
          setTooltipPos({ 
            x: containerRect.left + nodePos.x, 
            y: containerRect.top + nodePos.y 
          });
          event.target.style('overlay-opacity', 0.2);
        });

        cyRef.current.on('mouseout', 'node', (event) => {
          if (!selectedNode) {
            setHoveredNode(null);
          }
          event.target.style('overlay-opacity', 0);
        });

        cyRef.current.on('tap', 'node', (event) => {
          const nodeId = event.target.id();
          const nodePos = event.target.renderedPosition();
          const containerRect = containerRef.current.getBoundingClientRect();
          
          setSelectedNode(nodeId);
          setTooltipPos({ 
            x: containerRect.left + nodePos.x, 
            y: containerRect.top + nodePos.y 
          });
        });

        cyRef.current.on('tap', (event) => {
          if (event.target === cyRef.current) {
            setSelectedNode(null);
            setHoveredNode(null);
          }
        });

        // Fit graph to view after a short delay
        setTimeout(() => {
          if (cyRef.current) {
            cyRef.current.fit();
            console.log("✅ Graph rendered successfully");
          }
        }, 500);

      } catch (error) {
        console.error("❌ Cytoscape Error:", error);
        console.error("Stack:", error.stack);
      }
    }, 50); // Small delay to ensure DOM is ready

    // Cleanup
    return () => {
      clearTimeout(initTimer);
      if (cyRef.current) {
        try {
          cyRef.current.destroy();
        } catch (e) {
          console.warn("Cleanup warn:", e);
        }
      }
    };
  }, [graphData, suspiciousAccounts]);

  // Get account details based on node ID
  const getAccountDetails = (accountId) => {
    return suspiciousAccounts.find(acc => String(acc.account_id) === String(accountId));
  };

  const displayedNodeId = selectedNode || hoveredNode;
  const accountDetails = displayedNodeId ? getAccountDetails(displayedNodeId) : null;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 relative">
      <div className="flex-1 flex flex-col">
        <div
          ref={containerRef} 
          className="flex-grow rounded-xl border border-purple-500/30 bg-slate-900 shadow-2xl"
          style={{ height: '500px', width: '100%', display: 'block' }}
        />
        <div className="mt-4 flex gap-6 text-xs font-bold justify-center text-white/80">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: colors.emeraldGreen }}></span> <span style={{ color: colors.emeraldGreen }}>No Risk (Score: 0-34)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: colors.amberYellow }}></span> <span style={{ color: colors.amberYellow }}>Low Risk (Score: 35-69)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: colors.crimsonRed }}></span> <span style={{ color: colors.crimsonRed }}>High Risk (Score: 70+)</span>
          </div>
        </div>
      </div>

      {/* Tooltip Popup - Only for nodes with data */}
      {(selectedNode || hoveredNode) && accountDetails && (() => {
        const riskColor = accountDetails.suspicion_score >= 70 ? colors.crimsonRed : accountDetails.suspicion_score >= 35 ? colors.amberYellow : colors.emeraldGreen;
        const riskLabel = accountDetails.suspicion_score >= 70 ? 'High Risk' : accountDetails.suspicion_score >= 35 ? 'Low Risk' : 'No Risk';
        
        return (
        <div 
          className="fixed rounded-xl border-2 shadow-2xl p-4 z-50 max-w-sm animate-in fade-in duration-200"
          style={{ 
            backgroundColor: colors.softCream, 
            borderColor: riskColor,
            left: `${tooltipPos.x + 70}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(0, -50%)',
            maxWidth: '320px'
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-start gap-2 mb-3">
            <div className="flex-1">
              <h4 className="font-black text-sm mb-1" style={{ color: riskColor }}>
                📊 {accountDetails.account_id}
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg text-white" style={{ backgroundColor: riskColor }}>
                  {riskLabel}: {accountDetails.suspicion_score.toFixed(1)}/100
                </span>
              </div>
            </div>
            {selectedNode && (
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-lg font-bold hover:opacity-80 transition-opacity flex-shrink-0"
                style={{ color: riskColor }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Suspicion Bar */}
          <div className="mb-3">
            <p className="text-[10px] font-bold mb-1" style={{ color: colors.darkSlateGray }}>Risk Level</p>
            <div className="w-full rounded-full h-2" style={{ backgroundColor: colors.lightGray }}>
              <div 
                className="h-2 rounded-full transition-all"
                style={{ 
                  width: `${Math.min(accountDetails.suspicion_score, 100)}%`,
                  backgroundColor: riskColor
                }}
              ></div>
            </div>
          </div>

          {/* Ring ID */}
          {accountDetails.ring_id && (
            <div className="mb-3 p-2 rounded-lg" style={{ backgroundColor: '#f5f5f5', borderLeft: `3px solid ${riskColor}` }}>
              <p className="text-[10px] font-bold" style={{ color: colors.darkSlateGray }}>FRAUD RING</p>
              <p className="font-mono font-bold text-xs" style={{ color: riskColor }}>{accountDetails.ring_id}</p>
            </div>
          )}

          {/* Patterns */}
          {accountDetails.detected_patterns && accountDetails.detected_patterns.length > 0 && (
            <div>
              <p className="text-[10px] font-bold mb-2" style={{ color: colors.darkSlateGray }}>🚨 DETECTED PATTERNS</p>
              <div className="flex flex-wrap gap-1.5">
                {accountDetails.detected_patterns.map((pattern, idx) => (
                  <span 
                    key={idx}
                    className="text-[9px] text-white px-2 py-1 rounded-md font-bold"
                    style={{ backgroundColor: riskColor }}
                  >
                    {pattern.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Arrow pointer */}
          <div 
            className="absolute w-3 h-3 -left-1.5 top-1/2 transform -translate-y-1/2 rotate-45"
            style={{ backgroundColor: colors.softCream, borderTop: `2px solid ${riskColor}`, borderLeft: `2px solid ${riskColor}` }}
          ></div>
        </div>
      )})()}

      {/* Tooltip for Normal Accounts (No Fraud Data) */}
      {(selectedNode || hoveredNode) && displayedNodeId && !accountDetails && (
        <div 
          className="fixed rounded-xl border-2 shadow-2xl p-4 z-50 max-w-sm animate-in fade-in duration-200"
          style={{ 
            backgroundColor: colors.softCream, 
            borderColor: colors.emeraldGreen,
            left: `${tooltipPos.x + 70}px`,
            top: `${tooltipPos.y}px`,
            transform: 'translate(0, -50%)',
            maxWidth: '280px'
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-start gap-2 mb-3">
            <div className="flex-1">
              <h4 className="font-black text-sm mb-1" style={{ color: colors.emeraldGreen }}>
                ✅ {displayedNodeId}
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg text-white" style={{ backgroundColor: colors.emeraldGreen }}>
                  Status: CLEAN
                </span>
              </div>
            </div>
            {selectedNode && (
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-lg font-bold hover:opacity-80 transition-opacity flex-shrink-0"
                style={{ color: colors.emeraldGreen }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Message */}
          <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: '#F0FDF4', borderLeft: `3px solid ${colors.emeraldGreen}` }}>
            <p className="text-sm font-bold" style={{ color: colors.emeraldGreen }}>
              No Fraud Detected
            </p>
            <p className="text-[11px] mt-1" style={{ color: colors.darkSlateGray }}>
              This account shows normal transaction patterns with no suspicious activity.
            </p>
          </div>

          {/* Arrow pointer */}
          <div 
            className="absolute w-3 h-3 -left-1.5 top-1/2 transform -translate-y-1/2 rotate-45"
            style={{ backgroundColor: colors.softCream, borderTop: `2px solid ${colors.emeraldGreen}`, borderLeft: `2px solid ${colors.emeraldGreen}` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default GraphView;