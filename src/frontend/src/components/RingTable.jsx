import React, { useState } from 'react';
import { colors } from '../colors.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faFileDownload, faEye, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import jsPDF from 'jspdf';

const RingTable = ({ rings, apiUrl, suspicious_accounts = [], summary = {}, onRingSelect = null }) => {
  const [selectedRingId, setSelectedRingId] = useState(null);

  const getRiskLevel = (riskScore) => {
    if (riskScore >= 80) return 'HIGH';
    if (riskScore >= 50) return 'MEDIUM';
    return 'LOW';
  };

  const getRiskColor = (riskLevel) => {
    if (riskLevel === 'HIGH') return colors.mutedCoral;
    if (riskLevel === 'MEDIUM') return colors.amberYellowBright;
    return colors.mutedBlue;
  };

  const getRiskBgColor = (riskLevel) => {
    if (riskLevel === 'HIGH') return 'rgba(224, 122, 95, 0.12)';
    if (riskLevel === 'MEDIUM') return 'rgba(245, 158, 11, 0.08)';
    return 'rgba(90, 125, 154, 0.06)';
  };

  const handleViewRing = (ringId) => {
    const newId = selectedRingId === ringId ? null : ringId;
    setSelectedRingId(newId);
    if (onRingSelect) {
      onRingSelect(newId);
    }
  };

  const handleDownloadJSON = async () => {
    try {
      console.log(" Downloading JSON results...");
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

      console.log(" JSON downloaded successfully");
    } catch (error) {
      console.error(" Download error:", error);
      alert("Failed to download JSON: " + error.message);
    }
  };

  const handleGeneratePDF = () => {
    try {
      console.log(" Generating PDF report...");
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Title
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('FINANCIAL CRIME INVESTIGATION REPORT', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Report Metadata
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Report Type: Fraud Ring Detection & Account Risk Analysis`, 20, yPosition);
      yPosition += 12;

      // Executive Summary Section
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('EXECUTIVE SUMMARY', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const highRiskCount = suspicious_accounts.filter(a => a.final_risk_level === 'High').length;
      const summaryData = [
        [`Total Accounts Analyzed`, summary.total_accounts_analyzed || suspicious_accounts.length],
        [`Suspicious Accounts Flagged`, summary.suspicious_accounts_flagged || suspicious_accounts.length],
        [`Fraud Rings Detected`, rings.length],
        [`High Risk Accounts`, highRiskCount],
        [`Processing Time`, `${summary.processing_time_seconds || 0}s`],
      ];

      summaryData.forEach(([label, value]) => {
        doc.text(`${label}:`, 25, yPosition);
        doc.setFont(undefined, 'bold');
        doc.text(String(value), pageWidth - 40, yPosition, { align: 'right' });
        doc.setFont(undefined, 'normal');
        yPosition += 8;
      });

      yPosition += 5;

      // Risk Verdict Section
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('RISK VERDICT', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const riskLevel = highRiskCount > 0 || rings.length > 2 ? ' HIGH' : rings.length > 0 ? ' MEDIUM' : ' LOW';
      doc.text(`Overall Risk Level: ${riskLevel}`, 25, yPosition);
      yPosition += 12;

      // Detected Fraud Rings Section
      if (rings.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('DETECTED FRAUD RINGS', 20, yPosition);
        yPosition += 10;

        rings.slice(0, 5).forEach((ring, idx) => {
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.text(`Ring #${idx + 1}: ${ring.ring_id}`, 25, yPosition);
          yPosition += 6;

          doc.setFont(undefined, 'normal');
          doc.text(`Pattern: ${ring.pattern_type?.replace(/_/g, ' ').toUpperCase()}`, 30, yPosition);
          yPosition += 5;
          doc.text(`Members: ${ring.member_accounts.length} accounts | Risk Score: ${ring.risk_score.toFixed(1)}/100`, 30, yPosition);
          yPosition += 5;
          doc.text(`Accounts: ${ring.member_accounts.join(', ')}`, 30, yPosition, { maxWidth: pageWidth - 60 });
          yPosition += 10;

          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }
        });

        if (rings.length > 5) {
          doc.setFont(undefined, 'italic');
          doc.text(`... and ${rings.length - 5} more fraud rings detected`, 25, yPosition);
          yPosition += 10;
        }
      }

      // Top Suspicious Accounts Section
      if (suspicious_accounts.length > 0) {
        yPosition += 5;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('TOP SUSPICIOUS ACCOUNTS', 20, yPosition);
        yPosition += 10;

        suspicious_accounts.slice(0, 10).forEach((acc, idx) => {
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.text(`${idx + 1}. ${acc.account_id}`, 25, yPosition);
          yPosition += 6;

          doc.setFont(undefined, 'normal');
          doc.text(`Risk Level: ${acc.final_risk_level} | Score: ${(acc.combined_risk_score || 0).toFixed(1)}/100`, 30, yPosition);
          yPosition += 5;
          if (acc.detected_patterns && acc.detected_patterns.length > 0) {
            doc.text(`Patterns: ${acc.detected_patterns.join(', ')}`, 30, yPosition, { maxWidth: pageWidth - 60 });
            yPosition += 5;
          }
          yPosition += 5;

          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }
        });
      }

      // Footer with report ID
      const timestamp = new Date().toISOString().split('T')[0];
      doc.setFontSize(8);
      doc.setFont(undefined, 'italic');
      doc.text(`Report ID: MuleEngine-${timestamp}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 20, pageHeight - 10);

      // Save PDF
      doc.save(`investigation_report_${timestamp}.pdf`);
      console.log(" PDF generated successfully");
    } catch (error) {
      console.error(" PDF generation error:", error);
      alert("Failed to generate PDF: " + error.message);
    }
  };

  if (!rings || rings.length === 0) {
    return (
      <div className="p-8 rounded-2xl border-2 text-center shadow-lg" style={{ 
        borderColor: colors.mutedBlue,
        background: `linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(255, 255, 255, 0.6) 100%)`
      }}>
        <p className="text-lg font-semibold" style={{ color: colors.mutedBlue }}> No fraud rings detected in this dataset.</p>
        <p className="text-xs mt-2" style={{ color: colors.darkSlateGray }}>All transactions appear to be within normal patterns.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 shadow-lg overflow-hidden" style={{ 
      borderColor: colors.mutedCoral,
      background: `linear-gradient(135deg, rgba(224, 122, 95, 0.08) 0%, rgba(255, 255, 255, 0.4) 100%)`
    }}>
      <div className="p-6 border-b-2 flex justify-between items-center gap-3" style={{ 
        backgroundColor: colors.mutedCoral, 
        borderColor: colors.mutedCoral
      }}>
        <h3 className="font-bold text-white flex items-center gap-2">
          <FontAwesomeIcon icon={faExclamationTriangle} /> Detected Fraud Rings ({rings.length})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleGeneratePDF}
            className="text-white px-4 py-2 rounded-lg text-sm font-bold transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
            style={{ backgroundColor: colors.mutedBlue }}
            title="Generate forensic investigation report in PDF format"
          >
            <FontAwesomeIcon icon={faFilePdf} /> Report (PDF)
          </button>
          <button
            onClick={handleDownloadJSON}
            className="text-white px-4 py-2 rounded-lg text-sm font-bold transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
            style={{ backgroundColor: colors.mutedBlue }}
          >
            <FontAwesomeIcon icon={faFileDownload} /> Report (JSON)
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs uppercase tracking-wider border-b-2" style={{ backgroundColor: '#F9F6F1', borderColor: colors.mutedBlue, color: colors.mutedBlue }}>
              <th className="px-6 py-4 font-black">Ring ID</th>
              <th className="px-6 py-4 font-black">Pattern Type</th>
              <th className="px-6 py-4 font-black">Risk Level</th>
              <th className="px-6 py-4 font-black">Members</th>
              <th className="px-6 py-4 font-black">Risk Score</th>
              <th className="px-6 py-4 font-black">Account IDs</th>
              <th className="px-6 py-4 font-black text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {rings.map((ring, idx) => {
              const riskLevel = getRiskLevel(ring.risk_score);
              const riskColor = getRiskColor(riskLevel);
              const riskBgColor = getRiskBgColor(riskLevel);
              const isSelected = selectedRingId === ring.ring_id;

              return (
                <tr 
                  key={ring.ring_id} 
                  className="border-b hover:shadow-md transition-all" 
                  style={{ 
                    borderColor: colors.mutedCoral + '30', 
                    backgroundColor: isSelected ? riskBgColor : (idx % 2 === 0 ? 'white' : colors.softCream)
                  }}
                >
                  <td className="px-6 py-5 font-mono text-sm font-black" style={{ color: riskColor, backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.5)' : 'inherit' }}>
                    {ring.ring_id}
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-2 rounded-xl text-xs font-black border-2 transition-all" style={{ 
                      background: `linear-gradient(135deg, ${riskColor}20 0%, ${riskColor}10 100%)`,
                      color: riskColor, 
                      borderColor: riskColor
                    }}>
                      {ring.pattern_type?.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span 
                      className="px-3 py-1.5 rounded-lg text-xs font-black text-white"
                      style={{ backgroundColor: riskColor }}
                    >
                      {riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold" style={{ color: colors.mutedBlue }}>
                    {ring.member_accounts.length} nodes
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-lg" style={{ color: riskColor }}>
                        {ring.risk_score.toFixed(1)}
                      </span>
                      <div className="w-24 rounded-full h-3" style={{ backgroundColor: colors.lightGray }}>
                        <div 
                          className="h-3 rounded-full transition-all"
                          style={{ 
                            width: `${ring.risk_score}%`,
                            backgroundColor: riskColor
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
                            style={{ backgroundColor: riskColor, borderColor: riskColor }}
                          >
                            {acc}
                          </span>
                        ))
                      ) : (
                        <>
                          {ring.member_accounts.slice(0, 3).map(acc => (
                            <span 
                              key={acc} 
                              className="px-3 py-1.5 rounded-lg border-2 font-mono font-bold hover:opacity-80 transition-opacity text-white"
                              style={{ backgroundColor: riskColor, borderColor: riskColor }}
                            >
                              {acc}
                            </span>
                          ))}
                          <span className="italic font-black px-2 py-1.5 rounded-lg border-2" style={{ color: riskColor, borderColor: riskColor, backgroundColor: riskBgColor }}>
                            +{ring.member_accounts.length - 3} more
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button
                      onClick={() => handleViewRing(ring.ring_id)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all transform hover:scale-105 flex items-center gap-2 mx-auto ${
                        isSelected ? 'shadow-lg scale-105' : 'shadow'
                      }`}
                      style={{
                        backgroundColor: isSelected ? riskColor : colors.mutedBlue,
                        color: 'white'
                      }}
                      title={isSelected ? 'Hide this ring graph' : 'View this ring in graph'}
                    >
                      <FontAwesomeIcon icon={faEye} /> {isSelected ? 'Viewing' : 'View'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="p-4 text-xs border-t-2 font-semibold" style={{ backgroundColor: colors.softCream, borderColor: colors.mutedCoral, color: colors.darkSlateGray }}>
         Money muling detection | Patterns: Circular Fund Routing, Smurfing (Fan-in/out), Layered Shell Networks
      </div>
    </div>
  );
};

export default RingTable;