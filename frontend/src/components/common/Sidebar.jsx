import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useProfilePanel } from '../../context/ProfilePanelContext';
import { resolveAvatar } from '../../utils/avatar';

const Ic = {
  shield:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  users:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  home:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  cloud:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
  calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  sprout:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><path d="M7 20s4-4.5 4-10a8 8 0 0 1 8-8c0 6-4 10-8 10"/><path d="M7 20c0-3 2-5 4-6" strokeLinecap="round"/></svg>,
  activity: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  calc:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>,
  bug:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><path d="M8 2l1.88 1.88M14.12 3.88 16 2M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z"/><path d="M6 13H2M22 13h-4"/></svg>,
  trend:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  chat:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  cart:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  file:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  logout:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  cpu:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
};

const MENU = [
  { path: '/dashboard',    icon: Ic.home,     labelKey: 'sidebar.home'           },
  { path: '/clima',        icon: Ic.cloud,    labelKey: 'sidebar.weather'        },
  { path: '/almanaque',    icon: Ic.calendar, labelKey: 'sidebar.almanac'        },
  { path: '/cultivos',     icon: Ic.sprout,   labelKey: 'sidebar.cropManagement' },
  { path: '/monitoreo',    icon: Ic.activity, labelKey: 'sidebar.monitoring'     },
  { path: '/dispositivos', icon: Ic.cpu,      labelKey: 'sidebar.devices'        },
  { path: '/insumos',      icon: Ic.calc,     labelKey: 'sidebar.calculator'     },
  { path: '/plagas',       icon: Ic.bug,      labelKey: 'sidebar.pestDetection'  },
  { path: '/prediccion',   icon: Ic.trend,    labelKey: 'sidebar.prediction'     },
  { path: '/asesoria',     icon: Ic.chat,     labelKey: 'sidebar.advisory'       },
  { path: '/marketplace',  icon: Ic.cart,     labelKey: 'nav.marketplace'        },
  { path: '/informes',     icon: Ic.file,     labelKey: 'sidebar.reports'        },
];

const ADMIN_ROLES = ['superadmin', 'admin'];

const NavItem = ({ path, icon, label, active }) => (
  <Link
    to={path}
    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium tracking-tight transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group ${
      active
        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/15'
        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/70 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-gray-100'
    }`}
  >
    {active && <span className="absolute left-0 top-1/2 w-0.5 h-5 -translate-y-1/2 rounded-r-full bg-emerald-500 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" />}
    <span className={`shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105 ${active ? 'text-emerald-600 dark:text-emerald-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-200'}`}>
      {icon}
    </span>
    <span className="truncate">{label}</span>
  </Link>
);

const Sidebar = () => {
  const location   = useLocation();
  const navigate   = useNavigate();
  const { user, logout } = useAuth();
  const { t }      = useLanguage();
  const { isDark } = useTheme();
  const { open: openPanel } = useProfilePanel();

  const isActive     = (path) => location.pathname === path;
  const isAdmin      = ADMIN_ROLES.includes(user?.rol);
  const isSuperAdmin = user?.rol === 'superadmin';
  const avatarUrl    = resolveAvatar(user?.avatar);
  const adminActive  = location.pathname === '/admin';

  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen bg-gray-50 dark:bg-gray-950 ring-1 ring-black/5 dark:ring-white/10 shrink-0">

      <div className="flex items-center gap-3 h-16 px-5 py-4 ring-1 ring-black/5 dark:ring-white/10 shrink-0">
        <img
          src={isDark ? '/logo-claro-crop.png' : '/logo-oscuro-crop.png'}
          alt="AgroYachay"
          className="w-7 h-7 object-contain shrink-0"
        />
        <div className="min-w-0">
          <p className="font-semibold text-sm text-gray-900 dark:text-white leading-none tracking-tight">AgroYachay</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400 font-medium leading-none">IoT Agriculture</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">

        {isAdmin && (
          <div className="mb-2">
            <Link
              to="/admin"
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium tracking-tight transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group ${
                adminActive
                  ? isSuperAdmin
                    ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/15'
                    : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/15'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/70 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {adminActive && (
                <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isSuperAdmin ? 'bg-purple-500' : 'bg-blue-500'}`} />
              )}
              <span className={`shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105 ${
                adminActive
                  ? isSuperAdmin ? 'text-purple-600 dark:text-purple-300' : 'text-blue-600 dark:text-blue-300'
                  : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-200'
              }`}>
                {isSuperAdmin ? Ic.shield : Ic.users}
              </span>
              <span className="truncate">{isSuperAdmin ? 'SuperAdmin' : 'Admin'}</span>
              {isSuperAdmin && (
                <span className="ml-auto shrink-0 text-[9px] font-semibold tracking-wide px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-300 ring-1 ring-purple-500/15">
                  SA
                </span>
              )}
            </Link>
            <div className="h-px bg-black/5 dark:bg-white/10 mx-3 mt-3" />
          </div>
        )}

        {MENU.map((item) => (
          <NavItem
            key={item.path}
            path={item.path}
            icon={item.icon}
            label={t(item.labelKey)}
            active={isActive(item.path)}
          />
        ))}
      </nav>

      <div className="px-3 pb-4 shrink-0 ring-1 ring-black/5 dark:ring-white/10 pt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={openPanel}
            className="flex items-center gap-3 flex-1 min-w-0 px-2.5 py-2 rounded-xl hover:bg-gray-100/70 dark:hover:bg-white/[0.04] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group touch-manipulation"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.nombre}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-emerald-500/30 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 ring-2 ring-emerald-500/30 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
                <span className="text-white font-semibold text-xs">
                  {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold tracking-tight text-gray-900 dark:text-white truncate leading-tight">
                {user?.nombre || 'Usuario'}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5 group-hover:text-emerald-500 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                Mi perfil
              </p>
            </div>
          </button>

          <button
            onClick={() => { logout(); navigate('/'); }}
            title="Cerrar sesion"
            className="shrink-0 p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] touch-manipulation"
          >
            {Ic.logout}
          </button>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;
