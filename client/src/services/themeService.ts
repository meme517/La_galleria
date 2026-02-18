type Theme = 'light' | 'dark';

const THEME_KEY = 'theme';

export function getTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return 'light';
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  localStorage.setItem(THEME_KEY, theme);
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

