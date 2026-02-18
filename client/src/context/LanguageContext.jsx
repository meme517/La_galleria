import React, { createContext, useContext, useMemo, useState } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key, fallback, vars) => fallback || key,
});

const interpolate = (template, vars) => {
  if (!vars) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      return String(vars[key]);
    }
    return match;
  });
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  const setLanguage = (next) => {
    const value = next === 'rw' ? 'rw' : 'en';
    localStorage.setItem('language', value);
    setLanguageState(value);
  };

  const t = (key, fallback, vars) => {
    const table = translations[language] || {};
    const value = table[key] || fallback || key;
    return interpolate(value, vars);
  };

  const ctxValue = useMemo(() => ({ language, setLanguage, t }), [language]);

  return <LanguageContext.Provider value={ctxValue}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
