import React from 'react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle({ showColorSchemes = false }) {
  const { mode, toggleMode, colorScheme, setColorScheme, colorSchemes, scheme } = useTheme();

  return (
    <div className="theme-toggle-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        className="theme-toggle"
        onClick={toggleMode}
        aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
        title={`Current: ${mode}. Click to toggle.`}
      >
        {mode === 'dark' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      {showColorSchemes && (
        <div className="color-scheme-selector" role="group" aria-label="Color scheme">
          {colorSchemes.map(({ key, accentPrimary, accentSecondary, name, accentGradient }) => (
            <button
              key={key}
              className={`color-scheme-btn ${colorScheme === key ? 'active' : ''}`}
              onClick={() => setColorScheme(key)}
              aria-label={`Color scheme: ${name}`}
              title={name}
              style={{
                '--scheme-gradient': accentGradient,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}