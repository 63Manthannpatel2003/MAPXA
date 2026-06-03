import React, { useState } from "react";
import "./FileUpload.css";
import { FiCheckCircle, FiFileText, FiUploadCloud } from "react-icons/fi";


const FileUpload = ({ onSuccess }) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.reload();
  };

  const onFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
    setMessageType("");
  };

  const onUpload = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      setMessageType("error");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.filename ? `Processed ${data.filename}` : "File processed.");
        setMessageType("success");
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        setMessage(data.error || "Upload failed.");
        setMessageType("error");
      }
    } catch {
      setMessage("Server connection failed.");
      setMessageType("error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="background-decoration">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="dots dots-1"></div>
        <div className="dots dots-2"></div>
      </div>

      <div className="upload-header">
        <div className="upload-badge">
          <h1>Smart Roster</h1>
        </div>

        <p>
          Upload any file and generate smart rosters instantly.
          <br />
          Works for every team member.
        </p>

        <button className="logout-btn" onClick={handleLogout}>
          Sign out
        </button>
      </div>

      <div className="upload-wrapper">
        <div className="upload-card">
          <div className="upload-container">
            <div className="upload-box">
              <input
                type="file"
                id="fileInput"
                hidden
                accept=".csv,.xls,.xlsx,.xlsm,.json,.txt,.pdf"
                onChange={onFileChange}
              />

              <label htmlFor="fileInput">
                <div className="upload-icon">
                  <FiUploadCloud />
                </div>

                <h2>Click or drag file here</h2>
                <p>CSV, Excel, JSON, TXT, PDF</p>
              </label>
            </div>

            {file && (
              <div className="file-preview">
                <div className="file-card">
                  <div className="file-left">
                    <div className="file-icon">
                      <FiFileText />
                    </div>

                    <div className="file-info">
                      <h3>{file.name}</h3>
                      <p>
                        {(file.size / 1024).toFixed(1)} KB - {file.type || "File"}
                      </p>
                    </div>
                  </div>

                  <div className="success-icon">
                    <FiCheckCircle />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            className="generate-btn"
            onClick={onUpload}
            disabled={isUploading || !file}
          >
            <span className="btn-star">*</span>
            {isUploading ? "Uploading..." : "Generate Report"}
          </button>

          {message && <div className={`message ${messageType}`}>{message}</div>}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
