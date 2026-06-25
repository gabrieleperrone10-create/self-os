'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Theme = 'scuro' | 'rituale';

const STORAGE_KEY = 'selfos-theme';
const DEFAULT_THEME: Theme = 'scuro';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'scuro' || stored === 'rituale') {
      setThemeState(stored);
      document.documentElement.setAttribute('data-theme', stored);
    }
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  return (
    <ThemeContext value={{ theme, setTheme }}>
      {children}
    </ThemeContext>
  );
}

/**
 * Inline script to prevent FOUC — runs before React hydration.
 * Renders as a <script> tag in the <head>.
 */
export function ThemeScript() {
  const script = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t==='rituale')document.documentElement.setAttribute('data-theme','rituale')}catch(e){}})()`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
