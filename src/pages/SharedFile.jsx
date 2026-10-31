import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/SharedFile.css';

function SharedFile() {
  const { shareToken } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { mode, toggleMode, colorScheme, setColorScheme, colorSchemes, scheme } = useTheme();

  useEffect(() => {
    fetchSharedFile();
  }, [shareToken]);

  const fetchSharedFile = async () => {
    try {
      const { data: share, error: shareError } = await supabase
        .from('shares')
        .select('file_id')
        .eq('share_token', shareToken)
        .single();

      if (shareError || !share) throw new Error('Share link not found');

      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', share.file_id)
        .single();

      if (fileError || !fileData) throw new Error('File not found');

      setFile(fileData);
      setError('');
    } catch (err) {
      setError(err.message);
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
      <ThemeToggle className="shared-theme-toggle" showColorSchemes />
      <div className="shared-file-box">
        <h1>📁 File Storage</h1>

        {loading && <p className="loading">Loading...</p>}

        {error && <div className="error-message">{error}</div>}

        {file && (
          <div className="file-details">
            {file.is_link ? (
              <>
                <div className="file-icon">🔗</div>
                <h2>{file.filename}</h2>
                <p>Shared Link</p>
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Open Link
                </a>
              </>
            ) : (
              <>
                <div className="file-icon">📄</div>
                <h2>{file.filename}</h2>
                <p>{file.file_type}</p>
                <p className="file-size">{formatFileSize(file.file_size)}</p>
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Download File
                </a>
              </>
            )}
            <p className="created-date">
              Shared on {new Date(file.created_at).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SharedFile;