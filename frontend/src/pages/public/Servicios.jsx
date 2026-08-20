import React, { useRef, useEffect, useState } from 'react';
import { WaveCanvas } from './Landing';
import { useLanguage } from '../../context/LanguageContext';

const Fade = ({ children, delay = 0, fromRight = false }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = fromRight ? 'translateX(40px)' : 'translateY(28px)';
    el.style.transition = `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.style.opacity = '1'; el.style.transform = 'none'; obs.unobserve(el); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay, fromRight]);
  return <div ref={ref}>{children}</div>;
};

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
);

const API_ENDPOINTS = {
  cultivos: 'GET/POST/PUT/DELETE /api/cultivos',
  iot: 'POST /api/sensores/lectura · GET /api/sensores/historico',
  clima: 'GET /api/clima/actual · POST /api/clima/plan-semanal',
  plagas: 'POST /api/plagas/detectar · POST /api/plagas/consejo-ia',
  prediccion: 'POST /api/prediccion/calcular · GET /api/prediccion/historial',
  asesoria: 'POST /api/asesoria/solicitar · GET /api/asesoria/mis-solicitudes',
  marketplace: 'GET /api/marketplace/productos',
  informes: 'POST /api/informes/generar · GET /api/informes/mis-informes',
  insumos: 'GET/POST /api/insumos',
  asistente: 'POST /api/asistente/consulta',
};

const SERVICES = [
  { id: 'cultivos', icon: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/><path d="M12 6v6l4 2" strokeLinecap="round"/><path d="M8 14c0 2.2 1.8 4 4 4s4-1.8 4-4" strokeLinecap="round"/></svg> },
  { id: 'iot', icon: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a4 4 0 0 1 8 0v2" strokeLinecap="round"/><circle cx="12" cy="13" r="2" fill="currentColor" stroke="none"/><path d="M9 10.5A4.5 4.5 0 0 0 7.5 13M15 10.5A4.5 4.5 0 0 1 16.5 13" strokeLinecap="round"/></svg> },
  { id: 'clima', icon: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M17 18a5 5 0 0 0-10 0" strokeLinecap="round"/><path d="M12 2v2M4.22 4.22l1.42 1.42M1 12h2M22 12h-2M18.36 5.64l-1.42 1.42" strokeLinecap="round"/><path d="M12 6a6 6 0 0 1 6 6" strokeLinecap="round"/></svg> },
  { id: 'plagas', icon: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" strokeLinecap="round"/><path d="M12 8v4M12 15h.01" strokeLinecap="round"/></svg> },
  { id: 'prediccion', icon: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: 'asesoria', icon: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round"/><path d="M8 10h8M8 14h5" strokeLinecap="round"/></svg> },
  { id: 'marketplace', icon: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" strokeLinecap="round"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0" strokeLinecap="round"/></svg> },
  { id: 'informes', icon: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { id: 'insumos', icon: 'bg-lime-50 dark:bg-lime-900/20 text-lime-600 dark:text-lime-400', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg> },
  { id: 'asistente', icon: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h8M8 14h4" strokeLinecap="round"/></svg> },
];

const Servicios = ({ onNavigate }) => {
  const [selected, setSelected] = useState(null);
  const { t, tList } = useLanguage();

  return (
    <div className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <section className="relative min-h-[calc(100dvh-4rem)] flex items-center overflow-hidden bg-gray-50 dark:bg-gray-950">
        <div aria-hidden className="pointer-events-none absolute -top-32 -left-24 w-[34rem] h-[34rem] rounded-full bg-emerald-500/15 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-12rem] right-[-8rem] w-[40rem] h-[40rem] rounded-full bg-teal-400/10 blur-[140px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            <div className="animate-slide-up">
              <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl font-bold leading-[1.05] tracking-tight text-gray-900 dark:text-white">
                {t('services.heroTitleLine1')}<br />
                <span className="text-emerald-600 dark:text-emerald-300">{t('services.heroTitleLine2')}</span>
              </h1>
              <p className="mt-6 text-base sm:text-lg leading-relaxed text-gray-500 dark:text-gray-400 max-w-lg">
                {t('services.heroDescription')}
              </p>
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => window.location.href = '/register'}
                  className="group relative h-12 pl-7 pr-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-[0_12px_30px_-10px_rgba(16,185,129,0.7)] flex items-center justify-center"
                >
                  <span>{t('services.createAccount')}</span>
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                    <Arrow />
                  </span>
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('planes')}
                  className="h-12 px-8 rounded-full ring-1 ring-black/10 dark:ring-white/15 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08] hover:ring-emerald-500/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] flex items-center justify-center"
                >
                  {t('services.viewPlans')}
                </button>
              </div>
            </div>

            <Fade fromRight>
              <div className="grid grid-cols-2 gap-3">
                {SERVICES.slice(0, 6).map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className="group text-left rounded-[1.5rem] p-1.5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 hover:ring-emerald-500/30 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5"
                  >
                    <div className="rounded-[calc(1.5rem-0.375rem)] bg-white dark:bg-gray-900/90 p-4 h-full">
                      <div className={`inline-flex p-2 rounded-xl mb-3 ${s.icon} transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110`}>{s.svg}</div>
                      <p className="font-semibold text-xs tracking-tight text-gray-900 dark:text-white leading-snug">{t(`services.items.${s.id}.title`)}</p>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{t(`services.items.${s.id}.badge`)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </Fade>
          </div>
        </div>
      </section>

      <WaveCanvas />
      <section className="relative py-20 lg:py-28 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute top-1/4 -right-32 w-[30rem] h-[30rem] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="relative max-w-7xl mx-auto">
          <Fade>
            <div className="mb-14 max-w-2xl">
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                {t('services.exploreTitle')}
              </h2>
              <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
                {t('services.exploreDescription')}
              </p>
            </div>
          </Fade>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {SERVICES.map((s, i) => {
              const isActive = selected?.id === s.id;
              return (
                <Fade key={s.id} delay={i * 35}>
                  <button
                    onClick={() => setSelected(isActive ? null : s)}
                    className={`group text-left w-full rounded-2xl p-1.5 ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 ${
                      isActive
                        ? 'ring-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-500/[0.07]'
                        : 'ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-white/[0.04] hover:ring-emerald-500/30'
                    }`}
                  >
                    <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-5 h-full">
                      <div className={`inline-flex p-2.5 rounded-xl mb-4 ${s.icon} transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110`}>
                        {s.svg}
                      </div>
                      <p className="font-semibold text-sm tracking-tight text-gray-900 dark:text-white mb-2 leading-snug">{t(`services.items.${s.id}.title`)}</p>
                      <span className="inline-block text-[10px] uppercase tracking-[0.15em] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/15 px-2 py-0.5 rounded-full mb-3">{t(`services.items.${s.id}.badge`)}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t(`services.items.${s.id}.summary`)}</p>
                    </div>
                  </button>
                </Fade>
              );
            })}
          </div>
        </div>
      </section>
      {selected && (
        <section className="pb-10 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-2xl p-1.5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 animate-fade-in">
              <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 overflow-hidden">
                <div className="flex items-center justify-between px-7 py-5 border-b border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-xl ${selected.icon}`}>{selected.svg}</div>
                    <div>
                      <h3 className="font-semibold tracking-tight text-gray-900 dark:text-white">{t(`services.items.${selected.id}.title`)}</h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{t(`services.items.${selected.id}.badge`)}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} aria-label={t('services.closeDetail')} className="p-2 rounded-full ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.06] text-gray-400 hover:text-emerald-500 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-black/5 dark:divide-white/10">
                  <div className="p-7">
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">{t(`services.items.${selected.id}.desc`)}</p>
                    <p className="text-[10px] uppercase font-medium text-gray-400 dark:text-gray-500 mb-2">{t('services.apiEndpoint')}</p>
                    <code className="block bg-[#04140d] text-emerald-300 text-xs px-4 py-3 rounded-xl font-mono break-all ring-1 ring-emerald-500/15">{API_ENDPOINTS[selected.id]}</code>
                  </div>
                  <div className="p-7">
                    <p className="text-[10px] uppercase font-medium text-gray-400 dark:text-gray-500 mb-4">{t('services.capabilities')}</p>
                    <ul className="space-y-2.5">
                      {tList(`services.items.${selected.id}.details`).map((d, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="shrink-0 mt-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/20 text-emerald-500 dark:text-emerald-300">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <WaveCanvas flip />
      <section className="relative py-20 lg:py-28 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-teal-400/10 blur-[130px]" />
        <div className="relative max-w-7xl mx-auto">
          <Fade>
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                {t('services.networkTitle')}
              </h2>
              <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
                {t('services.networkDescription')}
              </p>
            </div>
          </Fade>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {tList('services.network').map((item, i) => (
              <Fade key={item.title} delay={i * 80}>
                <div className="group rounded-2xl p-1.5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 hover:ring-emerald-500/30 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 h-full">
                  <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-6 h-full">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center mb-5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 shadow-[0_10px_24px_-10px_rgba(16,185,129,0.7)]">
                      {i + 1}
                    </div>
                    <h3 className="font-semibold tracking-tight text-gray-900 dark:text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      <WaveCanvas />
      <section className="py-20 lg:py-28 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {tList('services.metrics').map((s, i) => (
              <Fade key={i} delay={i * 60}>
                <div className="group rounded-2xl p-1.5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 hover:ring-emerald-500/30 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 h-full">
                  <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-7 text-center h-full">
                    <p className="font-display text-4xl sm:text-5xl font-bold text-emerald-600 dark:text-emerald-300 mb-2 tracking-tight">{s.value}</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm tracking-tight">{s.label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{s.sub}</p>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      <WaveCanvas flip />
      <section className="px-4 sm:px-6 py-20 lg:py-28 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-[#04140d] text-white px-6 sm:px-12 py-16 sm:py-20 ring-1 ring-white/10">
            <div aria-hidden className="pointer-events-none absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-emerald-500/25 blur-[120px]" />
            <div aria-hidden className="pointer-events-none absolute bottom-[-10rem] right-[-6rem] w-[32rem] h-[32rem] rounded-full bg-teal-400/15 blur-[140px]" />

            <div className="relative max-w-2xl mx-auto text-center">
              <Fade>
                <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl font-bold leading-[1.05] tracking-tight">
                  {t('services.ctaTitleLine1')}<br />{t('services.ctaTitleLine2')}
                </h2>
                <p className="mt-5 text-base sm:text-lg leading-relaxed text-emerald-100/70 max-w-xl mx-auto">
                  {t('services.ctaDescription')}
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => window.location.href = '/register'}
                    className="group relative h-12 pl-8 pr-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#04140d] text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-[0_12px_30px_-10px_rgba(16,185,129,0.8)] flex items-center justify-center"
                  >
                    <span>{t('services.createAccount')}</span>
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                      <Arrow />
                    </span>
                  </button>
                  <button
                    onClick={() => onNavigate && onNavigate('planes')}
                    className="h-12 px-9 rounded-full ring-1 ring-white/25 text-white text-sm font-semibold bg-white/5 hover:bg-white/10 hover:ring-white/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] flex items-center justify-center"
                  >
                    {t('services.ctaSecondary')}
                  </button>
                </div>
              </Fade>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Servicios;
