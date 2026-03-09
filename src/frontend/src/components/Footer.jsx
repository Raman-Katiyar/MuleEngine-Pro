import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../colors.js';
import { 
  FeaturesModal, 
  DocumentationModal, 
  PricingModal, 
  AboutModal, 
  PrivacyModal, 
  TermsModal, 
  SecurityModal, 
  ContactModal, 
  APIDocsModal, 
  BlogModal, 
  CareersModal, 
  ComplianceModal 
} from './Modals.jsx';

// fontawesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLock, faGlobe, faBolt, faHeart, faUserShield
} from '@fortawesome/free-solid-svg-icons';
import { faTwitter as fabTwitter, faLinkedin as fabLinkedin, faFacebook as fabFacebook, faYoutube as fabYoutube } from '@fortawesome/free-brands-svg-icons';

function Footer() {
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAPIModal, setShowAPIModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [showCareersModal, setShowCareersModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);

  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (action) => {
    action();
  };

  const footerSections = [
    {
      title: 'Product',
      links: [
        { label: 'Features', action: () => setShowFeaturesModal(true) },
        { label: 'Pricing', action: () => setShowPricingModal(true) },
        { label: 'Documentation', action: () => setShowDocModal(true) },
        { label: 'API Docs', action: () => setShowAPIModal(true) },
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', action: () => setShowAboutModal(true) },
        { label: 'Blog', action: () => setShowBlogModal(true) },
        { label: 'Careers', action: () => setShowCareersModal(true) },
        { label: 'Contact', action: () => setShowContactModal(true) },
      ]
    },
    {
      title: 'Security',
      links: [
        { label: 'Privacy Policy', action: () => setShowPrivacyModal(true) },
        { label: 'Terms of Service', action: () => setShowTermsModal(true) },
        { label: 'Security', action: () => setShowSecurityModal(true) },
        { label: 'Compliance', action: () => setShowComplianceModal(true) },
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Blog', action: () => setShowBlogModal(true) },
        { label: 'Documentation', action: () => setShowDocModal(true) },
        { label: 'API Docs', action: () => setShowAPIModal(true) },
        { label: 'Support', action: () => setShowContactModal(true) },
      ]
    }
  ];

  const socialLinks = [
    { icon: <FontAwesomeIcon icon={fabTwitter} />, label: 'Twitter', href: 'https://twitter.com' },
    { icon: <FontAwesomeIcon icon={fabLinkedin} />, label: 'LinkedIn', href: 'https://linkedin.com' },
    { icon: <FontAwesomeIcon icon={fabFacebook} />, label: 'Facebook', href: 'https://facebook.com' },
    { icon: <FontAwesomeIcon icon={fabYoutube} />, label: 'YouTube', href: 'https://youtube.com' },
  ];

  return (
    <footer 
      className="mt-20 border-t-4 transition-all duration-300 relative overflow-hidden"
      style={{ 
        background: `linear-gradient(135deg, ${colors.mutedBlue} 0%, #5a6f93 50%, #4a5970 100%)`,
        borderColor: colors.amberYellowBright,
        color: colors.white
      }}
    >
      {/* Background SVG Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <defs>
            <pattern id="footerGrid" x="100" y="100" width="200" height="200" patternUnits="userSpaceOnUse">
              <path d="M 0 0 L 200 0 L 200 200 L 0 200 Z" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="1000" height="1000" fill="url(#footerGrid)" />
        </svg>
      </div>

      {/* Top CTA Section */}
      <div 
        className="border-b-2 py-12 px-4 sm:px-6 lg:px-8 relative z-10"
        style={{ borderBottomColor: 'rgba(255,255,255,0.1)' }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-2xl sm:text-3xl font-black mb-4">Ready to Detect Financial Crimes?</h3>
          <p className="text-sm opacity-90 mb-6 max-w-2xl mx-auto">
            Empower your organization with AI-driven fraud detection powered by advanced graph analysis and machine learning.
          </p>
          <button 
            onClick={() => {
              navigate('/');
              setTimeout(() => {
                const el = document.getElementById('upload');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="px-8 py-3 rounded-lg font-bold text-sm transition-all duration-300 transform hover:scale-105 shadow-lg"
            style={{ 
              backgroundColor: colors.emeraldGreen,
              color: colors.white
            }}
          >
            Start Free Trial
          </button>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Footer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {footerSections.map((section, idx) => (
              <div key={idx}>
                <h4 className="text-sm font-black mb-4" style={{ color: colors.amberYellowBright }}>
                  {section.title}
                </h4>
                <ul className="space-y-2">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <button 
                        onClick={() => handleLinkClick(link.action)}
                        className="text-xs opacity-80 hover:opacity-100 transition-all duration-300 inline-flex items-center group focus:outline-none bg-none border-0 cursor-pointer p-0"
                        style={{ color: colors.white }}
                      >
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity mr-2">→</span>
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div 
            className="border-t"
            style={{ borderColor: 'rgba(255,255,255,0.2)' }}
          />

          {/* Bottom Section */}
          <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Brand Info */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shadow"
                >
                  <FontAwesomeIcon icon={faUserShield} className="w-6 h-6 text-white" />
                </div>
                <span className="font-black text-lg">MuleEngine Pro</span>
              </div>
              <p className="text-xs opacity-75">
                Enterprise-grade financial forensics engine powered by AI and graph analysis.
              </p>
            </div>

            {/* Social Links */}
            <div className="flex justify-center space-x-6">
              {socialLinks.map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.label}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: `2px solid rgba(255,255,255,0.2)`
                  }}
                >
                  {social.icon}
                </a>
              ))}
            </div>

            {/* Copyright & Links */}
            <div className="text-right">
              <p className="text-xs opacity-75 mb-2">
                © {currentYear} MuleEngine. All rights reserved.
              </p>
              <div className="flex justify-end space-x-4">
                <button 
                  onClick={() => setShowPrivacyModal(true)} 
                  className="text-xs opacity-75 hover:opacity-100 transition-opacity focus:outline-none bg-none border-0 p-0 cursor-pointer"
                  style={{ color: colors.white }}
                >
                  Privacy
                </button>
                <span className="text-xs opacity-50">•</span>
                <button 
                  onClick={() => setShowTermsModal(true)} 
                  className="text-xs opacity-75 hover:opacity-100 transition-opacity focus:outline-none bg-none border-0 p-0 cursor-pointer"
                  style={{ color: colors.white }}
                >
                  Terms
                </button>
                <span className="text-xs opacity-50">•</span>
                <button 
                  onClick={() => setShowComplianceModal(true)} 
                  className="text-xs opacity-75 hover:opacity-100 transition-opacity focus:outline-none bg-none border-0 p-0 cursor-pointer"
                  style={{ color: colors.white }}
                >
                  Cookies
                </button>
              </div>
            </div>
          </div>

          {/* Footer Bottom Badge */}
          <div 
            className="mt-8 pt-8 border-t text-center text-[10px] opacity-60"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <div className="space-y-1">
              <p><FontAwesomeIcon icon={faLock} /> Bank-Grade Security | <FontAwesomeIcon icon={faGlobe} /> Global Compliance | <FontAwesomeIcon icon={faBolt} /> Real-Time Processing</p>
              <p>Made with <FontAwesomeIcon icon={faHeart} /> for Financial Security</p>
            </div>
          </div>
        </div>
      </div>

      {/* All Modal Components */}
      <FeaturesModal isOpen={showFeaturesModal} onClose={() => setShowFeaturesModal(false)} />
      <DocumentationModal isOpen={showDocModal} onClose={() => setShowDocModal(false)} />
      <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} />
      <APIDocsModal isOpen={showAPIModal} onClose={() => setShowAPIModal(false)} />
      <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />
      <BlogModal isOpen={showBlogModal} onClose={() => setShowBlogModal(false)} />
      <CareersModal isOpen={showCareersModal} onClose={() => setShowCareersModal(false)} />
      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
      <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      <SecurityModal isOpen={showSecurityModal} onClose={() => setShowSecurityModal(false)} />
      <ComplianceModal isOpen={showComplianceModal} onClose={() => setShowComplianceModal(false)} />
    </footer>
  );
}

export default Footer;
