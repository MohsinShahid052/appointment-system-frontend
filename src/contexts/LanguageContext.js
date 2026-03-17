import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import en from '../locales/en';
import nl from '../locales/nl';
import ku from '../locales/ku';

export const TRANSLATIONS = { en, nl, ku };

// Map browser/navigator language tags → our supported codes
const LOCALE_MAP = {
  // Dutch
  nl: 'nl', 'nl-NL': 'nl', 'nl-BE': 'nl',
  // Kurdish
  ku: 'ku', 'ku-Arab': 'ku', 'ku-Latn': 'ku',
  ckb: 'ku', 'ckb-Arab': 'ku', // Central Kurdish (Sorani)
  kmr: 'ku', // Northern Kurdish (Kurmanji)
  // English (default)
  en: 'en', 'en-US': 'en', 'en-GB': 'en',
};

// Languages that use RTL direction
const RTL_LANGS = new Set(['ku']);

const STORAGE_KEY = 'app_language';

/** Detect language from browser without any external API call */
export function detectLanguage() {
  // 1. Persisted preference wins
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && TRANSLATIONS[saved]) return saved;

  // 2. Browser navigator.languages array (most to least preferred)
  const candidates = navigator.languages || [navigator.language || 'en'];
  for (const lang of candidates) {
    if (LOCALE_MAP[lang]) return LOCALE_MAP[lang];
    // Try the base tag (e.g. "nl" from "nl-NL")
    const base = lang.split('-')[0];
    if (LOCALE_MAP[base]) return LOCALE_MAP[base];
  }

  return 'en';
}

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => detectLanguage());

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Apply dir + lang attribute to <html> so CSS and screen readers react correctly
  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    html.dir = RTL_LANGS.has(language) ? 'rtl' : 'ltr';
  }, [language]);

  const setLanguage = useCallback((code) => {
    if (!TRANSLATIONS[code]) return;
    localStorage.setItem(STORAGE_KEY, code);
    setLanguageState(code);
  }, []);

  const isRTL = RTL_LANGS.has(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL, TRANSLATIONS }}>
      {children}
    </LanguageContext.Provider>
  );
};

/** Primary hook — use this in every component */
export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};

export default LanguageContext;
