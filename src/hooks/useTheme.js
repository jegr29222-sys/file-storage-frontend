import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

// Color schemes
const colorSchemes = {
  midnight: {
    name: 'Midnight Aurora',
    accentPrimary: '#7850ff',
    accentSecondary: '#00dcff',
    accentGradient: 'linear-gradient(135deg, #7850ff 0%, #00dcff 100%)',
    accentGlow: 'rgba(120, 80, 255, 0.4)',
    accentGlowStrong: 'rgba(120, 80, 255, 0.6)',
  },
  emerald: {
    name: 'Emerald Forest',
    accentPrimary: '#10b981',
    accentSecondary: '#34d399',
    accentGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    accentGlow: 'rgba(16, 185, 129, 0.4)',
    accentGlowStrong: 'rgba(16, 185, 129, 0.6)',
  },
  amber: {
    name: 'Golden Amber',
    accentPrimary: '#f59e0b',
    accentSecondary: '#fbbf24',
    accentGradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    accentGlow: 'rgba(245, 158, 11, 0.4)',
    accentGlowStrong: 'rgba(245, 158, 11, 0.6)',
  },
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('themeMode') || 'dark';
    }
    return 'dark';
  });

  const [colorScheme, setColorScheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('colorScheme') || 'midnight';
    }
    return 'midnight';
  });

  const scheme = colorSchemes[colorScheme];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.setAttribute('data-color-scheme', colorScheme);
    // Set CSS custom properties for the color scheme
    Object.entries(scheme).forEach(([key, value]) => {
      if (key !== 'name') {
        document.documentElement.style.setProperty(`--color-${key}`, value);
      }
    });
    localStorage.setItem('themeMode', mode);
    localStorage.setItem('colorScheme', colorScheme);
  }, [mode, colorScheme, scheme]);

  const toggleMode = useCallback(() => {
    setMode(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const setColorSchemeFn = useCallback((schemeKey) => {
    if (colorSchemes[schemeKey]) {
      setColorScheme(schemeKey);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{
      mode,
      toggleMode,
      colorScheme,
      setColorScheme: setColorSchemeFn,
      scheme,
      colorSchemes: Object.entries(colorSchemes).map(([key, value]) => ({ key, ...value }))
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}