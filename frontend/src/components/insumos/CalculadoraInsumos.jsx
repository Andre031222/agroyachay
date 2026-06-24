import React, { useState } from 'react';
import { insumosAPI } from '../../services/api';
import { CULTIVOS_PUNO } from '../../utils/constants';
import { formatCurrency } from '../../utils/helpers';
import { notify } from '../../utils/swal';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

const Ic = {
  calc:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/><line x1="14" y1="18" x2="16" y2="18"/></svg>,
  leaf:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>,
  drop:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  trend:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  dollar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  bulb:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>,
  clock:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  target: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  expand: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>,
  pin:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  check:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"/></svg>,
  print:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  reset:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>,
  arrow:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
};

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#04140d] text-white text-xs rounded-xl px-3 py-2 ring-1 ring-white/10">
      {label && <p className="font-semibold text-emerald-100/70 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: <strong>{p.value?.toLocaleString()}</strong>
        </p>
      ))}
    </div>
  );
};

const COLORS     = ['#10b981', '#3b82f6', '#8b5cf6'];
const INP        = 'w-full h-9 px-3 text-sm rounded-xl bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 text-gray-900 dark:text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:bg-white dark:focus:bg-white/[0.06]';
const AREA_STEPS = [0.1, 0.5, 1, 2, 5, 10, 20, 50];

// Presentational double-bezel card wrapper (consistent with Auth)
const Bezel = ({ className = '', children }) => (
  <div className="rounded-2xl p-1.5 ring-1 ring-black/5 dark:ring-white/10 bg-white/60 dark:bg-white/[0.03]">
    <div className={`rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900 ${className}`}>
      {children}
    </div>
  </div>
);

const SectionLabel = ({ icon, children, extra }) => (
  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 ring-1 ring-emerald-300/20 text-emerald-600 dark:text-emerald-400">
      {icon}
    </span>
    {children}
    {extra}
  </p>
);

const CalculadoraInsumos = () => {
  const [form, setForm]         = useState({ tipo_cultivo: '', variedad: '', area_hectareas: 1 });
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading]   = useState(false);

  const cultivo   = form.tipo_cultivo ? CULTIVOS_PUNO[form.tipo_cultivo] : null;
  const variedad  = cultivo && form.variedad
    ? cultivo.variedades.find(v => v.nombre === form.variedad)
    : null;

  const areaM2    = (form.area_hectareas * 10_000).toLocaleString('es-PE');
  const areaTopos = (form.area_hectareas * 3).toFixed(2);
  const areaAcres = (form.area_hectareas * 2.47105).toFixed(2);
  const areaPct   = Math.min(100, (form.area_hectareas / 50) * 100);
  const parcelaCat =
    form.area_hectareas < 1  ? 'Parcela pequeña'  :
    form.area_hectareas < 5  ? 'Parcela mediana'  :
    form.area_hectareas < 20 ? 'Parcela grande'   : 'Producción industrial';

  const handleCalcular = async (e) => {
    e.preventDefault();
    if (!form.tipo_cultivo) { notify.warning('Selecciona un cultivo'); return; }
    setLoading(true);
    try {
      const res = await insumosAPI.calcularInsumos({
        tipo_cultivo: form.tipo_cultivo,
        area_hectareas: form.area_hectareas,
      });
      setResultado(res.data.data);
      notify.success('Cálculo completado');
    } catch (err) {
      notify.error('Error al calcular: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const handleReset = () => {
    setForm({ tipo_cultivo: '', variedad: '', area_hectareas: 1 });
    setResultado(null);
  };

  const npkData  = resultado ? [
    { nombre: 'N',     cantidad: resultado.requerimientos.nitrogeno.cantidad_kg, costo: resultado.requerimientos.nitrogeno.costo },
    { nombre: 'P₂O₅',  cantidad: resultado.requerimientos.fosforo.cantidad_kg,   costo: resultado.requerimientos.fosforo.costo   },
    { nombre: 'K₂O',   cantidad: resultado.requerimientos.potasio.cantidad_kg,   costo: resultado.requerimientos.potasio.costo   },
  ] : [];

  const pieData = resultado ? [
    { name: 'N',    value: resultado.requerimientos.nitrogeno.cantidad_kg, color: '#10b981' },
    { name: 'P₂O₅', value: resultado.requerimientos.fosforo.cantidad_kg,   color: '#3b82f6' },
    { name: 'K₂O',  value: resultado.requerimientos.potasio.cantidad_kg,   color: '#8b5cf6' },
  ] : [];

  return (
    <div className="px-4 sm:px-6 py-6 space-y-5 bg-gray-50 dark:bg-gray-950 min-h-full">

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Calculadora de Insumos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Fertilización NPK optimizada · Puno 3800–4500 msnm
          </p>
        </div>
        {resultado && (
          <div className="flex items-center gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-white dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-emerald-500/40 active:scale-[0.97] touch-manipulation">
              {Ic.print} Imprimir
            </button>
            <button onClick={handleReset}
              className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-white dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-emerald-500/40 active:scale-[0.97] touch-manipulation">
              {Ic.reset} Nuevo cálculo
            </button>
          </div>
        )}
      </div>

      <Bezel className="p-5 sm:p-6">
        <form onSubmit={handleCalcular} className="space-y-7">

          <div>
            <SectionLabel icon={Ic.leaf}>Tipo de cultivo</SectionLabel>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2">
              {Object.entries(CULTIVOS_PUNO).map(([key, c]) => (
                <button key={key} type="button"
                  onClick={() => setForm(f => ({ ...f, tipo_cultivo: key, variedad: '' }))}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] touch-manipulation ${
                    form.tipo_cultivo === key
                      ? 'ring-2 ring-emerald-500/60 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'ring-black/5 dark:ring-white/10 bg-gray-50/80 dark:bg-white/[0.04] hover:ring-emerald-500/40'
                  }`}>
                  <span className="text-2xl leading-none">{c.icon}</span>
                  <span className={`text-[10px] font-bold truncate w-full text-center px-1 ${
                    form.tipo_cultivo === key ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'
                  }`}>{c.nombre}</span>
                </button>
              ))}
            </div>
          </div>

          {cultivo && (
            <div className="flex items-start gap-4 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-300/30 dark:ring-emerald-800/40 rounded-2xl px-4 py-3.5">
              <span className="text-3xl leading-none shrink-0">{cultivo.icon}</span>
              <div className="min-w-0">
                <p className="font-bold text-sm text-gray-900 dark:text-white">{cultivo.nombre}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cultivo.descripcion}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  {Ic.pin} Altitud óptima: {cultivo.altitud}
                </p>
              </div>
            </div>
          )}

          {cultivo && (
            <div>
              <SectionLabel
                icon={Ic.target}
                extra={<span className="font-normal normal-case tracking-normal text-gray-400">(opcional)</span>}
              >
                Variedad
              </SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {cultivo.variedades.map(v => (
                  <button key={v.nombre} type="button"
                    onClick={() => setForm(f => ({ ...f, variedad: v.nombre }))}
                    className={`p-3 rounded-xl ring-1 text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation ${
                      form.variedad === v.nombre
                        ? 'ring-2 ring-sky-500/60 bg-sky-50 dark:bg-sky-900/20'
                        : 'ring-black/5 dark:ring-white/10 bg-gray-50/80 dark:bg-white/[0.04] hover:ring-sky-500/40'
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
          )}

          <div>
            <SectionLabel icon={Ic.expand}>Área de cultivo</SectionLabel>
            <div className="bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Hectáreas</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{form.area_hectareas.toFixed(2)}</span>
                  <span className="text-sm text-gray-400">ha</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-300/20 px-2 py-0.5 rounded-full ml-1">
                    {parcelaCat}
                  </span>
                </div>
              </div>

              <div className="relative h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="absolute h-full rounded-full bg-emerald-500 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{ width: `${areaPct}%` }} />
                <input type="range" min="0.1" max="50" step="0.1"
                  value={form.area_hectareas}
                  onChange={e => setForm(f => ({ ...f, area_hectareas: parseFloat(e.target.value) }))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-wrap">
                  {AREA_STEPS.map(v => (
                    <button key={v} type="button"
                      onClick={() => setForm(f => ({ ...f, area_hectareas: v }))}
                      className={`h-7 px-2.5 rounded-full text-xs font-bold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.95] touch-manipulation ${
                        form.area_hectareas === v
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 text-gray-600 dark:text-gray-400 hover:ring-emerald-500/40'
                      }`}>
                      {v}
                    </button>
                  ))}
                </div>
                <input type="number" step="0.01" min="0.01" max="9999"
                  value={form.area_hectareas}
                  onChange={e => setForm(f => ({ ...f, area_hectareas: parseFloat(e.target.value) || 0.1 }))}
                  className={INP + ' w-28 ml-auto'} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'm²',   value: areaM2   },
                  { label: 'topos',value: areaTopos },
                  { label: 'acres',value: areaAcres },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/10 rounded-xl py-2 text-center">
                    <p className="font-display text-base font-bold tracking-tight text-gray-900 dark:text-white">{value}</p>
                    <p className="text-[10px] text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading || !form.tipo_cultivo}
            className="group w-full h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] flex items-center justify-center gap-2.5 touch-manipulation">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Calculando…</>
              : <>
                  {Ic.calc} Calcular fertilizantes óptimos
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                    {Ic.arrow}
                  </span>
                </>
            }
          </button>
        </form>
      </Bezel>

      {resultado && !loading && (
        <>
          <Bezel className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
              <div>
                <h3 className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                  Plan de fertilización — {resultado.tipo_cultivo}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {resultado.area_hectareas} ha{variedad ? ` · ${variedad.nombre}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-300/30 dark:ring-emerald-800/40 rounded-full px-4 py-2">
                <span className="text-emerald-500">{Ic.dollar}</span>
                <span className="font-display text-sm font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(resultado.costo_total)}
                </span>
                <span className="text-[10px] text-gray-400">inversión total</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label:'Nitrógeno (N)',   kg: resultado.requerimientos.nitrogeno.cantidad_kg, costo: resultado.requerimientos.nitrogeno.costo, color:'bg-emerald-500', light:'bg-emerald-50 dark:bg-emerald-900/20 ring-emerald-300/30 dark:ring-emerald-800/40', text:'text-emerald-700 dark:text-emerald-400' },
                { label:'Fósforo (P₂O₅)', kg: resultado.requerimientos.fosforo.cantidad_kg,   costo: resultado.requerimientos.fosforo.costo,   color:'bg-sky-500',     light:'bg-sky-50 dark:bg-sky-900/20 ring-sky-300/30 dark:ring-sky-800/40',             text:'text-sky-700 dark:text-sky-400'         },
                { label:'Potasio (K₂O)',   kg: resultado.requerimientos.potasio.cantidad_kg,   costo: resultado.requerimientos.potasio.costo,   color:'bg-violet-500',  light:'bg-violet-50 dark:bg-violet-900/20 ring-violet-300/30 dark:ring-violet-800/40', text:'text-violet-700 dark:text-violet-400'   },
              ].map(({ label, kg, costo, color, light, text }) => (
                <div key={label} className="rounded-[1.25rem] p-1 ring-1 ring-black/5 dark:ring-white/10 bg-white/60 dark:bg-white/[0.03]">
                  <div className={`rounded-[calc(1.25rem-0.25rem)] ring-1 p-4 ${light}`}>
                    <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white mb-3`}>
                      {Ic.leaf}
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-0.5">
                      <span className={`font-display text-3xl font-bold leading-none tracking-tight ${text}`}>{kg}</span>
                      <span className={`text-sm font-bold ${text}`}>kg</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{formatCurrency(costo)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Bezel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Bezel className="p-5 sm:p-6">
              <SectionLabel icon={Ic.trend}>Distribución NPK (kg)</SectionLabel>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={npkData} barCategoryGap="35%" margin={{ top:4, right:4, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:[&>line]:stroke-gray-800" vertical={false} />
                  <XAxis dataKey="nombre" tick={{ fontSize:11, fontWeight:700, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:10, fontWeight:600, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="cantidad" name="Cantidad (kg)" radius={[6,6,0,0]}>
                    {npkData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Bezel>

            <Bezel className="p-5 sm:p-6">
              <SectionLabel icon={Ic.target}>Proporción NPK</SectionLabel>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={85} innerRadius={35} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-4 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold">{d.name}</span>
                  </div>
                ))}
              </div>
            </Bezel>
          </div>

          <Bezel className="p-5 sm:p-6">
            <SectionLabel icon={Ic.trend}>Proyección de beneficios</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: formatCurrency(resultado.beneficios.ahorro_estimado),           label:'Ahorro estimado',        sub:'Reducción de costos hasta 25%', color:'text-emerald-600 dark:text-emerald-400', bg:'bg-emerald-50 dark:bg-emerald-900/20 ring-emerald-300/30 dark:ring-emerald-800/40' },
                { value: `+${resultado.beneficios.aumento_rendimiento_porcentaje}%`,      label:'Aumento de rendimiento', sub:'Incremento hasta 15%',          color:'text-sky-600 dark:text-sky-400',         bg:'bg-sky-50 dark:bg-sky-900/20 ring-sky-300/30 dark:ring-sky-800/40'                 },
                { value: resultado.beneficios.mejora_calidad,                             label:'Calidad del producto',   sub:'Producto premium garantizado',  color:'text-violet-600 dark:text-violet-400',   bg:'bg-violet-50 dark:bg-violet-900/20 ring-violet-300/30 dark:ring-violet-800/40'     },
              ].map(({ value, label, sub, color, bg }) => (
                <div key={label} className={`rounded-2xl ring-1 p-4 ${bg}`}>
                  <p className={`font-display text-2xl font-bold leading-tight tracking-tight mb-1 ${color}`}>{value}</p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </Bezel>

          <Bezel className="p-5 sm:p-6">
            <SectionLabel icon={Ic.bulb}>Recomendaciones de aplicación</SectionLabel>
            <div className="space-y-2">
              {resultado.recomendaciones.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 bg-sky-50 dark:bg-sky-900/20 ring-1 ring-sky-300/30 dark:ring-sky-800/40 rounded-2xl px-4 py-3">
                  <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 text-xs font-black mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </Bezel>

          <div className="rounded-2xl bg-gray-50/80 dark:bg-white/[0.03] ring-1 ring-dashed ring-black/10 dark:ring-white/10 px-4 py-3.5 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Cálculos basados en recomendaciones técnicas del INIA y condiciones del Altiplano puneño.
            </p>
            <button onClick={handleReset}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 touch-manipulation">
              {Ic.reset} Nuevo cálculo
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CalculadoraInsumos;
