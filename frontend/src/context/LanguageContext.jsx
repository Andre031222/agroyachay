import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import es from '../locales/es.json';
import en from '../locales/en.json';
import qu from '../locales/qu.json';
import ay from '../locales/ay.json';
import { setTranslator } from '../utils/i18nBridge';

const LanguageContext = createContext();

export const DEFAULT_TEXTS = {
  'errors.title': 'Algo salió mal · Something went wrong',
  'errors.description': 'Ocurrió un error inesperado · An unexpected error occurred',
  'errors.backHome': 'Volver al inicio · Back to home',
};

export const SUPPORTED_LANGUAGES = [
  { code: 'es', label: 'Español', native: 'Castellano', short: 'ES', intl: 'es-PE' },
  { code: 'en', label: 'English', native: 'English', short: 'EN', intl: 'en-GB' },
  { code: 'qu', label: 'Quechua', native: 'Runasimi', short: 'QU', intl: 'es-PE' },
  { code: 'ay', label: 'Aymara', native: 'Aymar aru', short: 'AY', intl: 'es-BO' },
];

export const DEFAULT_LANGUAGE = 'es';

const STORAGE_KEY = 'agroyachay-language';
const TRANSLATIONS = { es, en, qu, ay };
const FALLBACKS = { es: ['en'], en: ['es'], qu: ['es', 'en'], ay: ['es', 'en'] };

const isSupported = (code) => SUPPORTED_LANGUAGES.some((lang) => lang.code === code);

const readStoredLanguage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && isSupported(saved) ? saved : null;
  } catch {
    return null;
  }
};

const detectBrowserLanguage = () => {
  const candidates = typeof navigator !== 'undefined'
    ? [navigator.language, ...(navigator.languages || [])]
    : [];
  for (const candidate of candidates) {
    const code = String(candidate || '').slice(0, 2).toLowerCase();
    if (isSupported(code)) return code;
  }
  return DEFAULT_LANGUAGE;
};

const resolveKey = (dictionary, path) => {
  let node = dictionary;
  for (const step of path) {
    if (node == null || typeof node !== 'object' || !(step in node)) return undefined;
    node = node[step];
  }
  return node;
};

const interpolate = (text, params) => {
  if (!params || typeof text !== 'string') return text;
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name) =>
    params[name] === undefined || params[name] === null ? match : String(params[name])
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [storedLanguage] = useState(readStoredLanguage);
  const [language, setLanguage] = useState(() => storedLanguage || detectBrowserLanguage());
  const [showLanguageModal, setShowLanguageModal] = useState(() => !storedLanguage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      /* empty */
    }
    document.documentElement.lang = language;
  }, [language]);

  const changeLanguage = useCallback((nextLanguage) => {
    if (!isSupported(nextLanguage)) return;
    setLanguage(nextLanguage);
    setShowLanguageModal(false);
  }, []);

  const t = useCallback((key, params) => {
    if (!key) return '';
    const path = String(key).split('.');
    for (const code of [language, ...(FALLBACKS[language] || [])]) {
      const value = resolveKey(TRANSLATIONS[code], path);
      if (typeof value === 'string') return interpolate(value, params);
      if (Array.isArray(value)) return value.map((item) => interpolate(item, params));
      if (value && typeof value === 'object') return value;
    }
    if (import.meta.env?.DEV) {
      console.warn(`[i18n] clave sin traducción: "${key}" (${language})`);
    }
    return key;
  }, [language]);

  const tList = useCallback((key, params) => {
    const value = t(key, params);
    return Array.isArray(value) ? value : [];
  }, [t]);

  const intlLocale = useMemo(
    () => SUPPORTED_LANGUAGES.find((lang) => lang.code === language)?.intl || 'es-PE',
    [language]
  );

  const formatNumber = useCallback(
    (value, options) => new Intl.NumberFormat(intlLocale, options).format(Number(value) || 0),
    [intlLocale]
  );

  const formatDate = useCallback((value, options = { dateStyle: 'medium' }) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(intlLocale, options).format(date);
  }, [intlLocale]);

  useEffect(() => {
    setTranslator(t);
  }, [t]);

  const value = useMemo(() => ({
    language,
    languages: SUPPORTED_LANGUAGES,
    changeLanguage,
    showLanguageModal,
    setShowLanguageModal,
    t,
    tList,
    intlLocale,
    formatNumber,
    formatDate,
  }), [language, changeLanguage, showLanguageModal, t, tList, intlLocale, formatNumber, formatDate]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
