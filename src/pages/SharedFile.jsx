import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/SharedFile.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function SharedFile() {
  const { shareToken } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSharedFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareToken]);

  const fetchSharedFile = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/share/${shareToken}`);
      setFile(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load shared file');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="shared-file-container">
      <div className="shared-file-box">
        <h1>📁 File Storage</h1>

        {loading && <p className="loading">Loading...</p>}

        {error && <div className="error-message">{error}</div>}

        {file && (
          <div className="file-details">
            {file.isLink ? (
              <>
                <div className="file-icon">🔗</div>
                <h2>{file.filename}</h2>
                <p>Shared Link</p>
                <a href={file.linkTarget} target="_blank" rel="noopener noreferrer" className="open-link-btn">
                  Open Link →
                </a>
              </>
            ) : (
              <>
                <div className="file-icon">📄</div>
                <h2>{file.filename}</h2>
                <p>{file.fileType}</p>
                <p className="file-size">{formatFileSize(file.fileSize)}</p>
                <a href={file.url} download className="download-btn">
                  ⬇️ Download File
                </a>
              </>
            )}
            <p className="created-date">
              Shared on {new Date(file.createdAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SharedFile;
