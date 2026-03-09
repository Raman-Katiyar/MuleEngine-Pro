import React, { useState } from 'react';
import { colors } from '../colors.js';

import { useNavigate, useLocation } from 'react-router-dom';
// fontawesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserShield } from '@fortawesome/free-solid-svg-icons';

function Header({ onNavigate, isAnalysisMode = false, onReset = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // wrapper that ensures we're on the homepage first
  const navigateHomeAndScroll = (sectionId) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      // wait a moment for home to render then scroll
      setTimeout(() => {
        const el = document.getElementById(sectionId === 'dashboard' ? 'hero' : sectionId === 'analysis' ? 'upload' : sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      // already on home, just scroll
      if (sectionId === 'dashboard') {
        // always scroll to the very top to avoid header covering
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (sectionId === 'analysis') {
        const el = document.getElementById('upload');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (sectionId === 'results') {
        const resultsElement = document.querySelector('[data-section="results"]');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
  };

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const handleReset = () => {
    setMobileMenuOpen(false);
    if (onReset) {
      onReset();
    }
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const handleHistory = () => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/history') {
      navigate('/history');
    }
  };

  let navItems;

  if (location.pathname === '/results') {
    // viewing a specific analysis result: only offer history and back
    navItems = [
      { label: 'History', action: handleHistory },
      { label: '← Back to Upload', action: handleReset, highlight: true },
    ];
  } else {
    // default navigation on all other pages (home/history/upload)
    navItems = [
      { label: 'Home', action: () => navigateHomeAndScroll('dashboard') },
      { label: 'Upload', action: () => navigateHomeAndScroll('analysis') },
      { label: 'History', action: handleHistory },
    ];
  }

  const headerBg = scrolled ? colors.mutedBlue : `${colors.mutedBlue}dd`;

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-2xl backdrop-blur-md' : 'shadow-lg backdrop-blur-sm'}`}
      style={{ 
        backgroundColor: headerBg,
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="headerPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="1" opacity="0.1" />
            </pattern>
          </defs>
          <rect width="1000" height="100" fill="url(#headerPattern)" />
        </svg>
      </div>

      <nav className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <button
            type="button"
            onClick={handleLogoClick}
            className="flex items-center space-x-3 group cursor-pointer hover:opacity-90 transition-opacity focus:outline-none appearance-none border-0 bg-transparent p-0"
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform"

            >
              <FontAwesomeIcon icon={faUserShield} className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black leading-tight" style={{ color: colors.white }}>MuleEngine</h1>
              <p className="text-xs leading-tight" style={{ color: colors.amberYellowBright }}>Financial Forensics</p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-3">
            {navItems.map((item, idx) => {
              const isActive = (
                (item.label === 'History' && location.pathname === '/history') ||
                (item.label === 'Home' && location.pathname === '/' )
              );
              return (
                <button 
                  type="button"
                  key={idx}
                  onClick={() => { item.action();
                                  // remove focus outline after navigation
                                  if (document.activeElement instanceof HTMLElement) {
                                    document.activeElement.blur();
                                  }
                                }}
                  className={`px-4 py-2 text-sm font-semibold transition-all duration-300 relative group focus:outline-none appearance-none border-0 rounded-lg ${
                    item.highlight
                      ? 'bg-emeraldGreen text-white hover:scale-105 shadow-lg'
                      : isActive
                        ? 'bg-white bg-opacity-20 text-white'
                        : 'hover:text-yellow-300 hover:bg-white hover:bg-opacity-10'
                  } focus:ring-2 focus:ring-white focus:ring-opacity-50`}
                  style={{ 
                    color: item.highlight ? colors.white : colors.white,
                    backgroundColor: item.highlight ? colors.emeraldGreen : 'transparent'
                  }}
                >
                  {item.label}
                  {!item.highlight && !isActive && (
                    <span 
                      className="absolute bottom-1 left-4 right-4 h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                      style={{ backgroundColor: colors.amberYellowBright }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Header Info - Hidden on smaller screens */}
          <div className="hidden lg:flex flex-col items-end text-right mr-4">
            {isAnalysisMode ? (
              <>
                <div className="text-xs font-bold text-yellow-300 flex items-center gap-1">
                  <span className="animate-pulse">●</span> Analysis Mode
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: colors.amberYellowBright }}>Results Displayed</div>
              </>
            ) : (
              <>
                <div className="text-xs font-bold" style={{ color: colors.white }}> Enterprise Grade</div>
                <div className="text-[10px] mt-0.5" style={{ color: colors.amberYellowBright }}>AI-Powered Detection</div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex flex-col space-y-1.5 p-2 focus:outline-none appearance-none border-0 bg-transparent hover:bg-white hover:bg-opacity-10 rounded-lg focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle mobile menu"
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-6 h-0.5 transition-all duration-300"
                style={{ 
                  backgroundColor: colors.white,
                  transform: mobileMenuOpen 
                    ? (i === 1 ? 'rotate-45 translate-y-2' : i === 2 ? 'scaleX-0' : '-rotate-45 -translate-y-2') 
                    : 'rotate-0'
                }}
              />
            ))}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 mt-0 bg-gradient-to-b backdrop-blur-lg shadow-xl border-t border-white border-opacity-10" style={{ background: `linear-gradient(180deg, ${colors.mutedBlue}f0 0%, ${colors.mutedBlue}e8 100%)` }}>
            <div className="px-4 py-4 space-y-2 max-h-96 overflow-y-auto">
              {navItems.map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    item.action();
                    setMobileMenuOpen(false);
                    if (document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                  }}
                  className={`block w-full text-left text-sm font-semibold px-4 py-3 rounded-lg transition-all duration-300 focus:outline-none appearance-none border-0 focus:ring-2 focus:ring-white focus:ring-opacity-50 ${
                    item.highlight
                      ? 'hover:scale-105'
                      : 'hover:bg-white hover:bg-opacity-15'
                  }`}
                  style={{ 
                    color: item.highlight ? colors.white : colors.white,
                    backgroundColor: item.highlight ? colors.emeraldGreen : 'transparent'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Spacer to prevent content overlap */}
        <style>{`
          body {
            padding-top: 4rem; /* 64px for h-16 */
          }
        `}</style>
      </nav>
    </header>
  );
}

export default Header;
