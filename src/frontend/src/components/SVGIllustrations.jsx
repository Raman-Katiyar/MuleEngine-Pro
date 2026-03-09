import React, { useState } from 'react';

export const InteractiveRingSVG = () => {
  const [clickedNodes, setClickedNodes] = useState(new Set());
  const [safeNodeIds, setSafeNodeIds] = useState(new Set());
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [explodedNodes, setExplodedNodes] = useState(new Set());
  const [totalClicks, setTotalClicks] = useState(0);

  const totalNodes = 7;
  const safeNodesCount = 4;

  // Initialize game with random safe nodes
  React.useEffect(() => {
    const randomSafeIds = new Set();
    const nodeIds = Array.from({ length: totalNodes }, (_, i) => i + 1);
    while (randomSafeIds.size < safeNodesCount) {
      const randomId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
      randomSafeIds.add(randomId);
    }
    setSafeNodeIds(randomSafeIds);
  }, []);

  const baseNodes = [
    { id: 1, cx: 150, cy: 50 },
    { id: 2, cx: 230, cy: 90 },
    { id: 3, cx: 240, cy: 170 },
    { id: 4, cx: 200, cy: 240 },
    { id: 5, cx: 100, cy: 240 },
    { id: 6, cx: 60, cy: 170 },
    { id: 7, cx: 70, cy: 90 },
  ];

  const handleNodeClick = (nodeId) => {
    if (clickedNodes.has(nodeId)) return;
    
    const newClicked = new Set(clickedNodes);
    newClicked.add(nodeId);
    setClickedNodes(newClicked);
    setTotalClicks(totalClicks + 1);
    
    if (safeNodeIds.has(nodeId)) {
      const newScore = score + 1;
      setScore(newScore);
      if (newScore === safeNodesCount) {
        setGameComplete(true);
      }
    } else {
      // Malicious node clicked - show boom animation but continue
      setExplodedNodes(prev => new Set([...prev, nodeId]));
      setTimeout(() => {
        setExplodedNodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(nodeId);
          return newSet;
        });
      }, 600);
    }
  };

  const resetGame = () => {
    const randomSafeIds = new Set();
    const nodeIds = Array.from({ length: totalNodes }, (_, i) => i + 1);
    while (randomSafeIds.size < safeNodesCount) {
      const randomId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
      randomSafeIds.add(randomId);
    }
    setSafeNodeIds(randomSafeIds);
    setClickedNodes(new Set());
    setScore(0);
    setGameComplete(false);
    setExplodedNodes(new Set());
    setTotalClicks(0);
  };

  return (
    <div className="w-full flex justify-center relative">
      <div className="relative w-full flex justify-center" style={{ maxWidth: '500px' }}>
        <svg 
          viewBox="0 0 300 300" 
          className="w-full h-auto cursor-pointer transition-all duration-300"
          style={{ 
            filter: gameComplete ? 'blur(4px) drop-shadow(0 10px 30px rgba(224, 122, 95, 0.4))' : 'drop-shadow(0 10px 30px rgba(224, 122, 95, 0.2))',
            opacity: gameComplete ? 0.6 : 1
          }}
        >
        <defs>
          <style>{`
            @keyframes boom {
              0% { r: 8; opacity: 1; }
              50% { r: 25; opacity: 0.8; filter: brightness(1.5); }
              100% { r: 40; opacity: 0; }
            }
            @keyframes found-pulse {
              0%, 100% { r: 8; opacity: 1; }
              50% { r: 14; opacity: 0.8; filter: drop-shadow(0 0 8px #10B981); }
            }
            .suspicious-node:hover { filter: brightness(1.3); }
            .boom-node { animation: boom 0.6s ease-out; }
            .safe-found { animation: found-pulse 0.4s ease-out; fill: #10B981; filter: drop-shadow(0 0 10px #10B981); }
          `}</style>
        </defs>

        {/* Circular ring */}
        <circle cx="150" cy="150" r="80" fill="none" stroke="#E07A5F" strokeWidth="3" />
        <circle cx="150" cy="150" r="100" fill="none" stroke="#E07A5F" strokeWidth="1" opacity="0.3" />
        <circle cx="150" cy="150" r="60" fill="none" stroke="#E07A5F" strokeWidth="1" opacity="0.3" />
        
        {/* Connected nodes - Interactive */}
        {baseNodes.map((node) => {
          const isSafe = safeNodeIds.has(node.id);
          const isClicked = clickedNodes.has(node.id);
          const isBoosting = explodedNodes.has(node.id);
          
          return (
            <g key={node.id}>
              {isBoosting && (
                <circle 
                  cx={node.cx} 
                  cy={node.cy} 
                  r="8" 
                  fill="#FF6B6B" 
                  className="boom-node"
                  opacity="0.9"
                />
              )}
              <circle 
                cx={node.cx} 
                cy={node.cy} 
                r="8" 
                fill={isClicked ? (isSafe ? "#10B981" : "#E07A5F") : "#E07A5F"}
                opacity={isClicked ? 1 : 0.8}
                className="suspicious-node"
                onClick={() => handleNodeClick(node.id)}
                style={{
                  cursor: isClicked ? 'default' : 'pointer',
                  transition: 'all 0.3s ease',
                  filter: isClicked 
                    ? (isSafe 
                      ? 'drop-shadow(0 0 10px #10B981)' 
                      : 'drop-shadow(0 0 8px #E07A5F)') 
                    : 'drop-shadow(0 0 4px rgba(224, 122, 95, 0.5))',
                  pointerEvents: isBoosting ? 'none' : 'auto',
                  opacity: isClicked && !isSafe ? 0.6 : (isClicked || isBoosting ? 1 : 0.8),
                }}
              />
              {isClicked && isSafe && (
                <text x={node.cx} y={node.cy + 3} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#10B981">
                  
                </text>
              )}
              {isClicked && !isSafe && (
                <text x={node.cx} y={node.cy + 3} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#E07A5F" opacity="0.6">
                  
                </text>
              )}
            </g>
          );
        })}
        
        {/* Center */}
        <circle cx="150" cy="150" r="20" fill="#E07A5F" opacity="0.5" />
      </svg>
        
        {/* Restart Button - Overlay on ring when game is complete */}
        {gameComplete && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <p className="text-white font-black text-lg drop-shadow-lg"> All Safe Routes Found!</p>
            <p className="text-white text-sm">Score: <span className="font-black">{score}</span> / {safeNodesCount} • Clicks: <span className="font-black">{totalClicks}</span></p>
            <button 
              onClick={resetGame}
              className="text-sm font-bold px-6 py-3 rounded-lg bg-emeraldGreen text-white hover:brightness-110 transition-all shadow-lg"
              style={{ backgroundColor: '#10B981' }}
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const GraphNetworkSVG = () => (
  <svg viewBox="0 0 400 400" className="w-full h-full opacity-20 absolute inset-0" style={{ pointerEvents: 'none' }}>
    {/* Animated circles */}
    <circle cx="100" cy="100" r="50" fill="none" stroke="#5A7D9A" strokeWidth="2" opacity="0.3" />
    <circle cx="300" cy="150" r="70" fill="none" stroke="#E07A5F" strokeWidth="2" opacity="0.3" />
    <circle cx="200" cy="300" r="60" fill="none" stroke="#10B981" strokeWidth="2" opacity="0.3" />
    
    {/* Connection lines */}
    <line x1="100" y1="100" x2="300" y2="150" stroke="#5A7D9A" strokeWidth="1" opacity="0.2" />
    <line x1="300" y1="150" x2="200" y2="300" stroke="#E07A5F" strokeWidth="1" opacity="0.2" />
    <line x1="200" y1="300" x2="100" y2="100" stroke="#10B981" strokeWidth="1" opacity="0.2" />
    
    {/* Nodes */}
    <circle cx="100" cy="100" r="8" fill="#5A7D9A" opacity="0.4" />
    <circle cx="300" cy="150" r="8" fill="#E07A5F" opacity="0.4" />
    <circle cx="200" cy="300" r="8" fill="#10B981" opacity="0.4" />
  </svg>
);

export const FraudDetectionSVG = () => (
  <svg viewBox="0 0 300 300" className="w-full h-full" style={{ filter: 'drop-shadow(0 10px 30px rgba(90, 125, 154, 0.2))' }}>
    {/* Shield */}
    <path d="M150 20 L80 50 L80 140 Q150 200 150 220 Q150 200 220 140 L220 50 Z" fill="none" stroke="#5A7D9A" strokeWidth="2" />
    
    {/* Checkmark */}
    <path d="M110 140 L135 165 L180 100" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Decorative circles */}
    <circle cx="150" cy="150" r="80" fill="none" stroke="#5A7D9A" strokeWidth="1" opacity="0.3" />
    <circle cx="150" cy="150" r="100" fill="none" stroke="#5A7D9A" strokeWidth="1" opacity="0.2" />
  </svg>
);

export const AnalyticsSVG = () => (
  <svg viewBox="0 0 300 300" className="w-full h-full" style={{ filter: 'drop-shadow(0 10px 30px rgba(224, 122, 95, 0.2))' }}>
    {/* Bar chart */}
    <rect x="40" y="180" width="30" height="100" fill="#5A7D9A" opacity="0.7" rx="4" />
    <rect x="85" y="130" width="30" height="150" fill="#E07A5F" opacity="0.7" rx="4" />
    <rect x="130" y="80" width="30" height="200" fill="#10B981" opacity="0.7" rx="4" />
    <rect x="175" y="110" width="30" height="170" fill="#FBBF24" opacity="0.7" rx="4" />
    <rect x="220" y="140" width="30" height="140" fill="#5A7D9A" opacity="0.7" rx="4" />
    
    {/* Axis */}
    <line x1="30" y1="290" x2="270" y2="290" stroke="#5A7D9A" strokeWidth="2" />
    <line x1="30" y1="40" x2="30" y2="290" stroke="#5A7D9A" strokeWidth="2" />
    
    {/* Data points */}
    <circle cx="55" cy="180" r="4" fill="#5A7D9A" />
    <circle cx="100" cy="130" r="4" fill="#E07A5F" />
    <circle cx="145" cy="80" r="4" fill="#10B981" />
    <circle cx="190" cy="110" r="4" fill="#FBBF24" />
    <circle cx="235" cy="140" r="4" fill="#5A7D9A" />
  </svg>
);

export const LockSecuritySVG = () => (
  <svg viewBox="0 0 300 300" className="w-full h-full" style={{ filter: 'drop-shadow(0 10px 30px rgba(16, 185, 129, 0.2))' }}>
    {/* Lock body */}
    <rect x="80" y="140" width="140" height="120" fill="none" stroke="#10B981" strokeWidth="2" rx="8" />
    
    {/* Lock shackle */}
    <path d="M100 140 Q100 80 150 80 Q200 80 200 140" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
    
    {/* Keyhole */}
    <circle cx="150" cy="190" r="12" fill="none" stroke="#10B981" strokeWidth="2" />
    <rect x="148" y="205" width="4" height="30" fill="#10B981" rx="2" />
    
    {/* Lock dots */}
    <circle cx="150" cy="150" r="3" fill="#10B981" opacity="0.5" />
    <circle cx="150" cy="160" r="3" fill="#10B981" opacity="0.5" />
    <circle cx="150" cy="170" r="3" fill="#10B981" opacity="0.5" />
  </svg>
);

export const RingSVG = () => (
  <InteractiveRingSVG />
);

export const StaticRingSVG = () => (
  <div className="w-full flex justify-center">
    <svg 
      viewBox="0 0 300 300" 
      className="w-full h-auto drop-shadow-lg"
      style={{ 
        filter: 'drop-shadow(0 10px 30px rgba(224, 122, 95, 0.2))',
        maxWidth: '500px',
        pointerEvents: 'none'
      }}
    >
      <defs>
        <style>{`
          .static-node { fill: #E07A5F; opacity: 0.8; }
        `}</style>
      </defs>

      {/* Circular ring */}
      <circle cx="150" cy="150" r="80" fill="none" stroke="#E07A5F" strokeWidth="3" />
      <circle cx="150" cy="150" r="100" fill="none" stroke="#E07A5F" strokeWidth="1" opacity="0.3" />
      <circle cx="150" cy="150" r="60" fill="none" stroke="#E07A5F" strokeWidth="1" opacity="0.3" />
      
      {/* Static nodes - Non-interactive */}
      <circle cx="150" cy="50" r="8" className="static-node" />
      <circle cx="230" cy="90" r="8" className="static-node" />
      <circle cx="240" cy="170" r="8" className="static-node" />
      <circle cx="200" cy="240" r="8" className="static-node" />
      <circle cx="100" cy="240" r="8" className="static-node" />
      <circle cx="60" cy="170" r="8" className="static-node" />
      <circle cx="70" cy="90" r="8" className="static-node" />
      
      {/* Center */}
      <circle cx="150" cy="150" r="20" fill="#E07A5F" opacity="0.5" />
    </svg>
  </div>
);

export const BackgroundPattern = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="dots" x="50" y="50" width="100" height="100" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="2" fill="#5A7D9A" opacity="0.1" />
          <circle cx="60" cy="30" r="2" fill="#E07A5F" opacity="0.1" />
        </pattern>
        
        <pattern id="grid" x="40" y="40" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#5A7D9A" strokeWidth="0.5" opacity="0.05" />
        </pattern>
      </defs>
      
      {/* Background patterns */}
      <rect width="1000" height="1000" fill="url(#grid)" />
      <rect width="1000" height="1000" fill="url(#dots)" />
      
      {/* Decorative lines */}
      <line x1="0" y1="0" x2="1000" y2="1000" stroke="#5A7D9A" strokeWidth="0.5" opacity="0.05" />
      <line x1="1000" y1="0" x2="0" y2="1000" stroke="#E07A5F" strokeWidth="0.5" opacity="0.05" />
    </svg>
  </div>
);

export const FloatingElement = ({ delay = 0, duration = 6 }) => (
  <style>{`
    @keyframes float-${delay} {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(5deg); }
    }
    .float-element-${delay} {
      animation: float-${delay} ${duration}s ease-in-out infinite;
      animation-delay: ${delay * 0.2}s;
    }
  `}</style>
);
