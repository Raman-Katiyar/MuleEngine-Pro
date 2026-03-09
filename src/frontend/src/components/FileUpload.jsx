import React, { useState } from 'react';
import { colors } from '../colors.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faFileCsv, faBolt, faCheckCircle, faBoxOpen, faTimes } from '@fortawesome/free-solid-svg-icons';

const FileUpload = ({ onAnalysisComplete }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.type === 'text/csv') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Please drop a valid CSV file.");
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Ensure API URL doesn't have trailing slash
      const apiUrl = process.env.REACT_APP_API_URL?.replace(/\/$/, '') || 'http://localhost:5000';
      const analyzeUrl = `${apiUrl}/analyze`;
      
      console.log(" Uploading CSV:", file.name, `API: ${analyzeUrl}`);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + Math.random() * 30, 90));
      }, 200);
      
      // API call to our FastAPI backend
      const response = await fetch(analyzeUrl, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(" Backend Error:", errorData);
        throw new Error(errorData.detail || 'Analysis failed');
      }

      const data = await response.json();
      console.log(" Analysis successful, data received:", data);
      
      // Delay to show 100% progress
      setTimeout(() => {
        onAnalysisComplete(data);
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      console.error(" Upload Error:", err);
      setError(err.message);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="backdrop-blur-sm border-2 rounded-3xl p-8 sm:p-12 shadow-lg hover:shadow-2xl transition-all duration-500 bg-light-blue"
      style={{ 
        backgroundColor: colors.softCream, 
        borderColor: colors.mutedBlue,
        background: `linear-gradient(135deg, rgba(90, 125, 154, 0.08) 0%, rgba(255, 255, 255, 0.6) 100%)`
      }}
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black mb-2" style={{ color: colors.mutedBlue }}>
          📤 Upload Transaction Data
        </h2>
        <p className="text-sm" style={{ color: colors.darkSlateGray }}>
          Analyze your financial transactions for money muling patterns in seconds
        </p>
      </div>

      <label 
        className="block cursor-pointer group"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div 
          className={`border-2 border-dashed rounded-3xl p-12 sm:p-16 text-center transition-all duration-300 transform ${
            dragActive ? 'scale-105 border-solid' : 'hover:scale-102'
          }`}
          style={{ 
            borderColor: dragActive ? colors.mutedCoral : colors.mutedBlue,
            backgroundColor: dragActive ? 'rgba(224, 122, 95, 0.1)' : 'transparent'
          }}
        >
          <div className={`text-7xl mb-4 transition-all duration-300 ${dragActive ? 'animate-bounce' : 'animate-float'}`}>
            <FontAwesomeIcon icon={dragActive ? faUpload : faFileCsv} />
          </div>
          <h3 className="text-2xl font-bold mb-2" style={{ color: colors.mutedBlue }}>
            {dragActive ? 'Drop your CSV here' : 'Drag & Drop Your CSV'}
          </h3>
          <p className="text-base mb-4" style={{ color: colors.darkSlateGray }}>
            or <span className="font-bold underline">click to browse</span> your files
          </p>
          <p className="text-xs font-semibold px-4 py-2 rounded-lg inline-block" style={{ backgroundColor: 'rgba(90, 125, 154, 0.1)', color: colors.mutedBlue }}>
            <FontAwesomeIcon icon={faBolt} /> Supports: transaction_id, sender_id, receiver_id, amount, timestamp
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </label>

      {/* File Info Card */}
      {file && (
        <div 
          className="mt-8 p-4 rounded-2xl text-sm flex items-center gap-4 border-2 animate-fade-in-up shadow-md"
          style={{ backgroundColor: '#F0FFF4', borderColor: colors.emeraldGreen }}
        >
          <div className="text-3xl"><FontAwesomeIcon icon={faCheckCircle} /></div>
          <div className="flex-grow">
            <p className="font-bold text-base" style={{ color: colors.emeraldGreen }}>{file.name}</p>
            <p className="text-xs" style={{ color: colors.darkSlateGray }}><FontAwesomeIcon icon={faBoxOpen} /> {(file.size / 1024).toFixed(2)} KB | <FontAwesomeIcon icon={faBolt} /> Ready to analyze</p>
          </div>
          <button 
            onClick={() => {
              setFile(null);
              setError(null);
            }}
            className="text-xl hover:scale-125 transition-transform"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full mt-8 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed btn-interactive"
        style={{ 
          backgroundColor: file && !loading ? colors.mutedBlue : colors.darkSlateGray,
          boxShadow: file && !loading ? `0 10px 25px -5px rgba(90, 125, 154, 0.4)` : 'none'
        }}
      >
        {loading ? (
          <>
            <span className="text-2xl animate-spin">⚙️</span>
            <span>Analyzing... {uploadProgress > 0 ? `(${Math.round(uploadProgress)}%)` : ''}</span>
          </>
        ) : (
          <>
            <span className="text-lg">🚀</span>
            <span>Analyze CSV</span>
          </>
        )}
      </button>

      {/* Progress Bar */}
      {loading && uploadProgress > 0 && (
        <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full progress-bar transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div 
          className="mt-6 p-4 border-2 rounded-2xl text-sm flex items-center gap-3 animate-fade-in-up shadow-md"
          style={{ 
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            borderColor: colors.crimsonRed,
            color: colors.crimsonRed
          }}
        >
          <span className="text-2xl">⚠️</span>
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-xs">
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
          <div className="text-2xl mb-1">📄</div>
          <p style={{ color: colors.emeraldGreen }} className="font-bold">CSV Format</p>
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(90, 125, 154, 0.1)' }}>
          <div className="text-2xl mb-1">⚡</div>
          <p style={{ color: colors.mutedBlue }} className="font-bold">&lt;30s Processing</p>
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(224, 122, 95, 0.1)' }}>
          <div className="text-2xl mb-1">🔐</div>
          <p style={{ color: colors.mutedCoral }} className="font-bold">Secure & Private</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;