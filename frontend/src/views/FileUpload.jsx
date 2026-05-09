import React, { useState } from 'react';

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
    backgroundColor: '#f0f2f5',
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
    border: '2px dashed #cbd5e0',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    cursor: 'pointer',
    backgroundColor: file ? '#f7fafc' : 'transparent',
    transition: 'all 0.3s ease',
  };

  const buttonStyle = {
    backgroundColor: isUploading ? '#a0aec0' : '#4a90e2',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: isUploading ? 'not-allowed' : 'pointer',
    width: '100%',
    transition: 'background-color 0.2s',
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
            style={{ display: 'none' }} 
          />
          <label htmlFor="fileInput" style={{ cursor: 'pointer' }}>
            <div style={{ fontSize: '30px', marginBottom: '10px' }}>📄</div>
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