import React, { useState, useEffect, useRef } from 'react';
import '../styles/ShareModal.css';

export default function ShareModal({ isOpen, onClose, file, onShare }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await onShare(file.id, email.trim().toLowerCase());
      setSuccess('File shared successfully!');
      setEmail('');
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Force close regardless of loading state
    setLoading(false);
    setError('');
    setSuccess('');
    onClose();
  };

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Share File</h3>
          <button className="modal-close" onClick={handleClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="file-info">
            <span className="file-icon">{file.is_link ? '🔗' : '📄'}</span>
            <span className="file-name">{file.filename}</span>
          </div>

          <p className="share-prompt">Enter the email of the user you want to share with:</p>

          {error && <div className="modal-error">{error}</div>}
          {success && <div className="modal-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onClick={(e) => { e.target.focus(); }}
              placeholder="user@example.com"
              required
              autoFocus
              autoComplete="email"
              disabled={loading}
            />
            <div className="modal-actions">
              <button type="button" className="btn" onClick={handleClose} disabled={loading}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading || !email.trim()}>
                {loading ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}