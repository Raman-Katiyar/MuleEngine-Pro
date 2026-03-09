import React from 'react';
import { colors } from '../colors.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, faSearch, faRobot, faChartBar, faLink, faChartLine, faMoneyBillWave,
  faBookOpen
} from '@fortawesome/free-solid-svg-icons';

const Modal = ({ isOpen, onClose, title, children, icon }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto relative"
        style={{ backgroundColor: colors.softCream }}
      >
        {/* Header */}
        <div 
          className="sticky top-0 border-b-2 px-6 py-4 flex justify-between items-center"
          style={{ 
            backgroundColor: colors.mutedBlue,
            borderColor: colors.amberYellowBright,
            color: colors.white
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <h2 className="text-2xl font-black">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-2xl font-bold hover:opacity-80 transition-opacity"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-gray-800">
          {children}
        </div>
      </div>
    </div>
  );
};

// Features Modal
const FeaturesModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Features" icon={<FontAwesomeIcon icon={faSearch} />}>
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2" style={{ color: colors.mutedBlue }}><FontAwesomeIcon icon={faSearch} /> Advanced Detection</h3>
        <p className="text-sm leading-relaxed">Detects three major fraud patterns: Circular Fund Routing, Smurfing (Fan-in/out), and Shell Network operations.</p>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2" style={{ color: colors.mutedBlue }}><FontAwesomeIcon icon={faRobot} /> AI-Powered Analysis</h3>
        <p className="text-sm leading-relaxed">Machine learning models analyze transaction patterns to identify anomalies and suspicious behavior.</p>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2" style={{ color: colors.mutedBlue }}><FontAwesomeIcon icon={faChartBar} /> Real-Time Processing</h3>
        <p className="text-sm leading-relaxed">Process thousands of transactions in seconds with our optimized graph analysis engine.</p>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2" style={{ color: colors.mutedBlue }}><FontAwesomeIcon icon={faLink} /> Network Visualization</h3>
        <p className="text-sm leading-relaxed">Interactive network graphs show transaction relationships and fraud ring structure.</p>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2" style={{ color: colors.mutedBlue }}><FontAwesomeIcon icon={faChartLine} /> Risk Scoring</h3>
        <p className="text-sm leading-relaxed">Comprehensive risk assessment with combined rule-based and AI-powered scoring systems.</p>
      </div>
    </div>
  </Modal>
);

// Documentation Modal
const DocumentationModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Documentation" icon={<FontAwesomeIcon icon={faBookOpen} />}>
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-lg mb-2" style={{ color: colors.mutedBlue }}>Quick Start</h3>
        <ol className="text-sm space-y-2 list-decimal list-inside">
          <li>Prepare your CSV file with transaction data</li>
          <li>Required columns: transaction_id, sender_id, receiver_id, amount, timestamp</li>
          <li>Upload the file using the upload interface</li>
          <li>View results in real-time with interactive visualizations</li>
        </ol>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-2" style={{ color: colors.mutedBlue }}>CSV Format</h3>
        <p className="text-sm mb-2">Timestamp format: YYYY-MM-DD HH:MM:SS</p>
        <p className="text-sm mb-2">Amount: Numeric values (supports decimals)</p>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-2" style={{ color: colors.mutedBlue }}>Output Results</h3>
        <p className="text-sm">Download results in JSON format containing detected fraud rings, suspicious accounts, and risk scores.</p>
      </div>
    </div>
  </Modal>
);

// Pricing Modal
const PricingModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Pricing" icon={<FontAwesomeIcon icon={faMoneyBillWave} />}>
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border-2 rounded-lg" style={{ borderColor: colors.mutedBlue }}>
          <h3 className="font-bold mb-2" style={{ color: colors.mutedBlue }}>Starter</h3>
          <p className="text-sm">Perfect for small teams testing the platform</p>
          <p className="text-lg font-bold mt-2">$299/month</p>
        </div>
        <div className="p-4 border-2 rounded-lg" style={{ borderColor: colors.amberYellowBright }}>
          <h3 className="font-bold mb-2" style={{ color: colors.amberYellowBright }}>Professional</h3>
          <p className="text-sm">For growing companies with increasing fraud detection needs</p>
          <p className="text-lg font-bold mt-2">$999/month</p>
        </div>
        <div className="p-4 border-2 rounded-lg md:col-span-2" style={{ borderColor: colors.emeraldGreen }}>
          <h3 className="font-bold mb-2" style={{ color: colors.emeraldGreen }}>Enterprise</h3>
          <p className="text-sm">Custom solutions for large-scale deployments</p>
          <p className="text-lg font-bold mt-2">Custom Pricing</p>
        </div>
      </div>
      <p className="text-xs opacity-75">All plans include 24/7 support and regular updates</p>
    </div>
  </Modal>
);

// About Modal
const AboutModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="About Us" icon="ℹ">
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-lg mb-2" style={{ color: colors.mutedBlue }}>MuleEngine Pro</h3>
        <p className="text-sm leading-relaxed">
          MuleEngine is an advanced financial crime detection platform designed to identify money muling rings through sophisticated graph analysis and machine learning algorithms.
        </p>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-2" style={{ color: colors.mutedBlue }}>Our Mission</h3>
        <p className="text-sm leading-relaxed">
          To empower financial institutions and organizations with cutting-edge technology to detect and prevent complex fraud schemes in real-time.
        </p>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-2" style={{ color: colors.mutedBlue }}>Why Choose Us?</h3>
        <ul className="text-sm space-y-2">
          <li>✅ 99.9% Detection Accuracy</li>
          <li>⚡ Processing in less than 30 seconds</li>
          <li>📊 Advanced Graph-Based Analysis</li>
          <li>🤖 AI-Powered Pattern Recognition</li>
          <li>🔒 Enterprise-Grade Security</li>
        </ul>
      </div>
    </div>
  </Modal>
);

// Privacy Policy Modal
const PrivacyModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Privacy Policy" icon="🛡️">
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="font-bold mb-2" style={{ color: colors.mutedBlue }}>Data Protection</h3>
        <p>We are committed to protecting your personal information and ensuring your privacy rights. All data is encrypted and stored securely.</p>
      </div>
      <div>
        <h3 className="font-bold mb-2" style={{ color: colors.mutedBlue }}>Data Collection</h3>
        <p>We collect only the necessary transaction data required for fraud detection analysis. Your personal information is never shared with third parties.</p>
      </div>
      <div>
        <h3 className="font-bold mb-2" style={{ color: colors.mutedBlue }}>User Rights</h3>
        <p>You have the right to access, modify, or delete your data at any time. Contact our support team for assistance.</p>
      </div>
      <p className="text-xs opacity-75 italic">Last updated: February 24, 2026</p>
    </div>
  </Modal>
);

// Terms of Service Modal
const TermsModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Terms of Service" icon="📜">
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="font-bold mb-2" style={{ color: colors.mutedBlue }}>Acceptance of Terms</h3>
        <p>By using MuleEngine Pro, you agree to comply with these terms and conditions.</p>
      </div>
      <div>
        <h3 className="font-bold mb-2" style={{ color: colors.mutedBlue }}>Service Agreement</h3>
        <p>MuleEngine provides advanced fraud detection services. Users are responsible for the accuracy of uploaded data.</p>
      </div>
      <div>
        <h3 className="font-bold mb-2" style={{ color: colors.mutedBlue }}>Limitation of Liability</h3>
        <p>MuleEngine is provided "as is" without warranties. We are not liable for any indirect, incidental, or consequential damages.</p>
      </div>
      <div>
        <h3 className="font-bold mb-2" style={{ color: colors.mutedBlue }}>Changes to Terms</h3>
        <p>We reserve the right to modify these terms at any time. Users will be notified of significant changes.</p>
      </div>
      <p className="text-xs opacity-75 italic">Effective: February 24, 2026</p>
    </div>
  </Modal>
);

// Security Modal
const SecurityModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Security" icon="🔐">
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-lg mb-2" style={{ color: colors.mutedBlue }}>Encryption</h3>
        <p className="text-sm">All data is encrypted using AES-256 encryption standards during transmission and storage.</p>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-2" style={{ color: colors.mutedBlue }}>Compliance</h3>
        <p className="text-sm">We comply with GDPR, CCPA, and other international data protection regulations.</p>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-2" style={{ color: colors.mutedBlue }}>Authentication</h3>
        <p className="text-sm">Multi-factor authentication and role-based access control protect your account.</p>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-2" style={{ color: colors.mutedBlue }}>Monitoring</h3>
        <p className="text-sm">24/7 security monitoring and regular penetration testing ensure system integrity.</p>
      </div>
    </div>
  </Modal>
);

// Contact Modal
const ContactModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Contact Us" icon="📞">
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-lg mb-2" style={{ color: colors.mutedBlue }}>Support</h3>
        <p className="text-sm">Email: support@muleengine.com</p>
        <p className="text-sm">Phone: +91 (080) 4141-0000</p>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-2" style={{ color: colors.mutedBlue }}>Sales</h3>
        <p className="text-sm">Email: sales@muleengine.com</p>
        <p className="text-sm">Phone: +91 (080) 4141-0001</p>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-2" style={{ color: colors.mutedBlue }}>Office</h3>
        <p className="text-sm">Greater Noida, Gautam Buddha Nagar, Uttar Pradesh, India</p>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-2" style={{ color: colors.mutedBlue }}>Hours</h3>
        <p className="text-sm">Monday - Friday: 9:00 AM - 6:00 PM IST</p>
        <p className="text-sm">Saturday - Sunday: Available for emergencies</p>
      </div>
    </div>
  </Modal>
);

// API Docs Modal
const APIDocsModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="API Documentation" icon="🧩">
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="font-bold mb-2" style={{ color: colors.mutedBlue }}>Base URL</h3>
        <code className="bg-gray-200 p-2 rounded block">https://api.muleengine.com/v1</code>
      </div>
      <div>
        <h3 className="font-bold mb-2" style={{ color: colors.mutedBlue }}>Authentication</h3>
        <p>All API requests require an API key in the Authorization header.</p>
      </div>
      <div>
        <h3 className="font-bold mb-2" style={{ color: colors.mutedBlue }}>Endpoints</h3>
        <p>POST /analyze - Analyze transaction data</p>
        <p>GET /results/{'{id}'} - Retrieve analysis results</p>
        <p>GET /export/{'{id}'} - Export results in JSON format</p>
      </div>
      <div>
        <h3 className="font-bold mb-2" style={{ color: colors.mutedBlue }}>Rate Limits</h3>
        <p>100 requests per minute for standard plans</p>
      </div>
    </div>
  </Modal>
);

// Blog Modal
const BlogModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Blog" icon="📰">
    <div className="space-y-4">
      <div className="p-3 border-l-4 rounded" style={{ borderColor: colors.mutedBlue }}>
        <h3 className="font-bold text-sm mb-1">The Rise of Money Muling in 2026</h3>
        <p className="text-xs opacity-75">February 20, 2026</p>
      </div>
      <div className="p-3 border-l-4 rounded" style={{ borderColor: colors.amberYellowBright }}>
        <h3 className="font-bold text-sm mb-1">Advanced Fraud Detection Techniques</h3>
        <p className="text-xs opacity-75">February 15, 2026</p>
      </div>
      <div className="p-3 border-l-4 rounded" style={{ borderColor: colors.emeraldGreen }}>
        <h3 className="font-bold text-sm mb-1">Compliance and Security Best Practices</h3>
        <p className="text-xs opacity-75">February 10, 2026</p>
      </div>
    </div>
  </Modal>
);

// Careers Modal
const CareersModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Careers" icon="💼">
    <div className="space-y-4">
      <p className="text-sm">Join our team of fraud detection experts and financial security specialists.</p>
      <div className="p-3 border rounded" style={{ borderColor: colors.mutedBlue }}>
        <h3 className="font-bold text-sm mb-1">Senior Machine Learning Engineer</h3>
        <p className="text-xs">Bangalore, India - Full Time</p>
      </div>
      <div className="p-3 border rounded" style={{ borderColor: colors.mutedBlue }}>
        <h3 className="font-bold text-sm mb-1">Fraud Analysis Specialist</h3>
        <p className="text-xs">Bangalore, India - Full Time</p>
      </div>
      <div className="p-3 border rounded" style={{ borderColor: colors.mutedBlue }}>
        <h3 className="font-bold text-sm mb-1">Full Stack Developer</h3>
        <p className="text-xs">Remote (India) - Full Time</p>
      </div>
      <div className="p-3 border rounded" style={{ borderColor: colors.mutedBlue }}>
        <h3 className="font-bold text-sm mb-1">Financial Security Consultant</h3>
        <p className="text-xs">Mumbai, India - Full Time</p>
      </div>
      <p className="text-xs opacity-75">Email: careers@muleengine.com</p>
    </div>
  </Modal>
);

// Compliance Modal
const ComplianceModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Compliance" icon="✅">
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="font-bold mb-2" style={{ color: colors.mutedBlue }}>GDPR</h3>
        <p>Full compliance with General Data Protection Regulation requirements for EU users.</p>
      </div>
      <div>
        <h3 className="font-bold mb-2" style={{ color: colors.mutedBlue }}>CCPA</h3>
        <p>California Consumer Privacy Act compliance for California residents.</p>
      </div>
      <div>
        <h3 className="font-bold mb-2" style={{ color: colors.mutedBlue }}>HIPAA</h3>
        <p>Health Insurance Portability and Accountability Act compliance available for healthcare organizations.</p>
      </div>
      <div>
        <h3 className="font-bold mb-2" style={{ color: colors.mutedBlue }}>PCI DSS</h3>
        <p>Payment Card Industry Data Security Standard compliance for payment processing.</p>
      </div>
      <div>
        <h3 className="font-bold mb-2" style={{ color: colors.mutedBlue }}>SOC 2</h3>
        <p>Type II SOC 2 certified for information security management.</p>
      </div>
    </div>
  </Modal>
);

export {
  Modal,
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
};
