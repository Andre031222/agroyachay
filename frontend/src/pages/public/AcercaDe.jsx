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
    el.style.transition = `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.style.opacity = '1'; el.style.transform = 'none'; obs.unobserve(el); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay, fromRight]);
  return <div ref={ref}>{children}</div>;
};

const Ic = {
  check:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
  arrow:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  warn:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4M12 16h.01"/><circle cx="12" cy="12" r="10"/></svg>,
  wifi:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>,
  brain:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>,
  lock:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  cpu:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></svg>,
  flask:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6M8.5 3 4 21h16L15.5 3"/><path d="M5 14h14"/></svg>,
  db:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>,
  react:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" strokeDasharray="4 2"/></svg>,
  esp:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M8 6V4M12 6V4M16 6V4M8 18v2M12 18v2M16 18v2"/><circle cx="8" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="16" cy="12" r="1" fill="currentColor"/></svg>,
  ai2:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26A7 7 0 0 1 12 2z"/><path d="M9 21h6"/></svg>,
  pdf:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></svg>,
};

const PILLAR_ICONS = [Ic.wifi, Ic.brain, Ic.lock, Ic.cpu];
const PILLAR_COLORS = [
  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
  'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
];

const MODULE_ENDPOINTS = [
  '/api/cultivos',
  '/api/sensores',
  '/api/clima/plan-semanal',
  '/api/plagas/detectar',
  '/api/prediccion/calcular',
  '/api/asesoria/solicitar',
  '/api/marketplace/productos',
  '/api/insumos',
  '/api/informes/generar',
  '/almanaque',
  '/api/asistente/consulta',
];

const stackFor = (t) => [
  { icon: Ic.flask, color: 'from-emerald-500 to-green-600', items: ['Python 3.12', 'Flask 3.0', 'SQLAlchemy', 'Flask-JWT-Extended', 'Flask-Migrate', 'Flask-CORS'] },
  { icon: Ic.db,    color: 'from-cyan-500 to-teal-600',     items: ['PostgreSQL 17', 'psycopg2-binary', t('about.stackTables'), 'Alembic migrations'] },
  { icon: Ic.react, color: 'from-blue-500 to-indigo-600',   items: ['React 18', 'Tailwind CSS 3', 'Recharts', 'React Router 6', 'Axios'] },
  { icon: Ic.esp,   color: 'from-amber-500 to-orange-600',  items: ['ESP32 DevKit', 'DHT11', t('about.stackSoilSensor'), 'Buffer offline', 'NTP UTC-5'] },
  { icon: Ic.ai2,   color: 'from-violet-500 to-purple-600', items: ['Groq llama-3.3-70b', 'Plant.id v2', 'OpenWeather API', 'scikit-learn'] },
  { icon: Ic.pdf,   color: 'from-rose-500 to-pink-600',     items: ['ReportLab PDF', 'OpenPyXL Excel', 'Matplotlib', 'Pillow'] },
];

const KIT_PRICES = [
  { part: 'ESP32 DevKit', price: '~S/.30' },
  { part: 'DHT11', price: '~S/.8' },
  { part: 'FC-28', price: '~S/.5' },
  { part: null, price: '~S/.43', highlight: true },
];

const FLOW_SIDES = ['left', 'right', 'left', 'right', 'left'];

const AcercaDe = ({ onNavigate }) => {
  const { t, tList } = useLanguage();
  const STACK = stackFor(t);

  return (
    <div className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <section className="relative min-h-[calc(100dvh-4rem)] flex items-center overflow-hidden bg-[#04140d] text-white">
        <div aria-hidden className="pointer-events-none absolute -top-40 -left-32 w-[34rem] h-[34rem] rounded-full bg-emerald-500/25 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-12rem] right-[-8rem] w-[38rem] h-[38rem] rounded-full bg-teal-400/15 blur-[140px]" />
        <div aria-hidden className="pointer-events-none absolute top-1/3 left-1/2 w-[26rem] h-[26rem] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-[130px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

            <div className="animate-slide-up">
              <h1 className="font-display text-white tracking-tight">
                {t('about.heroBefore')}{' '}
                <span className="text-emerald-300">{t('about.heroHighlight')}</span>{' '}
                {t('about.heroAfter')}
              </h1>
              <p className="mt-6 text-body-lg text-emerald-100/70 max-w-lg">
                {t('about.heroDescription')}
              </p>
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <button onClick={() => onNavigate('servicios')}
                  className="group inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-[0_12px_30px_-10px_rgba(16,185,129,0.7)]">
                  {t('about.viewModules')}
                  <span className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">{Ic.arrow}</span>
                </button>
                <button onClick={() => onNavigate('contactos')}
                  className="inline-flex items-center justify-center h-12 px-8 rounded-full ring-1 ring-white/15 text-emerald-50 text-sm font-medium bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
                  {t('about.contact')}
                </button>
              </div>
            </div>

            <Fade fromRight>
              <div className="rounded-2xl p-1.5 bg-white/10 ring-1 ring-white/10">
                <div className="rounded-[calc(1rem-0.375rem)] bg-[#06190f]/90 px-7 py-8 ring-1 ring-white/5">
                  <ul className="space-y-3.5">
                    {tList('about.problems').map(problem => (
                      <li key={problem} className="flex items-start gap-3 text-sm text-emerald-50/80">
                        <span className="shrink-0 mt-0.5">{Ic.warn}</span>
                        {problem}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-7 pt-5 border-t border-white/10 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-300 font-semibold">{t('about.problemsSolved')}</span>
                  </div>
                </div>
              </div>
            </Fade>
          </div>
        </div>
      </section>

      <WaveCanvas />
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <Fade>
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-h2 font-semibold tracking-tight text-gray-900 dark:text-white">
                {t('about.pillarsTitle')}
              </h2>
            </div>
          </Fade>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {tList('about.pillars').map(({ title, desc }, i) => (
              <Fade key={title} delay={i * 70}>
                <div className="group h-full rounded-2xl p-1.5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
                  <div className="h-full rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-6">
                    <div className={`w-12 h-12 rounded-2xl ${PILLAR_COLORS[i]} flex items-center justify-center mb-5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110`}>
                      {PILLAR_ICONS[i]}
                    </div>
                    <h3 className="font-semibold tracking-tight text-gray-900 dark:text-white mb-3 leading-snug">{title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      <WaveCanvas flip />
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-white dark:bg-gray-900/40">
        <div className="max-w-7xl mx-auto">
          <Fade>
            <div className="mb-14 max-w-xl">
              <h2 className="text-h2 font-semibold tracking-tight text-gray-900 dark:text-white">
                {t('about.modulesTitle')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">
                {t('about.modulesDescription')}
              </p>
            </div>
          </Fade>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tList('about.modules').map(({ label, desc }, i) => (
              <Fade key={label} delay={i * 40}>
                <div className="group h-full rounded-2xl p-1.5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
                  <div className="h-full rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-5 flex items-start gap-4">
                    <div className="shrink-0 w-9 h-9 rounded-xl bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <h3 className="font-semibold tracking-tight text-sm text-gray-900 dark:text-white mb-1">{label}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2.5">{desc}</p>
                      <code className="text-[10px] font-mono text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/15 px-2 py-0.5 rounded-full">{MODULE_ENDPOINTS[i]}</code>
                    </div>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      <WaveCanvas />
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <Fade>
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-h2 font-semibold tracking-tight text-gray-900 dark:text-white">
                {t('about.stackTitle')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">
                {t('about.stackDescription')}
              </p>
            </div>
          </Fade>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {STACK.map(({ icon, color, items }, i) => (
              <Fade key={tList('about.stackCategories')[i]} delay={i * 60}>
                <div className="group h-full rounded-2xl p-1.5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
                  <div className="h-full rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 overflow-hidden">
                    <div className={`bg-gradient-to-r ${color} p-4 flex items-center gap-3`}>
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white">
                        {icon}
                      </div>
                      <span className="font-semibold tracking-tight text-white text-sm">{tList('about.stackCategories')[i]}</span>
                    </div>
                    <div className="p-5">
                      <div className="flex flex-wrap gap-2">
                        {items.map(item => (
                          <span key={item} className="text-xs font-mono px-2.5 py-1 rounded-full bg-gray-50 dark:bg-white/[0.04] text-gray-600 dark:text-gray-300 ring-1 ring-black/5 dark:ring-white/10 transition-colors duration-500">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      <WaveCanvas flip />

      {/* KIT IoT ------------------------------------------------------------- */}
      <section className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6 bg-[#04140d] text-white">
        <div aria-hidden className="pointer-events-none absolute -top-32 right-[-6rem] w-[30rem] h-[30rem] rounded-full bg-emerald-500/20 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-10rem] left-[-6rem] w-[30rem] h-[30rem] rounded-full bg-teal-400/12 blur-[140px]" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

            <Fade>
              <div>
                <h2 className="text-h2 font-semibold tracking-tight mb-5">
                  {t('about.kitTitleLine1')}<br />
                  <span className="text-emerald-300">{t('about.kitTitleLine2')}</span>
                </h2>
                <p className="text-emerald-100/70 leading-relaxed mb-8">
                  {t('about.kitDescription')}
                </p>
                <ul className="space-y-3">
                  {tList('about.hardware').map(item => (
                    <li key={item} className="flex items-start gap-3 text-sm text-emerald-50/80">
                      <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-emerald-500/15 ring-1 ring-emerald-300/20 text-emerald-300 flex items-center justify-center">
                        {Ic.check}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-wrap gap-3">
                  {KIT_PRICES.map(({ part, price, highlight }) => (
                    <div key={price} className={`px-3.5 py-2 rounded-full text-xs font-semibold ring-1 ${highlight ? 'bg-emerald-500 text-white ring-emerald-400/40' : 'bg-white/[0.04] text-emerald-50/80 ring-white/10'}`}>
                      <span className="opacity-70">{part || t('about.priceTotal')}</span>
                      <span className="ml-2 font-bold">{price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Fade>

            <Fade fromRight delay={120}>
              <div className="relative">
                <div aria-hidden className="pointer-events-none absolute -inset-4 bg-emerald-500/10 rounded-2xl blur-2xl" />
                <div className="relative rounded-2xl p-1.5 bg-white/10 ring-1 ring-white/10">
                  <div className="rounded-[calc(1rem-0.375rem)] bg-[#03100a] overflow-hidden ring-1 ring-white/5">
                    <div className="flex items-center gap-1.5 px-4 py-3 bg-white/[0.03] border-b border-white/10">
                      <span className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="ml-3 text-xs text-emerald-100/40 font-mono">agroyachay_esp32.ino</span>
                    </div>
                    <div className="p-6 font-mono text-sm leading-7 text-emerald-300">
                      <p className="text-emerald-100/30">{t('about.codeConfig')}</p>
                      <p>const char* SSID = <span className="text-amber-300">"TuRed"</span>;</p>
                      <p>const char* SERVER =</p>
                      <p className="pl-5 text-amber-300">"http://192.168.x.x:5000";</p>
                      <p>const int INTERVAL = <span className="text-sky-300">10000</span>; <span className="text-emerald-100/30">// 10s</span></p>
                      <div className="my-3 border-t border-white/10" />
                      <p className="text-emerald-100/30">{t('about.codeSensors')}</p>
                      <p>DHT dht(<span className="text-sky-300">15</span>, DHT11);</p>
                      <p>const int SOIL_PIN = <span className="text-sky-300">34</span>;</p>
                      <div className="my-3 border-t border-white/10" />
                      <p className="text-emerald-100/30">{t('about.codeBuffer')}</p>
                      <p>SensorBuffer buf[<span className="text-sky-300">10</span>];</p>
                      <p><span className="text-blue-300">if</span> (!wifi) buf.<span className="text-yellow-300">push</span>(reading);</p>
                      <p><span className="text-blue-300">else</span> syncAll(); <span className="text-emerald-100/30">{t('about.codeAutoSync')}</span></p>
                      <div className="my-3 border-t border-white/10" />
                      <p className="text-emerald-100/30">{t('about.codeCalibration')}</p>
                      <p>const <span className="text-sky-300">int</span> DRY = <span className="text-orange-300">4095</span>;</p>
                      <p>const <span className="text-sky-300">int</span> WET = <span className="text-orange-300">1500</span>;</p>
                    </div>
                  </div>
                </div>
              </div>
            </Fade>
          </div>
        </div>
      </section>

      <WaveCanvas />
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <Fade>
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-h2 font-semibold tracking-tight text-gray-900 dark:text-white">
                {t('about.flowTitleLine1')}<br />{t('about.flowTitleLine2')}
              </h2>
            </div>
          </Fade>

          <div className="relative">
            <div aria-hidden className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-emerald-200/60 dark:bg-emerald-500/20" />

            <div className="space-y-10">
              {tList('about.flow').map((step, i) => (
                <Fade key={step.title} delay={i * 80} fromRight={FLOW_SIDES[i] === 'right'}>
                  <div className={`lg:w-5/12 ${FLOW_SIDES[i] === 'right' ? 'lg:ml-auto' : ''}`}>
                    <div className="group rounded-2xl p-1.5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
                      <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110">
                            {i + 1}
                          </div>
                          <h3 className="font-semibold tracking-tight text-gray-900 dark:text-white">{step.title}</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  </div>
                </Fade>
              ))}
            </div>
          </div>
        </div>
      </section>

      <WaveCanvas flip />
      <section className="relative overflow-hidden py-24 sm:py-28 px-4 sm:px-6 bg-[#04140d] text-white">
        <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 w-[36rem] h-[36rem] -translate-x-1/2 rounded-full bg-emerald-500/25 blur-[130px]" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-12rem] right-[-6rem] w-[30rem] h-[30rem] rounded-full bg-teal-400/15 blur-[140px]" />

        <div className="relative max-w-3xl mx-auto text-center">
          <Fade>
            <h2 className="font-display text-white tracking-tight">
              {t('about.ctaTitleLine1')}<br />{t('about.ctaTitleLine2')}
            </h2>
            <p className="mt-6 text-emerald-100/70 text-body-lg max-w-xl mx-auto">
              {t('about.ctaDescription')}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/register'}
                className="group inline-flex items-center justify-center gap-2 h-12 px-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-[0_12px_30px_-10px_rgba(16,185,129,0.7)]">
                {t('about.ctaPrimary')}
                <span className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">{Ic.arrow}</span>
              </button>
              <button
                onClick={() => onNavigate('contactos')}
                className="inline-flex items-center justify-center h-12 px-10 rounded-full ring-1 ring-white/15 text-emerald-50 text-sm font-medium bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
                {t('about.ctaSecondary')}
              </button>
            </div>
          </Fade>
        </div>
      </section>
    </div>
  );
};

export default AcercaDe;
