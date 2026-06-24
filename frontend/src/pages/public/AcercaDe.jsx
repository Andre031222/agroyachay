import React, { useRef, useEffect } from 'react';
import { WaveCanvas } from './Landing';

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

const PROBLEMS = [
  'Parcelas en zonas remotas donde no llega el agrónomo',
  'Plagas detectadas tarde por falta de monitoreo continuo',
  'Desconocimiento del estado real del suelo y el aire',
  'Pérdidas por no conocer el pronóstico con anticipación',
  'Decisiones de compra sin comparar precios de insumos reales',
  'Sin historial de actividades ni costos por parcela',
];

const PILLARS = [
  {
    icon: Ic.wifi,
    title: 'Opera sin señal estable',
    desc: 'El ESP32 guarda lecturas en buffer local y las sincroniza automáticamente al reconectar. No se pierde ningún dato aunque no haya WiFi horas enteras.',
    color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    hover: 'hover:border-emerald-400 hover:shadow-emerald-50',
  },
  {
    icon: Ic.brain,
    title: 'IA sin depender de expertos',
    desc: 'Groq llama-3.3-70b responde preguntas de riego, plagas y fertilización con contexto real de tu campo. Asesoría en 7 especialidades via tickets.',
    color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
    hover: 'hover:border-violet-400 hover:shadow-violet-50',
  },
  {
    icon: Ic.lock,
    title: 'Tus datos, tu servidor',
    desc: 'Todo vive en tu PostgreSQL local. Sin servicios externos que fallen, suban precios o expongan tus datos de producción.',
    color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    hover: 'hover:border-blue-400 hover:shadow-blue-50',
  },
  {
    icon: Ic.cpu,
    title: 'Hardware accesible en Perú',
    desc: 'ESP32 (~S/.30) + DHT11 (~S/.8) + FC-28 (~S/.5). Todo disponible en tiendas electrónicas locales. Sin importar componentes costosos.',
    color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    hover: 'hover:border-amber-400 hover:shadow-amber-50',
  },
];

const MODULES = [
  { label: 'Gestión de cultivos',         desc: 'Ciclo completo Planificado → Cosechado, 10 tipos',       api: '/api/cultivos' },
  { label: 'Dashboard IoT',               desc: 'Lecturas en tiempo real, alertas automáticas por umbral', api: '/api/sensores' },
  { label: 'Clima + Plan semanal IA',     desc: 'OpenWeather + Groq, plan de actividades por día',         api: '/api/clima/plan-semanal' },
  { label: 'Detección de plagas',         desc: 'Foto → Plant.id → Groq plan con dosis y urgencia',        api: '/api/plagas/detectar' },
  { label: 'Predicción de cosecha',       desc: 'scikit-learn estima kg/ha y rentabilidad proyectada',     api: '/api/prediccion/calcular' },
  { label: 'Asesoría especializada',      desc: '7 especialidades, tickets con prioridad y estado',        api: '/api/asesoria/solicitar' },
  { label: 'Marketplace de insumos',      desc: 'Semillas, fertilizantes, equipos — sin comisión',         api: '/api/marketplace/productos' },
  { label: 'Calculadora de insumos',      desc: 'NPK, agua, pesticidas, herbicidas — por hectárea',        api: '/api/insumos' },
  { label: 'Informes PDF y Excel',        desc: '4 tipos con gráficos reales desde tus sensores',          api: '/api/informes/generar' },
  { label: 'Almanaque Bristol',           desc: 'Planificación lunar de actividades agrícolas',            api: '/almanaque' },
  { label: 'Asistente AgroIA',            desc: 'Chat libre con Llama 3.3 70B, contexto de tu campo',     api: '/api/asistente/consulta' },
];

const STACK = [
  { cat: 'Backend',       icon: Ic.flask, color: 'from-emerald-500 to-green-600',   items: ['Python 3.12', 'Flask 3.0', 'SQLAlchemy', 'Flask-JWT-Extended', 'Flask-Migrate', 'Flask-CORS'] },
  { cat: 'Base de datos', icon: Ic.db,    color: 'from-cyan-500 to-teal-600',       items: ['PostgreSQL 17', 'psycopg2-binary', '14 tablas', 'Alembic migrations'] },
  { cat: 'Frontend',      icon: Ic.react, color: 'from-blue-500 to-indigo-600',     items: ['React 18', 'Tailwind CSS 3', 'Recharts', 'React Router 6', 'Axios'] },
  { cat: 'IoT Hardware',  icon: Ic.esp,   color: 'from-amber-500 to-orange-600',    items: ['ESP32 DevKit', 'DHT11', 'FC-28 suelo', 'Buffer offline', 'NTP UTC-5'] },
  { cat: 'IA & APIs',     icon: Ic.ai2,   color: 'from-violet-500 to-purple-600',   items: ['Groq llama-3.3-70b', 'Plant.id v2', 'OpenWeather API', 'scikit-learn'] },
  { cat: 'Reportes',      icon: Ic.pdf,   color: 'from-rose-500 to-pink-600',       items: ['ReportLab PDF', 'OpenPyXL Excel', 'Matplotlib', 'Pillow'] },
];

const HARDWARE = [
  'ESP32 DevKit — controlador principal con WiFi integrado',
  'DHT11 — temperatura + humedad del aire (GPIO 15)',
  'FC-28 — humedad del suelo analógica (GPIO 34)',
  'LED indicador de estado de conexión (GPIO 2)',
  'Sincronización NTP UTC-5 (zona horaria Perú)',
  'HTTP POST al backend cada 10 segundos',
];

const AcercaDe = ({ onNavigate }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">

      {/* HERO ---------------------------------------------------------------- */}
      <section className="relative min-h-[calc(100dvh-4rem)] flex items-center overflow-hidden bg-[#04140d] text-white">
        <div aria-hidden className="pointer-events-none absolute -top-40 -left-32 w-[34rem] h-[34rem] rounded-full bg-emerald-500/25 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-12rem] right-[-8rem] w-[38rem] h-[38rem] rounded-full bg-teal-400/15 blur-[140px]" />
        <div aria-hidden className="pointer-events-none absolute top-1/3 left-1/2 w-[26rem] h-[26rem] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-[130px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

            <div className="animate-slide-up">
              <h1 className="font-display text-white tracking-tight">
                Construido para el{' '}
                <span className="text-emerald-300">campo remoto</span>{' '}
                peruano
              </h1>
              <p className="mt-6 text-body-lg text-emerald-100/70 max-w-lg">
                AgroYachay nació con un objetivo claro: darle al pequeño agricultor las mismas
                herramientas de la agroindustria, adaptadas a zonas aisladas de sierra y selva,
                presupuestos reales y conectividad intermitente.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <button onClick={() => onNavigate('servicios')}
                  className="group inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-[0_12px_30px_-10px_rgba(16,185,129,0.7)]">
                  Ver módulos del sistema
                  <span className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">{Ic.arrow}</span>
                </button>
                <button onClick={() => onNavigate('contactos')}
                  className="inline-flex items-center justify-center h-12 px-8 rounded-full ring-1 ring-white/15 text-emerald-50 text-sm font-medium bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
                  Contactar
                </button>
              </div>
            </div>

            <Fade fromRight>
              <div className="rounded-2xl p-1.5 bg-white/10 ring-1 ring-white/10">
                <div className="rounded-[calc(1rem-0.375rem)] bg-[#06190f]/90 px-7 py-8 ring-1 ring-white/5">
                  <ul className="space-y-3.5">
                    {PROBLEMS.map(p => (
                      <li key={p} className="flex items-start gap-3 text-sm text-emerald-50/80">
                        <span className="shrink-0 mt-0.5">{Ic.warn}</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-7 pt-5 border-t border-white/10 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-300 font-semibold">AgroYachay resuelve todo lo anterior</span>
                  </div>
                </div>
              </div>
            </Fade>
          </div>
        </div>
      </section>

      <WaveCanvas />

      {/* PRINCIPIOS ---------------------------------------------------------- */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <Fade>
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-h2 font-semibold tracking-tight text-gray-900 dark:text-white">
                Por qué funciona donde otros no
              </h2>
            </div>
          </Fade>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PILLARS.map(({ icon, title, desc, color }, i) => (
              <Fade key={title} delay={i * 70}>
                <div className="group h-full rounded-2xl p-1.5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
                  <div className="h-full rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-6">
                    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110`}>
                      {icon}
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

      {/* MÓDULOS ------------------------------------------------------------- */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-white dark:bg-gray-900/40">
        <div className="max-w-7xl mx-auto">
          <Fade>
            <div className="mb-14 max-w-xl">
              <h2 className="text-h2 font-semibold tracking-tight text-gray-900 dark:text-white">
                11 módulos. Todo integrado.
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">
                Cada módulo comparte datos con los demás. Los sensores alimentan las predicciones,
                el clima informa las alertas y la IA tiene contexto real de tu campo.
              </p>
            </div>
          </Fade>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map(({ label, desc, api }, i) => (
              <Fade key={label} delay={i * 40}>
                <div className="group h-full rounded-2xl p-1.5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
                  <div className="h-full rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-5 flex items-start gap-4">
                    <div className="shrink-0 w-9 h-9 rounded-xl bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <h3 className="font-semibold tracking-tight text-sm text-gray-900 dark:text-white mb-1">{label}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2.5">{desc}</p>
                      <code className="text-[10px] font-mono text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/15 px-2 py-0.5 rounded-full">{api}</code>
                    </div>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      <WaveCanvas />

      {/* STACK --------------------------------------------------------------- */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <Fade>
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-h2 font-semibold tracking-tight text-gray-900 dark:text-white">
                Herramientas de producción real
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">
                Sin frameworks experimentales. Todo probado, documentado y con comunidad activa en Perú y Latinoamérica.
              </p>
            </div>
          </Fade>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {STACK.map(({ cat, icon, color, items }, i) => (
              <Fade key={cat} delay={i * 60}>
                <div className="group h-full rounded-2xl p-1.5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
                  <div className="h-full rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 overflow-hidden">
                    <div className={`bg-gradient-to-r ${color} p-4 flex items-center gap-3`}>
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white">
                        {icon}
                      </div>
                      <span className="font-semibold tracking-tight text-white text-sm">{cat}</span>
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
                  ESP32 + sensores.<br />
                  <span className="text-emerald-300">Menos de S/.50 el kit.</span>
                </h2>
                <p className="text-emerald-100/70 leading-relaxed mb-8">
                  Un ESP32 con DHT11 y FC-28 mide temperatura, humedad del aire y del suelo cada 10 segundos.
                  Sin WiFi guarda hasta 10 lecturas en buffer y las envía automáticamente al reconectar.
                  El firmware está en Arduino C++ y el código es completamente tuyo.
                </p>
                <ul className="space-y-3">
                  {HARDWARE.map(h => (
                    <li key={h} className="flex items-start gap-3 text-sm text-emerald-50/80">
                      <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-emerald-500/15 ring-1 ring-emerald-300/20 text-emerald-300 flex items-center justify-center">
                        {Ic.check}
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-wrap gap-3">
                  {[
                    { part: 'ESP32 DevKit', price: '~S/.30' },
                    { part: 'DHT11',        price: '~S/.8' },
                    { part: 'FC-28',        price: '~S/.5' },
                    { part: 'Total',        price: '~S/.43', highlight: true },
                  ].map(({ part, price, highlight }) => (
                    <div key={part} className={`px-3.5 py-2 rounded-full text-xs font-semibold ring-1 ${highlight ? 'bg-emerald-500 text-white ring-emerald-400/40' : 'bg-white/[0.04] text-emerald-50/80 ring-white/10'}`}>
                      <span className="opacity-70">{part}</span>
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
                      <p className="text-emerald-100/30">// Configuración</p>
                      <p>const char* SSID = <span className="text-amber-300">"TuRed"</span>;</p>
                      <p>const char* SERVER =</p>
                      <p className="pl-5 text-amber-300">"http://192.168.x.x:5000";</p>
                      <p>const int INTERVAL = <span className="text-sky-300">10000</span>; <span className="text-emerald-100/30">// 10s</span></p>
                      <div className="my-3 border-t border-white/10" />
                      <p className="text-emerald-100/30">// Sensores</p>
                      <p>DHT dht(<span className="text-sky-300">15</span>, DHT11);</p>
                      <p>const int SOIL_PIN = <span className="text-sky-300">34</span>;</p>
                      <div className="my-3 border-t border-white/10" />
                      <p className="text-emerald-100/30">// Buffer offline</p>
                      <p>SensorBuffer buf[<span className="text-sky-300">10</span>];</p>
                      <p><span className="text-blue-300">if</span> (!wifi) buf.<span className="text-yellow-300">push</span>(reading);</p>
                      <p><span className="text-blue-300">else</span> syncAll(); <span className="text-emerald-100/30">// auto-sync</span></p>
                      <div className="my-3 border-t border-white/10" />
                      <p className="text-emerald-100/30">// Calibración FC-28</p>
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

      {/* FLUJO --------------------------------------------------------------- */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <Fade>
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-h2 font-semibold tracking-tight text-gray-900 dark:text-white">
                De la parcela al informe,<br />sin salir del sistema
              </h2>
            </div>
          </Fade>

          <div className="relative">
            <div aria-hidden className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-emerald-200/60 dark:bg-emerald-500/20" />

            <div className="space-y-10">
              {[
                { side: 'left',  n: '1', title: 'El sensor mide',        desc: 'Temperatura, humedad de aire y suelo cada 10 s. Si no hay WiFi, buffer local hasta 10 lecturas. Timestamp NTP real.' },
                { side: 'right', n: '2', title: 'El backend procesa',     desc: 'Flask recibe el POST, guarda en PostgreSQL, evalúa umbrales y dispara alertas automáticas si hay anomalías.' },
                { side: 'left',  n: '3', title: 'La IA analiza',          desc: 'Groq cruza temperatura, humedad, pronóstico y tipo de cultivo. Genera plan de riego, alertas fitosanitarias y actividades del día.' },
                { side: 'right', n: '4', title: 'Tú decides y actúas',    desc: 'Ves el dashboard en el celular. Detectas plaga con foto. Consultas al asistente. Solicitas asesoría si necesitas.' },
                { side: 'left',  n: '5', title: 'El informe queda listo', desc: 'PDF o Excel con gráficos reales: estado de cultivos, análisis financiero, impacto climático. Descarga en un clic.' },
              ].map((step, i) => (
                <Fade key={step.n} delay={i * 80} fromRight={step.side === 'right'}>
                  <div className={`lg:w-5/12 ${step.side === 'right' ? 'lg:ml-auto' : ''}`}>
                    <div className="group rounded-2xl p-1.5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
                      <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110">
                            {step.n}
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

      {/* CTA ----------------------------------------------------------------- */}
      <section className="relative overflow-hidden py-24 sm:py-28 px-4 sm:px-6 bg-[#04140d] text-white">
        <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 w-[36rem] h-[36rem] -translate-x-1/2 rounded-full bg-emerald-500/25 blur-[130px]" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-12rem] right-[-6rem] w-[30rem] h-[30rem] rounded-full bg-teal-400/15 blur-[140px]" />

        <div className="relative max-w-3xl mx-auto text-center">
          <Fade>
            <h2 className="font-display text-white tracking-tight">
              El sistema está listo.<br />Tu campo, también.
            </h2>
            <p className="mt-6 text-emerald-100/70 text-body-lg max-w-xl mx-auto">
              Crea tu cuenta, registra tu primera parcela y conecta el ESP32. Sin tarjeta, sin contratos. Control total desde el primer día.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/register'}
                className="group inline-flex items-center justify-center gap-2 h-12 px-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-[0_12px_30px_-10px_rgba(16,185,129,0.7)]">
                Crear cuenta gratis
                <span className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">{Ic.arrow}</span>
              </button>
              <button
                onClick={() => onNavigate('contactos')}
                className="inline-flex items-center justify-center h-12 px-10 rounded-full ring-1 ring-white/15 text-emerald-50 text-sm font-medium bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
                Hablar con nosotros
              </button>
            </div>
          </Fade>
        </div>
      </section>
    </div>
  );
};

export default AcercaDe;
