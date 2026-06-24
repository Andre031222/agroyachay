import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { useSystemConfig } from '../../hooks/useSystemConfig';
import ThemeToggle from '../../components/common/ThemeToggle';

const Inicio      = lazy(() => import('./Inicio'));
const AcercaDe    = lazy(() => import('./AcercaDe'));
const Servicios   = lazy(() => import('./Servicios'));
const Planes      = lazy(() => import('./Planes'));
const Testimonios = lazy(() => import('./Testimonios'));
const Contactos   = lazy(() => import('./Contactos'));

const NAV_ITEMS = [
  { key: 'inicio',      label: 'Inicio',      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { key: 'acerca',      label: 'Nosotros',    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg> },
  { key: 'servicios',   label: 'Servicios',   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { key: 'planes',      label: 'Planes',      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> },
  { key: 'testimonios', label: 'Datos',       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { key: 'contactos',   label: 'Contacto',    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg> },
];

export const WaveCanvas = ({ flip = false, dark = false }) => {
  const ref     = useRef(null);
  const darkRef = useRef(dark);
  const rafRef  = useRef(null);
  const visible = useRef(false);

  useEffect(() => { darkRef.current = dark; }, [dark]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let freq = 0;

    const resize = () => { canvas.width = canvas.offsetWidth; };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const draw = () => {
      if (!visible.current || document.hidden) { rafRef.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const h = canvas.height, w = canvas.width, d = darkRef.current;
      ctx.beginPath(); ctx.moveTo(0, h);
      for (let x = 0; x <= w; x++) {
        ctx.lineTo(x, Math.sin((x/w)*Math.PI*2 + freq*1.2)*18 + Math.sin((x/w)*Math.PI*3 + freq*.8)*10 + h*.55);
      }
      ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.closePath();
      ctx.fillStyle = d ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.08)';
      ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, h);
      for (let x = 0; x <= w; x++) {
        ctx.lineTo(x, Math.sin((x/w)*Math.PI*2 + freq)*22 + Math.sin((x/w)*Math.PI*4 + freq*1.5)*8 + h*.65);
      }
      ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.closePath();
      ctx.fillStyle = d ? 'rgba(16,185,129,0.28)' : 'rgba(16,185,129,0.13)';
      ctx.fill();
      freq += 0.013;
      rafRef.current = requestAnimationFrame(draw);
    };

    const obs = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; }, { threshold: 0 });
    obs.observe(canvas);

    const onVisibility = () => { if (!document.hidden && visible.current) { cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(draw); } };
    document.addEventListener('visibilitychange', onVisibility);

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      obs.disconnect();
    };
  }, [flip]);

  return (
    <div className={`w-full overflow-hidden ${flip ? 'rotate-180' : ''}`} style={{ height: 80 }}>
      <canvas ref={ref} className="w-full h-full" style={{ display: 'block', height: 80 }} />
    </div>
  );
};

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center gap-4 py-32 animate-fade-in">
    <div className="relative flex items-center justify-center">
      <span aria-hidden className="absolute w-12 h-12 rounded-full bg-emerald-500/15 blur-md" />
      <div className="relative w-7 h-7 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    </div>
    <span className="text-[10px] uppercase font-medium text-gray-400 dark:text-gray-500">Cargando</span>
  </div>
);

const MobileBottomNav = ({ active, onNavigate }) => (
  <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none">
    <div className="pointer-events-auto rounded-2xl p-1.5 bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 shadow-[0_24px_60px_-24px_rgba(16,185,129,0.35)]">
      <div className="grid grid-cols-6 rounded-[calc(1rem-0.375rem)]">
        {NAV_ITEMS.map(({ key, label, icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onNavigate(key)}
              className={`group relative flex flex-col items-center justify-center gap-1 py-2.5 touch-manipulation transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                isActive ? 'text-emerald-600 dark:text-emerald-300' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <span
                className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  isActive
                    ? 'bg-emerald-500/12 ring-1 ring-emerald-500/25 scale-100'
                    : 'scale-95 group-active:scale-90'
                }`}
              >
                {icon}
              </span>
              <span className="text-[9px] font-semibold leading-none tracking-tight">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  </nav>
);

export const useFadeIn = () => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.style.opacity = '1';
        el.style.transform = 'translateX(0)';
        obs.unobserve(el);
      }
    }, { threshold: 0.15 });
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateX(-40px)';
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
};

const Landing = () => {
  const [active, setActive]           = useState('inicio');
  const [scrolled, setScrolled]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate  = useNavigate();
  const { loginWithGoogle } = useAuth();
  const { isDark } = useTheme();
  const { config, bool, imageUrl } = useSystemConfig();

  const showAnnouncement = bool('announcement_enabled') && config.announcement_text;
  const logoSrc          = imageUrl('logo');
  const hasSocials       = config.social_twitter || config.social_facebook || config.social_instagram || config.social_linkedin;

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const result = await loginWithGoogle(tokenResponse);
        if (result.success) navigate('/dashboard', { replace: true });
      } finally { setGoogleLoading(false); }
    },
    onError: () => setGoogleLoading(false),
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [active]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const headerTop = showAnnouncement ? 'top-9' : 'top-0';

  const renderContent = () => {
    switch (active) {
      case 'acerca':      return <AcercaDe onNavigate={setActive} />;
      case 'servicios':   return <Servicios onNavigate={setActive} />;
      case 'planes':      return <Planes onNavigate={setActive} />;
      case 'testimonios': return <Testimonios />;
      case 'contactos':   return <Contactos />;
      default:            return <Inicio onNavigate={setActive} />;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white font-sans">

      {showAnnouncement && (
        <div
          className="fixed inset-x-0 top-0 z-[60] py-2 px-4 text-center text-sm font-medium tracking-tight text-white animate-slide-down"
          style={{ backgroundColor: config.announcement_color || '#10b981' }}
        >
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
            {config.announcement_text}
          </span>
        </div>
      )}

      <header
        style={{ transform: 'translateZ(0)', willChange: 'transform' }}
        className={`fixed inset-x-0 ${headerTop} z-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          scrolled
            ? 'bg-white/75 dark:bg-gray-950/70 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10'
            : 'bg-transparent ring-1 ring-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between gap-3">

            <button type="button" onClick={() => setActive('inicio')} className="flex items-center gap-2 sm:gap-2.5 group shrink-0 touch-manipulation">
              {logoSrc ? (
                <img src={logoSrc} alt={config.site_name} className="h-8 sm:h-9 w-auto transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105" />
              ) : (
                <img
                  src={isDark ? '/logo-claro-crop.png' : '/logo-oscuro-crop.png'}
                  alt={config.site_name}
                  className="h-8 w-8 sm:h-10 sm:w-10 object-contain transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
                />
              )}
              <div className="leading-none">
                <span className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">{config.site_name}</span>
                <span className="hidden sm:block text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5 tracking-tight">{config.site_tagline}</span>
              </div>
            </button>

            <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
              <div className="flex items-center gap-0.5 rounded-full p-1 ring-1 ring-black/5 dark:ring-white/10 bg-gray-50/60 dark:bg-white/[0.04]">
                {NAV_ITEMS.map(item => (
                  <button type="button" key={item.key} onClick={() => setActive(item.key)}
                    className={`px-3.5 py-1.5 text-sm font-medium rounded-full touch-manipulation transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      active === item.key
                        ? 'text-emerald-700 dark:text-emerald-300 bg-white dark:bg-white/[0.08] ring-1 ring-emerald-500/20 shadow-[0_8px_20px_-12px_rgba(16,185,129,0.5)]'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <ThemeToggle />

              <button
                type="button"
                onClick={() => googleLogin()}
                disabled={googleLoading}
                className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3.5 rounded-full ring-1 ring-black/8 dark:ring-white/12 bg-white dark:bg-white/[0.04] text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-white/[0.08] active:scale-[0.97] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] disabled:opacity-60 touch-manipulation"
              >
                {googleLoading
                  ? <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  : <GoogleIcon />
                }
                <span className="hidden sm:inline text-xs font-medium">Google</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="group relative inline-flex items-center h-9 pl-4 pr-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-full active:scale-[0.97] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[0_12px_30px_-12px_rgba(16,185,129,0.7)] touch-manipulation gap-2"
              >
                <span className="hidden sm:inline">Acceder</span>
                <span className="sm:hidden">Entrar</span>
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              </button>
            </div>

          </div>
        </div>
      </header>

      <main className={`${showAnnouncement ? 'pt-[92px]' : 'pt-14'} pb-16 md:pb-0`}>
        <Suspense fallback={<PageLoader />}>
          {renderContent()}
        </Suspense>
      </main>

      <MobileBottomNav active={active} onNavigate={setActive} />

      <footer className="relative overflow-hidden bg-[#04140d] text-white hidden md:block">
        <div aria-hidden className="pointer-events-none absolute -top-40 -left-24 w-[34rem] h-[34rem] rounded-full bg-emerald-500/20 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-12rem] right-[-8rem] w-[36rem] h-[36rem] rounded-full bg-teal-400/12 blur-[140px]" />
        <WaveCanvas dark={isDark} />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-6 pb-14">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">

            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                {logoSrc ? (
                  <img src={logoSrc} alt={config.site_name} className="h-9 w-auto rounded-xl" />
                ) : (
                  <img src="/logo-claro-crop.png" alt={config.site_name} className="h-10 w-10 object-contain" />
                )}
                <div>
                  <div className="font-semibold text-white tracking-tight">{config.site_name}</div>
                  <div className="text-xs text-emerald-100/50">{config.site_tagline}</div>
                </div>
              </div>
              <p className="text-sm text-emerald-100/60 leading-relaxed max-w-xs">{config.footer_description}</p>

              {hasSocials && (
                <div className="mt-5 flex items-center gap-2">
                  {config.social_twitter && (
                    <a href={config.social_twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="flex items-center justify-center w-9 h-9 rounded-full ring-1 ring-white/12 bg-white/[0.04] text-emerald-100/70 hover:text-white hover:bg-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                  )}
                  {config.social_facebook && (
                    <a href={config.social_facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex items-center justify-center w-9 h-9 rounded-full ring-1 ring-white/12 bg-white/[0.04] text-emerald-100/70 hover:text-white hover:bg-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                  )}
                  {config.social_instagram && (
                    <a href={config.social_instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex items-center justify-center w-9 h-9 rounded-full ring-1 ring-white/12 bg-white/[0.04] text-emerald-100/70 hover:text-white hover:bg-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                  )}
                  {config.social_linkedin && (
                    <a href={config.social_linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="flex items-center justify-center w-9 h-9 rounded-full ring-1 ring-white/12 bg-white/[0.04] text-emerald-100/70 hover:text-white hover:bg-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                {['Flask', 'React 18', 'PostgreSQL', 'ESP32', 'Groq LLM', 'Plant.id'].map(t => (
                  <span key={t} className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/[0.04] text-emerald-100/60 ring-1 ring-white/10">{t}</span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase font-semibold text-emerald-200 mb-4">Módulos</p>
              <ul className="space-y-2.5">
                {['Cultivos IoT', 'Sensores ESP32', 'Clima + IA', 'Detección Plagas', 'Predicción Cosecha', 'Informes PDF/Excel'].map(s => (
                  <li key={s} className="text-sm text-emerald-100/55">{s}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[10px] uppercase font-semibold text-emerald-200 mb-4">Navegación</p>
              <ul className="space-y-2.5">
                {NAV_ITEMS.map(item => (
                  <li key={item.key}>
                    <button type="button" onClick={() => setActive(item.key)} className="text-sm text-emerald-100/55 hover:text-emerald-300 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[10px] uppercase font-semibold text-emerald-200 mb-4">Contacto</p>
              <ul className="space-y-3">
                {config.footer_contact && (
                  <li className="flex items-start gap-2 text-sm text-emerald-100/55">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 mt-0.5 text-emerald-400"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
                    {config.footer_contact}
                  </li>
                )}
                <li className="flex items-start gap-2 text-sm text-emerald-100/55">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 mt-0.5 text-emerald-400"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Puno, Perú
                </li>
              </ul>
              <div className="mt-6">
                <button type="button" onClick={() => setActive('contactos')}
                  className="group inline-flex items-center gap-2 rounded-full pl-4 pr-1.5 py-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] shadow-[0_12px_30px_-12px_rgba(16,185,129,0.7)]">
                  Enviar mensaje
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-emerald-100/40">
              {config.footer_copyright || `© ${new Date().getFullYear()} ${config.site_name} — Todos los derechos reservados`}
            </p>
            <div className="flex items-center gap-2 rounded-full px-3 py-1 ring-1 ring-white/10 bg-white/[0.04]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-100/60">Sistema activo</span>
            </div>
            <p className="text-xs text-emerald-100/30">Desarrollado por R. Andre Vilca Solorzano</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
