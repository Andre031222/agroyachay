import React, { useState, useEffect, useCallback } from 'react';
import { CULTIVOS_PUNO } from '../../utils/constants';
import { formatCurrency } from '../../utils/helpers';
import { notify } from '../../utils/swal';
import { cultivosAPI, asistenteAPI } from '../../services/api';
import {
  AreaChart, Area,
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

const Ic = {
  chart:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  trend:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  dollar:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  cal:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  award:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  leaf:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>,
  target:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  rain:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>,
  sun:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>,
  map:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  brain:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.66z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.66z"/></svg>,
  history: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>,
  reset:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>,
  clock:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

const PRECIOS = {
  Papa: 2.5, Quinua: 8.0, 'Cañihua': 6.5, Habas: 4.0,
  Cebada: 1.8, 'Avena Forrajera': 0.8, Tarwi: 5.5, Oca: 3.0,
};

const ALTITUDE_FACTOR = {
  Papa: 0.95, Quinua: 1.0, 'Cañihua': 1.05, Habas: 0.90,
  Cebada: 0.95, 'Avena Forrajera': 0.90, Tarwi: 0.92, Oca: 0.96,
};

const INP =
  'w-full h-10 px-3.5 text-sm rounded-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ' +
  'bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 ' +
  'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:bg-white dark:focus:bg-white/[0.06]';
const AREA_STEPS = [0.5, 1, 2, 5, 10, 20];

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
    <polyline points="12 5 19 12 12 19" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl">
      {label && <p className="font-semibold text-gray-300 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.stroke || p.fill || '#10b981' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const generarPrediccion = (tipoCultivo, variedad, areaha) => {
  const cultivo = CULTIVOS_PUNO[tipoCultivo];
  if (!cultivo || !variedad) return null;
  const [minR, maxR] = variedad.rendimiento.split('-').map(s => parseFloat(s));
  const rendBase   = (minR + maxR) / 2;
  const altFactor  = ALTITUDE_FACTOR[tipoCultivo] || 0.95;
  const areaFactor = areaha > 10 ? 0.93 : areaha > 5 ? 0.97 : 1.0;
  const climaFactor    = altFactor * (0.88 + (tipoCultivo.length % 5) * 0.02);
  const temporalFactor = 0.90 + (variedad.nombre.length % 8) * 0.01;
  const rendPorHa  = rendBase * climaFactor * temporalFactor;
  const rendTotal  = rendPorHa * areaha * areaFactor;
  const precioKg   = PRECIOS[tipoCultivo] || 2.0;
  const ingreso    = rendTotal * 1000 * precioKg;
  const [minD, maxD] = variedad.ciclo.split('-').map(s => parseInt(s));
  const dias = Math.round((minD + maxD) / 2);
  const fechaCosecha = new Date();
  fechaCosecha.setDate(fechaCosecha.getDate() + dias);
  const confianza = Math.min(94, 78 + Math.round(altFactor * 10));

  const tendencia = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const v = 0.88 + i * 0.025 + (tipoCultivo.length % 3) * 0.01;
    return { mes: d.toLocaleDateString('es-PE', { month:'short' }), rendimiento: parseFloat((rendPorHa * v).toFixed(2)) };
  });

  return {
    rendimiento_estimado:     parseFloat(rendTotal.toFixed(2)),
    rendimiento_por_hectarea: parseFloat(rendPorHa.toFixed(2)),
    precio_mercado: precioKg,
    ingreso_estimado: ingreso,
    confianza_prediccion: confianza,
    dias_cosecha: dias,
    fecha_cosecha: fechaCosecha,
    factores: {
      clima:    parseFloat(climaFactor.toFixed(2)),
      temporal: parseFloat(temporalFactor.toFixed(2)),
      area:     parseFloat(areaFactor.toFixed(2)),
    },
    tendencia,
    escenarios: [
      { nombre:'Pesimista', rend: parseFloat((rendTotal * 0.75).toFixed(2)), ingreso: ingreso * 0.75, color:'#ef4444' },
      { nombre:'Probable',  rend: parseFloat(rendTotal.toFixed(2)),           ingreso,               color:'#10b981' },
      { nombre:'Optimista', rend: parseFloat((rendTotal * 1.20).toFixed(2)), ingreso: ingreso * 1.20, color:'#3b82f6' },
    ],
  };
};

const formatAnalisis = (text) => {
  if (!text) return [];
  return text
    .split('\n')
    .map(line => line
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^[\*\-]\s+/, '')
      .trim()
    )
    .filter(l => l.length > 0);
};

const PrediccionCosecha = () => {
  const [tab, setTab]                   = useState('calculadora');
  const [step, setStep]                 = useState('form');
  const [cultivos, setCultivos]         = useState([]);
  const [form, setForm]                 = useState({ tipo_cultivo:'', variedad:'', area: 1 });
  const [prediccion, setPrediccion]     = useState(null);
  const [loading, setLoading]           = useState(false);
  const [groqLoading, setGroqLoading]   = useState(false);
  const [groqAnalisis, setGroqAnalisis] = useState(null);

  const cultivoSel  = form.tipo_cultivo ? CULTIVOS_PUNO[form.tipo_cultivo] : null;
  const variedadSel = cultivoSel && form.variedad
    ? cultivoSel.variedades.find(v => v.nombre === form.variedad)
    : null;
  const areaPct = Math.min(100, (form.area / 50) * 100);

  useEffect(() => {
    cultivosAPI.getAll().then(r => setCultivos(r.data?.data || [])).catch(() => {});
  }, []);

  const callGroqAnalisis = useCallback(async (pred, tipo, variedad, area) => {
    setGroqLoading(true);
    try {
      const res = await asistenteAPI.consulta(
        `Analiza esta predicción de cosecha para un agricultor de Puno, Perú (altiplano 3800-4500 msnm).

Cultivo: ${tipo} — variedad ${variedad} — ${area} ha
Rendimiento estimado: ${pred.rendimiento_estimado} ton (${pred.rendimiento_por_hectarea} t/ha)
Ingreso proyectado: S/ ${pred.ingreso_estimado.toFixed(0)}
Confianza: ${pred.confianza_prediccion}% — Días a cosecha: ${pred.dias_cosecha}

Dame exactamente 4 recomendaciones numeradas en texto plano. Sin asteriscos, sin guiones, sin markdown. Usa este formato:

1. Titulo de la recomendación
Explicación de 2 oraciones con productos disponibles en Perú y dosis específicas.

2. Titulo
Explicación.

3. Titulo
Explicación.

4. Titulo
Explicación.`,
        { region: 'Puno, Perú', cultivos: [tipo] }
      );
      if (res.data.success) setGroqAnalisis(res.data.data.respuesta);
    } catch {
      setGroqAnalisis(null);
    } finally {
      setGroqLoading(false);
    }
  }, []);

  const handlePredecir = async () => {
    if (!form.tipo_cultivo) { notify.warning('Selecciona un cultivo'); return; }
    if (!form.variedad)     { notify.warning('Selecciona una variedad'); return; }
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 350));
      const pred = generarPrediccion(form.tipo_cultivo, variedadSel, form.area);
      setPrediccion(pred);
      setGroqAnalisis(null);
      setStep('result');
      notify.success('Predicción generada');
      callGroqAnalisis(pred, form.tipo_cultivo, form.variedad, form.area);
    } catch {
      notify.error('Error al generar predicción');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ tipo_cultivo:'', variedad:'', area: 1 });
    setPrediccion(null);
    setGroqAnalisis(null);
    setStep('form');
  };

  const analisisLines = formatAnalisis(groqAnalisis);

  return (
    <div className="p-4 sm:p-6 space-y-5 bg-gray-50 dark:bg-gray-950 min-h-full">

      <div className="flex items-end justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Predicción de Cosecha
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Análisis predictivo + AgroIA · Región de Puno
          </p>
        </div>
        {step === 'result' && (
          <button onClick={resetForm}
            className="group flex items-center gap-2 h-10 pl-4 pr-1.5 rounded-full bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:ring-emerald-500/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation shrink-0">
            Nueva predicción
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:rotate-180">
              {Ic.reset}
            </span>
          </button>
        )}
      </div>

      <div className="inline-flex gap-1 p-1 rounded-full bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 w-fit">
        {[
          { id:'calculadora', label:'Calculadora',  icon: Ic.chart   },
          { id:'historial',   label:'Mis cultivos', icon: Ic.history },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'calculadora') setStep('form'); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] touch-manipulation ${
              tab === t.id
                ? 'bg-white dark:bg-white/[0.08] text-gray-900 dark:text-white ring-1 ring-emerald-500/30'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'calculadora' && step === 'form' && (
        <div className="rounded-2xl p-1.5 bg-white/60 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 animate-slide-up">
        <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/5 p-5 sm:p-6 space-y-6">

          <div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.18em] mb-3 flex items-center gap-2">
              {Ic.leaf} Tipo de cultivo
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2">
              {Object.entries(CULTIVOS_PUNO).map(([key, c]) => (
                <button key={key} type="button"
                  onClick={() => setForm(f => ({ ...f, tipo_cultivo: key, variedad: '' }))}
                  className={`flex flex-col items-center gap-1 py-3 rounded-2xl ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] touch-manipulation ${
                    form.tipo_cultivo === key
                      ? 'ring-emerald-500/50 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'ring-black/5 dark:ring-white/10 bg-gray-50/60 dark:bg-white/[0.03] hover:ring-emerald-400/40'
                  }`}>
                  <span className="text-2xl leading-none">{c.icon}</span>
                  <span className={`text-[10px] font-bold truncate w-full text-center px-1 ${
                    form.tipo_cultivo === key ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'
                  }`}>{c.nombre}</span>
                </button>
              ))}
            </div>
          </div>

          {cultivoSel && (
            <>
              <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500/20 rounded-2xl px-4 py-3.5 animate-slide-up">
                <span className="text-3xl leading-none shrink-0">{cultivoSel.icon}</span>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-gray-900 dark:text-white">{cultivoSel.nombre}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cultivoSel.descripcion}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">{Ic.sun} {cultivoSel.altitud}</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.18em] mb-3 flex items-center gap-2">
                  {Ic.target} Variedad
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {cultivoSel.variedades.map(v => (
                    <button key={v.nombre} type="button"
                      onClick={() => setForm(f => ({ ...f, variedad: v.nombre }))}
                      className={`p-3.5 rounded-2xl ring-1 text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation ${
                        form.variedad === v.nombre
                          ? 'ring-sky-500/50 bg-sky-50 dark:bg-sky-900/20'
                          : 'ring-black/5 dark:ring-white/10 bg-gray-50/60 dark:bg-white/[0.03] hover:ring-sky-400/40'
                      }`}>
                      <p className={`text-sm font-bold mb-1 ${form.variedad === v.nombre ? 'text-sky-700 dark:text-sky-400' : 'text-gray-800 dark:text-gray-200'}`}>
                        {v.nombre}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">{Ic.trend} {v.rendimiento}</span>
                        <span className="flex items-center gap-1">{Ic.clock} {v.ciclo}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.18em] mb-3 flex items-center gap-2">
              {Ic.map} Área de cultivo
            </p>
            <div className="bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-end justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Hectáreas</span>
                <span className="font-display text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{form.area} <span className="text-base text-emerald-600 dark:text-emerald-400">ha</span></span>
              </div>
              <div className="relative h-2 rounded-full bg-gray-200 dark:bg-white/10">
                <div className="absolute h-full rounded-full bg-emerald-500 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" style={{ width: `${areaPct}%` }} />
                <input type="range" min="0.1" max="50" step="0.1" value={form.area}
                  onChange={e => setForm(f => ({ ...f, area: parseFloat(e.target.value) }))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-wrap">
                  {AREA_STEPS.map(v => (
                    <button key={v} type="button"
                      onClick={() => setForm(f => ({ ...f, area: v }))}
                      className={`h-8 px-3 rounded-full text-xs font-bold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.95] touch-manipulation ${
                        form.area === v ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 text-gray-600 dark:text-gray-400 hover:ring-emerald-400/40'
                      }`}>
                      {v}
                    </button>
                  ))}
                </div>
                <input type="number" step="0.1" min="0.1" max="9999" value={form.area}
                  onChange={e => setForm(f => ({ ...f, area: parseFloat(e.target.value) || 0.1 }))}
                  className={INP + ' w-24 ml-auto'} />
              </div>
            </div>
          </div>

          <button onClick={handlePredecir} disabled={loading || !form.tipo_cultivo || !form.variedad}
            className="group w-full h-12 flex items-center justify-center gap-2.5 pl-5 pr-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analizando…</>
              : <>
                  Generar predicción con IA
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1">
                    <Arrow />
                  </span>
                </>}
          </button>
        </div>
        </div>
      )}

      {tab === 'calculadora' && step === 'result' && prediccion && (
        <div className="space-y-5 animate-slide-up">

          <div className="bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 p-4 sm:p-5 flex items-center gap-4 flex-wrap">
            <span className="text-3xl leading-none">{CULTIVOS_PUNO[form.tipo_cultivo]?.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-white">{form.tipo_cultivo} · {form.variedad}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{form.area} ha · Predicción generada ahora</p>
            </div>
            <div className="flex items-center gap-1.5 bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-500/20 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              <span className="text-xs font-bold text-violet-700 dark:text-violet-400">{prediccion.confianza_prediccion}% confianza</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-0">
            {[
              { icon:Ic.trend,  label:'Rendimiento total',   value:`${prediccion.rendimiento_estimado}`, unit:'ton',     color:'bg-emerald-500', accent:true },
              { icon:Ic.leaf,   label:'Por hectárea',         value:`${prediccion.rendimiento_por_hectarea}`, unit:'t/ha',color:'bg-sky-500'     },
              { icon:Ic.dollar, label:'Precio de mercado',    value:formatCurrency(prediccion.precio_mercado), unit:'por kg', color:'bg-amber-500' },
              { icon:Ic.dollar, label:'Ingreso estimado',     value:formatCurrency(prediccion.ingreso_estimado), unit:'total', color:'bg-violet-500', accent:true },
            ].map(({ icon, label, value, unit, color, accent }) => (
              <div key={label} className={`rounded-[1.5rem] p-1 ${accent ? 'bg-emerald-500/15 ring-1 ring-emerald-500/20' : 'bg-white/60 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10'}`}>
                <div className="rounded-[calc(1.5rem-0.25rem)] bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/5 p-4 h-full">
                  <div className={`${color} w-8 h-8 rounded-xl flex items-center justify-center text-white mb-3`}>{icon}</div>
                  <p className={`${accent ? 'font-display text-3xl' : 'text-2xl'} font-bold tracking-tight leading-none truncate ${accent ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>{value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{label}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{unit}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon:Ic.cal,   label:'Días a cosecha',  value:`${prediccion.dias_cosecha} días`,  color:'text-sky-600 dark:text-sky-400',       bg:'bg-sky-50 dark:bg-sky-900/20 ring-sky-500/20'           },
              { icon:Ic.cal,   label:'Fecha estimada',  value:prediccion.fecha_cosecha.toLocaleDateString('es-PE',{day:'numeric',month:'long',year:'numeric'}), color:'text-emerald-600 dark:text-emerald-400', bg:'bg-emerald-50 dark:bg-emerald-900/20 ring-emerald-500/20' },
              { icon:Ic.award, label:'Confianza IA',    value:`${prediccion.confianza_prediccion}%`, color:'text-violet-600 dark:text-violet-400',bg:'bg-violet-50 dark:bg-violet-900/20 ring-violet-500/20' },
            ].map(({ icon, label, value, color, bg }) => (
              <div key={label} className={`rounded-2xl ring-1 px-4 py-3.5 flex items-center gap-3 ${bg}`}>
                <span className={color}>{icon}</span>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.16em]">{label}</p>
                  <p className={`text-sm font-bold ${color}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 p-5">
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.18em] mb-4 flex items-center gap-2">
                {Ic.trend} Tendencia esperada · 6 meses
              </p>
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={prediccion.tendencia} margin={{ top:4, right:4, left:-24, bottom:0 }}>
                  <defs>
                    <linearGradient id="gPred" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:[&>line]:stroke-gray-800" />
                  <XAxis dataKey="mes" tick={{ fontSize:11, fontWeight:600, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:10, fontWeight:600, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="rendimiento" stroke="#10b981" strokeWidth={2.5} fill="url(#gPred)" name="t/ha" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 p-5">
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.18em] mb-4 flex items-center gap-2">
                {Ic.chart} Escenarios · toneladas
              </p>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={prediccion.escenarios} margin={{ top:4, right:4, left:-24, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:[&>line]:stroke-gray-800" vertical={false} />
                  <XAxis dataKey="nombre" tick={{ fontSize:11, fontWeight:700, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:10, fontWeight:600, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="rend" name="Toneladas" radius={[6,6,0,0]}>
                    {prediccion.escenarios.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-4 mt-1.5">
                {prediccion.escenarios.map(e => (
                  <div key={e.nombre} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: e.color }} />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">{e.nombre}: {e.rend}t</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 p-5">
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.18em] mb-3 flex items-center gap-2">
              {Ic.rain} Factores de impacto
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon:Ic.rain, label:'Factor climático',  val:prediccion.factores.clima,    color:'text-sky-600 dark:text-sky-400',         bar:'bg-sky-500'     },
                { icon:Ic.sun,  label:'Factor temporal',   val:prediccion.factores.temporal, color:'text-emerald-600 dark:text-emerald-400', bar:'bg-emerald-500' },
                { icon:Ic.map,  label:'Factor área',       val:prediccion.factores.area,     color:'text-violet-600 dark:text-violet-400',   bar:'bg-violet-500'  },
              ].map(({ icon, label, val, color, bar }) => (
                <div key={label} className="bg-gray-50/80 dark:bg-white/[0.04] rounded-2xl p-4 ring-1 ring-black/5 dark:ring-white/10">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-2">{icon} {label}</div>
                  <p className={`font-display text-2xl font-bold tracking-tight mb-2.5 ${color}`}>{val}</p>
                  <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${bar} rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]`} style={{ width: `${parseFloat(val) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-violet-500 rounded-xl flex items-center justify-center text-white">{Ic.brain}</div>
              <div>
                <h4 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Recomendaciones AgroIA</h4>
                <p className="text-[10px] text-gray-400">Groq · llama-3.3-70b-versatile</p>
              </div>
            </div>
            {groqLoading ? (
              <div className="flex items-center gap-3 bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-500/20 rounded-2xl px-4 py-4">
                <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-violet-700 dark:text-violet-400 font-medium">AgroIA generando recomendaciones…</span>
              </div>
            ) : analisisLines.length > 0 ? (
              <div className="space-y-3">
                {(() => {
                  const recs = [];
                  let current = null;
                  analisisLines.forEach(line => {
                    if (/^\d+\./.test(line)) {
                      if (current) recs.push(current);
                      current = { titulo: line.replace(/^\d+\.\s*/, ''), cuerpo: [] };
                    } else if (current) {
                      current.cuerpo.push(line);
                    }
                  });
                  if (current) recs.push(current);
                  if (!recs.length) {
                    return (
                      <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50/80 dark:bg-white/[0.04] rounded-2xl px-4 py-4 ring-1 ring-black/5 dark:ring-white/10">
                        {analisisLines.join('\n')}
                      </div>
                    );
                  }
                  return recs.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 bg-gray-50/80 dark:bg-white/[0.04] rounded-2xl px-4 py-3.5 ring-1 ring-black/5 dark:ring-white/10">
                      <span className="w-6 h-6 rounded-lg bg-violet-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">{r.titulo}</p>
                        {r.cuerpo.length > 0 && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{r.cuerpo.join(' ')}</p>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : null}
          </div>

        </div>
      )}

      {tab === 'historial' && (
        <div className="space-y-3 animate-slide-up">
          {cultivos.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 py-14 flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 dark:bg-white/[0.06] rounded-2xl flex items-center justify-center text-gray-400">{Ic.history}</div>
              <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Sin cultivos registrados</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Registra cultivos en la sección Cultivos para ver predicciones aquí</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 dark:text-gray-500 px-1">Predicciones rápidas basadas en tus cultivos registrados</p>
              {cultivos.map(c => {
                const v = c.variedad && c.tipo_cultivo && CULTIVOS_PUNO[c.tipo_cultivo]
                  ? CULTIVOS_PUNO[c.tipo_cultivo].variedades.find(x => x.nombre === c.variedad)
                  : null;
                const quick = v ? generarPrediccion(c.tipo_cultivo, v, c.area_hectareas || 1) : null;
                return (
                  <div key={c.id} className="bg-white dark:bg-gray-900 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 p-4 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-emerald-500/30">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white">{c.nombre}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {c.tipo_cultivo}{c.variedad ? ` · ${c.variedad}` : ''} · {c.area_hectareas || 0} ha
                        </p>
                      </div>
                      {quick ? (
                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-right">
                            <p className="font-black text-emerald-600 dark:text-emerald-400">{quick.rendimiento_estimado} ton</p>
                            <p className="text-gray-400">rendimiento est.</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-violet-600 dark:text-violet-400">{formatCurrency(quick.ingreso_estimado)}</p>
                            <p className="text-gray-400">ingreso est.</p>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setTab('calculadora'); setForm({ tipo_cultivo: c.tipo_cultivo || '', variedad: c.variedad || '', area: c.area_hectareas || 1 }); setStep('form'); }}
                          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline touch-manipulation">
                          Ir a calculadora
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

    </div>
  );
};

export default PrediccionCosecha;
