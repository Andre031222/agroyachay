import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { climaAPI, cultivosAPI, informesAPI, dispositivosAPI } from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const tempFallback = [
  { h: '06:00', t: 8 }, { h: '09:00', t: 11 },
  { h: '12:00', t: 14 }, { h: '15:00', t: 15 },
  { h: '18:00', t: 12 }, { h: '21:00', t: 9 },
];

const WEATHER_LABELS = {
  'clear sky': 'Despejado', 'few clouds': 'Pocas nubes',
  'scattered clouds': 'Nublado parcial', 'broken clouds': 'Nublado parcial',
  'overcast clouds': 'Nublado', 'light rain': 'Lluvia ligera',
  'moderate rain': 'Lluvia', 'heavy intensity rain': 'Lluvia intensa',
  'thunderstorm': 'Tormenta', 'snow': 'Nieve', 'mist': 'Neblina',
};

const Ic = {
  leaf:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M11 20A7 7 0 0 1 4 13c0-3.87 3.13-7 7-7 3.87 0 7 3.13 7 7a7 7 0 0 1-7 7z"/><path d="M11 20c0-4-2-7-7-8" strokeLinecap="round"/></svg>,
  therm:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>,
  drop:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  trend:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  bell:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  cloud:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
  wind:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>,
  sprout:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M7 20s4-4.5 4-10a8 8 0 0 1 8-8c0 6-4 10-8 10"/><path d="M7 20c0-3 2-5 4-6" strokeLinecap="round"/></svg>,
  chart:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  act:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  cpu:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
  chat:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  bug:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M8 2l1.88 1.88M14.12 3.88 16 2M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z"/><path d="M6 13H2M22 13h-4M15 22l1 1M9 22l-1 1"/></svg>,
  right:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><polyline points="9 18 15 12 9 6"/></svg>,
};

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm bg-[#04140d]/95 text-white text-xs px-3.5 py-2.5 ring-1 ring-white/10 backdrop-blur-sm">
      <p className="font-semibold mb-0.5 text-emerald-200/90">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

// Double-bezel shell, consistent with Auth cards.
const Bezel = ({ className = '', coreClass = '', children, style }) => (
  <div
    style={style}
    className={`rounded-sm p-1.5 ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-white/[0.04] ${className}`}
  >
    <div className={`rounded-[1px] bg-white dark:bg-gray-900/90 ${coreClass}`}>
      {children}
    </div>
  </div>
);

const KpiCard = ({ icon, label, value, unit, color, live }) => (
  <Bezel coreClass="p-5">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ring-1 ring-white/20 ${color}`}>
        {icon}
      </div>
      {live && (
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      )}
    </div>
    <div className="flex items-baseline gap-1">
      <span className="font-display text-4xl text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{value}</span>
      {unit && <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">{unit}</span>}
    </div>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 tracking-tight">{label}</p>
  </Bezel>
);

const Dashboard = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [hora, setHora] = useState(new Date());

  const [clima,  setClima]  = useState({ temperatura: null, descripcion: '', humedad: null, velocidad_viento: null });
  const [alertas, setAlertas] = useState([]);
  const [cultivos, setCultivos] = useState([]);
  const [sensor, setSensor]   = useState(null);
  const [tempChart, setTempChart] = useState(tempFallback);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [climaRes, alertasRes, cultivosRes, dispositivosRes, statsRes] = await Promise.allSettled([
        climaAPI.getClima({ lat: -15.8422, lon: -70.0199, ciudad: 'Puno' }),
        climaAPI.getAlertas(),
        cultivosAPI.getAll(),
        dispositivosAPI.getMisDispositivos(),
        informesAPI.getEstadisticas(),
      ]);

      if (climaRes.status === 'fulfilled' && climaRes.value.data?.data)
        setClima(climaRes.value.data.data);

      if (alertasRes.status === 'fulfilled' && alertasRes.value.data?.data?.length)
        setAlertas(alertasRes.value.data.data.slice(0, 4));

      if (cultivosRes.status === 'fulfilled')
        setCultivos(cultivosRes.value.data?.data || []);

      if (statsRes.status === 'fulfilled' && statsRes.value.data?.data)
        setEstadisticas(statsRes.value.data.data);

      if (dispositivosRes.status === 'fulfilled') {
        const devs = dispositivosRes.value.data?.dispositivos || [];
        if (devs.length) {
          const [estadoRes, lecturasRes] = await Promise.allSettled([
            dispositivosAPI.getEstado(devs[0].esp32_id),
            dispositivosAPI.getLecturas(devs[0].id, 24),
          ]);
          if (estadoRes.status === 'fulfilled' && (estadoRes.value.data?.success || estadoRes.value.data?.data))
            setSensor(estadoRes.value.data.data || estadoRes.value.data);
          if (lecturasRes.status === 'fulfilled') {
            const rows = lecturasRes.value.data?.data || lecturasRes.value.data?.lecturas || [];
            if (rows.length >= 2) {
              const step = Math.max(1, Math.floor(rows.length / 6));
              const pts = [];
              for (let i = rows.length - 1; i >= 0 && pts.length < 6; i -= step) {
                const row = rows[i];
                pts.unshift({
                  h: new Date(row.timestamp || row.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
                  t: parseFloat((row.temperatura_aire ?? row.temperatura ?? row.valor ?? 0).toFixed(1)),
                });
              }
              if (pts.length >= 2) setTempChart(pts);
            }
          }
        }
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    refreshRef.current = setInterval(fetchAll, 60_000);
    return () => clearInterval(refreshRef.current);
  }, [fetchAll]);

  const tempSensor = sensor?.lecturas?.temperatura_aire ?? sensor?.temperatura_aire ?? null;
  const humedSuelo = sensor?.lecturas?.humedad_suelo    ?? sensor?.humedad_suelo    ?? null;

  const kpis = useMemo(() => [
    { icon: Ic.leaf,  label: 'Cultivos activos',   value: loading ? '…' : String(cultivos.length), unit: '',   color: 'bg-emerald-500', live: false },
    { icon: Ic.therm, label: 'Temperatura',         value: tempSensor != null ? tempSensor.toFixed(1) : (clima.temperatura != null ? Math.round(clima.temperatura).toString() : '…'), unit: '°C', color: 'bg-orange-500', live: true },
    { icon: Ic.drop,  label: 'Humedad del suelo',   value: humedSuelo != null ? Math.round(humedSuelo).toString() : (clima.humedad != null ? Math.round(clima.humedad).toString() : '…'), unit: '%',  color: 'bg-sky-500',    live: true },
    { icon: Ic.trend, label: 'Detecciones plagas',  value: loading ? '…' : String(estadisticas?.metricas?.total_detecciones ?? 0), unit: '',   color: 'bg-violet-500', live: false },
  ], [cultivos.length, tempSensor, humedSuelo, clima, estadisticas, loading]);

  const allAlerts = useMemo(() => {
    const list = [];
    if (sensor) {
      const t = sensor.lecturas?.temperatura_aire ?? sensor.temperatura_aire;
      const h = sensor.lecturas?.humedad_suelo    ?? sensor.humedad_suelo;
      if (t != null && t > 20) list.push({ msg: `Temperatura alta: ${t.toFixed(1)}°C`,     dot: 'bg-red-400',     label: 'Alerta' });
      if (t != null && t < 5)  list.push({ msg: `Riesgo helada: ${t.toFixed(1)}°C`,          dot: 'bg-red-400',     label: 'Alerta' });
      if (h != null && h < 40) list.push({ msg: `Humedad baja: ${Math.round(h)}% — Riego`,   dot: 'bg-amber-400',   label: 'Aviso'  });
      if (sensor.conectado)    list.push({ msg: 'Sensor ESP32 activo',                        dot: 'bg-emerald-400', label: 'OK'     });
    }
    alertas.forEach(a => list.push({
      msg: a.mensaje || a.descripcion || a.titulo || '',
      dot: a.nivel === 'alto' ? 'bg-red-400' : 'bg-amber-400',
      label: a.nivel === 'alto' ? 'Alerta' : 'Aviso',
    }));
    if (!list.length) list.push({ msg: 'Sistema operando con normalidad', dot: 'bg-emerald-400', label: 'OK' });
    return list.slice(0, 5);
  }, [sensor, alertas]);

  const quickLinks = [
    { icon: Ic.sprout, label: 'Cultivos',   path: '/cultivos',   color: 'text-emerald-600 dark:text-emerald-400', bg: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20' },
    { icon: Ic.cloud,  label: 'Clima',      path: '/clima',      color: 'text-sky-600 dark:text-sky-400',         bg: 'hover:bg-sky-50 dark:hover:bg-sky-900/20' },
    { icon: Ic.act,    label: 'Monitoreo',  path: '/monitoreo',  color: 'text-orange-600 dark:text-orange-400',   bg: 'hover:bg-orange-50 dark:hover:bg-orange-900/20' },
    { icon: Ic.bug,    label: 'Plagas',     path: '/plagas',     color: 'text-red-600 dark:text-red-400',         bg: 'hover:bg-red-50 dark:hover:bg-red-900/20' },
    { icon: Ic.chart,  label: 'Informes',  path: '/informes',   color: 'text-violet-600 dark:text-violet-400',   bg: 'hover:bg-violet-50 dark:hover:bg-violet-900/20' },
    { icon: Ic.cpu,    label: 'Sensores',   path: '/dispositivos',color: 'text-gray-600 dark:text-gray-400',      bg: 'hover:bg-gray-100 dark:hover:bg-gray-800' },
    { icon: Ic.drop,   label: 'Insumos',    path: '/insumos',    color: 'text-cyan-600 dark:text-cyan-400',       bg: 'hover:bg-cyan-50 dark:hover:bg-cyan-900/20' },
    { icon: Ic.chat,   label: 'Asesoría',   path: '/asesoria',   color: 'text-teal-600 dark:text-teal-400',       bg: 'hover:bg-teal-50 dark:hover:bg-teal-900/20' },
  ];

  const timeStr = hora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const dateStr = hora.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const firstName = user?.nombre?.split(' ')[0] || 'Agricultor';
  const descClima = WEATHER_LABELS[clima.descripcion?.toLowerCase()] ?? clima.descripcion ?? '—';

  return (
    <div className="relative min-h-full overflow-hidden bg-gray-50 dark:bg-gray-950 px-4 py-6 sm:px-6 sm:py-8">

      {/* Ambient accents, consistent with Auth showcase */}
      <div aria-hidden className="pointer-events-none absolute -top-40 -right-24 w-[34rem] h-[34rem] rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-[140px]" />
      <div aria-hidden className="pointer-events-none absolute bottom-[-12rem] left-[-8rem] w-[34rem] h-[34rem] rounded-full bg-teal-400/10 dark:bg-teal-400/10 blur-[150px]" />

      <div className="relative max-w-7xl mx-auto space-y-6 animate-slide-up">

        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl text-gray-900 dark:text-white tracking-tight">
              Hola, {firstName}
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 capitalize">{dateStr}</p>
          </div>
          <div className="text-right hidden sm:block shrink-0">
            <p className="font-display text-3xl text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{timeStr}</p>
            <div className="flex items-center justify-end gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">Sistema activo</span>
            </div>
          </div>
        </div>

        {/* KPIs — bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
        </div>

        {/* Chart + side column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

          <Bezel className="lg:col-span-2" coreClass="p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-display text-xl text-gray-900 dark:text-white tracking-tight">Temperatura del día</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {sensor ? 'Sensor ESP32 · datos reales' : 'Valores de referencia'}
                </p>
              </div>
              <span className="flex items-center justify-center w-9 h-9 rounded-full text-orange-500 bg-orange-50 dark:bg-orange-500/10 ring-1 ring-orange-500/15">
                {Ic.therm}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={tempChart} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="gTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:[&>line]:stroke-gray-800" />
                <XAxis dataKey="h" tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="t" stroke="#ef4444" strokeWidth={2} fill="url(#gTemp)" name="°C" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Bezel>

          <div className="flex flex-col gap-4 sm:gap-5">

            <Bezel coreClass="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl text-gray-900 dark:text-white tracking-tight">Clima · Puno</h3>
                <button onClick={() => navigate('/clima')} className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 hover:text-emerald-500 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] touch-manipulation">
                  Ver más {Ic.right}
                </button>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <span className="font-display text-5xl text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">
                  {clima.temperatura != null ? `${Math.round(clima.temperatura)}°` : '…'}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-tight">{descClima || '…'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Hoy en Puno, Perú</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { icon: Ic.drop, label: 'Humedad', v: clima.humedad != null ? `${clima.humedad}%` : '…' },
                  { icon: Ic.wind, label: 'Viento',  v: clima.velocidad_viento != null ? `${Math.round(clima.velocidad_viento * 3.6)} km/h` : '…' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-sm bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 px-3 py-2.5">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full text-gray-500 dark:text-gray-400 bg-white dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 shrink-0">{s.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{s.v}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Bezel>

            <Bezel className="flex-1" coreClass="p-6 h-full">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full text-amber-500 bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-500/15 shrink-0">{Ic.bell}</span>
                <h3 className="font-display text-xl text-gray-900 dark:text-white tracking-tight">Alertas</h3>
                <span className="ml-auto flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 tabular-nums">{allAlerts.length}</span>
              </div>
              <div className="space-y-3">
                {allAlerts.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${a.dot}`} />
                    <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 leading-snug">{a.msg}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] shrink-0 ${
                      a.label === 'Alerta' ? 'text-red-500' : a.label === 'Aviso' ? 'text-amber-500' : 'text-emerald-500'
                    }`}>{a.label}</span>
                  </div>
                ))}
              </div>
            </Bezel>

          </div>
        </div>

        {/* Módulos */}
        <Bezel coreClass="p-6">
          <h3 className="font-display text-xl text-gray-900 dark:text-white tracking-tight mb-5">Módulos</h3>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
            {quickLinks.map((n, i) => (
              <button
                key={i}
                onClick={() => navigate(n.path)}
                className={`group flex flex-col items-center gap-2 py-4 rounded-sm ring-1 ring-black/5 dark:ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] touch-manipulation ${n.bg}`}
              >
                <span className={`flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 ${n.color}`}>{n.icon}</span>
                <span className={`text-[10px] font-semibold tracking-tight ${n.color}`}>{n.label}</span>
              </button>
            ))}
          </div>
        </Bezel>

      </div>
    </div>
  );
};

export default Dashboard;
