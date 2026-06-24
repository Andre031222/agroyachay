import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WaveCanvas } from './Landing';
import { useSystemConfig } from '../../hooks/useSystemConfig';

const I = {
  plant:  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12M12 12C12 12 7 9 7 5a5 5 0 0 1 10 0c0 4-5 7-5 7z"/><path d="M9 17c-2 0-4-1-4-3s2-3 4-3"/></svg>,
  sensor: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4"/></svg>,
  cloud:  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/></svg>,
  bug:    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 8V4M8.5 9.5 6 7M15.5 9.5 18 7M8 14H4M20 14h-4"/></svg>,
  chart:  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
  store:  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></svg>,
  report: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
  ai:     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26A7 7 0 0 1 12 2z"/><path d="M9 21h6"/></svg>,
  arrow:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  check:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
  shield: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  zap:    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  bar:    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="8"/><rect x="13" y="6" width="3" height="12"/></svg>,
  users:  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};

const FEATURES = [
  { icon: I.plant,  title: 'Gestión de Cultivos',       desc: '10 tipos de cultivo, ciclo completo planificado→cosechado, historial de actividades e insumos con costos reales.' },
  { icon: I.sensor, title: 'Monitoreo IoT ESP32',        desc: 'Temperatura, humedad de aire y suelo cada 10 s. Buffer offline automático. Alertas por umbrales configurables.' },
  { icon: I.cloud,  title: 'Clima + Plan Semanal IA',    desc: 'OpenWeather + Groq analiza tu parcela y genera recomendaciones de riego, alerta de helada y actividades del día.' },
  { icon: I.bug,    title: 'Detección de Plagas',        desc: 'Foto desde campo → Plant.id identifica la enfermedad → Groq devuelve plan con urgencia, productos y dosis exactas.' },
  { icon: I.chart,  title: 'Predicción de Cosecha',      desc: 'scikit-learn estima rendimiento kg/ha y rentabilidad proyectada con base en tus datos reales de sensores.' },
  { icon: I.store,  title: 'Marketplace de Insumos',     desc: 'Semillas, fertilizantes y equipos con enlace directo a MercadoLibre y Amazon. Sin comisiones ni intermediarios.' },
  { icon: I.report, title: 'Informes PDF y Excel',       desc: '4 tipos: Ejecutivo, Cultivos, Financiero, Climático. Gráficos generados con datos reales de tus sensores.' },
  { icon: I.ai,     title: 'Asistente AgroIA',           desc: 'Chat libre con Llama 3.3 70B vía Groq. Responde sobre riego, plagas, siembra con contexto de tu campo actual.' },
];

const HOW = [
  { n: '01', title: 'Registra tu parcela', desc: 'Define cultivo, área y coordenadas. El sistema prepara sensores, umbrales y módulos relevantes.' },
  { n: '02', title: 'Conecta el ESP32',    desc: 'Firmware incluido. El sensor envía datos cada 10 s y opera en modo offline con sincronización automática.' },
  { n: '03', title: 'Recibe análisis IA',  desc: 'Groq cruza clima, sensores y cultivos para darte recomendaciones específicas de tu campo en tiempo real.' },
  { n: '04', title: 'Genera informes',     desc: 'PDF/Excel con gráficos reales, análisis financiero y proyección de cosecha. Descarga inmediata.' },
];

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

const Inicio = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { config } = useSystemConfig();
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let loaded = false;

    const load = () => {
      if (loaded) return;
      loaded = true;
      video.querySelectorAll('source[data-src]').forEach(s => { s.src = s.dataset.src; });
      video.load();
      video.play().catch(() => {});
    };

    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { load(); obs.disconnect(); }
    }, { threshold: 0.01 });
    obs.observe(video);

    const onVis = () => {
      if (document.hidden) video.pause();
      else if (loaded) video.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVis, { passive: true });

    return () => { obs.disconnect(); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">

      <section className="relative min-h-[calc(100dvh-4rem)] flex items-center overflow-hidden bg-[#04140d]">

        <video
          ref={videoRef}
          poster="/videos/poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source data-src="/videos/bg.webm" type="video/webm" />
          <source data-src="/videos/bg.mp4"  type="video/mp4" />
        </video>

        {/* Overlay stack: tint + emerald wash + bottom fade */}
        <div className="absolute inset-0 bg-[#04140d]/55 dark:bg-[#04140d]/70" />
        <div aria-hidden className="pointer-events-none absolute -top-40 -left-32 w-[34rem] h-[34rem] rounded-full bg-emerald-500/20 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-12rem] right-[-8rem] w-[38rem] h-[38rem] rounded-full bg-teal-400/15 blur-[140px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#04140d]/30 via-transparent to-[#04140d]/70" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            <div className="animate-slide-up">
              <h1 className="font-display text-display tracking-tightest mb-6 text-white">
                Control total de tu{' '}
                <span className="text-emerald-300">{config.hero_title}</span>{' '}
                desde cualquier lugar
              </h1>

              <p className="text-body-lg text-emerald-50/75 max-w-lg mb-9">
                {config.hero_description}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => navigate('/register')}
                  className="group relative inline-flex items-center justify-center h-12 pl-7 pr-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-[0_18px_40px_-12px_rgba(16,185,129,0.7)]">
                  {config.hero_cta}
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                    {I.arrow}
                  </span>
                </button>
                <button onClick={() => onNavigate('servicios')}
                  className="inline-flex items-center justify-center h-12 px-8 rounded-full ring-1 ring-white/25 text-white text-sm font-semibold backdrop-blur-md hover:bg-white/10 hover:ring-white/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
                  Ver el sistema
                </button>
              </div>

              <div className="mt-10 flex flex-wrap gap-2">
                {['Python/Flask', 'React 18', 'PostgreSQL 17', 'ESP32 IoT', 'Groq LLM', 'Plant.id', 'OpenWeather'].map(t => (
                  <span key={t} className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/[0.07] text-emerald-50/70 ring-1 ring-white/10 backdrop-blur-md">{t}</span>
                ))}
              </div>
            </div>

            <div className="hidden lg:block animate-fade-in">
              <div className="relative">
                <div aria-hidden className="absolute -inset-6 bg-emerald-400/15 rounded-2xl blur-[80px]" />
                {/* Double-bezel card */}
                <div className="relative rounded-2xl p-1.5 bg-white/60 dark:bg-white/[0.05] ring-1 ring-black/5 dark:ring-white/10 shadow-[0_30px_70px_-28px_rgba(16,185,129,0.45)]">
                  <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-6 space-y-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase text-gray-400 dark:text-gray-500 font-medium">Parcela Principal</div>
                      <div className="mt-1 font-semibold tracking-tight text-gray-900 dark:text-white">Cultivo de Papa — 2.5 ha</div>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/15 px-3 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Activo
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Temperatura', value: '14.2°C', sub: 'Normal', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg> },
                      { label: 'Humedad Aire', value: '68%',   sub: 'Óptimo',  color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-900/30',       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg> },
                      { label: 'Suelo',       value: '42%',   sub: 'Regar',   color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-900/30',     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18M3 12h18M3 18h18"/></svg> },
                    ].map(s => (
                      <div key={s.label} className={`${s.bg} rounded-2xl p-3 ring-1 ring-black/5 dark:ring-white/10`}>
                        <div className={`mb-1 ${s.color}`}>{s.icon}</div>
                        <div className={`text-lg font-semibold ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{s.label}</div>
                        <div className={`text-[10px] font-bold ${s.color}`}>{s.sub}</div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="text-xs text-gray-400 dark:text-gray-400 mb-2 flex justify-between"><span>Temperatura — últimas 8 lecturas</span><span className="text-emerald-600 dark:text-emerald-400 font-medium">ESP32_01</span></div>
                    <div className="flex items-end gap-1.5 h-12">
                      {[62, 75, 68, 80, 71, 85, 78, 90].map((h, i) => (
                        <div key={i}
                          className={`flex-1 rounded-t transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${i === 7 ? 'bg-emerald-500' : 'bg-emerald-100 dark:bg-emerald-900/40'}`}
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl p-1 bg-gradient-to-br from-emerald-500 to-teal-500">
                    <div className="rounded-[calc(1rem-0.25rem)] bg-gradient-to-r from-emerald-500 to-teal-500 p-3 text-white">
                      <div className="text-[10px] font-bold uppercase opacity-80 mb-1">AgroIA recomienda</div>
                      <div className="text-xs font-medium leading-relaxed">
                        Humedad de suelo en 42% — programar riego esta tarde. Pronóstico: cielo despejado, T máx 17°C.
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WaveCanvas />

      <section className="py-28 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <Fade>
            <div className="text-center mb-16">
              <h2 className="text-h2 font-semibold tracking-tight text-gray-900 dark:text-white mb-4">
                {config.ecosystem_title}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
                {config.ecosystem_description}
              </p>
            </div>
          </Fade>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon, title, desc }, i) => (
              <Fade key={title} delay={i * 60}>
                <div className="group h-full rounded-2xl p-1.5 bg-white/60 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:ring-emerald-500/30">
                  <div className="h-full rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-emerald-500 group-hover:text-white group-hover:ring-emerald-500/40">
                      {icon}
                    </div>
                    <h3 className="font-semibold tracking-tight text-gray-900 dark:text-white mb-2 text-sm leading-snug">{title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      <WaveCanvas flip />

      <section className="py-28 px-4 sm:px-6 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto space-y-28">

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Fade>
              <div>
                <h2 className="text-h2 font-semibold tracking-tight text-gray-900 dark:text-white mb-4">
                  ESP32 que funciona<br />hasta sin señal
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                  El ESP32 con DHT11 y FC-28 mide temperatura, humedad del aire y humedad del suelo cada 10 segundos.
                  Sin WiFi guarda 10 lecturas en buffer y las sincroniza al reconectar. El firmware es tuyo, open-source en Arduino C++.
                </p>
                <ul className="space-y-3">
                  {['Lecturas cada 10 s — temperatura + humedad aire + suelo', 'Buffer offline de 10 registros automático', 'Alertas por umbrales configurables por parcela', 'NTP UTC-5, timestamps reales para Perú'].map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                      <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">{I.check}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Fade>
            <Fade fromRight delay={100}>
              <div className="rounded-2xl p-1.5 bg-white/5 ring-1 ring-white/10 shadow-[0_30px_70px_-28px_rgba(16,185,129,0.4)]">
              <div className="rounded-[calc(1rem-0.375rem)] bg-[#04140d] p-6 font-mono text-sm text-emerald-300 leading-7">
                <div className="text-gray-500 text-xs mb-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="ml-2">agroyachay_esp32.ino</span>
                </div>
                <p className="text-gray-500">// Lectura cada 10 s</p>
                <p>float temp = dht.<span className="text-yellow-300">readTemperature</span>();</p>
                <p>float hum  = dht.<span className="text-yellow-300">readHumidity</span>();</p>
                <p>int soil = <span className="text-blue-300">analogRead</span>(<span className="text-orange-300">34</span>);</p>
                <p className="mt-2 text-gray-500">// POST al backend</p>
                <p>String json = <span className="text-amber-300">"&#123;"</span></p>
                <p className="pl-4"><span className="text-amber-300">"temp:"</span> + temp +</p>
                <p className="pl-4"><span className="text-amber-300">", hum:"</span> + hum + <span className="text-amber-300">"&#125;"</span>;</p>
                <p className="mt-2 text-gray-500">// Si sin WiFi → buffer local</p>
                <p><span className="text-blue-300">if</span> (!wifi) buffer.<span className="text-yellow-300">push</span>(json);</p>
              </div>
              </div>
            </Fade>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Fade fromRight>
              <div className="order-2 lg:order-1 space-y-4">
                {[
                  { q: '¿Cuándo riego?',      a: 'Humedad suelo en 42% y sin lluvia prevista 3 días. Riego mañana temprano, 45 min por goteo.' },
                  { q: '¿Qué detectó la IA?', a: 'Phytophthora infestans (tizón tardío) — confianza 87%. Urgencia: 24h. Aplica Metalaxil 1.5 g/L.' },
                  { q: 'Plan esta semana',     a: 'Lun: fertilizar. Mié: riego. Jue: día óptimo para fumigación (viento <10 km/h, sin lluvia).' },
                ].map(msg => (
                  <div key={msg.q} className="rounded-[1.75rem] p-1.5 bg-white/60 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10">
                    <div className="rounded-[calc(1.75rem-0.375rem)] bg-white dark:bg-gray-900/90 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                      <div className="text-[10px] uppercase font-medium text-gray-400 dark:text-gray-500 mb-1">Agricultor</div>
                      <div className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white mb-3">{msg.q}</div>
                      <div className="text-[10px] uppercase font-medium text-emerald-600 dark:text-emerald-400 mb-1">AgroIA</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{msg.a}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Fade>
            <Fade delay={100} fromRight={false}>
              <div className="order-1 lg:order-2">
                <h2 className="text-h2 font-semibold tracking-tight text-gray-900 dark:text-white mb-4">
                  IA que conoce<br />tu campo real
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                  Groq llama-3.3-70b responde consultas agrícolas con contexto de tus cultivos activos, región, datos de sensores y pronóstico del día. No es un chatbot genérico — sabe que tienes Papa en Puno y que el suelo está al 42%.
                </p>
                <ul className="space-y-3">
                  {['Análisis climático con riesgo y alerta fitosanitaria', 'Plan de manejo de plagas con productos y dosis', 'Planificación semanal de actividades por pronóstico', 'Chat libre: cualquier consulta agronómica'].map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                      <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">{I.check}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Fade>
          </div>
        </div>
      </section>

      <WaveCanvas />

      <section className="py-28 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <Fade>
            <div className="text-center mb-16">
              <h2 className="text-h2 font-semibold tracking-tight text-gray-900 dark:text-white">En 4 pasos, control total</h2>
            </div>
          </Fade>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW.map((step, i) => (
              <Fade key={step.n} delay={i * 80}>
                <div className="relative">
                  <div className="font-display text-5xl font-semibold text-emerald-200/70 dark:text-emerald-500/20 leading-none mb-3">{step.n}</div>
                  <div className="w-8 h-1 bg-emerald-500 rounded-full mb-4" />
                  <h3 className="font-semibold tracking-tight text-gray-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      <WaveCanvas flip />

      <section className="py-28 px-4 sm:px-6 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Fade>
              <div>
                <h2 className="text-h2 font-semibold tracking-tight text-gray-900 dark:text-white mb-6">
                  Una plataforma completa,<br />no una app simple
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                  30+ endpoints REST, 14 tablas en PostgreSQL, autenticación JWT, generación de informes server-side, websockets para sensores en tiempo real y módulo de IA con contexto personalizado.
                </p>
                <button onClick={() => onNavigate('acerca')}
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
                  Ver detalles técnicos
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/20 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">{I.arrow}</span>
                </button>
              </div>
            </Fade>

            <Fade fromRight delay={100}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: I.shield, val: '14',    label: 'Tablas PostgreSQL', bg: 'from-emerald-500 to-green-600' },
                  { icon: I.zap,    val: '30+',   label: 'Endpoints REST',    bg: 'from-green-500 to-teal-500' },
                  { icon: I.bar,    val: '4',     label: 'Tipos de informe',  bg: 'from-teal-500 to-cyan-500' },
                  { icon: I.users,  val: '7',     label: 'Áreas de asesoría', bg: 'from-cyan-500 to-blue-500' },
                ].map(stat => (
                  <div key={stat.label} className={`bg-gradient-to-br ${stat.bg} rounded-[1.5rem] p-5 text-white ring-1 ring-white/10`}>
                    <div className="mb-3 opacity-80">{stat.icon}</div>
                    <div className="font-display text-3xl font-semibold mb-1">{stat.val}</div>
                    <div className="text-xs opacity-80 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </Fade>
          </div>
        </div>
      </section>

      <WaveCanvas />

      <section className="relative py-28 px-4 sm:px-6 overflow-hidden bg-[#04140d] text-white">
        <div aria-hidden className="pointer-events-none absolute -top-32 -left-24 w-[30rem] h-[30rem] rounded-full bg-emerald-500/25 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-12rem] right-[-8rem] w-[34rem] h-[34rem] rounded-full bg-teal-400/15 blur-[140px]" />

        <div className="relative max-w-3xl mx-auto text-center">
          <Fade>
            <h2 className="font-display text-h1 font-bold tracking-tight mb-6">
              Conecta tu primer sensor<br />en menos de 10 minutos
            </h2>
            <p className="text-emerald-100/75 text-body-lg mb-10">
              Sin tarjeta de crédito. Sin instalación. Crea tu cuenta, agrega tu parcela y el ESP32 empieza a enviar datos de inmediato.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => navigate('/register')}
                className="group relative inline-flex items-center justify-center h-12 pl-8 pr-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-[0_18px_40px_-12px_rgba(16,185,129,0.7)]">
                Crear cuenta gratis
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                  {I.arrow}
                </span>
              </button>
              <button onClick={() => onNavigate('contactos')}
                className="inline-flex items-center justify-center h-12 px-10 rounded-full ring-1 ring-white/25 text-white text-sm font-semibold backdrop-blur-md hover:bg-white/10 hover:ring-white/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
                Solicitar demo
              </button>
            </div>
          </Fade>
        </div>
      </section>
    </div>
  );
};

export default Inicio;
