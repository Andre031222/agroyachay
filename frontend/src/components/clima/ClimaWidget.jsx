import React, { useEffect, useState, useCallback } from 'react';
import { climaAPI } from '../../services/api';
import { notify } from '../../utils/swal';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const WEATHER_LABELS = {
  'clear sky': 'Despejado', 'few clouds': 'Pocas nubes',
  'scattered clouds': 'Nublado parcial', 'broken clouds': 'Nublado parcial',
  'overcast clouds': 'Nublado', 'light rain': 'Lluvia ligera',
  'moderate rain': 'Lluvia', 'heavy intensity rain': 'Lluvia intensa',
  'thunderstorm': 'Tormenta', 'snow': 'Nieve', 'mist': 'Neblina',
  'fog': 'Niebla', 'haze': 'Bruma', 'drizzle': 'Llovizna',
};

const WEATHER_EMOJI = {
  '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
  '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
  '50d': '🌫️', '50n': '🌫️',
};

const DAYS  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const Ic = {
  drop:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  wind:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>,
  eye:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  therm:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>,
  sun:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  pin:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  refresh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  gauge:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M12 2a10 10 0 1 0 10 10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[#04140d] px-3 py-2 text-xs text-white ring-1 ring-white/15">
      <p className="mb-1 font-semibold tracking-tight">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}{p.unit || ''}</strong></p>
      ))}
    </div>
  );
};

const StatBox = ({ icon, label, value, unit, color }) => (
  <div className="group flex items-center gap-3 rounded-2xl bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 p-3.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5">
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${color} text-white ring-1 ring-white/20`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">{label}</p>
      <p className="font-display text-sm font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
        {value}<span className="ml-0.5 text-xs font-semibold text-gray-400">{unit}</span>
      </p>
    </div>
  </div>
);

const ClimaWidget = () => {
  const [clima,    setClima]    = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [locating, setLocating] = useState(false);
  const [ciudad,   setCiudad]   = useState('Puno, Perú');
  const [coords,   setCoords]   = useState({ lat: -15.8422, lon: -70.0199 });

  const fetchData = useCallback(async (lat, lon, city) => {
    setLoading(true);
    try {
      const [climaRes, pronRes] = await Promise.all([
        climaAPI.getClima({ lat, lon, ciudad: city }),
        climaAPI.getPronostico({ lat, lon }),
      ]);

      if (climaRes.data?.data) setClima(climaRes.data.data);

      const raw = pronRes.data?.data || [];
      const byDay = {};
      raw.forEach(item => {
        const key = new Date(item.fecha_hora).toLocaleDateString('es-PE');
        if (!byDay[key]) byDay[key] = { fecha: new Date(item.fecha_hora), temps: [], humeds: [], vientos: [], icono: item.icono, desc: item.descripcion };
        byDay[key].temps.push(item.temperatura);
        byDay[key].humeds.push(item.humedad);
        byDay[key].vientos.push(item.velocidad_viento);
      });

      const days = Object.values(byDay).slice(0, 7).map(d => ({
        fecha:    d.fecha,
        icono:    d.icono,
        desc:     d.desc,
        tempMax:  Math.round(Math.max(...d.temps)),
        tempMin:  Math.round(Math.min(...d.temps)),
        humedad:  Math.round(d.humeds.reduce((a, b) => a + b, 0) / d.humeds.length),
        viento:   Math.round(d.vientos.reduce((a, b) => a + b, 0) / d.vientos.length),
      }));
      setForecast(days);
    } catch {
      notify.error('Error al cargar el clima');
    } finally { setLoading(false); }
  }, []);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      fetchData(coords.lat, coords.lon, ciudad);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`);
          const d = await res.json();
          const city = d.address.city || d.address.town || d.address.village || d.address.state || 'Tu ubicación';
          localStorage.setItem('userLocation', JSON.stringify({ lat, lon, ciudad: city }));
          setCiudad(city);
          setCoords({ lat, lon });
          fetchData(lat, lon, city);
          notify.success(`Ubicación: ${city}`);
        } catch {
          fetchData(lat, lon, 'Tu ubicación');
        } finally { setLocating(false); }
      },
      () => {
        fetchData(coords.lat, coords.lon, ciudad);
        setLocating(false);
      }
    );
  }, [coords, ciudad, fetchData]);

  useEffect(() => {
    const saved = localStorage.getItem('userLocation');
    if (saved) {
      try {
        const { lat, lon, ciudad: c } = JSON.parse(saved);
        setCiudad(c); setCoords({ lat, lon });
        fetchData(lat, lon, c);
      } catch { fetchData(coords.lat, coords.lon, ciudad); }
    } else {
      detectLocation();
    }
  }, []);

  const dayLabel = (i, fecha) => {
    if (i === 0) return 'Hoy';
    if (i === 1) return 'Mañana';
    return DAYS[new Date(fecha).getDay()];
  };

  if (loading || locating) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <p className="text-sm text-gray-400 dark:text-gray-500">{locating ? 'Detectando ubicación…' : 'Cargando clima…'}</p>
      </div>
    );
  }

  if (!clima) return null;

  const desc = WEATHER_LABELS[clima.descripcion?.toLowerCase()] ?? clima.descripcion ?? '—';
  const emoji = WEATHER_EMOJI[clima.icono] || '🌡️';
  const amanecer = clima.amanecer ? new Date(clima.amanecer).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '—';
  const atardecer = clima.atardecer ? new Date(clima.atardecer).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '—';

  const chartData = forecast.map((d, i) => ({
    dia: dayLabel(i, d.fecha),
    max: d.tempMax,
    min: d.tempMin,
    humedad: d.humedad,
  }));

  return (
    <div className="min-h-full space-y-4 bg-gray-50 dark:bg-gray-950 p-4 sm:p-6">

      {/* Hero clima — panel oscuro double-bezel con orbe mesh */}
      <div className="rounded-2xl bg-white/10 dark:bg-white/5 p-1.5 ring-1 ring-black/5 dark:ring-white/15">
        <div className="relative overflow-hidden rounded-[calc(1rem-0.375rem)] bg-[#04140d] p-5 text-white sm:p-7">
          <div aria-hidden className="pointer-events-none absolute -top-28 -left-20 h-[24rem] w-[24rem] rounded-full bg-emerald-500/25 blur-[120px]" />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-16 h-[26rem] w-[26rem] rounded-full bg-teal-400/15 blur-[130px]" />

          <div className="relative mb-6 flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 text-base font-semibold text-white">
                <span className="text-emerald-300">{Ic.pin}</span>
                {ciudad}
              </span>
              <p className="mt-2.5 text-xs capitalize text-emerald-100/60">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <button
              onClick={() => { localStorage.removeItem('userLocation'); detectLocation(); }}
              className="rounded-full p-2 text-emerald-100/60 ring-1 ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-white hover:ring-white/25 active:scale-90 touch-manipulation"
              title="Actualizar ubicación"
            >
              {Ic.refresh}
            </button>
          </div>

          <div className="relative mb-7 flex items-center gap-5">
            <span className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-3xl bg-white/10 text-5xl ring-1 ring-white/15">{emoji}</span>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-6xl font-bold leading-none tracking-tight text-white">
                  {Math.round(clima.temperatura)}°
                </span>
                {clima.sensacion_termica != null && (
                  <span className="text-sm text-emerald-100/60">Sensación {Math.round(clima.sensacion_termica)}°</span>
                )}
              </div>
              <p className="mt-1.5 text-base font-semibold text-emerald-50/90">{desc}</p>
              {forecast[0] && (
                <p className="mt-0.5 text-xs text-emerald-100/50">
                  Máx {forecast[0].tempMax}° · Mín {forecast[0].tempMin}°
                </p>
              )}
            </div>
          </div>

          <div className="relative grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatBoxDark icon={Ic.drop}  label="Humedad"   value={clima.humedad ?? '—'}  unit="%"     color="text-sky-300" />
            <StatBoxDark icon={Ic.wind}  label="Viento"    value={clima.velocidad_viento != null ? Math.round(clima.velocidad_viento) : '—'} unit=" km/h" color="text-teal-300" />
            <StatBoxDark icon={Ic.gauge} label="Presión"   value={clima.presion ?? '—'}  unit=" hPa"  color="text-violet-300" />
            <StatBoxDark icon={Ic.therm} label="Sensación" value={clima.sensacion_termica != null ? Math.round(clima.sensacion_termica) : '—'} unit="°" color="text-orange-300" />
          </div>

          <div className="relative mt-2 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2.5 rounded-2xl bg-white/[0.06] px-4 py-3 ring-1 ring-white/10">
              <span className="text-amber-300">{Ic.sun}</span>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-amber-200/80">Amanecer</p>
                <p className="font-display text-sm font-bold tracking-tight text-white">{amanecer}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl bg-white/[0.06] px-4 py-3 ring-1 ring-white/10">
              <span className="text-orange-300">{Ic.moon}</span>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-orange-200/80">Atardecer</p>
                <p className="font-display text-sm font-bold tracking-tight text-white">{atardecer}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {forecast.length > 0 && (
        <div className="rounded-2xl bg-white/10 dark:bg-white/5 p-1.5 ring-1 ring-black/5 dark:ring-white/10">
          <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900 p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold tracking-tight text-gray-900 dark:text-white">Pronóstico 7 días</h3>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">Semana</span>
            </div>
            <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1">
              {forecast.map((d, i) => (
                <div
                  key={i}
                  className={`flex-shrink-0 w-[88px] snap-start rounded-2xl p-3 text-center ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 ${
                    i === 0
                      ? 'bg-emerald-600 text-white ring-emerald-400/40'
                      : 'bg-gray-50/80 dark:bg-white/[0.04] text-gray-700 dark:text-gray-300 ring-black/5 dark:ring-white/10'
                  }`}
                >
                  <p className={`mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] ${i === 0 ? 'text-emerald-100' : 'text-gray-400 dark:text-gray-500'}`}>
                    {dayLabel(i, d.fecha)}
                  </p>
                  <p className="mb-1.5 text-2xl">{WEATHER_EMOJI[d.icono] || '🌡️'}</p>
                  <p className={`font-display text-base font-bold leading-none tracking-tight ${i === 0 ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{d.tempMax}°</p>
                  <p className={`mt-0.5 text-xs font-medium ${i === 0 ? 'text-emerald-200' : 'text-gray-400'}`}>{d.tempMin}°</p>
                  <div className={`mt-2 flex items-center justify-center gap-0.5 text-[10px] font-semibold ${i === 0 ? 'text-emerald-100' : 'text-sky-500'}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-2.5 h-2.5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                    {d.humedad}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div className="rounded-2xl bg-white/10 dark:bg-white/5 p-1.5 ring-1 ring-black/5 dark:ring-white/10">
            <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900 p-5 sm:p-6">
              <span className="inline-block rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-rose-600 ring-1 ring-rose-500/20 dark:text-rose-400">Temperatura</span>
              <p className="mb-4 mt-2 text-xs text-gray-400 dark:text-gray-500">Máxima y mínima semanal · °C</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gMax" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gMin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:[&>line]:stroke-gray-800" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11, fontWeight: 600, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={2} fill="url(#gMax)" name="Máx" dot={false} unit="°" />
                  <Area type="monotone" dataKey="min" stroke="#3b82f6" strokeWidth={2} fill="url(#gMin)" name="Mín" dot={false} unit="°" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 dark:bg-white/5 p-1.5 ring-1 ring-black/5 dark:ring-white/10">
            <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900 p-5 sm:p-6">
              <span className="inline-block rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-sky-600 ring-1 ring-sky-500/20 dark:text-sky-400">Humedad</span>
              <p className="mb-4 mt-2 text-xs text-gray-400 dark:text-gray-500">Promedio diario semanal · %</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:[&>line]:stroke-gray-800" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11, fontWeight: 600, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="humedad" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Humedad" unit="%" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

const StatBoxDark = ({ icon, label, value, unit, color }) => (
  <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3.5 ring-1 ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-white/[0.09]">
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-100/50">{label}</p>
      <p className="font-display text-sm font-bold leading-tight tracking-tight text-white">
        {value}<span className="ml-0.5 text-xs font-semibold text-emerald-100/50">{unit}</span>
      </p>
    </div>
  </div>
);

export default ClimaWidget;
