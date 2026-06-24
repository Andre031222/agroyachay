import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dispositivosAPI } from '../../services/api';
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

const AnimNum = ({ value, decimals = 1 }) => {
  const [disp, setDisp] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (value == null) { setDisp(null); return; }
    const from = prev.current ?? value;
    const diff = value - from;
    let s = 0;
    const t = setInterval(() => {
      s++;
      setDisp(s >= 20 ? value : from + (diff / 20) * s);
      if (s >= 20) clearInterval(t);
    }, 25);
    prev.current = value;
    return () => clearInterval(t);
  }, [value]);
  return disp == null ? <span>—</span> : <span>{disp.toFixed(decimals)}</span>;
};

const GaugeBar = ({ value, minC, min, max, maxC, dotColor }) => {
  if (value == null) return <div className="h-2 bg-gray-100 dark:bg-white/[0.06] rounded-full" />;
  const total  = (maxC - minC) || 1;
  const pct    = Math.min(100, Math.max(0, ((value - minC) / total) * 100));
  const oPct   = ((min  - minC) / total) * 100;
  const oWidth = ((max  - min)  / total) * 100;
  return (
    <div className="relative h-2 w-full">
      <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-visible relative ring-1 ring-inset ring-black/5 dark:ring-white/10">
        <div className="absolute h-full rounded-full bg-emerald-200/70 dark:bg-emerald-400/25"
          style={{ left: `${oPct}%`, width: `${oWidth}%` }} />
      </div>
      <div
        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-gray-900 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${dotColor}`}
        style={{ left: `${pct}%` }}
      />
    </div>
  );
};

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900/95 backdrop-blur text-white text-xs rounded-2xl px-3.5 py-2.5 ring-1 ring-white/10">
      <p className="font-semibold text-gray-300 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value?.toFixed(1)}</strong>
        </p>
      ))}
    </div>
  );
};

const Ic = {
  therm:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>,
  drop:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  sprout:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M7 20s4-4.5 4-10a8 8 0 0 1 8-8c0 6-4 10-8 10"/><path d="M7 20c0-3 2-5 4-6" strokeLinecap="round"/></svg>,
  wifi:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
  wifioff: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a11 11 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
  refresh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  check:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"/></svg>,
  alert:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  activity:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  cpu:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
  clock:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  link:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
};

const SENSOR_CFG = {
  temperatura_aire: {
    label:'Temperatura del Aire', unit:'°C', decimals:1,
    minC:8,  min:20, max:28, maxC:35,
    icon: Ic.therm,  iconBg:'bg-orange-500', iconClr:'text-orange-500',
  },
  humedad_aire: {
    label:'Humedad del Aire', unit:'%', decimals:0,
    minC:25, min:50, max:80, maxC:95,
    icon: Ic.drop,   iconBg:'bg-sky-500',    iconClr:'text-sky-500',
  },
  humedad_suelo: {
    label:'Humedad del Suelo', unit:'%', decimals:0,
    minC:20, min:50, max:80, maxC:95,
    icon: Ic.sprout, iconBg:'bg-emerald-500',iconClr:'text-emerald-500',
  },
};

const getEstado = (tipo, val) => {
  if (val == null) return 'nodata';
  const t = SENSOR_CFG[tipo];
  if (!t) return 'normal';
  if (val < t.minC || val > t.maxC) return 'critical';
  if (val < t.min  || val > t.max)  return 'warning';
  return 'normal';
};

const ESTADO = {
  normal:   { label:'Óptimo',         dot:'bg-emerald-500', badge:'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/15', iconBg:'bg-emerald-500', dotColor:'bg-emerald-500' },
  warning:  { label:'Fuera de rango', dot:'bg-amber-400',   badge:'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/20',           iconBg:'bg-amber-400',   dotColor:'bg-amber-400'   },
  critical: { label:'Nivel crítico',  dot:'bg-red-500',     badge:'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 ring-red-500/20',                     iconBg:'bg-red-500',     dotColor:'bg-red-500'     },
  nodata:   { label:'Sin datos',      dot:'bg-gray-300',    badge:'bg-gray-50 dark:bg-white/[0.04] text-gray-400 ring-black/5 dark:ring-white/10',                   iconBg:'bg-gray-300',    dotColor:'bg-gray-400'    },
};

const SensoresDashboard = () => {
  const [dispositivos, setDispositivos] = useState([]);
  const [devicesReady, setDevicesReady] = useState(false);
  const [sensorActivo, setSensorActivo] = useState(null);
  const [sensorData, setSensorData]     = useState(null);
  const [lecturas, setLecturas]         = useState([]);
  const [loadingData, setLoadingData]   = useState(false);
  const [connected, setConnected]       = useState(false);
  const [lastUpdate, setLastUpdate]     = useState(null);
  const [autoRefresh, setAutoRefresh]   = useState(true);
  const [pulse, setPulse]               = useState(false);
  const [activeChart, setActiveChart]   = useState('temperatura');

  useEffect(() => {
    dispositivosAPI.getMisDispositivos()
      .then(res => {
        const devs = res.data?.dispositivos || [];
        setDispositivos(devs);
        if (devs.length > 0) setSensorActivo(devs[0]);
      })
      .catch(() => {})
      .finally(() => setDevicesReady(true));
  }, []);

  const fetchData = useCallback(async () => {
    if (!sensorActivo) return;
    setLoadingData(true);
    try {
      const [eRes, lRes] = await Promise.all([
        dispositivosAPI.getEstado(sensorActivo.esp32_id),
        dispositivosAPI.getLecturas(sensorActivo.id, 40),
      ]);

      if (eRes.data?.success) {
        setSensorData(eRes.data);
        const recs = eRes.data.ultimas_lecturas || [];
        const latest = recs.reduce((a, b) =>
          new Date(b?.timestamp || 0) > new Date(a?.timestamp || 0) ? b : a, null);
        setConnected(latest ? (Date.now() - new Date(latest.timestamp)) / 1000 < 30 : false);
      }

      if (lRes.data?.success) {
        const map = {};
        (lRes.data.lecturas || []).forEach(l => {
          if (!map[l.timestamp]) {
            map[l.timestamp] = {
              time: new Date(l.timestamp).toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit', second:'2-digit' }),
              ts: l.timestamp,
            };
          }
          if (l.tipo_lectura === 'temperatura_aire') map[l.timestamp].temperatura  = +l.valor;
          if (l.tipo_lectura === 'humedad_aire')     map[l.timestamp].humedadAire  = +l.valor;
          if (l.tipo_lectura === 'humedad_suelo')    map[l.timestamp].humedadSuelo = +l.valor;
        });
        setLecturas(Object.values(map).sort((a, b) => new Date(a.ts) - new Date(b.ts)));
      }

      setLastUpdate(new Date());
      setPulse(true);
      setTimeout(() => setPulse(false), 800);
    } catch {
      setConnected(false);
    } finally {
      setLoadingData(false);
    }
  }, [sensorActivo]);

  useEffect(() => { if (sensorActivo) fetchData(); }, [sensorActivo, fetchData]);

  useEffect(() => {
    if (!autoRefresh || !sensorActivo) return;
    const t = setInterval(fetchData, 5000);
    return () => clearInterval(t);
  }, [autoRefresh, sensorActivo, fetchData]);

  const getVal = (tipo) => {
    const r = sensorData?.ultimas_lecturas?.find(l => l.tipo_lectura === tipo);
    return r ? +r.valor : null;
  };

  const sensorCards = Object.entries(SENSOR_CFG).map(([tipo, cfg]) => ({
    tipo,
    ...cfg,
    val: getVal(tipo),
  }));

  const chartData = lecturas.slice(-30);
  const hasData   = lecturas.length > 0;

  if (!devicesReady) return (
    <div className="px-4 sm:p-6 p-6 bg-gray-50 dark:bg-gray-950 min-h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 animate-slide-up">
        <div className="w-9 h-9 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando dispositivos...</p>
      </div>
    </div>
  );

  if (devicesReady && dispositivos.length === 0) return (
    <div className="px-4 sm:p-6 p-6 bg-gray-50 dark:bg-gray-950 min-h-full flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl p-1.5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 animate-slide-up">
        <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/15 flex items-center justify-center mx-auto mb-5 text-emerald-600 dark:text-emerald-400">
            {Ic.cpu}
          </div>
          <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-2">Sin dispositivos vinculados</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            Vincula tu sensor ESP32 a un cultivo para comenzar a ver temperatura, humedad del aire y humedad del suelo en tiempo real.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: Ic.therm,  label:'Temperatura', color:'bg-orange-50 dark:bg-orange-500/10 ring-orange-500/15 text-orange-500' },
              { icon: Ic.drop,   label:'H. Aire',     color:'bg-sky-50 dark:bg-sky-500/10 ring-sky-500/15 text-sky-500'            },
              { icon: Ic.sprout, label:'H. Suelo',    color:'bg-emerald-50 dark:bg-emerald-500/10 ring-emerald-500/15 text-emerald-500' },
            ].map((s, i) => (
              <div key={i} className={`flex flex-col items-center gap-2 py-3.5 rounded-2xl ring-1 ${s.color}`}>
                {s.icon}
                <span className="text-[10px] font-semibold">{s.label}</span>
              </div>
            ))}
          </div>

          <Link to="/dispositivos"
            className="inline-flex items-center gap-2 px-5 h-11 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation">
            {Ic.link}
            Vincular dispositivo ESP32
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="px-4 py-5 sm:p-6 space-y-4 bg-gray-50 dark:bg-gray-950 min-h-full animate-slide-up">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Monitoreo IoT</h1>
          {dispositivos.length > 1 ? (
            <select
              value={sensorActivo?.id || ''}
              onChange={e => {
                const d = dispositivos.find(x => x.id === parseInt(e.target.value));
                if (d) { setSensorActivo(d); setSensorData(null); setLecturas([]); }
              }}
              className="mt-2 text-xs bg-white dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              {dispositivos.map(d => (
                <option key={d.id} value={d.id}>{d.nombre} ({d.esp32_id})</option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              {sensorActivo?.nombre || '—'} · <span className="font-mono">{sensorActivo?.esp32_id || '—'}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-gray-400">
              {Ic.clock}
              {lastUpdate.toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
            </span>
          )}
          <button onClick={() => setAutoRefresh(a => !a)}
            className={`flex items-center gap-1.5 h-9 px-3.5 rounded-full ring-1 text-xs font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation ${
              autoRefresh
                ? 'bg-emerald-50 dark:bg-emerald-500/10 ring-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-white/[0.04] ring-black/5 dark:ring-white/10 text-gray-500 dark:text-gray-400'
            }`}>
            <span className={autoRefresh ? 'animate-spin' : ''}>{Ic.refresh}</span>
            Auto {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button onClick={fetchData} disabled={loadingData}
            className="flex items-center gap-1.5 h-9 px-3.5 bg-white dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.08] disabled:opacity-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation">
            {Ic.refresh} Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sensorCards.map(({ tipo, val, icon, iconBg, unit, decimals, label, minC, min, max, maxC }) => {
          const estado = getEstado(tipo, val);
          const ep     = ESTADO[estado];
          return (
            <div key={tipo}
              className={`rounded-2xl p-1.5 ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                pulse && val != null
                  ? 'bg-emerald-50/70 dark:bg-emerald-500/10 ring-emerald-500/20'
                  : 'bg-white/70 dark:bg-white/[0.04] ring-black/5 dark:ring-white/10'
              }`}>
              <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-full ${ep.iconBg} ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center text-white`}>
                  {icon}
                </div>
                <span className={`flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full ring-1 ${ep.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${ep.dot} ${estado === 'critical' ? 'animate-pulse' : ''}`} />
                  {ep.label}
                </span>
              </div>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-display text-4xl font-semibold tracking-tight text-gray-900 dark:text-white leading-none">
                  <AnimNum value={val} decimals={decimals} />
                </span>
                <span className="text-base font-semibold text-gray-400">{unit}</span>
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>

              {minC != null && (
                <div className="mt-3.5 mb-2">
                  <GaugeBar value={val} minC={minC} min={min} max={max} maxC={maxC} dotColor={ep.dotColor} />
                </div>
              )}
              {minC != null && (
                <div className="flex items-center justify-between mt-2.5">
                  <div className="text-center">
                    <p className="text-[9px] text-gray-400">Mín. crítico</p>
                    <p className="text-[10px] font-semibold text-red-500">{minC}{unit}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">Óptimo</p>
                    <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{min}–{max}{unit}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-gray-400">Máx. crítico</p>
                    <p className="text-[10px] font-semibold text-red-500">{maxC}{unit}</p>
                  </div>
                </div>
              )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl p-1.5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10">
        <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90">
        <div className="flex items-center justify-between px-5 pt-4 pb-0 border-b border-black/5 dark:border-white/10">
          <div className="flex gap-0.5">
            {[
              { id:'temperatura', label:'Temperatura',   icon: Ic.therm    },
              { id:'humedad',     label:'Humedad',       icon: Ic.drop     },
              { id:'todos',       label:'Completo',      icon: Ic.activity },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveChart(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] touch-manipulation ${
                  activeChart === t.id
                    ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}>
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
          <span className="text-[10px] text-gray-400 pb-2 pr-1">
            {hasData ? `${lecturas.length} lecturas` : 'Sin datos'}
          </span>
        </div>

        <div className="p-5">
          {!hasData ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-12 h-12 bg-gray-50 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 rounded-full flex items-center justify-center mb-3 text-gray-400">
                {Ic.activity}
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Sin lecturas disponibles</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {connected ? 'Esperando primera lectura del sensor...' : 'Conecta el ESP32 al hotspot configurado'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {(activeChart === 'temperatura' || activeChart === 'todos') && (
                <div>
                  {activeChart === 'todos' && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 bg-orange-500 rounded-full ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center text-white">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Temperatura del Aire (°C)</span>
                    </div>
                  )}
                  {activeChart === 'temperatura' && (
                    <div className="flex items-center gap-4 mb-3 flex-wrap">
                      <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-orange-400 rounded" /><span className="text-xs text-gray-500">Temperatura</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-3 border-t border-dashed border-emerald-400" /><span className="text-xs text-gray-500">Zona óptima (20–28°C)</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-3 border-t border-dashed border-red-400" /><span className="text-xs text-gray-500">Límite crítico</span></div>
                    </div>
                  )}
                  <ResponsiveContainer width="100%" height={activeChart === 'todos' ? 160 : 260}>
                    <AreaChart data={chartData} margin={{ top:6, right:6, left:-22, bottom:0 }}>
                      <defs>
                        <linearGradient id="gTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#f97316" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:[&>line]:stroke-gray-800" />
                      <XAxis dataKey="time" tick={{ fontSize:10, fill:'#9ca3af', fontWeight:600 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis domain={[0, 45]} tick={{ fontSize:10, fill:'#9ca3af', fontWeight:600 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip />} />
                      <ReferenceLine y={28} stroke="#10b981" strokeDasharray="5 3" strokeWidth={1.5} />
                      <ReferenceLine y={20} stroke="#10b981" strokeDasharray="5 3" strokeWidth={1.5} />
                      <ReferenceLine y={35} stroke="#ef4444" strokeDasharray="5 3" strokeWidth={1.5} />
                      <ReferenceLine y={8}  stroke="#ef4444" strokeDasharray="5 3" strokeWidth={1.5} />
                      <Area type="monotone" dataKey="temperatura" stroke="#f97316" strokeWidth={2.5}
                        fill="url(#gTemp)" dot={false}
                        activeDot={{ r:5, fill:'#f97316', strokeWidth:2, stroke:'#fff' }}
                        name="Temp °C" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {(activeChart === 'humedad' || activeChart === 'todos') && (
                <div>
                  {activeChart === 'todos' && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 bg-sky-500 rounded-full ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center text-white">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Humedad Aire y Suelo (%)</span>
                    </div>
                  )}
                  {activeChart === 'humedad' && (
                    <div className="flex items-center gap-4 mb-3 flex-wrap">
                      <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded" style={{background:'#3b82f6'}} /><span className="text-xs text-gray-500">Humedad Aire</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded" style={{background:'#10b981'}} /><span className="text-xs text-gray-500">Humedad Suelo</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-3 border-t border-dashed border-red-400" /><span className="text-xs text-gray-500">Umbral riego urgente (40%)</span></div>
                    </div>
                  )}
                  <ResponsiveContainer width="100%" height={activeChart === 'todos' ? 160 : 260}>
                    <AreaChart data={chartData} margin={{ top:6, right:6, left:-22, bottom:0 }}>
                      <defs>
                        <linearGradient id="gAire" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gSuelo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:[&>line]:stroke-gray-800" />
                      <XAxis dataKey="time" tick={{ fontSize:10, fill:'#9ca3af', fontWeight:600 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis domain={[0, 100]} tick={{ fontSize:10, fill:'#9ca3af', fontWeight:600 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip />} />
                      <ReferenceLine y={80} stroke="#10b981" strokeDasharray="5 3" strokeWidth={1.5} />
                      <ReferenceLine y={60} stroke="#10b981" strokeDasharray="5 3" strokeWidth={1.5} />
                      <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="5 3" strokeWidth={1.5} />
                      <Area type="monotone" dataKey="humedadAire"  stroke="#3b82f6" strokeWidth={2.5}
                        fill="url(#gAire)"  dot={false}
                        activeDot={{ r:5, fill:'#3b82f6', strokeWidth:2, stroke:'#fff' }}
                        name="H. Aire %" />
                      <Area type="monotone" dataKey="humedadSuelo" stroke="#10b981" strokeWidth={2.5}
                        fill="url(#gSuelo)" dot={false}
                        activeDot={{ r:5, fill:'#10b981', strokeWidth:2, stroke:'#fff' }}
                        name="H. Suelo %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="rounded-2xl p-1.5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10">
        <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-emerald-500 rounded-full ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center text-white">{Ic.cpu}</div>
            <div>
              <h3 className="font-display text-sm font-semibold tracking-tight text-gray-900 dark:text-white">Dispositivo</h3>
              <p className="text-xs text-gray-400">Configuración del sensor ESP32</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label:'ESP32 ID',    value: sensorData?.sensor?.esp32_id || sensorActivo?.esp32_id || '—', mono:true },
              { label:'Tipo',       value: sensorData?.sensor?.tipo      || 'DHT11 + FC-28'               },
              { label:'Ubicación',  value: sensorData?.sensor?.ubicacion || '—'                           },
              { label:'Cultivo',    value: sensorActivo?.cultivo_nombre  || '—'                           },
              { label:'Intervalo',  value: 'Cada 10 segundos'                                             },
              { label:'Protocolo',  value: 'HTTP · REST API'                                              },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 dark:bg-white/[0.04] rounded-2xl px-3 py-2.5 ring-1 ring-black/5 dark:ring-white/10">
                <p className="text-[10px] text-gray-400">{item.label}</p>
                <p className={`text-xs font-semibold text-gray-800 dark:text-gray-200 truncate ${item.mono ? 'font-mono' : ''}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
        </div>

        <div className="rounded-2xl p-1.5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10">
        <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-sky-500 rounded-full ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center text-white">{Ic.activity}</div>
            <div>
              <h3 className="font-display text-sm font-semibold tracking-tight text-gray-900 dark:text-white">Estado en tiempo real</h3>
              <p className="text-xs text-gray-400">
                {hasData ? `${lecturas.length} lecturas registradas` : 'Sin lecturas disponibles'}
                {lastUpdate && ` · ${lastUpdate.toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}`}
              </p>
            </div>
          </div>

          <div className={`flex items-start gap-3 px-3.5 py-3 rounded-2xl ring-1 mb-4 ${
            connected
              ? 'bg-emerald-50 dark:bg-emerald-500/10 ring-emerald-500/15'
              : 'bg-amber-50 dark:bg-amber-500/10 ring-amber-500/20'
          }`}>
            <span className={`shrink-0 mt-0.5 ${connected ? 'text-emerald-500' : 'text-amber-500'}`}>
              {connected ? Ic.check : Ic.alert}
            </span>
            <div>
              <p className={`text-xs font-semibold ${connected ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                {connected ? 'ESP32 activo y enviando datos' : 'ESP32 sin conexión'}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                {connected
                  ? 'Funciona de forma autónoma con alimentación USB 5V'
                  : 'Conecta el sensor al hotspot configurado para reanudar'}
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {sensorCards.map(({ tipo, val, icon, label, unit, decimals, minC, maxC }) => {
              const estado = getEstado(tipo, val);
              const ep = ESTADO[estado];
              const pct = (minC != null && maxC != null && val != null)
                ? Math.min(100, Math.max(3, ((val - minC) / (maxC - minC)) * 100))
                : 0;
              return (
                <div key={tipo} className="flex items-center gap-3">
                  <span className="text-gray-400 shrink-0">{icon}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-24 shrink-0 truncate">{label}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full ring-1 ring-inset ring-black/5 dark:ring-white/10">
                    {val != null && (
                      <div className={`h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${ep.dotColor}`}
                        style={{ width: `${pct}%` }} />
                    )}
                  </div>
                  <span className={`text-xs font-semibold w-14 text-right ${
                    estado === 'normal'   ? 'text-emerald-500' :
                    estado === 'warning'  ? 'text-amber-500'   :
                    estado === 'critical' ? 'text-red-500'     : 'text-gray-400'
                  }`}>
                    {val != null ? `${val.toFixed(decimals)}${unit}` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        </div>

      </div>
    </div>
  );
};

export default SensoresDashboard;
