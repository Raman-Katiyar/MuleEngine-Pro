import React, { useState } from 'react';
import { colors } from '../colors.js';

const FileUpload = ({ onAnalysisComplete }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Please select a valid CSV file.");
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Ensure API URL doesn't have trailing slash
      const apiUrl = process.env.REACT_APP_API_URL?.replace(/\/$/, '') || 'http://localhost:5000';
      const analyzeUrl = `${apiUrl}/analyze`;
      
      console.log("📤 Uploading CSV:", file.name, `API: ${analyzeUrl}`);
      
      // API call to our FastAPI backend
      const response = await fetch(analyzeUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Backend Error:", errorData);
        throw new Error(errorData.detail || 'Analysis failed');
      }

      const data = await response.json();
      console.log("✅ Analysis successful, data received:", data);
      onAnalysisComplete(data);
    } catch (err) {
      console.error("❌ Upload Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="backdrop-blur-sm border-2 rounded-2xl p-10 shadow-lg hover:shadow-xl transition-all duration-300" style={{ backgroundColor: colors.softCream, borderColor: colors.mutedBlue }}>
      <label className="block cursor-pointer group">
        <div className="border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300 hover:bg-blue-50/50" style={{ borderColor: colors.mutedBlue }}>
          <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">📁</div>
          <h3 className="text-xl font-bold mb-2" style={{ color: colors.mutedBlue }}>
            Drag & Drop Your CSV
          </h3>
          <p className="text-sm mb-4" style={{ color: colors.darkSlateGray }}>or click to browse your files</p>
          <p className="text-xs font-semibold" style={{ color: colors.darkSlateGray }}>
            ⚡ Supports: transaction_id, sender_id, receiver_id, amount, timestamp
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </label>

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full mt-8 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-3 disabled:opacity-50" 
        style={{ backgroundColor: colors.darkSlateGray }}
      >
        {loading ? (
          <>
            <span className="text-xl animate-spin">⚙️</span>
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <span>Analyze CSV</span>
          </>
        )}
      </button>

      {file && (
        <div className="mt-6 p-4 rounded-xl text-sm flex items-center gap-3 border-2" style={{ backgroundColor: '#F0FFF4', borderColor: colors.mutedBlue }}>
          <span>✅</span>
          <div>
            <p className="font-semibold" style={{ color: colors.mutedBlue }}>{file.name}</p>
            <p className="text-xs" style={{ color: colors.darkSlateGray }}>{(file.size / 1024).toFixed(2)} KB</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-300 text-sm flex items-center gap-3">
          <span>❌</span>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;