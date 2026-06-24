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
  check: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
  x:     <svg width="9"  height="9"  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  arrow: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  handshake: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l1.06 1.06L12 21.23l7.36-7.94 1.06-1.06a5.4 5.4 0 0 0 0-7.65z"/></svg>,
  signal:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor" stroke="none"/></svg>,
  cpu:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></svg>,
  leaf:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M11 20A7 7 0 0 1 4 13c0-3.87 3.13-7 7-7 3.87 0 7 3.13 7 7a7 7 0 0 1-7 7z"/><path d="M11 20c0-4-2-7-7-8" strokeLinecap="round"/></svg>,
};

const PLANS = [
  {
    name: 'Sin sensor',
    price: 'Gratis',
    sub: 'para siempre',
    description: 'Gestiona tu campo sin hardware. Empieza hoy.',
    perfectFor: 'Agricultores que aún no tienen sensor, estudiantes, técnicos agropecuarios.',
    popular: false,
    cta: 'Crear cuenta gratis',
    color: 'hover:border-gray-300 dark:hover:border-gray-600',
    badge: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    badgeLabel: 'Siempre gratis',
    features: [
      { ok: true,  text: 'Hasta 3 parcelas activas' },
      { ok: true,  text: 'Registro de actividades y costos' },
      { ok: true,  text: 'Clima actual y pronóstico 5 días' },
      { ok: true,  text: 'Detección de plagas con IA (10/mes)' },
      { ok: true,  text: 'Calculadora de insumos' },
      { ok: true,  text: 'Almanaque agrícola Bristol' },
      { ok: true,  text: 'Marketplace de insumos' },
      { ok: false, text: 'Monitoreo IoT en tiempo real' },
      { ok: false, text: 'Predicción de cosecha IA' },
      { ok: false, text: 'Asistente AgroIA (chat)' },
      { ok: false, text: 'Informes PDF y Excel' },
    ],
  },
  {
    name: 'Kit AgroYachay',
    price: 'S/ 129',
    sub: 'pago único · 1 año de software incluido',
    description: 'El sensor ESP32 + todo el software por un año. Sin cobros mensuales.',
    perfectFor: 'Cualquier agricultor. Compras el hardware una sola vez y listo.',
    popular: true,
    note: 'Año 2 en adelante: S/ 59/año solo por el software',
    cta: 'Pedir mi kit',
    color: 'hover:border-emerald-400',
    badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    badgeLabel: 'Más vendido',
    hardware: [
      'Microcontrolador ESP32 WROOM-32',
      'Sensor DHT11 (temperatura + humedad aire)',
      'Sensor FC-28 (humedad de suelo)',
      'Cables, resistencias y caja protectora',
      'Firmware preinstalado y probado',
    ],
    features: [
      { ok: true, text: 'Parcelas ilimitadas' },
      { ok: true, text: 'Monitoreo IoT en tiempo real' },
      { ok: true, text: 'Detección de plagas ilimitada con IA' },
      { ok: true, text: 'Predicción de cosecha con ML' },
      { ok: true, text: 'Asistente AgroIA — chat libre' },
      { ok: true, text: 'Informes PDF y Excel ilimitados' },
      { ok: true, text: 'Alertas por umbrales configurables' },
      { ok: true, text: 'Soporte por email (respuesta 24 h)' },
    ],
  },
];

const DIFFERENTIALS = [
  { icon: Ic.handshake, title: 'Sin contratos', desc: 'Mes a mes. Cancela cuando quieras sin penalizaciones ni cargos ocultos.', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', hover: 'hover:border-emerald-400' },
  { icon: Ic.cpu,       title: 'Hardware abierto', desc: 'Usa tu propio ESP32. El firmware es abierto y compatible con cualquier módulo estándar.', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400', hover: 'hover:border-blue-400' },
  { icon: Ic.signal,    title: 'IA funcional', desc: 'Groq llama-3.3-70b + Plant.id v2 + scikit-learn corriendo en producción, no promesas.', color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400', hover: 'hover:border-violet-400' },
  { icon: Ic.leaf,      title: 'Hecho para Perú', desc: 'Diseñado para cultivos andinos — papa, quinua, maíz — en zonas remotas con conectividad intermitente.', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400', hover: 'hover:border-amber-400' },
];

const FAQS = [
  { q: '¿El Kit incluye todo lo necesario para instalar?', a: 'Sí. Viene el ESP32, sensores DHT11 y FC-28, cables y la caja protectora. Solo necesitas una fuente USB 5V (cargador de celular).' },
  { q: '¿Qué pasa después del primer año?', a: 'El hardware es tuyo para siempre. La plataforma web cuesta S/ 59 el segundo año en adelante — solo si quieres seguir usando los módulos de IA e informes.' },
  { q: '¿Puedo usar el plan Gratis sin comprar el sensor?', a: 'Sí. El plan gratuito tiene gestión de cultivos, clima, detección de plagas y calculadora de insumos. Solo pierde el monitoreo IoT en tiempo real.' },
  { q: '¿Cómo recibo el Kit?', a: 'Por ahora escribiéndonos directamente. Enviamos a todo el Perú vía Olva Courier o Serpost. Tiempo de entrega: 3–7 días hábiles.' },
  { q: '¿El firmware del ESP32 es abierto?', a: 'Sí. El código está disponible y puedes compilarlo tú mismo si lo prefieres. El Kit llega con el firmware ya instalado y probado.' },
  { q: '¿Qué formas de pago aceptan?', a: 'Yape, Plin, transferencia bancaria BCP/Interbank. Emitimos comprobante de pago electrónico.' },
];

const Planes = ({ onNavigate }) => {

  return (
    <div className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">

      {/* HERO */}
      <section className="relative min-h-[calc(100dvh-4rem)] flex items-center overflow-hidden bg-[#04140d]">
        <div aria-hidden className="pointer-events-none absolute -top-40 -left-32 w-[34rem] h-[34rem] rounded-full bg-emerald-500/25 blur-[130px]" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-12rem] right-[-8rem] w-[38rem] h-[38rem] rounded-full bg-teal-400/15 blur-[150px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            <div className="animate-slide-up">
              <h1 className="font-display text-display font-bold tracking-tight text-white leading-[1.05]">
                Compras el sensor.<br />
                <span className="text-emerald-300">El software va incluido.</span>
              </h1>
              <p className="mt-6 text-base sm:text-lg leading-relaxed text-emerald-100/70 max-w-lg">
                Sin suscripciones. Sin cobros mensuales. El Kit AgroYachay incluye
                el hardware ESP32 listo para instalar y un año completo de plataforma.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => window.location.href = '/register'}
                  className="group relative h-12 pl-7 pr-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-[0_12px_30px_-10px_rgba(16,185,129,0.7)] inline-flex items-center justify-center">
                  Comenzar gratis
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                    {Ic.arrow}
                  </span>
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('contactos')}
                  className="h-12 px-8 rounded-full ring-1 ring-white/15 text-emerald-50 text-sm font-medium bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] inline-flex items-center justify-center">
                  Hablar con ventas
                </button>
              </div>
            </div>

            <Fade fromRight>
              <div className="rounded-2xl p-1.5 bg-white/10 ring-1 ring-white/15 shadow-[0_24px_60px_-24px_rgba(16,185,129,0.4)]">
                <div className="rounded-[calc(1rem-0.375rem)] bg-[#061a11]/90 px-7 py-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                  <div className="flex items-center gap-2.5 mb-6">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-[10px] uppercase text-emerald-200/80 font-medium">Kit AgroYachay incluye</p>
                  </div>
                  <ul className="space-y-3">
                    {[
                      '5 parcelas activas simultáneas',
                      'Monitoreo IoT en tiempo real con tu ESP32',
                      'Detección de plagas ilimitada con Plant.id',
                      'Predicción de cosecha con ML (scikit-learn)',
                      'Asistente AgroIA — chat con Llama 3.3 70B',
                      'Informes PDF y Excel ilimitados',
                      'Alertas por umbrales de temperatura y humedad',
                      'Marketplace de insumos agrícolas',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-emerald-50/90">
                        <span className="shrink-0 mt-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 ring-1 ring-emerald-300/20 text-emerald-300">
                          {Ic.check}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-7 pt-5 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-emerald-100/40">14 días de prueba gratis incluidos</span>
                    <span className="text-emerald-300 font-semibold text-2xl tracking-tight">S/ 129<span className="text-xs font-normal text-emerald-100/40 ml-1">pago único</span></span>
                  </div>
                </div>
              </div>
            </Fade>
          </div>
        </div>
      </section>

      <WaveCanvas />

      {/* PLANES */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <Fade>
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="font-display text-h1 font-bold tracking-tight text-gray-900 dark:text-white">
                Tres planes, un solo objetivo.
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-4">
                Empieza gratis y escala cuando tu campo lo necesite. Sin migraciones complicadas.
              </p>
            </div>
          </Fade>

          <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {PLANS.map((plan, i) => (
              <Fade key={plan.name} delay={i * 100} fromRight={i === 1}>
                <div className={`group relative rounded-2xl p-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 ${
                  plan.popular
                    ? 'bg-emerald-500/10 ring-1 ring-emerald-500/40 shadow-[0_24px_60px_-24px_rgba(16,185,129,0.35)]'
                    : 'bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10'
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="rounded-full px-3 py-1 text-[10px] uppercase font-medium text-white bg-emerald-600 shadow-[0_8px_20px_-8px_rgba(16,185,129,0.8)]">
                        Más elegido
                      </span>
                    </div>
                  )}

                  <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-display text-lg font-semibold tracking-tight text-gray-900 dark:text-white">{plan.name}</h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{plan.description}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] uppercase font-medium ${plan.badge}`}>
                        {plan.badgeLabel}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white leading-none">
                        {plan.price}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{plan.sub}</p>
                    {plan.note && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">
                        {plan.note}
                      </p>
                    )}

                    <div className="mt-5 mb-6 px-4 py-3 rounded-2xl bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10">
                      <p className="text-[10px] font-medium text-gray-400 uppercase mb-1">Perfecto para</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{plan.perfectFor}</p>
                    </div>

                    {plan.hardware && (
                      <>
                        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2">
                          <span className="text-emerald-500">{Ic.cpu}</span>
                          Hardware incluido
                        </p>
                        <ul className="space-y-2 mb-5">
                          {plan.hardware.map((h, j) => (
                            <li key={j} className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-400">
                              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              {h}
                            </li>
                          ))}
                        </ul>
                        <div className="h-px bg-gray-200/70 dark:bg-white/10 mb-5" />
                        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase mb-3">Software 1 año incluido</p>
                      </>
                    )}

                    {!plan.hardware && (
                      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase mb-3">Incluye</p>
                    )}

                    <ul className="space-y-2.5 mb-8">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-3">
                          <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                            f.ok
                              ? 'bg-emerald-500/15 ring-1 ring-emerald-300/20 text-emerald-500 dark:text-emerald-300'
                              : 'bg-gray-100 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 text-gray-300 dark:text-gray-600'
                          }`}>
                            {f.ok ? Ic.check : Ic.x}
                          </span>
                          <span className={`text-sm ${
                            f.ok ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'
                          }`}>{f.text}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() => {
                        if (plan.name === 'Kit AgroYachay') onNavigate && onNavigate('contactos');
                        else window.location.href = '/register';
                      }}
                      className={`group/cta relative w-full h-12 rounded-full text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] flex items-center justify-center ${
                        plan.popular
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_12px_30px_-10px_rgba(16,185,129,0.7)]'
                          : 'ring-1 ring-black/8 dark:ring-white/12 text-gray-700 dark:text-gray-100 bg-white dark:bg-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.08]'
                      }`}
                    >
                      <span>{plan.cta}</span>
                      <span className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/cta:translate-x-0.5 ${
                        plan.popular ? 'bg-white/15 text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                      }`}>
                        {Ic.arrow}
                      </span>
                    </button>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      <WaveCanvas flip />

      {/* DIFERENCIALES */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <Fade>
            <div className="mb-16 max-w-2xl">
              <h2 className="font-display text-h1 font-bold tracking-tight text-gray-900 dark:text-white">
                Tecnología real. Precio justo.
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-4">
                No vendemos promesas. Cada feature del sistema está funcionando en producción,
                con código fuente que puedes auditar.
              </p>
            </div>
          </Fade>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DIFFERENTIALS.map(({ icon, title, desc, color }, i) => (
              <Fade key={title} delay={i * 70}>
                <div className="group h-full rounded-2xl p-1.5 bg-gray-50/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
                  <div className="h-full rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-5 ring-1 ring-black/5 dark:ring-white/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105`}>
                      {icon}
                    </div>
                    <h3 className="font-display font-semibold tracking-tight text-gray-900 dark:text-white mb-2.5 leading-snug">{title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      <WaveCanvas />

      {/* FAQ */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <Fade>
            <div className="mb-14 max-w-2xl">
              <h2 className="font-display text-h1 font-bold tracking-tight text-gray-900 dark:text-white">
                Todo lo que necesitas saber
              </h2>
            </div>
          </Fade>

          <div className="grid sm:grid-cols-2 gap-4">
            {FAQS.map((faq, i) => (
              <Fade key={i} delay={i * 50} fromRight={i % 2 === 1}>
                <div className="group h-full rounded-2xl p-1.5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
                  <div className="h-full rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/15 ring-1 ring-emerald-300/20 text-emerald-600 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <h3 className="font-semibold tracking-tight text-sm text-gray-900 dark:text-white">{faq.q}</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed pl-11">{faq.a}</p>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      <WaveCanvas flip />

      {/* CTA FINAL */}
      <section className="relative overflow-hidden py-24 lg:py-28 px-4 sm:px-6 bg-[#04140d] text-white">
        <div aria-hidden className="pointer-events-none absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-emerald-500/25 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-10rem] right-[-6rem] w-[32rem] h-[32rem] rounded-full bg-teal-400/15 blur-[140px]" />

        <div className="relative max-w-3xl mx-auto text-center">
          <Fade>
            <h2 className="font-display text-display font-bold tracking-tight leading-[1.05]">
              ¿Listo para empezar?<br />Tu campo te espera.
            </h2>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-emerald-100/70 max-w-xl mx-auto">
              Crea tu cuenta gratis, registra tu primera parcela y empieza a ver datos reales hoy mismo. Sin compromiso.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/register'}
                className="group relative h-12 pl-8 pr-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-[0_12px_30px_-10px_rgba(16,185,129,0.7)] inline-flex items-center justify-center">
                Comenzar gratis ahora
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                  {Ic.arrow}
                </span>
              </button>
              <button
                onClick={() => onNavigate && onNavigate('contactos')}
                className="h-12 px-10 rounded-full ring-1 ring-white/15 text-emerald-50 text-sm font-medium bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] inline-flex items-center justify-center">
                Hablar con ventas
              </button>
            </div>
          </Fade>
        </div>
      </section>
    </div>
  );
};

export default Planes;
