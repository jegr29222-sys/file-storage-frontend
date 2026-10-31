import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFiles } from '../hooks/useFiles';
import { useTheme } from '../hooks/useTheme';
import DropZone from '../components/DropZone';
import PreviewModal from '../components/PreviewModal';
import ThemeToggle from '../components/ThemeToggle';
import ShareModal from '../components/ShareModal';
import '../styles/Dashboard.css';

function Dashboard() {
  const { user, signOut } = useAuth();
  const { files, loading, error, fetchFiles, uploadFile, addLink, deleteFile, restoreFile, permanentDelete, createShare, shareWithUser, fetchSharedWithMe } = useFiles();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [addingLink, setAddingLink] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sharingId, setSharingId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [previewFile, setPreviewFile] = useState(null);
  const [bulkAction, setBulkAction] = useState(null);
  const [shareModalFile, setShareModalFile] = useState(null);
  const lastSelectedRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'shared') {
      fetchSharedWithMe();
    } else {
      fetchFiles(activeTab === 'trash');
    }
  }, [fetchFiles, fetchSharedWithMe, activeTab]);

  const filteredFiles = files.filter(f => {
    if (activeTab === 'links') return f.is_link;
    if (activeTab === 'shared') return f.shared_by_email; // files shared with me
    if (activeTab === 'trash') return false;
    // 'all' tab: show user's own files (not shared with me, not links)
    return !f.shared_by_email && !f.is_link;
  }).filter(f => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return f.filename.toLowerCase().includes(query) ||
           (f.file_type && f.file_type.toLowerCase().includes(query));
  });

  const handleFileUpload = useCallback(async (fileList) => {
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < filesArray.length; i++) {
        await uploadFile(filesArray[i]);
        setProgress(Math.round(((i + 1) / filesArray.length) * 100));
      }
      setProgress(100);
    } catch (err) {
      // error handled in hook
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  }, [uploadFile]);

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    let url = linkUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    setAddingLink(true);
    try {
      await addLink(url, linkName.trim() || url);
      setLinkUrl('');
      setLinkName('');
      setShowLinkForm(false);
    } catch (err) {
      // error handled in hook
    } finally {
      setAddingLink(false);
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Move "${file.filename}" to trash?`)) return;
    try {
      await deleteFile(file.id, file.storage_path);
      setSelectedFiles(prev => {
        const next = new Set(prev);
        next.delete(file.id);
        return next;
      });
    } catch (err) {
      // error handled in hook
    }
  };

  const handleRestore = async (file) => {
    try {
      await restoreFile(file.id);
      setSelectedFiles(prev => {
        const next = new Set(prev);
        next.delete(file.id);
        return next;
      });
    } catch (err) {
      // error handled in hook
    }
  };

  const handlePermanentDelete = async (file) => {
    if (!window.confirm(`Permanently delete "${file.filename}"? This cannot be undone.`)) return;
    try {
      await permanentDelete(file.id, file.storage_path);
      setSelectedFiles(prev => {
        const next = new Set(prev);
        next.delete(file.id);
        return next;
      });
    } catch (err) {
      // error handled in hook
    }
  };

  const handleBulkDelete = async () => {
    const filesToDelete = files.filter(f => selectedFiles.has(f.id));
    if (!window.confirm(`Move ${filesToDelete.length} item(s) to trash?`)) return;

    try {
      for (const file of filesToDelete) {
        await deleteFile(file.id, file.storage_path);
      }
      setSelectedFiles(new Set());
    } catch (err) {
      // error handled in hook
    }
  };

  const handleBulkPermanentDelete = async () => {
    const filesToDelete = files.filter(f => selectedFiles.has(f.id));
    if (!window.confirm(`Permanently delete ${filesToDelete.length} item(s)? This cannot be undone.`)) return;

    try {
      for (const file of filesToDelete) {
        await permanentDelete(file.id, file.storage_path);
      }
      setSelectedFiles(new Set());
    } catch (err) {
      // error handled in hook
    }
  };

  const handleBulkRestore = async () => {
    const filesToRestore = files.filter(f => selectedFiles.has(f.id));
    try {
      for (const file of filesToRestore) {
        await restoreFile(file.id);
      }
      setSelectedFiles(new Set());
    } catch (err) {
      // error handled in hook
    }
  };

  const handleBulkShare = async () => {
    const filesToShare = files.filter(f => selectedFiles.has(f.id) && !f.is_link);
    if (filesToShare.length === 0) return alert('No files to share (links cannot be shared)');

    try {
      const urls = [];
      for (const file of filesToShare) {
        const shareUrl = await createShare(file.id);
        urls.push(shareUrl);
      }
      navigator.clipboard.writeText(urls.join('\n'));
      alert(`${urls.length} share link(s) copied to clipboard!`);
      setSelectedFiles(new Set());
    } catch (err) {
      // error handled in hook
    }
  };

  const handleShare = async (file) => {
    setShareModalFile(file);
  };

  const handleShareWithUser = async (fileId, email) => {
    await shareWithUser(fileId, email);
    // fetchSharedWithMe will be called by the recipient when they switch to that tab
  };

  const handleCloseShareModal = () => {
    setShareModalFile(null);
  };

  const handleRowClick = (file, e, index) => {
    if (e.target.closest('button, a, input')) return;
    if (e.shiftKey && lastSelectedRef.current !== null) {
      const start = Math.min(index, lastSelectedRef.current);
      const end = Math.max(index, lastSelectedRef.current);
      const allFiles = activeTab === 'trash' ? files : filteredFiles;
      const newSelection = new Set(selectedFiles);
      for (let i = start; i <= end; i++) {
        newSelection.add(allFiles[i].id);
      }
      setSelectedFiles(newSelection);
    } else {
      const newSelection = new Set(selectedFiles);
      if (newSelection.has(file.id)) {
        newSelection.delete(file.id);
      } else {
        newSelection.add(file.id);
      }
      setSelectedFiles(newSelection);
      lastSelectedRef.current = index;
    }
  };

  const handleCheckboxChange = (fileId, checked) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (checked) next.add(fileId);
      else next.delete(fileId);
      return next;
    });
  };

  const handleSelectAll = (allFiles) => {
    if (selectedFiles.size === allFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(allFiles.map(f => f.id)));
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '—';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    if (file.is_link) return '🔗';
    if (file.file_type?.startsWith('image/')) return '🖼️';
    if (file.file_type?.startsWith('video/')) return '🎬';
    if (file.file_type?.startsWith('audio/')) return '🎵';
    if (file.file_type === 'application/pdf') return '📄';
    if (file.file_type?.includes('zip') || file.file_type?.includes('compressed')) return '📦';
    return '📁';
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handlePreview = (file) => {
    setPreviewFile(file);
  };

  const handlePreviewClose = () => {
    setPreviewFile(null);
  };

  const isTrash = activeTab === 'trash';
  const currentFiles = isTrash ? files : filteredFiles;
  const hasSelection = selectedFiles.size > 0;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>File Storage</h1>
          <p>{user?.email}</p>
        </div>
        <div className="header-actions">
          <ThemeToggle showColorSchemes />
          <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
        </div>
      </header>

      <div className="dashboard-content">
        <aside className="sidebar">
          <h3>Storage</h3>
          <div className="storage-info">
            <h3>Unlimited</h3>
            <p>No storage limits</p>
          </div>
          <div className="folders">
            <button className={activeTab === 'all' ? 'active' : ''} onClick={() => { setActiveTab('all'); setSelectedFiles(new Set()); }}>All Files</button>
            <button className={activeTab === 'shared' ? 'active' : ''} onClick={() => { setActiveTab('shared'); setSelectedFiles(new Set()); }}>Shared with Me</button>
            <button className={activeTab === 'links' ? 'active' : ''} onClick={() => { setActiveTab('links'); setSelectedFiles(new Set()); }}>Links</button>
            <button className={activeTab === 'trash' ? 'active' : ''} onClick={() => { setActiveTab('trash'); setSelectedFiles(new Set()); }}>Trash</button>
          </div>
        </aside>

        <main className="main-content">
          {error && <div className="error-banner">{error}</div>}

          {!isTrash && (
            <>
              <DropZone onFilesSelected={handleFileUpload} disabled={uploading} />

              <div className="toolbar">
                <div className="search-input-wrapper">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="search"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search files"
                  />
                </div>
                <button className="btn btn-primary" onClick={() => setShowLinkForm(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Link
                </button>
              </div>
            </>
          )}

          {hasSelection && (
            <div className="bulk-toolbar">
              <span className="bulk-toolbar-info">
                {selectedFiles.size} item{selectedFiles.size !== 1 ? 's' : ''} selected
              </span>
              <div className="bulk-toolbar-actions">
                {isTrash ? (
                  <>
                    <button className="btn btn-primary" onClick={handleBulkRestore}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z" />
                        <polyline points="12 3 12 7 12 11" />
                      </svg>
                      Restore
                    </button>
                    <button className="btn btn-danger" onClick={handleBulkPermanentDelete}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                      Delete Forever
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-primary" onClick={handleBulkShare}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                      Share
                    </button>
                    <button className="btn btn-danger" onClick={handleBulkDelete}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Delete
                    </button>
                  </>
                )}
                <button className="btn" onClick={() => setSelectedFiles(new Set())}>Clear</button>
              </div>
            </div>
          )}

          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar" style={{ width: progress + '%' }} />
            </div>
          )}

          {showLinkForm && !isTrash && (
            <form className="add-link-form" onSubmit={handleAddLink}>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                required
              />
              <input
                type="text"
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
                placeholder="Link name (optional)"
              />
              <button type="submit" className="btn btn-primary" disabled={addingLink}>
                {addingLink ? 'Adding...' : 'Add Link'}
              </button>
              <button type="button" className="btn" onClick={() => setShowLinkForm(false)}>Cancel</button>
            </form>
          )}

          <div className="files-list">
            {loading ? (
              <div className="loading">Loading files...</div>
            ) : currentFiles.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">{isTrash ? '🗑️' : '📁'}</div>
                <p>{isTrash ? 'Trash is empty' : 'No files yet. Upload a file or add a link to get started.'}</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th style={{width: '56px', textAlign: 'center'}}>
                      <label className="select-all-header">
                        <input
                          type="checkbox"
                          className="select-checkbox"
                          checked={selectedFiles.size === currentFiles.length && currentFiles.length > 0}
                          indeterminate={selectedFiles.size > 0 && selectedFiles.size < currentFiles.length}
                          onChange={(e) => handleSelectAll(currentFiles)}
                          aria-label="Select all"
                        />
                      </label>
                    </th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentFiles.map((file, index) => (
                    <tr
                      key={file.id}
                      className={selectedFiles.has(file.id) ? 'selected' : ''}
                      onClick={(e) => handleRowClick(file, e, index)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleRowClick(file, e, index);
                        }
                      }}
                    >
                      <td style={{textAlign: 'center'}} data-label="Select">
                        <input
                          type="checkbox"
                          className="select-checkbox"
                          checked={selectedFiles.has(file.id)}
                          onChange={(e) => handleCheckboxChange(file.id, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${file.filename}`}
                        />
                      </td>
                      <td className="file-name-cell" data-label="Name">
                        <span className="file-icon">{getFileIcon(file)}</span>
                        <span className="file-name" title={file.filename}>{file.filename}</span>
                      </td>
                      <td data-label="Type">
                        <span className={`pill ${file.is_link ? 'pill-link' : ''}`}>
                          {file.is_link ? 'Link' : (file.file_type || 'File')}
                        </span>
                      </td>
                      <td data-label="Size">{formatSize(file.file_size)}</td>
                      <td data-label="Actions">
                        {isTrash ? (
                          <>
                            <button className="action-btn" onClick={(e) => { e.stopPropagation(); handleRestore(file); }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z" />
                              </svg>
                              Restore
                            </button>
                            <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handlePermanentDelete(file); }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                              Delete Forever
                            </button>
                          </>
                        ) : (
                          <>
                            {!file.is_link && (
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="action-link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="17 8 12 3 7 8" />
                                  <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                Download
                              </a>
                            )}
                            {file.is_link && (
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="action-link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                  <polyline points="15 3 21 3 21 9" />
                                  <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                                Open
                              </a>
                            )}
                            <button
                              className="action-btn"
                              onClick={(e) => { e.stopPropagation(); handlePreview(file); }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              Preview
                            </button>
                            <button
                              className="action-btn"
                              onClick={(e) => { e.stopPropagation(); handleShare(file); }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="18" cy="5" r="3" />
                                <circle cx="6" cy="12" r="3" />
                                <circle cx="18" cy="19" r="3" />
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                              </svg>
                              Share
                            </button>
                            <button
                              className="delete-btn"
                              onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      <footer className="dashboard-footer">
        Made by jegr
      </footer>
      <PreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={handlePreviewClose}
      />
      <ShareModal
        isOpen={!!shareModalFile}
        onClose={handleCloseShareModal}
        file={shareModalFile}
        onShare={handleShareWithUser}
      />
    </div>
  );
}

export default Dashboard;