import React, { useState } from "react";
import "./FileUpload.css";

import {
  FiUploadCloud,
  FiFolder
} from "react-icons/fi";

const FileUpload = () => {

  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const onFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
  };

  const onUpload = async () => {

    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {

      const response = await fetch(
        "http://localhost:5001/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(`${data.message}`);
      } else {
        setMessage(`${data.error}`);
      }

    } catch (err) {
      setMessage(" Server connection failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="background-decoration">

        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        {/* <div className="blob blob-3"></div> */}

        <div className="dots dots-1"></div>
        <div className="dots dots-2"></div>

      </div>
      <div className="upload-header">

        <div className="upload-badge">
          <h1>
            Smart Roster
          </h1>
        </div>


        <p>
          Upload any file and generate smart rosters instantly.
          <br />
          Works for every team member.
        </p>

      </div>
      <div className="upload-wrapper">

        <div className="upload-card">

          <div className="upload-container">

            <div className="upload-box">

              <input
                type="file"
                id="fileInput"
                hidden
                onChange={onFileChange}
              />

              <label htmlFor="fileInput">

                <div className="upload-icon">
                  <FiUploadCloud />
                </div>

                <h2>
                  Click or drag file here
                </h2>

                <p>
                  CSV, Excel, JSON, TXT, PDF
                </p>

              </label>

            </div>


            {file && (
              <div className="file-preview">

                <div className="file-card">

                  <div className="file-left">

                    <div className="file-icon">
                      📄
                    </div>

                    <div className="file-info">

                      <h3>
                        {file.name}
                      </h3>

                      <p>
                        {(file.size / 1024).toFixed(1)} KB • {file.type || "File"}
                      </p>

                    </div>

                  </div>

                  <div className="success-icon">
                    ✓
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
            <span className="btn-star">
              ✨
            </span>

            {isUploading
              ? "Uploading..."
              : "Generate Report"}
          </button>
          {message && (
            <div className={`message ${message.includes("✅")
              ? "success"
              : "error"
              }`}>
              {message}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default FileUpload;