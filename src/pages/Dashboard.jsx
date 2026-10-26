import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Dashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Dashboard({ user, onLogout }) {
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState('root');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkName, setLinkName] = useState('');
  const [linkTarget, setLinkTarget] = useState('');

  useEffect(() => {
    // Set authorization header
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    fetchFiles();
  }, [currentFolder]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/files?folder=${currentFolder}`);
      setFiles(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', currentFolder);

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/files/upload`, formData, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });
      setUploadProgress(0);
      fetchFiles();
    } catch (err) {
      setError('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async () => {
    if (!linkName || !linkTarget) {
      setError('Link name and target required');
      return;
    }

    let target = linkTarget;
    // Add https:// if no protocol specified
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }

    try {
      await axios.post(`${API_BASE_URL}/files/link`, {
        linkName,
        linkTarget: target,
        folder: currentFolder
      });
      setLinkName('');
      setLinkTarget('');
      setShowAddLink(false);
      fetchFiles();
    } catch (err) {
      setError('Failed to add link');
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (window.confirm('Delete this file?')) {
      try {
        await axios.delete(`${API_BASE_URL}/files/${fileId}`);
        fetchFiles();
      } catch (err) {
        setError('Failed to delete file');
      }
    }
  };

  const handleCreateShare = async (fileId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/share/create`, {
        fileId: fileId
      });
      const shareUrl = response.data.shareUrl;
      navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch (err) {
      setError('Failed to create share link');
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
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>File Storage</h1>
          <p>Welcome, {user?.name || user?.email}</p>
        </div>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>

      <div className="dashboard-content">
        <div className="sidebar">
          <div className="storage-info">
            <h3>Storage</h3>
            <p>Unlimited Storage</p>
          </div>
          <div className="folders">
            <h3>Folders</h3>
            <button
              className={currentFolder === 'root' ? 'active' : ''}
              onClick={() => setCurrentFolder('root')}
            >
              📁 Root
            </button>
          </div>
        </div>

        <div className="main-content">
          {error && <div className="error-banner">{error}</div>}

          <div className="toolbar">
            <label className="upload-btn">
              📤 Upload File
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={loading}
                style={{ display: 'none' }}
              />
            </label>
            <button
              className="add-link-btn"
              onClick={() => setShowAddLink(!showAddLink)}
            >
              🔗 Add Link
            </button>
          </div>

          {uploadProgress > 0 && (
            <div className="upload-progress">
              <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
              <span>{uploadProgress}%</span>
            </div>
          )}

          {showAddLink && (
            <div className="add-link-form">
              <input
                type="text"
                placeholder="Link name"
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
              />
              <input
                type="url"
                placeholder="Link target (URL)"
                value={linkTarget}
                onChange={(e) => setLinkTarget(e.target.value)}
              />
              <button onClick={handleAddLink}>Add Link</button>
              <button onClick={() => setShowAddLink(false)}>Cancel</button>
            </div>
          )}

          <div className="files-list">
            {loading && !uploadProgress ? (
              <p className="loading">Loading files...</p>
            ) : files.length === 0 ? (
              <p className="empty">No files yet. Upload or add a link to get started!</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr key={file._id}>
                      <td>
                        {file.isLink ? '🔗' : '📄'} {file.filename}
                      </td>
                      <td>{file.isLink ? 'Link' : file.fileType || 'File'}</td>
                      <td>{file.fileSize ? formatFileSize(file.fileSize) : '-'}</td>
                      <td>{new Date(file.createdAt).toLocaleDateString()}</td>
                      <td>
                        {!file.isLink && (
                          <>
                            <a href={file.url} download className="action-link">
                              ⬇️ Download
                            </a>
                            <button
                              className="action-btn"
                              onClick={() => handleCreateShare(file._id)}
                            >
                              🔗 Share
                            </button>
                          </>
                        )}
                        {file.isLink && (
                          <a href={file.linkTarget} target="_blank" rel="noopener noreferrer" className="action-link">
                            🔗 Open
                          </a>
                        )}
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteFile(file._id)}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
