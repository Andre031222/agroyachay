import React, { useRef, useEffect, useState } from 'react';
import { WaveCanvas } from './Landing';

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

const SERVICES = [
  {
    id: 'cultivos', title: 'Gestión de Cultivos', badge: 'Core',
    color: 'hover:border-emerald-400 hover:shadow-emerald-50', icon: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    summary: 'Ciclo completo de 10 cultivos desde la siembra hasta la cosecha.',
    desc: 'Registra parcelas con GPS, tipo de cultivo y fechas clave. El sistema lleva historial de actividades, insumos con costos y proyecciones automáticas.',
    details: ['10 cultivos: Papa, Maíz, Trigo, Soja, Arroz, Tomate, Quinua, Oca, Habas, Otro','6 estados: Planificado → Cosechado','Actividades con fecha, tipo, costo','Insumos: NPK, agua, pesticidas, semillas','Estadísticas de rendimiento histórico'],
    api: 'GET/POST/PUT/DELETE /api/cultivos',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/><path d="M12 6v6l4 2" strokeLinecap="round"/><path d="M8 14c0 2.2 1.8 4 4 4s4-1.8 4-4" strokeLinecap="round"/></svg>,
  },
  {
    id: 'iot', title: 'Monitoreo IoT ESP32', badge: 'Hardware',
    color: 'hover:border-cyan-400 hover:shadow-cyan-50', icon: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
    summary: 'Lecturas automáticas de temperatura, humedad de aire y suelo cada 10 s.',
    desc: 'ESP32 + DHT11 + FC-28 enviando datos al backend. Alertas automáticas por umbrales, buffer offline de 10 lecturas y gráficos históricos de 7 días.',
    details: ['ESP32 DevKit + DHT11 + FC-28','Frecuencia: cada 10 segundos','Buffer offline: 10 lecturas sin WiFi','Alertas por temperatura y humedad','Gráficos históricos de 7 días'],
    api: 'POST /api/sensores/lectura · GET /api/sensores/historico',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a4 4 0 0 1 8 0v2" strokeLinecap="round"/><circle cx="12" cy="13" r="2" fill="currentColor" stroke="none"/><path d="M9 10.5A4.5 4.5 0 0 0 7.5 13M15 10.5A4.5 4.5 0 0 1 16.5 13" strokeLinecap="round"/></svg>,
  },
  {
    id: 'clima', title: 'Clima + Plan Semanal IA', badge: 'IA · OpenWeather',
    color: 'hover:border-blue-400 hover:shadow-blue-50', icon: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    summary: 'Pronóstico en tiempo real con análisis IA para planificar actividades.',
    desc: 'OpenWeather + Groq llama-3.3-70b. Cruza pronóstico de 5 días con cultivos activos y genera nivel de riesgo, actividad óptima y plan semanal.',
    details: ['Clima actual: temperatura, humedad, viento','Pronóstico cada 3 h durante 5 días','Análisis IA: riesgo bajo/medio/alto/crítico','Recomendaciones de riego del día','Alerta fitosanitaria si el clima favorece plagas'],
    api: 'GET /api/clima/actual · POST /api/clima/plan-semanal',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M17 18a5 5 0 0 0-10 0" strokeLinecap="round"/><path d="M12 2v2M4.22 4.22l1.42 1.42M1 12h2M22 12h-2M18.36 5.64l-1.42 1.42" strokeLinecap="round"/><path d="M12 6a6 6 0 0 1 6 6" strokeLinecap="round"/></svg>,
  },
  {
    id: 'plagas', title: 'Detección de Plagas IA', badge: 'Plant.id v2',
    color: 'hover:border-rose-400 hover:shadow-rose-50', icon: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
    summary: 'Identifica enfermedades enviando una foto desde el campo.',
    desc: 'Plant.id v2 identifica la enfermedad con porcentaje de confianza. Groq genera el plan de manejo: urgencia, productos con dosis y alternativa orgánica.',
    details: ['Plant.id v2 Health Assessment API','Confianza en porcentaje','Severidad: leve / moderada / severa','Urgencia: inmediata / 24h / semana / monitorear','Historial por cultivo con imágenes archivadas'],
    api: 'POST /api/plagas/detectar · POST /api/plagas/consejo-ia',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" strokeLinecap="round"/><path d="M12 8v4M12 15h.01" strokeLinecap="round"/></svg>,
  },
  {
    id: 'prediccion', title: 'Predicción de Cosecha', badge: 'Machine Learning',
    color: 'hover:border-violet-400 hover:shadow-violet-50', icon: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
    summary: 'Estima rendimiento en kg/ha y rentabilidad proyectada con scikit-learn.',
    desc: 'Random Forest analiza área, tipo de cultivo, historial de actividades y lecturas IoT para proyectar el rendimiento y los ingresos a precio de mercado.',
    details: ['Modelo Random Forest — scikit-learn 1.3','Variables: área, cultivo, actividades, IoT','Salida: kg/ha + intervalo de confianza','Proyección de ingresos a precio local','Historial de predicciones vs resultados reales'],
    api: 'POST /api/prediccion/calcular · GET /api/prediccion/historial',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    id: 'asesoria', title: 'Asesoría Especializada', badge: 'Sistema de Tickets',
    color: 'hover:border-amber-400 hover:shadow-amber-50', icon: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    summary: '7 especialidades con seguimiento por estado y prioridad.',
    desc: 'Sistema de tickets agronómicos. El usuario describe el problema y elige especialidad y prioridad. El administrador responde con notificación por email.',
    details: ['7 especialidades agronómicas','4 niveles de prioridad','4 estados: Pendiente → Resuelta','Notificaciones por email al crear/responder'],
    api: 'POST /api/asesoria/solicitar · GET /api/asesoria/mis-solicitudes',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round"/><path d="M8 10h8M8 14h5" strokeLinecap="round"/></svg>,
  },
  {
    id: 'marketplace', title: 'Marketplace de Insumos', badge: 'Catálogo',
    color: 'hover:border-teal-400 hover:shadow-teal-50', icon: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
    summary: 'Catálogo de semillas, fertilizantes y equipos con precios referenciales.',
    desc: 'Directorio de productos agrícolas con enlace a MercadoLibre o Amazon. 5 categorías, 12 productos base y módulo de scraping para actualización automática.',
    details: ['5 categorías de insumos','Precio referencial por plataforma','12 productos pre-cargados','Filtrado por categoría y búsqueda'],
    api: 'GET /api/marketplace/productos',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" strokeLinecap="round"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0" strokeLinecap="round"/></svg>,
  },
  {
    id: 'informes', title: 'Informes PDF / Excel', badge: 'Reportes',
    color: 'hover:border-orange-400 hover:shadow-orange-50', icon: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    summary: '4 tipos de informe con gráficos reales generados en el servidor.',
    desc: 'ReportLab (PDF) + OpenPyXL (Excel) + Matplotlib para gráficos reales de sensores, cultivos y finanzas. Quedan archivados para descarga en cualquier momento.',
    details: ['Dashboard Ejecutivo','Estado de Cultivos con actividades','Análisis Financiero: costos e ingresos','Impacto Climático: correlación clima-rendimiento'],
    api: 'POST /api/informes/generar · GET /api/informes/mis-informes',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  },
  {
    id: 'insumos', title: 'Calculadora de Insumos', badge: 'Utilidad',
    color: 'hover:border-lime-400 hover:shadow-lime-50', icon: 'bg-lime-50 dark:bg-lime-900/20 text-lime-600 dark:text-lime-400',
    summary: 'Calcula fertilizante, agua y pesticidas exactos por hectárea.',
    desc: 'Ingresa área, tipo de cultivo y requerimientos. El sistema calcula dosis, costos y registra el uso real en el historial por temporada.',
    details: ['NPK, Agua, Pesticida, Herbicida, Semillas','Cálculo por hectárea + conversión de unidades','Costo unitario y total del tratamiento','Historial de aplicaciones por cultivo'],
    api: 'GET/POST /api/insumos',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>,
  },
  {
    id: 'asistente', title: 'Asistente AgroIA', badge: 'Groq LLM',
    color: 'hover:border-emerald-400 hover:shadow-emerald-50', icon: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    summary: 'Chat libre con Llama 3.3 70B especializado en agricultura peruana.',
    desc: 'Consulta en lenguaje natural sobre riego, plagas, siembra o cualquier tema agrícola. Tiene contexto de tus cultivos, región y datos de sensores en tiempo real.',
    details: ['llama-3.3-70b-versatile vía Groq API','Contexto: cultivos activos, región, temperatura','Respuestas en español con dosis y productos locales','Plan semanal según pronóstico de 5 días'],
    api: 'POST /api/asistente/consulta',
    svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h8M8 14h4" strokeLinecap="round"/></svg>,
  },
];

const Servicios = ({ onNavigate }) => {
  const [selected, setSelected] = useState(null);

  return (
    <div className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative min-h-[calc(100dvh-4rem)] flex items-center overflow-hidden bg-gray-50 dark:bg-gray-950">
        <div aria-hidden className="pointer-events-none absolute -top-32 -left-24 w-[34rem] h-[34rem] rounded-full bg-emerald-500/15 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-12rem] right-[-8rem] w-[40rem] h-[40rem] rounded-full bg-teal-400/10 blur-[140px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            <div className="animate-slide-up">
              <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl font-bold leading-[1.05] tracking-tight text-gray-900 dark:text-white">
                Un sistema.<br />
                <span className="text-emerald-600 dark:text-emerald-300">Sin nada genérico.</span>
              </h1>
              <p className="mt-6 text-base sm:text-lg leading-relaxed text-gray-500 dark:text-gray-400 max-w-lg">
                Cada módulo está conectado con los demás. Los datos de sensores alimentan las predicciones,
                el clima informa las alertas y el asistente IA tiene contexto real de tu campo.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => window.location.href = '/register'}
                  className="group relative h-12 pl-7 pr-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-[0_12px_30px_-10px_rgba(16,185,129,0.7)] flex items-center justify-center"
                >
                  <span>Crear cuenta gratis</span>
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                    <Arrow />
                  </span>
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('planes')}
                  className="h-12 px-8 rounded-full ring-1 ring-black/10 dark:ring-white/15 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08] hover:ring-emerald-500/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] flex items-center justify-center"
                >
                  Ver planes
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
                      <p className="font-semibold text-xs tracking-tight text-gray-900 dark:text-white leading-snug">{s.title}</p>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{s.badge}</span>
                    </div>
                  </button>
                ))}
              </div>
            </Fade>
          </div>
        </div>
      </section>

      <WaveCanvas />

      {/* ── Módulos ──────────────────────────────────────────── */}
      <section className="relative py-20 lg:py-28 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute top-1/4 -right-32 w-[30rem] h-[30rem] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="relative max-w-7xl mx-auto">
          <Fade>
            <div className="mb-14 max-w-2xl">
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                Explora cada módulo
              </h2>
              <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
                Haz clic en cualquier tarjeta para ver capacidades detalladas, la API que la alimenta y los datos que genera.
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
                      <p className="font-semibold text-sm tracking-tight text-gray-900 dark:text-white mb-2 leading-snug">{s.title}</p>
                      <span className="inline-block text-[10px] uppercase tracking-[0.15em] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/15 px-2 py-0.5 rounded-full mb-3">{s.badge}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{s.summary}</p>
                    </div>
                  </button>
                </Fade>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Detalle del módulo seleccionado ──────────────────── */}
      {selected && (
        <section className="pb-10 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-2xl p-1.5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 animate-fade-in">
              <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 overflow-hidden">
                <div className="flex items-center justify-between px-7 py-5 border-b border-black/5 dark:border-white/10">
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-xl ${selected.icon}`}>{selected.svg}</div>
                    <div>
                      <h3 className="font-semibold tracking-tight text-gray-900 dark:text-white">{selected.title}</h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{selected.badge}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} aria-label="Cerrar detalle" className="p-2 rounded-full ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.06] text-gray-400 hover:text-emerald-500 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-black/5 dark:divide-white/10">
                  <div className="p-7">
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">{selected.desc}</p>
                    <p className="text-[10px] uppercase font-medium text-gray-400 dark:text-gray-500 mb-2">Endpoint API</p>
                    <code className="block bg-[#04140d] text-emerald-300 text-xs px-4 py-3 rounded-xl font-mono break-all ring-1 ring-emerald-500/15">{selected.api}</code>
                  </div>
                  <div className="p-7">
                    <p className="text-[10px] uppercase font-medium text-gray-400 dark:text-gray-500 mb-4">Capacidades específicas</p>
                    <ul className="space-y-2.5">
                      {selected.details.map((d, i) => (
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

      {/* ── Arquitectura integrada ───────────────────────────── */}
      <section className="relative py-20 lg:py-28 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-teal-400/10 blur-[130px]" />
        <div className="relative max-w-7xl mx-auto">
          <Fade>
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                Los módulos se hablan entre sí
              </h2>
              <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
                El valor real no está en los módulos por separado, sino en la red de datos que forman juntos.
              </p>
            </div>
          </Fade>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { n: '1', title: 'Sensores → Predicción', desc: 'Las lecturas del ESP32 son variables de entrada del modelo Random Forest para estimar el rendimiento del cultivo con mayor precisión.', color: 'hover:border-cyan-400 hover:shadow-cyan-50' },
              { n: '2', title: 'Clima → Alertas automáticas', desc: 'Groq cruza el pronóstico de 5 días con tus cultivos activos y dispara alertas fitosanitarias y planes de riego automáticamente.', color: 'hover:border-blue-400 hover:shadow-blue-50' },
              { n: '3', title: 'Plagas → Insumos → Informe', desc: 'La detección sugiere productos, se registran en la calculadora de insumos y el costo aparece en el informe de rentabilidad PDF.', color: 'hover:border-emerald-400 hover:shadow-emerald-50' },
            ].map((item, i) => (
              <Fade key={item.n} delay={i * 80}>
                <div className="group rounded-2xl p-1.5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 hover:ring-emerald-500/30 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 h-full">
                  <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-6 h-full">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center mb-5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 shadow-[0_10px_24px_-10px_rgba(16,185,129,0.7)]">
                      {item.n}
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

      {/* ── Métricas ─────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { value: '10',  label: 'módulos integrados',  sub: 'conectados entre sí' },
              { value: '14',  label: 'tablas PostgreSQL',   sub: 'modelo de datos completo' },
              { value: '40+', label: 'endpoints REST',      sub: 'API documentada' },
              { value: '3',   label: 'APIs externas',       sub: 'Groq · Plant.id · OpenWeather' },
            ].map((s, i) => (
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

      {/* ── CTA final (panel oscuro) ─────────────────────────── */}
      <section className="px-4 sm:px-6 py-20 lg:py-28 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-[#04140d] text-white px-6 sm:px-12 py-16 sm:py-20 ring-1 ring-white/10">
            <div aria-hidden className="pointer-events-none absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-emerald-500/25 blur-[120px]" />
            <div aria-hidden className="pointer-events-none absolute bottom-[-10rem] right-[-6rem] w-[32rem] h-[32rem] rounded-full bg-teal-400/15 blur-[140px]" />

            <div className="relative max-w-2xl mx-auto text-center">
              <Fade>
                <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl font-bold leading-[1.05] tracking-tight">
                  ¿Listo para conectar<br />tu primer sensor?
                </h2>
                <p className="mt-5 text-base sm:text-lg leading-relaxed text-emerald-100/70 max-w-xl mx-auto">
                  Configura tu parcela y empieza a recibir datos en tiempo real en menos de 10 minutos. Sin tarjeta, sin contratos.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => window.location.href = '/register'}
                    className="group relative h-12 pl-8 pr-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#04140d] text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-[0_12px_30px_-10px_rgba(16,185,129,0.8)] flex items-center justify-center"
                  >
                    <span>Crear cuenta gratis</span>
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                      <Arrow />
                    </span>
                  </button>
                  <button
                    onClick={() => onNavigate && onNavigate('planes')}
                    className="h-12 px-9 rounded-full ring-1 ring-white/25 text-white text-sm font-semibold bg-white/5 hover:bg-white/10 hover:ring-white/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] flex items-center justify-center"
                  >
                    Ver planes y precios
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
