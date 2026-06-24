import React, { createContext, useContext, useState, useEffect } from 'react';
import es from '../locales/es.json';
import qu from '../locales/qu.json';
import ay from '../locales/ay.json';

const LanguageContext = createContext();

const translations = {
  es,
  qu,
  ay
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('agroyachay-language');
    return savedLanguage;
  });

  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    if (!language) {
      setShowLanguageModal(true);
    }
  }, [language]);

  useEffect(() => {
    if (language) {
      localStorage.setItem('agroyachay-language', language);
      document.documentElement.lang = language;
    }
  }, [language]);

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    setShowLanguageModal(false);
  };

  const t = (key) => {
    const currentLang = language || 'es';
    const keys = key.split('.');
    let translation = translations[currentLang];

    for (const k of keys) {
      if (translation && translation[k]) {
        translation = translation[k];
      } else {
        return key;
      }
    }

    return translation;
  };

  const value = {
    language: language || 'es',
    changeLanguage,
    showLanguageModal,
    setShowLanguageModal,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
