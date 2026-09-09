import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  preference: ThemePreference;
  /** What is actually painted right now. */
  resolved: 'light' | 'dark';
  setPreference: (preference: ThemePreference) => void;
  cycle: () => void;
}

const STORAGE_KEY = 'up_byelaws_theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function readPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
  const [systemDark, setSystemDark] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  // Follow the OS live, so "system" keeps tracking after sunset rather than freezing
  // at whatever the OS was doing when the tab opened.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const resolved: 'light' | 'dark' = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    document.documentElement.style.colorScheme = resolved;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', resolved === 'dark' ? '#000000' : '#fbfbfd');
  }, [resolved]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode — the theme still applies for this session */
    }
  }, []);

  const cycle = useCallback(() => {
    setPreference(preference === 'light' ? 'dark' : preference === 'dark' ? 'system' : 'light');
  }, [preference, setPreference]);

  const value = useMemo(() => ({ preference, resolved, setPreference, cycle }), [preference, resolved, setPreference, cycle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};
