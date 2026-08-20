import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, SUPPORTED_LANGUAGES as LANGS } from '../../context/LanguageContext';

const CHIP_STYLES = {
  es: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/25',
  en: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-500/25',
  qu: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/25',
  ay: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 ring-violet-500/25',
};

const GlobeIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    className={`w-3 h-3 opacity-50 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'rotate-180' : ''}`}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const LanguageSelector = ({ variant = 'default' }) => {
  const { language, changeLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGS.find((lang) => lang.code === language) || LANGS[0];
  const onDark = variant === 'onDark';

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const triggerClass = onDark
    ? open
      ? 'bg-white/[0.16] ring-white/30 text-white'
      : 'bg-white/[0.06] ring-white/15 text-white/80 hover:bg-white/[0.12] hover:text-white'
    : open
      ? 'bg-emerald-50 dark:bg-emerald-500/10 ring-emerald-400/50 text-emerald-700 dark:text-emerald-300'
      : 'bg-transparent ring-transparent text-gray-500 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-white/[0.06] hover:text-emerald-700 dark:hover:text-emerald-300';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t('language.select')}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`group flex items-center gap-1.5 h-8 pl-2 pr-2 rounded-full ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] touch-manipulation ${triggerClass}`}
      >
        <GlobeIcon className="w-4 h-4 shrink-0 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:rotate-[18deg]" />
        <span className="text-[11px] font-bold tracking-[0.08em] tabular-nums">{current.short}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-2 w-52 rounded-2xl p-1.5 bg-white/85 dark:bg-gray-950/85 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 shadow-[0_24px_60px_-24px_rgba(16,185,129,0.45)] z-50 animate-slide-up"
        >
          <p className="px-2.5 pt-1.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
            {t('language.select')}
          </p>
          <div className="space-y-0.5">
            {LANGS.map((lang) => {
              const active = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => { changeLanguage(lang.code); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation ${
                    active
                      ? 'bg-emerald-500/10 ring-1 ring-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] font-medium'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`flex items-center justify-center w-8 h-7 shrink-0 rounded-lg ring-1 text-[10px] font-bold tracking-[0.06em] tabular-nums transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${CHIP_STYLES[lang.code]}`}
                  >
                    {lang.short}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate leading-tight">{lang.label}</span>
                    <span className="block text-[10px] font-normal text-gray-400 dark:text-gray-500 leading-tight truncate">
                      {lang.native}
                    </span>
                  </span>
                  {active && <span className="text-emerald-500 shrink-0"><CheckIcon /></span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
