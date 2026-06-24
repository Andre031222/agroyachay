import React, { useState, useEffect, useCallback } from 'react';
import { cultivosAPI } from '../../services/api';
import { notify, confirmAction } from '../../utils/swal';

const Ic = {
  sprout:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M7 20s4-4.5 4-10a8 8 0 0 1 8-8c0 6-4 10-8 10"/><path d="M7 20c0-3 2-5 4-6" strokeLinecap="round"/></svg>,
  plus:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  therm:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>,
  drop:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  activity:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  gauge:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  sun:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  wind:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>,
  check:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"/></svg>,
  x:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  pin:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  cal:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  trend:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  layers:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  info:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  list:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  star:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  arrow:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

const CULTIVOS_PUNO = {
  'Papa':    { variedades:['Canchán','Yungay','Perricholi','Única','Peruanita','Amarilis','Huayro','Negra'], ciclo:150, rendimiento:25,  temp:{min:10,max:20,ideal:15}, humSuelo:{min:40,max:60,ideal:50}, ph:{min:5.5,max:7.0,ideal:6.2}, luz:{min:70,max:100,ideal:85}, accent:'bg-yellow-500', light:'bg-yellow-50 dark:bg-yellow-900/20', border:'border-yellow-200 dark:border-yellow-800/40', text:'text-yellow-700 dark:text-yellow-400' },
  'Quinua':  { variedades:['Blanca Juli','Kancolla','Salcedo INIA','Pasankalla','Negra Collana'],             ciclo:180, rendimiento:2.5, temp:{min:5,max:15,ideal:10},  humSuelo:{min:30,max:50,ideal:40}, ph:{min:6.0,max:8.0,ideal:7.0}, luz:{min:80,max:100,ideal:90}, accent:'bg-amber-500',  light:'bg-amber-50 dark:bg-amber-900/20',   border:'border-amber-200 dark:border-amber-800/40',   text:'text-amber-700 dark:text-amber-400'   },
  'Cañihua': { variedades:['Cupi','Illimani','Ramis'],                                                        ciclo:150, rendimiento:1.2, temp:{min:0,max:10,ideal:5},   humSuelo:{min:25,max:45,ideal:35}, ph:{min:5.5,max:7.5,ideal:6.5}, luz:{min:75,max:100,ideal:85}, accent:'bg-emerald-500',light:'bg-emerald-50 dark:bg-emerald-900/20',border:'border-emerald-200 dark:border-emerald-800/40',text:'text-emerald-700 dark:text-emerald-400'},
  'Habas':   { variedades:['Cusco Verde','Rosada Junín','San Isidro'],                                        ciclo:180, rendimiento:4.5, temp:{min:12,max:20,ideal:16}, humSuelo:{min:50,max:70,ideal:60}, ph:{min:6.0,max:7.5,ideal:6.8}, luz:{min:70,max:95,ideal:80},  accent:'bg-green-500',  light:'bg-green-50 dark:bg-green-900/20',   border:'border-green-200 dark:border-green-800/40',   text:'text-green-700 dark:text-green-400'   },
  'Maíz':    { variedades:['Maíz morado','Choclo blanco','Cancha','Kulli'],                                   ciclo:200, rendimiento:8,   temp:{min:15,max:28,ideal:22}, humSuelo:{min:45,max:65,ideal:55}, ph:{min:5.8,max:7.2,ideal:6.5}, luz:{min:80,max:100,ideal:90}, accent:'bg-orange-500', light:'bg-orange-50 dark:bg-orange-900/20', border:'border-orange-200 dark:border-orange-800/40', text:'text-orange-700 dark:text-orange-400' },
};

const ETAPAS = [
  { max:20,  label:'Germinación',         color:'bg-yellow-400' },
  { max:40,  label:'Crecimiento vegetal', color:'bg-green-500'  },
  { max:60,  label:'Floración',           color:'bg-pink-500'   },
  { max:80,  label:'Formación',           color:'bg-blue-500'   },
  { max:100, label:'Maduración',          color:'bg-orange-500' },
  { max:999, label:'Lista para cosecha',  color:'bg-emerald-500'},
];

const ACTIVIDADES_TIPOS = [
  { id:'riego',         label:'Riego',           emoji:'💧', color:'text-sky-600 dark:text-sky-400',     bg:'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800/40'     },
  { id:'fertilizacion', label:'Fertilización',   emoji:'🌿', color:'text-green-600 dark:text-green-400', bg:'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40' },
  { id:'fumigacion',    label:'Fumigación',       emoji:'🛡️', color:'text-orange-600 dark:text-orange-400',bg:'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/40'},
  { id:'aporque',       label:'Aporque',           emoji:'⛏️', color:'text-amber-600 dark:text-amber-400', bg:'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40' },
  { id:'deshierbe',     label:'Deshierbe',         emoji:'✂️', color:'text-teal-600 dark:text-teal-400',   bg:'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800/40'   },
  { id:'tratamiento',   label:'Tratamiento',       emoji:'💊', color:'text-red-600 dark:text-red-400',     bg:'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40'       },
  { id:'observacion',   label:'Observación',       emoji:'📝', color:'text-violet-600 dark:text-violet-400',bg:'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800/40'},
  { id:'cosecha',       label:'Cosecha parcial',   emoji:'🌾', color:'text-yellow-600 dark:text-yellow-400',bg:'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/40'},
];

const LS_KEY = 'ts_actividades_v1';

const getActividades = (cultivoId) => {
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    return (all[String(cultivoId)] || []).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  } catch { return []; }
};

const saveActividad = (cultivoId, actividad) => {
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    const key = String(cultivoId);
    all[key] = [{ ...actividad, id: Date.now(), fecha: actividad.fecha || new Date().toISOString() }, ...(all[key] || [])].slice(0, 100);
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch {}
};

const deleteActividad = (cultivoId, actividadId) => {
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    const key = String(cultivoId);
    all[key] = (all[key] || []).filter(a => a.id !== actividadId);
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch {}
};

const getSensorStatus = (val, range) => {
  if (val < range.min || val > range.max) return 'critical';
  if (Math.abs(val - range.ideal) <= (range.ideal - range.min) * 0.3) return 'good';
  return 'warn';
};

const STATUS_COLOR = { good:'text-emerald-500', warn:'text-amber-500', critical:'text-red-500' };
const STATUS_BG    = {
  good:     'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/40',
  warn:     'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/40',
  critical: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/40',
};

const getRecomendaciones = (sensors, info, cultivo) => {
  const recs = [];
  if (!info) return recs;

  const t = sensors.temperatura, h = sensors.humedadSuelo, ph = sensors.ph;
  const pron = (() => {
    if (!cultivo.fecha_siembra) return null;
    const dias = Math.floor((new Date() - new Date(cultivo.fecha_siembra)) / 86400000);
    return Math.min(100, (dias / info.ciclo) * 100);
  })();

  if (t < info.temp.min)       recs.push({ nivel:'alto',  emoji:'🥶', txt:'Temperatura bajo el mínimo — riesgo de helada. Cubre con agrotextil o malla antigranizo.' });
  else if (t > info.temp.max)  recs.push({ nivel:'alto',  emoji:'🔥', txt:'Temperatura sobre el máximo — estrés térmico. Aumenta la frecuencia de riego.' });
  else if (t < info.temp.ideal - 3) recs.push({ nivel:'medio', emoji:'🌡️', txt:'Temperatura un poco baja. Considera cobertura nocturna si baja más.' });

  if (h < info.humSuelo.min)   recs.push({ nivel:'alto',  emoji:'🏜️', txt:'Humedad del suelo crítica — aplica riego inmediatamente para evitar marchitamiento.' });
  else if (h > info.humSuelo.max) recs.push({ nivel:'alto',  emoji:'🌊', txt:'Exceso de humedad — riesgo de hongos y pudrición. Verifica el drenaje.' });
  else if (h < info.humSuelo.ideal - 8) recs.push({ nivel:'medio', emoji:'💧', txt:'Humedad ligeramente baja. Programa riego en las próximas horas.' });

  if (ph < info.ph.min)        recs.push({ nivel:'alto',  emoji:'⚗️', txt:`pH bajo (${ph.toFixed(1)}). Aplica cal agrícola para elevar el pH gradualmente.` });
  else if (ph > info.ph.max)   recs.push({ nivel:'alto',  emoji:'⚗️', txt:`pH alto (${ph.toFixed(1)}). Aplica azufre elemental para reducir el pH.` });

  if (sensors.viento > 25)     recs.push({ nivel:'medio', emoji:'💨', txt:'Vientos fuertes. Instala cortavientos temporales para proteger plantas jóvenes.' });

  if (pron !== null) {
    if (pron >= 35 && pron < 45) recs.push({ nivel:'info', emoji:'🌸', txt:'Etapa de floración próxima. Aplica fertilizante potásico para fortalecer la flor.' });
    if (pron >= 75 && pron < 85) recs.push({ nivel:'info', emoji:'📦', txt:'Etapa de maduración. Reduce el riego gradualmente para favorecer la cosecha.' });
    if (pron >= 95)               recs.push({ nivel:'info', emoji:'🌾', txt:'Cultivo listo para cosecha. Planifica la logística de recolección y almacenamiento.' });
  }

  if (!recs.length) recs.push({ nivel:'ok', emoji:'✅', txt:'Todas las condiciones del cultivo están dentro de los rangos óptimos. Continúa el manejo habitual.' });
  return recs;
};

// Double-bezel shell: presentational wrapper consistent with Auth (Login / AuthShared)
const Card = ({ children, className = '' }) => (
  <div className="rounded-2xl p-1.5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10">
    <div className={`rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] ${className}`}>
      {children}
    </div>
  </div>
);

const Inp =
  'w-full h-11 px-3.5 rounded-xl text-sm transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ' +
  'bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 ' +
  'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:bg-white dark:focus:bg-white/[0.06]';
const Lbl = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5';

const GestionCultivosIoT = () => {
  const [cultivos, setCultivos]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showModal, setShowModal]           = useState(false);
  const [editingCultivo, setEditingCultivo] = useState(null);
  const [selectedCultivo, setSelectedCultivo] = useState(null);
  const [detailTab, setDetailTab]           = useState('sensores');
  const [showActModal, setShowActModal]     = useState(false);
  const [actForm, setActForm]               = useState({ tipo: 'riego', descripcion: '', fecha: new Date().toISOString().split('T')[0] });
  const [actRefresh, setActRefresh]         = useState(0);

  const [sensors, setSensors] = useState({
    temperatura: 15.5, humedad: 65, humedadSuelo: 45,
    ph: 6.5, nutrientes: 72, luz: 85, viento: 12, lluvia: 0,
  });

  const [form, setForm] = useState({
    nombre:'', tipo_cultivo:'Papa', variedad:'', area:'',
    fecha_siembra:'', notas:'',
  });

  useEffect(() => {
    fetchCultivos();
    const t = setInterval(() => setSensors(p => ({
      temperatura:  Math.max(5,   Math.min(25,  p.temperatura   + (Math.random() - 0.5) * 0.5)),
      humedad:      Math.max(30,  Math.min(90,  p.humedad       + (Math.random() - 0.5) * 2)),
      humedadSuelo: Math.max(20,  Math.min(80,  p.humedadSuelo  + (Math.random() - 0.5) * 2)),
      ph:           Math.max(5.0, Math.min(8.0, p.ph            + (Math.random() - 0.5) * 0.1)),
      nutrientes:   Math.max(50,  Math.min(100, p.nutrientes    + (Math.random() - 0.5) * 1)),
      luz:          Math.max(60,  Math.min(100, p.luz           + (Math.random() - 0.5) * 3)),
      viento:       Math.max(0,   Math.min(30,  p.viento        + (Math.random() - 0.5) * 2)),
      lluvia:       Math.max(0,   Math.min(50,  Math.random() < 0.1 ? Math.random() * 10 : p.lluvia * 0.8)),
    })), 5000);
    return () => clearInterval(t);
  }, []);

  const fetchCultivos = async () => {
    try {
      setLoading(true);
      const r = await cultivosAPI.getAll();
      const data = Array.isArray(r.data.data) ? r.data.data : [];
      setCultivos(data.filter(c => c?.id && c?.nombre && c?.tipo_cultivo));
    } catch (e) {
      if (e.response?.status !== 401) notify.error('Error al cargar cultivos');
      setCultivos([]);
    } finally { setLoading(false); }
  };

  const analizarIoT = useCallback((cultivo) => {
    const info = CULTIVOS_PUNO[cultivo.tipo_cultivo];
    if (!info) return null;
    const alertas = [];
    let salud = 100;
    const checks = [
      { val: sensors.temperatura,  range: info.temp,     label:`Temperatura (${sensors.temperatura.toFixed(1)}°C)`,   critMsg:'Riesgo de helada.',             warnMsg:'Temperatura fuera del rango óptimo.', penalty:[25,15] },
      { val: sensors.humedadSuelo, range: info.humSuelo, label:`Humedad suelo (${sensors.humedadSuelo.toFixed(0)}%)`, critMsg:'Riego urgente.',                 warnMsg:'Humedad ligeramente fuera de rango.', penalty:[20,15] },
      { val: sensors.ph,           range: info.ph,       label:`pH (${sensors.ph.toFixed(1)})`,                       critMsg:sensors.ph < info.ph.min ? 'Aplicar cal agrícola.' : 'Aplicar azufre elemental.', warnMsg:'pH ligeramente fuera de rango.', penalty:[10,8] },
    ];
    checks.forEach(({ val, range, label, critMsg, warnMsg, penalty }) => {
      if (val < range.min || val > range.max) {
        alertas.push({ tipo:'critical', msg:label, rec:critMsg });
        salud -= penalty[0];
      } else if (Math.abs(val - range.ideal) > (range.ideal - range.min) * 0.5) {
        alertas.push({ tipo:'warn', msg:label, rec:warnMsg });
        salud -= penalty[1] / 2;
      }
    });
    if (sensors.viento > 25) { alertas.push({ tipo:'warn', msg:`Viento fuerte (${sensors.viento.toFixed(1)} km/h)`, rec:'Instalar cortavientos.' }); salud -= 5; }
    return { alertas, salud: Math.max(0, Math.round(salud)), optimo: alertas.length === 0 };
  }, [sensors]);

  const calcPronostico = useCallback((cultivo) => {
    const info = CULTIVOS_PUNO[cultivo.tipo_cultivo];
    if (!info || !cultivo.fecha_siembra) return null;
    const siembra = new Date(cultivo.fecha_siembra);
    if (isNaN(siembra.getTime())) return null;
    const iot = analizarIoT(cultivo);
    const factor = (iot?.salud || 100) / 100;
    const dias = Math.floor((new Date() - siembra) / 86400000);
    const progreso = Math.min(100, Math.max(0, (dias / info.ciclo) * 100 * factor));
    const cicloAdj = Math.ceil(info.ciclo / factor);
    const diasRest = Math.max(0, cicloAdj - dias);
    const fechaCosecha = new Date(siembra);
    fechaCosecha.setDate(fechaCosecha.getDate() + cicloAdj);
    const etapa = ETAPAS.find(e => progreso < e.max) || ETAPAS[ETAPAS.length - 1];
    const area = parseFloat(cultivo.area_hectareas || cultivo.area) || 0;
    return { progreso: Math.round(progreso), diasRest, fechaCosecha, etapa, rendimiento: (area * info.rendimiento * factor).toFixed(1), salud: iot?.salud || 100, factor, iot };
  }, [analizarIoT]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.area || !form.fecha_siembra) { notify.warning('Completa nombre, área y fecha de siembra'); return; }
    try {
      const payload = { nombre: form.nombre.trim(), tipo_cultivo: form.tipo_cultivo, variedad: form.variedad || '', area_hectareas: parseFloat(form.area), fecha_siembra: form.fecha_siembra, notas: form.notas.trim() };
      if (editingCultivo) {
        await cultivosAPI.updateCultivo(editingCultivo.id, payload);
        notify.success('Cultivo actualizado');
      } else {
        await cultivosAPI.createCultivo(payload);
        notify.success('Cultivo registrado');
      }
      closeModal();
      await fetchCultivos();
    } catch (err) { notify.error(err.response?.data?.message || 'Error al guardar'); }
  };

  const handleEdit = (c) => {
    setEditingCultivo(c);
    setForm({ nombre: c.nombre || '', tipo_cultivo: c.tipo_cultivo || 'Papa', variedad: c.variedad || '', area: (c.area_hectareas || c.area)?.toString() || '', fecha_siembra: c.fecha_siembra ? new Date(c.fecha_siembra).toISOString().split('T')[0] : '', notas: c.notas || '' });
    setShowModal(true);
  };

  const handleDelete = async (c) => {
    const ok = await confirmAction({ title: `¿Eliminar "${c.nombre}"?`, text: 'Se eliminará el cultivo y todos sus datos. Esta acción no se puede deshacer.', confirmText: 'Sí, eliminar', danger: true });
    if (!ok) return;
    try {
      await cultivosAPI.deleteCultivo(c.id);
      notify.success('Cultivo eliminado');
      if (selectedCultivo?.id === c.id) setSelectedCultivo(null);
      await fetchCultivos();
    } catch { notify.error('Error al eliminar'); }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCultivo(null);
    setForm({ nombre:'', tipo_cultivo:'Papa', variedad:'', area:'', fecha_siembra:'', notas:'' });
  };

  const handleSaveActividad = () => {
    if (!selectedCultivo) return;
    saveActividad(selectedCultivo.id, { tipo: actForm.tipo, descripcion: actForm.descripcion.trim(), fecha: actForm.fecha ? new Date(actForm.fecha).toISOString() : new Date().toISOString() });
    notify.success('Actividad registrada');
    setActForm({ tipo:'riego', descripcion:'', fecha: new Date().toISOString().split('T')[0] });
    setShowActModal(false);
    setActRefresh(n => n + 1);
  };

  const handleDeleteActividad = async (actId) => {
    const ok = await confirmAction({ title: '¿Eliminar esta actividad?', confirmText: 'Eliminar', danger: true });
    if (!ok || !selectedCultivo) return;
    deleteActividad(selectedCultivo.id, actId);
    setActRefresh(n => n + 1);
  };

  const stats = {
    total:     cultivos.length,
    area:      cultivos.reduce((s, c) => s + (parseFloat(c.area_hectareas || c.area) || 0), 0).toFixed(1),
    salud:     cultivos.length ? Math.round(cultivos.reduce((s, c) => s + (calcPronostico(c)?.salud || 0), 0) / cultivos.length) : 0,
    creciendo: cultivos.filter(c => { const p = calcPronostico(c); return p && p.progreso < 100; }).length,
  };

  const actividades = selectedCultivo ? getActividades(selectedCultivo.id) : [];
  const detailPron  = selectedCultivo ? calcPronostico(selectedCultivo) : null;
  const detailInfo  = selectedCultivo ? CULTIVOS_PUNO[selectedCultivo.tipo_cultivo] : null;
  const recs        = selectedCultivo && detailInfo ? getRecomendaciones(sensors, detailInfo, selectedCultivo) : [];

  if (loading) return (
    <div className="p-5 bg-gray-50 dark:bg-gray-950 min-h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Cargando cultivos...</p>
      </div>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-7 space-y-5 bg-gray-50 dark:bg-gray-950 min-h-full">

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Cultivos</h1>
        </div>
        <button onClick={() => setShowModal(true)}
          className="group relative h-11 pl-5 pr-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-[0_12px_30px_-10px_rgba(16,185,129,0.7)] flex items-center gap-2 touch-manipulation">
          <span>Nuevo cultivo</span>
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[calc(50%+1px)] group-hover:scale-105">
            {Ic.plus}
          </span>
        </button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-2.5">
          {[
            { icon: Ic.therm,    v: `${sensors.temperatura.toFixed(1)}°C`, l: 'Temperatura' },
            { icon: Ic.drop,     v: `${sensors.humedadSuelo.toFixed(0)}%`, l: 'H. Suelo'   },
            { icon: Ic.activity, v: sensors.ph.toFixed(1),                  l: 'pH suelo'   },
            { icon: Ic.sun,      v: `${sensors.luz.toFixed(0)}%`,           l: 'Luz solar'  },
            { icon: Ic.wind,     v: `${sensors.viento.toFixed(1)} km/h`,    l: 'Viento'     },
            { icon: Ic.drop,     v: `${sensors.humedad.toFixed(0)}%`,       l: 'H. Aire'    },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-xl px-3 py-2 bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">{s.icon}</span>
              <div>
                <p className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white leading-none">{s.v}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-none mt-1">{s.l}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Ic.layers, label:'Cultivos activos',   value: stats.total,      unit:'',   color:'bg-emerald-500' },
          { icon: Ic.pin,    label:'Área total',          value: stats.area,       unit:'ha', color:'bg-sky-500'     },
          { icon: Ic.gauge,  label:'Salud promedio',      value: `${stats.salud}`, unit:'%',  color:'bg-violet-500'  },
          { icon: Ic.trend,  label:'En crecimiento',      value: stats.creciendo,  unit:'',   color:'bg-amber-500'   },
        ].map((k, i) => (
          <Card key={i} className="p-4">
            <div className={`${k.color} w-9 h-9 rounded-xl flex items-center justify-center text-white mb-3 ring-1 ring-black/5`}>{k.icon}</div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl font-bold tracking-tight text-gray-900 dark:text-white leading-none">{k.value}</span>
              {k.unit && <span className="text-xs font-semibold text-gray-400">{k.unit}</span>}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{k.label}</p>
          </Card>
        ))}
      </div>

      <div className={`flex gap-4 ${selectedCultivo ? 'flex-col xl:flex-row' : ''}`}>

        <div className={selectedCultivo ? 'xl:w-[55%]' : 'w-full'}>
          {cultivos.length === 0 ? (
            <Card className="py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-emerald-500/10 ring-1 ring-emerald-300/20 text-emerald-600 dark:text-emerald-400">{Ic.sprout}</div>
              <h3 className="font-display text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-1.5">Sin cultivos registrados</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Agrega tu primer cultivo con monitoreo IoT</p>
              <button onClick={() => setShowModal(true)}
                className="group relative inline-flex items-center gap-2 h-11 pl-5 pr-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-[0_12px_30px_-10px_rgba(16,185,129,0.7)] touch-manipulation">
                <span>Agregar cultivo</span>
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[calc(50%+1px)] group-hover:scale-105">
                  {Ic.arrow}
                </span>
              </button>
            </Card>
          ) : (
            <div className={`grid gap-3 ${selectedCultivo ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'}`}>
              {cultivos.map((c) => {
                const pron = calcPronostico(c);
                const info = CULTIVOS_PUNO[c.tipo_cultivo];
                const isSelected = selectedCultivo?.id === c.id;
                const acts = getActividades(c.id);
                const lastAct = acts[0];

                return (
                  <div key={c.id} onClick={() => { setSelectedCultivo(isSelected ? null : c); setDetailTab('sensores'); }}
                    className={`group rounded-2xl p-1.5 cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.99] touch-manipulation ring-1 ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-500/[0.08] ring-emerald-400/50 dark:ring-emerald-500/40'
                        : 'bg-white/70 dark:bg-white/[0.04] ring-black/5 dark:ring-white/10 hover:ring-emerald-300/50 dark:hover:ring-emerald-700/50'
                    }`}>
                    <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900/90 overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                    <div className={`h-1 ${info?.accent || 'bg-emerald-500'}`} />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${info?.light || 'bg-emerald-50'} ${info?.text || 'text-emerald-700'} ring-1 ring-inset ${info?.border?.replace(/border-/g, 'ring-') || 'ring-emerald-200'}`}>
                              {c.tipo_cultivo}
                            </span>
                            {pron?.iot?.optimo && <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-0.5">{Ic.check} Óptimo</span>}
                          </div>
                          <h3 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white truncate">{c.nombre}</h3>
                          {c.variedad && <p className="text-[11px] text-gray-400 dark:text-gray-500">{c.variedad}</p>}
                        </div>
                        {pron && (
                          <div className={`shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center ring-1 ring-inset ${
                            pron.salud >= 80 ? 'bg-emerald-50 dark:bg-emerald-900/20 ring-emerald-200/70 dark:ring-emerald-800/40' :
                            pron.salud >= 60 ? 'bg-amber-50 dark:bg-amber-900/20 ring-amber-200/70 dark:ring-amber-800/40' :
                                              'bg-red-50 dark:bg-red-900/20 ring-red-200/70 dark:ring-red-800/40'
                          }`}>
                            <p className={`text-xs font-bold leading-none ${pron.salud >= 80 ? 'text-emerald-600 dark:text-emerald-400' : pron.salud >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                              {pron.salud}%
                            </p>
                            <p className="text-[9px] text-gray-400 mt-0.5">salud</p>
                          </div>
                        )}
                      </div>

                      {pron && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${pron.etapa.color}`}>{pron.etapa.label}</span>
                            <span className="text-[11px] font-semibold tracking-tight text-gray-700 dark:text-gray-300">{pron.progreso}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${pron.etapa.color}`} style={{ width: `${pron.progreso}%` }} />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-1.5 mb-3">
                        {[
                          { icon: Ic.cal,   v: c.area_hectareas ? `${c.area_hectareas} ha` : '—' },
                          { icon: Ic.trend, v: pron ? `${pron.diasRest}d` : '—' },
                          { icon: Ic.gauge, v: pron ? `~${pron.rendimiento} kg` : '—' },
                        ].map((m, i) => (
                          <div key={i} className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10">
                            <span className="text-gray-400 dark:text-gray-500 shrink-0">{m.icon}</span>
                            <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 truncate">{m.v}</span>
                          </div>
                        ))}
                      </div>

                      {lastAct && (
                        <div className="flex items-center gap-1.5 mb-2 text-[10px] text-gray-400 dark:text-gray-500">
                          <span>{ACTIVIDADES_TIPOS.find(a => a.id === lastAct.tipo)?.emoji || '📝'}</span>
                          <span>{ACTIVIDADES_TIPOS.find(a => a.id === lastAct.tipo)?.label || lastAct.tipo}</span>
                          <span>·</span>
                          <span>{new Date(lastAct.fecha).toLocaleDateString('es-PE', { day:'numeric', month:'short' })}</span>
                          {acts.length > 1 && <span className="ml-auto">{acts.length} actividades</span>}
                        </div>
                      )}

                      {pron?.iot?.alertas?.length > 0 && (
                        <div className="space-y-1 mb-3">
                          {pron.iot.alertas.slice(0, 1).map((a, i) => (
                            <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl ring-1 ring-inset text-xs ${STATUS_BG[a.tipo].replace(/border-/g, 'ring-')}`}>
                              <span className={STATUS_COLOR[a.tipo]}>{Ic.info}</span>
                              <span className="text-gray-600 dark:text-gray-400 truncate">{a.msg}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-1.5">
                        <button onClick={e => { e.stopPropagation(); handleEdit(c); }}
                          className="flex-1 flex items-center justify-center gap-1 h-9 rounded-xl bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 hover:bg-sky-50 dark:hover:bg-sky-900/20 text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 font-semibold text-xs transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] touch-manipulation">
                          {Ic.edit} Editar
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleDelete(c); }}
                          className="flex-1 flex items-center justify-center gap-1 h-9 rounded-xl bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 font-semibold text-xs transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] touch-manipulation">
                          {Ic.trash} Eliminar
                        </button>
                      </div>
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedCultivo && detailPron && detailInfo && (
          <div className="xl:flex-1 xl:min-w-0 animate-slide-up">
            <Card>
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-black/5 dark:border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${detailInfo.light} ${detailInfo.text} ring-1 ring-inset ${detailInfo.border.replace(/border-/g, 'ring-')}`}>{selectedCultivo.tipo_cultivo}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${detailPron.etapa.color}`}>{detailPron.etapa.label}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-white mt-1.5">{selectedCultivo.nombre}</h3>
                  {selectedCultivo.variedad && <p className="text-xs text-gray-400 dark:text-gray-500">{selectedCultivo.variedad}</p>}
                </div>
                <button onClick={() => setSelectedCultivo(null)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 touch-manipulation">{Ic.x}</button>
              </div>

              <div className="flex border-b border-black/5 dark:border-white/10">
                {[
                  { id:'sensores',     label:'Sensores',    icon: Ic.activity },
                  { id:'actividades',  label:'Actividades', icon: Ic.list     },
                  { id:'recomendaciones', label:'Consejos', icon: Ic.star     },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setDetailTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors touch-manipulation ${
                      detailTab === tab.id
                        ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}>
                    <span>{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-5 space-y-4">

                {detailTab === 'sensores' && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Salud del cultivo</span>
                        <span className={`font-display text-lg font-bold tracking-tight ${detailPron.salud >= 80 ? 'text-emerald-500' : detailPron.salud >= 60 ? 'text-amber-500' : 'text-red-500'}`}>{detailPron.salud}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-2.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${detailPron.salud >= 80 ? 'bg-emerald-500' : detailPron.salud >= 60 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${detailPron.salud}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Progreso del ciclo</span>
                        <span className="text-sm font-semibold tracking-tight text-gray-800 dark:text-gray-200">{detailPron.progreso}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${detailPron.etapa.color}`} style={{ width: `${detailPron.progreso}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 text-right">Cosecha estimada: {detailPron.fechaCosecha.toLocaleDateString('es-PE', { day:'numeric', month:'short', year:'numeric' })}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label:'Área',             value:`${selectedCultivo.area_hectareas || 0} ha` },
                        { label:'Días restantes',   value:`${detailPron.diasRest} días`              },
                        { label:'Rendim. estimado', value:`~${detailPron.rendimiento} kg`            },
                        { label:'Factor IoT',       value:`${(detailPron.factor * 100).toFixed(0)}%` },
                      ].map((s, i) => (
                        <div key={i} className="rounded-xl px-3 py-2.5 bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10">
                          <p className="text-[10px] text-gray-400 dark:text-gray-500">{s.label}</p>
                          <p className="text-sm font-semibold tracking-tight text-gray-800 dark:text-gray-200">{s.value}</p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2.5">Condiciones IoT vs Óptimo</p>
                      <div className="space-y-2.5">
                        {[
                          { label:'Temperatura', actual: sensors.temperatura.toFixed(1), unit:'°C', range: detailInfo.temp,     icon: Ic.therm    },
                          { label:'H. suelo',    actual: sensors.humedadSuelo.toFixed(0),unit:'%',  range: detailInfo.humSuelo, icon: Ic.drop     },
                          { label:'pH suelo',    actual: sensors.ph.toFixed(1),          unit:'',   range: detailInfo.ph,       icon: Ic.activity },
                          { label:'Luz',         actual: sensors.luz.toFixed(0),         unit:'%',  range: detailInfo.luz,      icon: Ic.sun      },
                        ].map((s, i) => {
                          const st = getSensorStatus(parseFloat(s.actual), s.range);
                          const pct = Math.min(100, Math.max(3, ((parseFloat(s.actual) - s.range.min) / (s.range.max - s.range.min)) * 100));
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-gray-400 dark:text-gray-500 shrink-0">{s.icon}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 w-20 shrink-0">{s.label}</span>
                              <div className="flex-1 h-2 bg-gray-100 dark:bg-white/10 rounded-full relative overflow-hidden">
                                <div className={`h-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${st === 'good' ? 'bg-emerald-400' : st === 'warn' ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className={`text-xs font-semibold w-14 text-right ${STATUS_COLOR[st]}`}>{s.actual}{s.unit}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {detailPron.iot?.alertas?.length > 0 ? (
                      <div className="space-y-1.5">
                        {detailPron.iot.alertas.map((a, i) => (
                          <div key={i} className={`px-3 py-2.5 rounded-xl ring-1 ring-inset ${STATUS_BG[a.tipo].replace(/border-/g, 'ring-')}`}>
                            <p className={`text-xs font-semibold ${STATUS_COLOR[a.tipo]}`}>{a.msg}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{a.rec}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl ring-1 ring-inset ring-emerald-200/70 dark:ring-emerald-800/40">
                        <span className="text-emerald-500">{Ic.check}</span>
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Condiciones óptimas — sin alertas activas</span>
                      </div>
                    )}
                  </>
                )}

                {detailTab === 'actividades' && (
                  <>
                    <button onClick={() => setShowActModal(true)}
                      className="group relative w-full h-11 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-[0_12px_30px_-12px_rgba(16,185,129,0.7)] flex items-center justify-center gap-2 touch-manipulation">
                      <span>Registrar actividad</span>
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[calc(50%+1px)] group-hover:scale-105">
                        {Ic.plus}
                      </span>
                    </button>

                    <div className="grid grid-cols-4 gap-1.5">
                      {ACTIVIDADES_TIPOS.slice(0, 4).map(at => (
                        <button key={at.id} onClick={() => { setActForm(f => ({ ...f, tipo: at.id })); setShowActModal(true); }}
                          className={`flex flex-col items-center gap-1 py-2.5 rounded-xl ring-1 ring-inset text-xs font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] hover:opacity-80 touch-manipulation ${at.bg.replace(/border-/g, 'ring-')}`}>
                          <span className="text-lg leading-none">{at.emoji}</span>
                          <span className={`text-[10px] ${at.color}`}>{at.label}</span>
                        </button>
                      ))}
                    </div>

                    {actividades.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 dark:text-gray-600">
                        <p className="text-2xl mb-2">📋</p>
                        <p className="text-xs font-medium">Sin actividades registradas</p>
                        <p className="text-[10px] mt-0.5">Usa los botones de arriba para registrar</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {actividades.map(act => {
                          const tipo = ACTIVIDADES_TIPOS.find(a => a.id === act.tipo) || { emoji:'📝', label: act.tipo, color:'text-gray-600', bg:'bg-gray-50 border-gray-200' };
                          return (
                            <div key={act.id} className={`flex items-start gap-3 px-3 py-2.5 rounded-xl ring-1 ring-inset ${tipo.bg.replace(/border-/g, 'ring-')}`}>
                              <span className="text-xl shrink-0 leading-none mt-0.5">{tipo.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className={`text-xs font-semibold ${tipo.color}`}>{tipo.label}</p>
                                  <p className="text-[10px] text-gray-400 shrink-0">{new Date(act.fecha).toLocaleDateString('es-PE', { day:'numeric', month:'short' })}</p>
                                </div>
                                {act.descripcion && <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-snug">{act.descripcion}</p>}
                              </div>
                              <button onClick={() => handleDeleteActividad(act.id)} className="shrink-0 p-1 text-gray-300 hover:text-red-400 transition-colors touch-manipulation">{Ic.x}</button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {detailTab === 'recomendaciones' && (
                  <div className="space-y-2.5">
                    {recs.map((r, i) => (
                      <div key={i} className={`flex items-start gap-3 px-3 py-3 rounded-xl ring-1 ring-inset ${
                        r.nivel === 'alto'   ? 'bg-red-50 dark:bg-red-900/20 ring-red-200 dark:ring-red-800/40' :
                        r.nivel === 'medio'  ? 'bg-amber-50 dark:bg-amber-900/20 ring-amber-200 dark:ring-amber-800/40' :
                        r.nivel === 'ok'     ? 'bg-emerald-50 dark:bg-emerald-900/20 ring-emerald-200 dark:ring-emerald-800/40' :
                                              'bg-blue-50 dark:bg-blue-900/20 ring-blue-200 dark:ring-blue-800/40'
                      }`}>
                        <span className="text-xl shrink-0 leading-none">{r.emoji}</span>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{r.txt}</p>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-black/5 dark:border-white/10">
                      <p className="text-[10px] text-gray-400 text-center">Recomendaciones basadas en lecturas IoT en tiempo real</p>
                    </div>
                  </div>
                )}

              </div>
            </Card>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4" onClick={closeModal}>
          <div
            className="w-full sm:max-w-lg max-h-[92vh] rounded-t-[2rem] sm:rounded-2xl p-1.5 bg-white/10 ring-1 ring-white/15 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
          <div className="rounded-t-[calc(2rem-0.375rem)] sm:rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900 overflow-hidden max-h-[calc(92vh-12px)] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/10">
              <h2 className="font-display text-base font-bold tracking-tight text-gray-900 dark:text-white">
                {editingCultivo ? `Editar — ${editingCultivo.nombre}` : 'Nuevo cultivo'}
              </h2>
              <button onClick={closeModal} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 touch-manipulation">
                {Ic.x}
              </button>
            </div>

            <div className="overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-5 space-y-4">

                {!editingCultivo && (
                  <div>
                    <label className={Lbl}>Tipo de cultivo</label>
                    <div className="grid grid-cols-5 gap-2">
                      {Object.entries(CULTIVOS_PUNO).map(([tipo, info]) => {
                        const emojis = { Papa:'🥔', Quinua:'🌾', Cañihua:'🌿', Habas:'🫘', Maíz:'🌽' };
                        const active = form.tipo_cultivo === tipo;
                        return (
                          <button key={tipo} type="button"
                            onClick={() => setForm(f => ({ ...f, tipo_cultivo: tipo, variedad: '' }))}
                            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] touch-manipulation ${
                              active
                                ? `${info.light} ring-2 ring-emerald-500/60`
                                : 'bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 hover:ring-black/10 dark:hover:ring-white/20'
                            }`}>
                            <span className="text-2xl leading-none">{emojis[tipo] || '🌱'}</span>
                            <span className={`text-[10px] font-semibold ${active ? info.text : 'text-gray-500 dark:text-gray-400'}`}>{tipo}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(() => {
                  const info = CULTIVOS_PUNO[form.tipo_cultivo];
                  if (!info) return null;
                  return (
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ring-1 ring-inset ${info.light} ${info.border.replace(/border-/g, 'ring-')}`}>
                      <div className={`w-6 h-6 rounded-lg ${info.accent} flex-shrink-0 ring-1 ring-black/5`} />
                      <div className="flex gap-3 text-[10px] text-gray-600 dark:text-gray-400 flex-wrap">
                        <span><b>Ciclo:</b> {info.ciclo}d</span>
                        <span><b>Temp:</b> {info.temp.ideal}°C</span>
                        <span><b>pH:</b> {info.ph.ideal}</span>
                        <span><b>Rendim.:</b> {info.rendimiento} t/ha</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={Lbl}>Nombre del cultivo *</label>
                    <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                      placeholder={`${form.tipo_cultivo} — ${new Date().getFullYear()}`} required className={Inp} />
                  </div>
                  <div>
                    <label className={Lbl}>Variedad</label>
                    <select value={form.variedad} onChange={e => setForm({...form, variedad: e.target.value})} className={Inp}>
                      <option value="">Sin especificar</option>
                      {(CULTIVOS_PUNO[form.tipo_cultivo]?.variedades || []).map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={Lbl}>Área (ha) *</label>
                    <input type="number" step="0.01" min="0.01" value={form.area}
                      onChange={e => setForm({...form, area: e.target.value})} placeholder="2.5" required className={Inp} />
                  </div>
                  <div className="col-span-2">
                    <label className={Lbl}>Fecha de siembra *</label>
                    <input type="date" value={form.fecha_siembra}
                      onChange={e => setForm({...form, fecha_siembra: e.target.value})} required className={Inp} />
                  </div>
                  <div className="col-span-2">
                    <label className={Lbl}>Notas (opcional)</label>
                    <textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})}
                      placeholder="Observaciones, condiciones del terreno..." rows={2}
                      className={`${Inp} h-auto py-2 resize-none`} />
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="submit"
                    className="flex-1 h-11 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-[0_12px_30px_-12px_rgba(16,185,129,0.7)]">
                    {editingCultivo ? 'Actualizar' : 'Crear cultivo'}
                  </button>
                  <button type="button" onClick={closeModal}
                    className="flex-1 h-11 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300 font-semibold text-sm ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
          </div>
        </div>
      )}

      {showActModal && selectedCultivo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowActModal(false)}>
          <div className="w-full max-w-sm rounded-2xl p-1.5 bg-white/10 ring-1 ring-white/15 animate-slide-up" onClick={e => e.stopPropagation()}>
          <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/10">
              <h3 className="font-display text-base font-bold tracking-tight text-gray-900 dark:text-white">Registrar actividad</h3>
              <button onClick={() => setShowActModal(false)} className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 touch-manipulation">{Ic.x}</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={Lbl}>Tipo de actividad</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {ACTIVIDADES_TIPOS.map(at => (
                    <button key={at.id} type="button" onClick={() => setActForm(f => ({ ...f, tipo: at.id }))}
                      className={`flex flex-col items-center gap-1 py-2 rounded-xl ring-1 ring-inset text-xs transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] touch-manipulation ${
                        actForm.tipo === at.id
                          ? at.bg.replace(/border-/g, 'ring-') + ' ring-2 !ring-emerald-500/60'
                          : 'bg-gray-50/80 dark:bg-white/[0.04] ring-black/5 dark:ring-white/10 hover:ring-black/10 dark:hover:ring-white/20'
                      }`}>
                      <span className="text-lg leading-none">{at.emoji}</span>
                      <span className="text-[9px] font-semibold text-gray-600 dark:text-gray-400">{at.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={Lbl}>Descripción (opcional)</label>
                <textarea value={actForm.descripcion} onChange={e => setActForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Ej: 20L por planta, fertilizante NPK 15-15-15..." rows={3} className={`${Inp} h-auto py-2 resize-none`} />
              </div>
              <div>
                <label className={Lbl}>Fecha</label>
                <input type="date" value={actForm.fecha} onChange={e => setActForm(f => ({ ...f, fecha: e.target.value }))} className={Inp} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={handleSaveActividad} className="flex-1 h-11 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-[0_12px_30px_-12px_rgba(16,185,129,0.7)]">
                  Guardar
                </button>
                <button type="button" onClick={() => setShowActModal(false)} className="flex-1 h-11 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300 font-semibold text-sm ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity:0 }                                    to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(10px) scale(.98) } to { opacity:1; transform:none } }
      `}</style>
    </div>
  );
};

export default GestionCultivosIoT;
