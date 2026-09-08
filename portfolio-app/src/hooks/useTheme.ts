import { useCallback, useEffect, useState } from 'react';

/*
 * useTheme — dark (default) / light toggle. Persists the choice in localStorage
 * and reflects it as `data-theme` on <html>, which the CSS light-theme override
 * block keys off. Dark is the site's original look and the default; only 'light'
 * stamps the attribute. The initial value is read from what index.html already
 * applied before paint (no flash), falling back to storage/dark.
 */

export type Theme = 'dark' | 'light';

const readInitial = (): Theme => {
  if (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light') {
    return 'light';
  }
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('theme') === 'light') return 'light';
  } catch {
    /* ignore */
  }
  return 'dark';
};

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(readInitial);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* ignore (private mode) */
    }
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return { theme, toggle };
}
