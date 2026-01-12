import React, { useState, useRef, useEffect } from "react";
import "./uplaod.css";
import { useNavigate } from "react-router-dom";
const Upload = (code) => {
  const Navigate =   useNavigate() 
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const xhrRef = useRef(null);

  const ALLOWED_EXTENSIONS = [".mp4", ".mkv", ".webm", ".mov"];
  const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB


  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const ext = selectedFile.name
      .slice(selectedFile.name.lastIndexOf("."))
      .toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError("Only video files are allowed (.mp4, .mkv, .webm, .mov)");
      setFile(null);
      return;
    }

    if (!selectedFile.type.startsWith("video/")) {
      setError("Invalid video file");
      setFile(null);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("Video size exceeds 1GB limit");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError("");
    setSuccess("");
  };

  const handleUpload = () => {
    if (!file) {
      setError("Select a video first");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("You are not authenticated");
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("video", file);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress((e.loaded / e.total) * 100);
      }
    };

    xhr.onload = () => {
      console.log("STATUS:", xhr.status);
      console.log("RESPONSE:", xhr.responseText);

      if (xhr.status >= 200 && xhr.status < 300) {
        setSuccess("Video uploaded successfully 🎬");
        console.log(code.code)
        Navigate(`/Theatre?code=${code.code}`)
      

        setFile(null);
      } else if (xhr.status === 401 || xhr.status === 422) {
        setError("Authentication failed. Please login again.");
      } else {
        setError("Upload failed");
      }

      setIsLoading(false);
    };

    xhr.onerror = () => {
      setError("Network error during upload");
      setIsLoading(false);
    };

    xhr.onabort = () => {
      setError("Upload cancelled");
      setIsLoading(false);
    };

    xhr.open("POST", "http://127.0.0.1:5000/api/video/upload");

    // 🔥 JWT HEADER (CRITICAL)
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
xhr.send(formData);
  };

  return (
    <div className="upload-container">
      <h2>Upload Movie</h2>

      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        disabled={isLoading}
      />

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      {isLoading && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${uploadProgress}%` }}
          >
            {Math.round(uploadProgress)}%
          </div>
        </div>
      )}

      <button onClick={handleUpload} disabled={!file || isLoading}>
        {isLoading ? "Uploading..." : "Upload Video"}
      </button>

      {isLoading && (
        <button onClick={() => xhrRef.current.abort()}>
          Cancel
        </button>
      )}
    </div>
  );
};

export default Upload;
