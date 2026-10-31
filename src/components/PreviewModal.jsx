import React, { useEffect, useRef, useState } from 'react';

export default function PreviewModal({ file, isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen || !file) return null;

  const isImage = file.file_type?.startsWith('image/');
  const isVideo = file.file_type?.startsWith('video/');
  const isAudio = file.file_type?.startsWith('audio/');
  const isPDF = file.file_type === 'application/pdf';
  const isText = file.file_type?.startsWith('text/') || ['json', 'md', 'txt', 'js', 'jsx', 'ts', 'tsx', 'css', 'html', 'xml', 'csv'].some(ext => file.filename?.endsWith('.' + ext));

  const handleLoad = () => setLoading(false);
  const handleError = () => {
    setLoading(false);
    setError('Failed to load preview');
  };

  return (
    <div
      className="preview-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${file.filename}`}
    >
      <div className="preview-modal" onClick={(e) => e.stopPropagation()} ref={modalRef}>
        <header className="preview-header">
          <h3 className="preview-title">{file.filename}</h3>
          <div className="preview-meta">
            <span className="preview-type">{file.is_link ? 'Link' : (file.file_type || 'File')}</span>
            {!file.is_link && file.file_size && (
              <span className="preview-size">{formatSize(file.file_size)}</span>
            )}
          </div>
          <button className="preview-close" onClick={onClose} aria-label="Close preview">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="preview-content">
          {loading && (
            <div className="preview-loading">
              <div className="preview-spinner" />
              <p>Loading preview...</p>
            </div>
          )}

          {error && !loading && (
            <div className="preview-error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={onClose}>Close</button>
            </div>
          )}

          {!loading && !error && (
            <>
              {isImage && (
                <img
                  src={file.url}
                  alt={file.filename}
                  className="preview-image"
                  onLoad={handleLoad}
                  onError={handleError}
                />
              )}

              {isVideo && (
                <video
                  ref={videoRef}
                  src={file.url}
                  controls
                  className="preview-video"
                  onLoadStart={() => setLoading(true)}
                  onCanPlay={handleLoad}
                  onError={handleError}
                  autoPlay
                />
              )}

              {isAudio && (
                <audio
                  ref={audioRef}
                  src={file.url}
                  controls
                  className="preview-audio"
                  onLoadStart={() => setLoading(true)}
                  onCanPlay={handleLoad}
                  onError={handleError}
                  autoPlay
                />
              )}

              {isPDF && (
                <iframe
                  src={file.url}
                  className="preview-pdf"
                  onLoad={handleLoad}
                  onError={handleError}
                  title={file.filename}
                />
              )}

              {isText && !isPDF && (
                <pre className="preview-text" onLoad={handleLoad}>
                  <code>Loading text content...</code>
                </pre>
              )}
            </>
          )}
        </div>

        <footer className="preview-footer">
          <div className="preview-actions">
            {!file.is_link && (
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Download
              </a>
            )}
            <button className="btn" onClick={() => {
              navigator.clipboard.writeText(file.url);
              alert('Link copied!');
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy Link
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function formatSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}