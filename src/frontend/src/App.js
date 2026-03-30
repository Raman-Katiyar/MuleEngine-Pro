import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import FileUpload from './components/FileUpload.jsx';
import UserModeCheck from './components/UserModeCheck.jsx';

// fontawesome icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileCsv,
  faChartLine,
  faCircle
} from '@fortawesome/free-solid-svg-icons';
import StatsSummary from './components/StatsSummary.jsx';
import GraphView from './components/GraphView.jsx';
import RingTable from './components/RingTable.jsx';
import AIRiskAnalysis from './components/AIRiskAnalysis.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import HistoryPage from './components/HistoryPage.jsx';
import ResultsPage from './components/ResultsPage.jsx';
import { 
  FraudDetectionSVG, 
  LockSecuritySVG, 
  RingSVG,
  StaticRingSVG,
  AnalyticsSVG,
  BackgroundPattern 
} from './components/SVGIllustrations.jsx';
import { colors } from './colors.js';

function App() {
  const [analysisData, setAnalysisData] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [activeMode, setActiveMode] = useState('admin');
  
  const navigate = useNavigate();

  // In production on Render, REACT_APP_API_URL is injected. Defaults to backend service URL.
  // During local development we run the backend on port 5000.
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('analysisHistory');
      if (savedHistory) {
        setAnalysisHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.warn('Could not load history from localStorage:', error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('analysisHistory', JSON.stringify(analysisHistory));
    } catch (error) {
      console.warn('Could not save history to localStorage:', error);
    }
  }, [analysisHistory]);

  const addToHistory = (analysisResult) => {
    const historyItem = {
      ...analysisResult,
      timestamp: new Date().toISOString(),
    };
    setAnalysisHistory([historyItem, ...analysisHistory]);
  };

  const handleAnalysis = (data) => {
    console.log(" Analysis Response Received:", data); 
    console.log("Graph Data Check:", { 
      hasGraphData: !!data.graph_data,
      nodes: data.graph_data?.nodes?.length || 0,
      edges: data.graph_data?.edges?.length || 0
    });
    
    setAnalysisData(data);
    addToHistory(data);
    
    if (data?.graph_data) {
      console.log(" Setting graph data from response.graph_data");
      setGraphData(data.graph_data);
    } 
    else if (data?.graph) {
      console.log(" Setting graph data from response.graph");
      setGraphData(data.graph);
    }
    else {
      console.warn(" No graph data found in response!");
      setGraphData({ nodes: [], edges: [] });
    }
    navigate('/results');
  };

  const handleReset = () => {
    setAnalysisData(null);
    setGraphData(null);
    navigate('/');
  };

  const handleSelectFromHistory = (analysis) => {
    setAnalysisData(analysis);
    if (analysis?.graph_data) {
      setGraphData(analysis.graph_data);
    } else if (analysis?.graph) {
      setGraphData(analysis.graph);
    } else {
      setGraphData({ nodes: [], edges: [] });
    }
    navigate('/results');
  };

  // small reusable cards used on homepage
  const FeatureCard = ({ icon, color, title, desc }) => (
    <div className="text-center hover:scale-110 transition-all duration-300 group cursor-default p-4 rounded-2xl" style={{ borderColor: color, borderWidth: '1px' }}>
      <div className="text-4xl font-black mb-2 group-hover:scale-125 transition-transform" style={{ color }}>{icon}</div>
      <div className="text-xs font-semibold" style={{ color }}>{title}</div>
      <p className="text-[10px] mt-2 opacity-60" style={{ color: colors.darkSlateGray }}>{desc}</p>
    </div>
  );

  const homeElement = (
    <div style={{ backgroundColor: colors.softCream }} className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Pattern */}
      <BackgroundPattern />
      {/* Header Component */}
      <Header isAnalysisMode={!!analysisData} onReset={handleReset} />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-6 sm:py-8 relative z-10">
            {/* Hero section */}
            <section id="hero" className="mb-12 pb-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                {/* Left Text Content */}
                <div className="text-center lg:text-left">
                  <h2 className="text-4xl sm:text-5xl font-black mb-6" style={{ color: colors.mutedBlue }}>
                    Financial <br /> Forensics Engine
                  </h2>
                  <p className="text-lg sm:text-xl mb-8 font-semibold leading-relaxed" style={{ color: colors.darkSlateGray }}>
                    Detect Money Muling Rings through AI-Powered Graph Analysis
                  </p>
                  <p className="text-sm sm:text-base opacity-75 mb-8" style={{ color: colors.darkSlateGray }}>
                    Enterprise-grade fraud detection powered by machine learning, graph analysis, and pattern recognition
                  </p>
                  <button onClick={() => document.getElementById('upload').scrollIntoView({ behavior: 'smooth' })} className="px-8 py-3 rounded-full font-bold text-white shadow-lg hover:scale-105 transition-transform" style={{ backgroundColor: colors.emeraldGreen }}>Start Analysis →</button>
                </div>
                
                {/* Right Illustration */}
                <div className="hidden lg:flex justify-center opacity-80 hover:opacity-100 transition-opacity">
                  <div className="w-80 h-auto">
                    <RingSVG />
                  </div>
                </div>
              </div>
            </section>
            
            {/* Features section */}
            <section id="features" className="mb-12 pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
                {/* Left Feature Illustration */}
                <div className="hidden lg:flex justify-center opacity-70 hover:opacity-90 transition-opacity">
                  <div className="w-48 h-48">
                    <LockSecuritySVG />
                  </div>
                </div>
                
                {/* Features Grid */}
                <div className="lg:col-span-3">
                  <div className="p-8 rounded-3xl border-2 shadow-lg backdrop-blur-sm" style={{ 
                    borderColor: colors.mutedBlue, 
                    background: `linear-gradient(135deg, rgba(90, 125, 154, 0.08) 0%, rgba(224, 122, 95, 0.06) 50%, rgba(16, 185, 129, 0.06) 100%)`
                  }}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FeatureCard icon="3" color={colors.mutedBlue} title="Patterns" desc="Circular routing, smurfing, shells" />
                      <FeatureCard icon="🤖" color={colors.amberYellowBright} title="Graph + AI" desc="ML-powered scoring" />
                      <FeatureCard icon="⚡" color={colors.emeraldGreen} title="Realtime" desc="Fast turnaround results" />
                    </div>
                  </div>
                </div>
                
                {/* Right Feature Illustration */}
                <div className="hidden lg:flex justify-center opacity-70 hover:opacity-90 transition-opacity">
                  <div className="w-48 h-48">
                    <FraudDetectionSVG />
                  </div>
                </div>
              </div>
            </section>

            {/* Upload section */}
            <section id="upload" className="mb-12">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-200 via-coral-100 to-emerald-200 rounded-3xl opacity-20 blur-xl"></div>
                <div className="relative rounded-3xl border-2 p-5 sm:p-6" style={{ borderColor: colors.mutedBlue, backgroundColor: 'rgba(255,255,255,0.45)' }}>
                  <div className="mb-5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveMode('admin')}
                      className="px-4 py-2 rounded-full text-sm font-bold border-2 transition-transform hover:scale-105"
                      style={{
                        borderColor: activeMode === 'admin' ? colors.mutedBlue : colors.lightGray,
                        backgroundColor: activeMode === 'admin' ? colors.mutedBlue : colors.white,
                        color: activeMode === 'admin' ? colors.white : colors.darkSlateGray,
                      }}
                    >
                      Admin Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMode('user')}
                      className="px-4 py-2 rounded-full text-sm font-bold border-2 transition-transform hover:scale-105"
                      style={{
                        borderColor: activeMode === 'user' ? colors.emeraldGreen : colors.lightGray,
                        backgroundColor: activeMode === 'user' ? colors.emeraldGreen : colors.white,
                        color: activeMode === 'user' ? colors.white : colors.darkSlateGray,
                      }}
                    >
                      User Mode
                    </button>
                  </div>

                  {activeMode === 'admin' ? (
                    <FileUpload onAnalysisComplete={handleAnalysis} />
                  ) : (
                    <UserModeCheck apiUrl={apiUrl} />
                  )}
                </div>
              </div>
            </section>
            
            {/* CSV Info Section with Illustration */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
              {/* Left Illustration */}
              <div className="hidden lg:flex justify-center opacity-70 hover:opacity-90 transition-opacity">
                <div className="w-40 h-40">
                  <FraudDetectionSVG />
                </div>
              </div>

              {/* Info Content */}
              <div className="lg:col-span-3 p-8 rounded-3xl border-2 shadow-lg animate-slide-in-up" style={{ 
                borderColor: colors.mutedBlue, 
                background: `linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(255, 255, 255, 0.6) 100%)`
              }}>
                <div className="mb-4">
                  <p className="font-bold text-lg mb-3 flex items-center gap-2" style={{ color: colors.mutedBlue }}>
                    <FontAwesomeIcon icon={faFileCsv} /> Expected CSV Format
                  </p>
                  <p className="text-xs mb-4" style={{ color: colors.darkSlateGray }}>Your CSV file should contain the following columns:</p>
                </div>
                <code className="text-xs bg-white p-4 rounded-xl border-2 block mb-4 font-mono shadow-md overflow-x-auto" style={{ borderColor: colors.mutedBlue, color: colors.mutedBlue }}>
                  transaction_id | sender_id | receiver_id | amount | timestamp
                </code>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2" style={{ color: colors.darkSlateGray }}>
                    <span>🕒</span>
                    <span>Timestamp: <code className="text-[10px]">YYYY-MM-DD HH:MM:SS</code></span>
                  </div>
                  <div className="flex items-center gap-2" style={{ color: colors.darkSlateGray }}>
                    <span>💰</span>
                    <span>Amount: Numeric value (supports decimals)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Section with Illustrations */}
            <section id="trust" className="mt-12 mb-12 pt-4">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-black mb-2" style={{ color: colors.mutedBlue }}>Why Trust MuleEngine?</h3>
                <p className="text-sm" style={{ color: colors.darkSlateGray }}>Enterprise-grade security and accuracy</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Card with Illustration */}
                <div className="p-6 rounded-2xl border-2 shadow-lg hover:shadow-xl transition-shadow" style={{ 
                  borderColor: colors.emeraldGreen,
                  background: `linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(255, 255, 255, 0.4) 100%)`
                }}>
                  <div className="flex justify-center mb-4 opacity-70 hover:opacity-90 transition-opacity">
                    <div className="w-32 h-32">
                      <LockSecuritySVG />
                    </div>
                  </div>
                  <h4 className="font-black text-lg mb-2 text-center" style={{ color: colors.emeraldGreen }}>🔒 Privacy-First</h4>
                  <p className="text-xs text-center" style={{ color: colors.darkSlateGray }}>Your data stays secure with enterprise-grade encryption and zero-knowledge architecture</p>
                </div>
                
                {/* Center Card with Illustration */}
                <div className="p-6 rounded-2xl border-2 shadow-lg hover:shadow-xl transition-shadow" style={{ 
                  borderColor: colors.amberYellowBright,
                  background: `linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(255, 255, 255, 0.4) 100%)`
                }}>
                  <div className="flex justify-center mb-4 opacity-70 hover:opacity-90 transition-opacity">
                    <div className="w-32 h-32">
                      <AnalyticsSVG />
                    </div>
                  </div>
                  <h4 className="font-black text-lg mb-2 text-center" style={{ color: colors.amberYellowBright }}>🎯 Accurate Results</h4>
                  <p className="text-xs text-center" style={{ color: colors.darkSlateGray }}>AI-powered detection with proven ML models delivering 95%+ accuracy in fraud identification</p>
                </div>
                
                {/* Right Card with Illustration */}
                <div className="p-6 rounded-2xl border-2 shadow-lg hover:shadow-xl transition-shadow" style={{ 
                  borderColor: colors.mutedBlue,
                  background: `linear-gradient(135deg, rgba(90, 125, 154, 0.08) 0%, rgba(255, 255, 255, 0.4) 100%)`
                }}>
                  <div className="flex justify-center mb-4 opacity-70 hover:opacity-90 transition-opacity">
                    <div className="w-32 h-32">
                      <StaticRingSVG />
                    </div>
                  </div>
                  <h4 className="font-black text-lg mb-2 text-center" style={{ color: colors.mutedBlue }}>⚡ Lightning Fast</h4>
                  <p className="text-xs text-center" style={{ color: colors.darkSlateGray }}>Analyze thousands of transactions in under 30 seconds with our optimized graph engine</p>
                </div>
              </div>
            </section>
      </main>

      {/* Footer Component */}
      <Footer />
    </div>
  );

  // final return with routing
  return (
    <Routes>
      <Route path="/history" element={
        <>
          <BackgroundPattern />
          <Header isAnalysisMode={!!analysisData} onReset={handleReset} />
          <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 sm:py-12 relative z-10">
            <HistoryPage history={analysisHistory} onSelectHistory={handleSelectFromHistory} onClose={() => navigate('/')} />
          </main>
          <Footer />
        </>
      } />
      <Route path="/results" element={
        <>
          <BackgroundPattern />
          <Header isAnalysisMode={!!analysisData} onReset={handleReset} />
          <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 sm:py-12 relative z-10">
            <ResultsPage
              analysisData={analysisData}
              graphData={graphData}
              apiUrl={apiUrl}
            />
          </main>
          <Footer />
        </>
      } />
      <Route path="/*" element={homeElement} />
    </Routes>
  );
}

export default App;