import React from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { useProfilePanel } from '../../context/ProfilePanelContext';
import { resolveAvatar } from '../../utils/avatar';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';

const PATH_KEY = {
  '/dashboard':    'dashboard',
  '/clima':        'clima',
  '/almanaque':    'almanaque',
  '/cultivos':     'cultivos',
  '/monitoreo':    'monitoreo',
  '/insumos':      'insumos',
  '/plagas':       'plagas',
  '/prediccion':   'prediccion',
  '/asesoria':     'asesoria',
  '/marketplace':  'marketplace',
  '/informes':     'informes',
  '/dispositivos': 'dispositivos',
  '/admin':        'admin',
};

const Navbar = () => {
  const location  = useLocation();
  const { t }     = useLanguage();
  const { user }  = useAuth();
  const { open: openPanel } = useProfilePanel();
  const avatarUrl = resolveAvatar(user?.avatar);

  const pageKey = PATH_KEY[location.pathname];
  const title   = pageKey ? t(`pages.${pageKey}.title`) : 'AgroYachay';
  const sub     = pageKey ? t(`pages.${pageKey}.sub`)   : '';

  return (
    <header className="sticky top-0 z-30 shrink-0 px-3 pt-3 sm:px-4">
      <div className="flex h-14 items-center justify-between gap-4 rounded-full px-3 sm:px-5 bg-white/70 dark:bg-gray-950/60 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10">

        <div className="min-w-0 flex items-center gap-3">
          <span aria-hidden className="hidden sm:block h-7 w-1 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500" />
          <div className="min-w-0">
            <h1 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white leading-tight truncate">
              {title}
            </h1>
            {sub && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5 truncate">
                {sub}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 rounded-full p-1 bg-gray-50/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10">
            <ThemeToggle />
            <LanguageSelector />
          </div>

          <button
            onClick={openPanel}
            title={t('profile.title')}
            className="group ml-0.5 rounded-full p-0.5 ring-1 ring-black/5 dark:ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-emerald-400/60 active:scale-[0.98] touch-manipulation"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.nombre}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
                <span className="text-white font-bold text-xs">
                  {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
