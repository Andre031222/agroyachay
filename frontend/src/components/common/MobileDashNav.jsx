import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useProfilePanel } from '../../context/ProfilePanelContext';
import { useLanguage } from '../../context/LanguageContext';
import { resolveAvatar } from '../../utils/avatar';

const MAIN = [
  { path:'/dashboard',   icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[22px] h-[22px]"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,    label:'Inicio'  },
  { path:'/cultivos',    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[22px] h-[22px]"><path d="M7 20s4-4.5 4-10a8 8 0 0 1 8-8c0 6-4 10-8 10"/><path d="M7 20c0-3 2-5 4-6" strokeLinecap="round"/></svg>,   label:'Cultivos'},
  { path:'/monitoreo',   icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[22px] h-[22px]"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,                                                     label:'Sensores'},
  { path:'/clima',       icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[22px] h-[22px]"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,                                                label:'Clima'   },
  { path:'/plagas',      icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[22px] h-[22px]"><path d="M8 2l1.88 1.88M14.12 3.88 16 2M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z"/></svg>, label:'Plagas'  },
];

const ALL = [
  { path:'/almanaque',   label:'Almanaque',   icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { path:'/dispositivos',label:'Dispositivos',icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg> },
  { path:'/insumos',     label:'Insumos',     icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg> },
  { path:'/prediccion',  label:'Prediccion',  icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
  { path:'/asesoria',    label:'Asesoria',    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { path:'/marketplace', label:'Marketplace', icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> },
  { path:'/informes',    label:'Informes',    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
];

const MobileDashNav = () => {
  const location  = useLocation();
  const { user }  = useAuth();
  const { open }  = useProfilePanel();
  const { t }     = useLanguage();
  const [showAll, setShowAll] = useState(false);
  const avatarUrl = resolveAvatar(user?.avatar);
  const active    = (path) => location.pathname === path;

  return (
    <>
      {showAll && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-[#04140d]/40 backdrop-blur-[2px] transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            onClick={() => setShowAll(false)}
          />
          <div className="lg:hidden fixed bottom-[5.5rem] inset-x-3 z-50 rounded-2xl p-1.5 ring-1 ring-black/5 dark:ring-white/10 safe-area-pb animate-slide-up">
            <div className="rounded-[calc(1rem-0.375rem)] backdrop-blur-xl bg-white/80 dark:bg-gray-950/70 overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Todas las secciones</p>
                <button onClick={() => setShowAll(false)} aria-label="Cerrar menú"
                  className="flex items-center justify-center w-7 h-7 rounded-full text-gray-400 ring-1 ring-black/5 dark:ring-white/10 hover:text-gray-600 dark:hover:text-gray-200 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.95] touch-manipulation">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5 px-3 pb-4">
                {ALL.map(({ path, label, icon }) => (
                  <Link key={path} to={path} onClick={() => setShowAll(false)}
                    aria-label={label} aria-current={active(path) ? 'page' : undefined}
                    className={`flex flex-col items-center gap-1.5 py-3.5 rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.95] touch-manipulation ${
                      active(path)
                        ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                    }`}>
                    {icon}
                    <span className="text-[10px] font-semibold leading-none tracking-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <nav aria-label="Navegación principal"
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-0 pointer-events-none">
        <div className="pointer-events-auto rounded-2xl p-1.5 ring-1 ring-black/5 dark:ring-white/10">
          <div
            className="grid h-16 rounded-[calc(1rem-0.375rem)] backdrop-blur-xl bg-white/80 dark:bg-gray-950/70"
            style={{ gridTemplateColumns: `repeat(${MAIN.length + 2}, 1fr)` }}>

            {MAIN.map(({ path, icon, label }) => (
              <Link key={path} to={path}
                aria-label={label} aria-current={active(path) ? 'page' : undefined}
                className="relative flex items-center justify-center touch-manipulation">
                <span
                  className={`flex flex-col items-center justify-center gap-1 w-[3.25rem] h-[3.25rem] rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.95] ${
                    active(path)
                      ? 'bg-emerald-500/15 ring-1 ring-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                  <span className={`transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${active(path) ? '-translate-y-px scale-105' : ''}`}>{icon}</span>
                  <span className="text-[9px] font-semibold leading-none tracking-tight">{label}</span>
                </span>
              </Link>
            ))}

            <button onClick={() => setShowAll(v => !v)}
              aria-label={showAll ? 'Cerrar menú' : 'Más secciones'} aria-expanded={showAll}
              className="relative flex items-center justify-center touch-manipulation">
              <span
                className={`flex flex-col items-center justify-center gap-1 w-[3.25rem] h-[3.25rem] rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.95] ${
                  showAll
                    ? 'bg-emerald-500/15 ring-1 ring-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                {showAll
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[22px] h-[22px]"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[22px] h-[22px]"><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>
                }
                <span className="text-[9px] font-semibold leading-none tracking-tight">{showAll ? 'Cerrar' : 'Mas'}</span>
              </span>
            </button>

            <button onClick={open} aria-label="Perfil"
              className="relative flex items-center justify-center touch-manipulation">
              <span className="flex flex-col items-center justify-center gap-1 w-[3.25rem] h-[3.25rem] rounded-full text-gray-400 dark:text-gray-500 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.95]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user?.nombre} referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center ring-1 ring-emerald-400/30">
                    <span className="text-white font-black text-[10px]">
                      {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <span className="text-[9px] font-semibold leading-none tracking-tight">Perfil</span>
              </span>
            </button>

          </div>
        </div>
      </nav>
    </>
  );
};

export default MobileDashNav;
