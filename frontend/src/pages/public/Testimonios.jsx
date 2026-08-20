import React, { useRef, useEffect } from 'react';
import { WaveCanvas } from './Landing';
import { useLanguage } from '../../context/LanguageContext';

const Fade = ({ children, delay = 0, fromRight = false }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = fromRight ? 'translateX(40px)' : 'translateX(-40px)';
    el.style.transition = `opacity 0.65s cubic-bezier(0.32,0.72,0,1) ${delay}ms, transform 0.65s cubic-bezier(0.32,0.72,0,1) ${delay}ms`;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.style.opacity = '1'; el.style.transform = 'none'; obs.unobserve(el); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay, fromRight]);
  return <div ref={ref}>{children}</div>;
};

const Ic = {
  arrow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
  info:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>,
};

const Quote = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-emerald-500/80 dark:text-emerald-400/80">
    <path d="M9.5 6C6.46 6 4 8.46 4 11.5V18h6v-6H7.5c0-1.66 1.34-3 3-3V6h-1Zm9 0C15.46 6 13 8.46 13 11.5V18h6v-6h-2.5c0-1.66 1.34-3 3-3V6h-1Z" />
  </svg>
);

const METRIC_COLORS = [
  'text-emerald-600 dark:text-emerald-400',
  'text-blue-600 dark:text-blue-400',
  'text-violet-600 dark:text-violet-400',
  'text-amber-600 dark:text-amber-400',
];

const STATUS_DOTS = ['bg-emerald-400', 'bg-amber-400', 'bg-white/25', 'bg-white/25'];

const Testimonios = ({ onNavigate }) => {
  const { t, tList } = useLanguage();

  return (
    <div className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <section className="relative min-h-[calc(100dvh-4rem)] flex items-center overflow-hidden bg-[#04140d] text-white">
        <div aria-hidden className="pointer-events-none absolute -top-32 -left-24 w-[30rem] h-[30rem] rounded-full bg-emerald-500/25 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-12rem] right-[-8rem] w-[34rem] h-[34rem] rounded-full bg-teal-400/15 blur-[140px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            <div className="animate-slide-up">
              <h1 className="font-display text-4xl xl:text-5xl font-bold leading-[1.05] tracking-tight">
                {t('testimonials.heroTitleLine1')}<br />
                <span className="text-emerald-300">{t('testimonials.heroTitleLine2')}</span>
              </h1>
              <p className="mt-5 text-base leading-relaxed text-emerald-100/70 max-w-lg">
                {t('testimonials.heroDescription')}
              </p>
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => window.location.href = '/register'}
                  className="group relative inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-emerald-500 text-white text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-emerald-400 active:scale-[0.98] shadow-[0_12px_30px_-10px_rgba(16,185,129,0.7)]">
                  {t('testimonials.createAccount')}
                  <span className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">{Ic.arrow}</span>
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('contactos')}
                  className="inline-flex items-center justify-center h-12 px-7 rounded-full text-emerald-50 text-sm font-semibold ring-1 ring-white/15 bg-white/[0.04] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/[0.08] active:scale-[0.98]">
                  {t('testimonials.contactTeam')}
                </button>
              </div>
            </div>

            <Fade fromRight>
              <div className="rounded-2xl p-1.5 bg-white/[0.04] ring-1 ring-white/10">
                <div className="rounded-[calc(1rem-0.375rem)] bg-[#06180f]/80 ring-1 ring-white/5 p-6 sm:p-7">
                  <div className="space-y-3.5 mb-6">
                    {tList('testimonials.status').map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/10 last:border-0">
                        <span className="text-sm text-emerald-50/85">{item.label}</span>
                        <span className="flex items-center gap-1.5 text-xs text-emerald-100/50">
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[i]}`} />
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/10 p-4">
                    <p className="text-[10px] text-emerald-100/50 mb-3 uppercase tracking-[0.18em] font-medium">{t('testimonials.expectedTitle')}</p>
                    <div className="space-y-2">
                      {tList('testimonials.expected').slice(0, 3).map((item, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-emerald-100/60">
                          <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-300 font-semibold">{t('testimonials.beFirst')}</span>
                  </div>
                </div>
              </div>
            </Fade>
          </div>
        </div>
      </section>

      <WaveCanvas />
      <section className="py-20 md:py-28 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <Fade>
            <div className="mb-12 max-w-2xl">
              <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
                {t('testimonials.emptyTitle')}
              </h2>
              <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-xl text-sm leading-relaxed">
                {t('testimonials.emptyDescription')}
              </p>
            </div>
          </Fade>

          <div className="grid sm:grid-cols-2 gap-5 mb-5">
            <Fade>
              <div className="group h-full rounded-2xl p-1.5 ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-white/[0.04] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5">
                <div className="h-full rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-6 sm:p-7">
                  <Quote />
                  <div className="mt-4 flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 ring-1 ring-amber-500/15 flex items-center justify-center shrink-0">
                      {Ic.info}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm tracking-tight">{t('testimonials.whyNoDataTitle')}</h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {t('testimonials.whyNoDataDescription')}
                  </p>
                </div>
              </div>
            </Fade>

            <Fade fromRight>
              <div className="group h-full rounded-2xl p-1.5 ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-white/[0.04] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5">
                <div className="h-full rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-6 sm:p-7">
                  <Quote />
                  <div className="mt-4 flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/15 flex items-center justify-center shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110">
                      {Ic.check}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm tracking-tight">{t('testimonials.beFirstTitle')}</h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                    {t('testimonials.beFirstDescription')}
                  </p>
                  <button
                    onClick={() => onNavigate && onNavigate('contactos')}
                    className="group/btn text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors inline-flex items-center gap-1.5">
                    {t('testimonials.contactUs')}
                    <span className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/btn:translate-x-0.5">{Ic.arrow}</span>
                  </button>
                </div>
              </div>
            </Fade>
          </div>

          <Fade delay={80}>
            <div className="rounded-2xl p-1.5 ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-white/[0.04]">
              <div className="rounded-[calc(1rem-0.375rem)] bg-gray-50 dark:bg-gray-900/90 p-6 sm:p-7">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                  {tList('testimonials.expected').map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Fade>
        </div>
      </section>

      <WaveCanvas flip />
      <section className="py-20 md:py-28 px-4 sm:px-6 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <Fade>
            <div className="mb-14 max-w-2xl">
              <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
                {t('testimonials.metricsTitle')}
              </h2>
              <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-xl text-sm leading-relaxed">
                {t('testimonials.metricsDescription')}
              </p>
            </div>
          </Fade>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {tList('testimonials.metrics').map(({ symbol, label, desc }, i) => (
              <Fade key={label} delay={i * 70} fromRight={i > 1}>
                <div className="group h-full rounded-2xl p-1.5 ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-white/[0.04] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
                  <div className="h-full rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-800/60 p-6">
                    <p className={`font-display text-4xl font-bold mb-3 tracking-tight ${METRIC_COLORS[i]}`}>{symbol}</p>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5 text-sm leading-snug tracking-tight">{label}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      <WaveCanvas />
      <section className="relative overflow-hidden py-24 md:py-28 px-4 sm:px-6 bg-[#04140d] text-white">
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-emerald-500/20 blur-[130px]" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-10rem] right-[-6rem] w-[28rem] h-[28rem] rounded-full bg-teal-400/15 blur-[120px]" />

        <div className="relative max-w-2xl mx-auto text-center">
          <Fade>
            <h2 className="font-display text-3xl md:text-4xl xl:text-5xl font-bold tracking-tight leading-[1.05]">
              {t('testimonials.ctaTitle')}
            </h2>
            <p className="mt-5 text-emerald-100/70 text-base leading-relaxed max-w-lg mx-auto">
              {t('testimonials.ctaDescription')}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/register'}
                className="group inline-flex items-center justify-center gap-2 h-12 px-9 rounded-full bg-emerald-500 text-white text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-emerald-400 active:scale-[0.98] shadow-[0_12px_30px_-10px_rgba(16,185,129,0.7)]">
                {t('testimonials.createAccount')}
                <span className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">{Ic.arrow}</span>
              </button>
              <button
                onClick={() => onNavigate && onNavigate('contactos')}
                className="inline-flex items-center justify-center h-12 px-9 rounded-full text-emerald-50 text-sm font-semibold ring-1 ring-white/20 bg-white/[0.04] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/[0.08] active:scale-[0.98]">
                {t('testimonials.contactTeam')}
              </button>
            </div>
          </Fade>
        </div>
      </section>
    </div>
  );
};

export default Testimonios;
