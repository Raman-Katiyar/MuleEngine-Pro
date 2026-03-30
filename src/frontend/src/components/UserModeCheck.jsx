import React, { useState } from 'react';
import { colors } from '../colors.js';

const getRiskVisual = (score) => {
  if (score <= 30) {
    return {
      color: colors.emeraldGreen,
      label: 'Safe',
      pillBg: 'rgba(16, 185, 129, 0.14)',
    };
  }

  if (score <= 60) {
    return {
      color: colors.amberYellow,
      label: 'Medium Risk',
      pillBg: 'rgba(245, 158, 11, 0.14)',
    };
  }

  return {
    color: colors.crimsonRed,
    label: 'High Risk',
    pillBg: 'rgba(220, 38, 38, 0.14)',
  };
};

function UserModeCheck({ apiUrl }) {
  const [accountId, setAccountId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckRisk = async () => {
    if (!accountId.trim()) {
      setError('Please enter a UPI ID or Account ID.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${apiUrl.replace(/\/$/, '')}/user-mode/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account_id: accountId.trim() }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.detail || 'Risk check failed.');
      }

      setResult(payload);
    } catch (requestError) {
      setError(requestError.message || 'Unable to check risk at the moment.');
    } finally {
      setLoading(false);
    }
  };

  const riskScore = result?.risk_score ?? 0;
  const riskVisual = getRiskVisual(riskScore);

  return (
    <div
      className="backdrop-blur-sm border-2 rounded-3xl p-8 sm:p-12 shadow-lg"
      style={{
        backgroundColor: colors.softCream,
        borderColor: colors.mutedBlue,
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(255, 255, 255, 0.7) 100%)',
      }}
    >
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black mb-2" style={{ color: colors.mutedBlue }}>
          Safe Payment Check
        </h2>
        <p className="text-sm" style={{ color: colors.darkSlateGray }}>
          Enter the receiver UPI/account ID to simulate risk before sending money.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div className="sm:col-span-3">
          <label className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.mutedBlue }}>
            UPI ID / Account ID
          </label>
          <input
            type="text"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="e.g. xyz@upi or ACC_10239"
            className="w-full mt-2 rounded-xl border-2 px-4 py-3 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: colors.mutedBlue, color: colors.darkSlateGray }}
          />
        </div>
        <button
          onClick={handleCheckRisk}
          disabled={loading}
          className="rounded-xl px-4 py-3 text-white font-bold shadow-md transition-transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: colors.mutedBlue }}
        >
          {loading ? 'Checking...' : 'Check Risk'}
        </button>
      </div>

      {error && (
        <div
          className="mt-6 p-4 border-2 rounded-2xl text-sm font-semibold"
          style={{
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            borderColor: colors.crimsonRed,
            color: colors.crimsonRed,
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 border-2 rounded-2xl p-6" style={{ borderColor: riskVisual.color }}>
          <p className="text-xs uppercase tracking-wide font-bold" style={{ color: colors.darkSlateGray }}>
            Receiver
          </p>
          <p className="text-lg font-black" style={{ color: colors.mutedBlue }}>
            {result.receiver_id}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="px-4 py-2 rounded-full text-sm font-black" style={{ color: riskVisual.color, backgroundColor: riskVisual.pillBg }}>
              Risk Score: {riskScore}/100
            </div>
            <div className="px-4 py-2 rounded-full text-sm font-bold" style={{ color: riskVisual.color, border: `1px solid ${riskVisual.color}` }}>
              {result.risk_level || riskVisual.label}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-black mb-2" style={{ color: colors.mutedBlue }}>
              Reasons:
            </p>
            <ul className="space-y-2 text-sm" style={{ color: colors.darkSlateGray }}>
              {(result.reasons || []).map((reason) => (
                <li key={reason}>- {reason}</li>
              ))}
            </ul>
          </div>

          <div
            className="mt-5 p-4 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: 'rgba(90, 125, 154, 0.08)', color: colors.darkSlateGray }}
          >
            {result.warning_message}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="px-5 py-2.5 rounded-xl text-white font-bold shadow-md transition-transform hover:scale-105"
              style={{ backgroundColor: colors.mutedCoral }}
            >
              Proceed Anyway
            </button>
            <button
              className="px-5 py-2.5 rounded-xl font-bold border-2 transition-transform hover:scale-105"
              style={{ borderColor: colors.mutedBlue, color: colors.mutedBlue }}
            >
              Cancel Transaction
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default UserModeCheck;
