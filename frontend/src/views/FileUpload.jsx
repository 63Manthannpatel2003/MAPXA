import React, { useState } from 'react';
import { FiUploadCloud } from "react-icons/fi";

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const onFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage(""); // Clear message when a new file is picked
  };

  const onUpload = async () => {
    if (!file) {
      setMessage("❌ Please select a PDF file first.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5001/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        setFile(null); // Reset file input
      } else {
        setMessage("⚠️ Error: " + data.error);
      }
    } catch (err) {
      setMessage("🌐 Could not connect to the server.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- Styles ---
  const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  // background: 'linear-gradient(135deg, #ede9fe 0%, #f8fafc 100%)',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  };

  const cardStyle = {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    width: '400px',
    textAlign: 'center',
  };

  const uploadBoxStyle = {
    border: '2px dashed #a855f7',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    cursor: 'pointer',
    backgroundColor: file ? '#f7fafc' : 'transparent',
    transition: 'all 0.3s ease',
  };

 const buttonStyle = {
  background: isUploading
    ? '#c4b5fd'
    : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #6d28d9 100%)',

  color: '#ffffff',
  border: 'none',
  width: '100%',
  padding: '15px 20px',
  borderRadius: '16px',

  fontSize: '16px',
  fontWeight: '700',
  letterSpacing: '0.3px',

  cursor: isUploading ? 'not-allowed' : 'pointer',

  boxShadow: isUploading
    ? 'none'
    : '0 14px 35px rgba(124, 58, 237, 0.35)',

  transition: 'all 0.3s ease',

  outline: 'none',

  position: 'relative',
  overflow: 'hidden',
};

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={{ color: '#2d3748', marginBottom: '10px' }}>Upload PDF</h2>
        <p style={{ color: '#718096', fontSize: '14px', marginBottom: '25px' }}>
          Select a document to store on our server
        </p>
        <div style={uploadBoxStyle}>
          <input 
            type="file" 
            accept="application/pdf" 
            onChange={onFileChange}
            id="fileInput"
            style={{ display: 'none'}} 
          />
          <label htmlFor="fileInput" style={{ cursor: 'pointer' }}>
            <div style={{ fontSize: '30px', marginBottom: '10px' }}>
                <FiUploadCloud />
            </div>
            <div style={{ color: '#4a5568', fontWeight: '500' }}>
              {file ? file.name : "Click to browse files"}
            </div>
            <div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '5px' }}>
              Only PDF files are supported
            </div>
          </label>
        </div>

        <button
  onClick={onUpload}
  style={buttonStyle}
  disabled={isUploading}

  onMouseEnter={(e) => {
    if (!isUploading) {
      e.target.style.transform = 'translateY(-3px)';
      e.target.style.boxShadow =
        '0 20px 40px rgba(124, 58, 237, 0.45)';
    }
  }}

  onMouseLeave={(e) => {
    if (!isUploading) {
      e.target.style.transform = 'translateY(0px)';
      e.target.style.boxShadow =
        '0 14px 35px rgba(124, 58, 237, 0.35)';
    }
  }}
>
  {isUploading ? "Uploading..." : "Upload File"}
</button>

        {message && (
          <p style={{ 
            marginTop: '20px', 
            fontSize: '14px', 
            color: message.includes('✅') ? '#38a169' : '#e53e3e',
            backgroundColor: message.includes('✅') ? '#f0fff4' : '#fff5f5',
            padding: '10px',
            borderRadius: '4px'
          }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;