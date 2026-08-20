import React from 'react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../context/LanguageContext';

const CHIP_STYLES = {
  es: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/25',
  en: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-500/25',
  qu: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/25',
  ay: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 ring-violet-500/25',
};

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-6 h-6">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-3.5 h-3.5">
    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LanguageModal = () => {
  const { language, changeLanguage, showLanguageModal, setShowLanguageModal, t } = useLanguage();

  if (!showLanguageModal) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-[#04140d]/70 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-2xl p-1.5 bg-white/10 ring-1 ring-white/15 animate-slide-up">
        <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900 px-6 py-7 shadow-2xl">

          <div className="flex flex-col items-center text-center mb-6">
            <span className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-4">
              <GlobeIcon />
            </span>
            <h2 className="font-display text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t('language.welcome')}
            </h2>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {t('language.selectLanguage')}
            </p>
          </div>

          <div className="space-y-2">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const active = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => changeLanguage(lang.code)}
                  className={`group w-full flex items-center gap-3 px-3 py-3 rounded-2xl ring-1 text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation ${
                    active
                      ? 'bg-emerald-500/10 ring-emerald-500/30'
                      : 'bg-gray-50/80 dark:bg-white/[0.04] ring-black/5 dark:ring-white/10 hover:ring-emerald-500/30'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`flex items-center justify-center w-10 h-9 shrink-0 rounded-xl ring-1 text-xs font-bold tracking-[0.06em] tabular-nums ${CHIP_STYLES[lang.code]}`}
                  >
                    {lang.short}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className={`block text-sm font-semibold tracking-tight truncate ${active ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-900 dark:text-white'}`}>
                      {lang.label}
                    </span>
                    <span className="block text-[11px] text-gray-400 dark:text-gray-500 truncate">
                      {lang.native}
                    </span>
                  </span>
                  <span className={`flex items-center justify-center w-7 h-7 shrink-0 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    active
                      ? 'bg-emerald-500 text-white'
                      : 'bg-black/[0.04] dark:bg-white/[0.06] text-gray-400 group-hover:bg-emerald-500 group-hover:text-white group-hover:translate-x-0.5'
                  }`}>
                    <ArrowIcon />
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowLanguageModal(false)}
            className="w-full mt-5 h-10 rounded-full text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] touch-manipulation"
          >
            {t('language.continue')}
          </button>

        </div>
      </div>
    </div>
  );
};

export default LanguageModal;
