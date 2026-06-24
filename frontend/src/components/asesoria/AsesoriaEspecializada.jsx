import React, { useState, useEffect, useMemo } from 'react';
import { asesoriaAPI, asistenteAPI } from '../../services/api';
import { notify } from '../../utils/swal';
import { TIPOS_ASESORIA } from '../../utils/constants';

const Ic = {
  users:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  msg:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  send:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  check:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"/></svg>,
  clock:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  award:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  leaf:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>,
  drop:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  sprout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 1 1.4 4c-1.6.1-3-.2-4.1-.8"/></svg>,
  bug:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M8 2l1.88 1.88M14.12 3.88 16 2M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z"/><path d="M12 20v-9"/><path d="M6 13H2"/><path d="M22 13h-4"/></svg>,
  trend:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  warn:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  user:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  x:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  brain:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.66z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.66z"/></svg>,
  plus:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  arrow:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
};

const ESPECIALIDADES = [
  { tipo:'Nutrición Vegetal',      icon: Ic.leaf,   expertos:12, tiempo:'24h',  iconBg:'bg-emerald-500', light:'bg-emerald-50 dark:bg-emerald-900/20', border:'border-emerald-200 dark:border-emerald-800/40', text:'text-emerald-700 dark:text-emerald-400', desc:'Fertilización y nutrientes para maximizar el rendimiento.' },
  { tipo:'Manejo Hídrico',         icon: Ic.drop,   expertos:8,  tiempo:'24h',  iconBg:'bg-sky-500',     light:'bg-sky-50 dark:bg-sky-900/20',         border:'border-sky-200 dark:border-sky-800/40',         text:'text-sky-700 dark:text-sky-400',         desc:'Sistemas de riego eficientes y gestión del agua.' },
  { tipo:'Manejo de Suelos',       icon: Ic.sprout, expertos:10, tiempo:'48h',  iconBg:'bg-amber-500',   light:'bg-amber-50 dark:bg-amber-900/20',     border:'border-amber-200 dark:border-amber-800/40',     text:'text-amber-700 dark:text-amber-400',     desc:'Análisis de suelos, fertilidad y conservación.' },
  { tipo:'Control Fitosanitario',  icon: Ic.bug,    expertos:15, tiempo:'12h',  iconBg:'bg-red-500',     light:'bg-red-50 dark:bg-red-900/20',         border:'border-red-200 dark:border-red-800/40',         text:'text-red-700 dark:text-red-400',         desc:'Prevención y control de plagas y enfermedades.' },
  { tipo:'Análisis Productivo',    icon: Ic.trend,  expertos:9,  tiempo:'36h',  iconBg:'bg-violet-500',  light:'bg-violet-50 dark:bg-violet-900/20',   border:'border-violet-200 dark:border-violet-800/40',   text:'text-violet-700 dark:text-violet-400',   desc:'Evaluación de rendimientos y estrategias de mejora.' },
  { tipo:'Agricultura Sostenible', icon: Ic.shield, expertos:11, tiempo:'24h',  iconBg:'bg-teal-500',    light:'bg-teal-50 dark:bg-teal-900/20',       border:'border-teal-200 dark:border-teal-800/40',       text:'text-teal-700 dark:text-teal-400',       desc:'Prácticas ecológicas y sostenibles para el altiplano.' },
];

const PRIORIDADES = [
  { val:'Baja',    cls:'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'         },
  { val:'Media',   cls:'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/40'     },
  { val:'Alta',    cls:'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/40' },
  { val:'Urgente', cls:'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40'           },
];

const estadoBadge = (e) => ({
  'Respondida':   'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  'Resuelta':     'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  'En Proceso':   'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  'En Revision':  'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  'Pendiente':    'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  'Cancelada':    'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
}[e] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400');

const INP =
  'w-full h-11 px-3.5 rounded-xl text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ' +
  'bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 ' +
  'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:bg-white dark:focus:bg-white/[0.06]';

const AsesoriaEspecializada = () => {
  const [solicitudes, setSolicitudes]       = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showModal, setShowModal]           = useState(false);
  const [form, setForm]                     = useState({ tipo_asesoria:'', descripcion_problema:'', prioridad:'Media' });
  const [preGroq, setPreGroq]               = useState(null);
  const [preGroqLoading, setPreGroqLoading] = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [filtroEstado, setFiltroEstado]     = useState('Todas');

  const stats = useMemo(() => ({
    total:       solicitudes.length,
    respondidas: solicitudes.filter(s => ['Respondida','Resuelta'].includes(s.estado)).length,
    pendientes:  solicitudes.filter(s => s.estado === 'Pendiente').length,
  }), [solicitudes]);

  const solicitudesFiltradas = useMemo(() =>
    filtroEstado === 'Todas'
      ? solicitudes
      : solicitudes.filter(s => s.estado === filtroEstado),
    [solicitudes, filtroEstado]
  );

  useEffect(() => {
    fetchSolicitudes();
    const iv = setInterval(() => {
      if (solicitudes.some(s => s.estado === 'Pendiente')) fetchSolicitudes();
    }, 30_000);
    return () => clearInterval(iv);
  }, []);

  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      const res = await asesoriaAPI.getMisSolicitudes();
      setSolicitudes(res.data.data || []);
    } catch { setSolicitudes([]); }
    finally { setLoading(false); }
  };

  const handlePreGroq = async () => {
    if (!form.descripcion_problema.trim() || form.descripcion_problema.trim().length < 20) {
      notify.warning('Describe el problema con al menos 20 caracteres para obtener orientación');
      return;
    }
    setPreGroqLoading(true);
    setPreGroq(null);
    try {
      const res = await asistenteAPI.consulta(
        `Un agricultor de Puno, Perú (altiplano 3800-4500 msnm) consulta sobre ${form.tipo_asesoria || 'su cultivo'}:

"${form.descripcion_problema}"

Dame una orientación inicial breve en texto plano (sin asteriscos, sin markdown):
1. Posible diagnóstico o causa del problema
2. Acciones inmediatas que puede tomar
3. Si requiere visita de un especialista o puede manejarlo solo

Máximo 5 oraciones en total. Directo y práctico.`,
        { region: 'Puno, Perú' }
      );
      if (res.data.success) setPreGroq(res.data.data.respuesta);
    } catch {
      notify.error('No se pudo obtener la orientación de IA');
    } finally {
      setPreGroqLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tipo_asesoria)               { notify.warning('Selecciona el tipo de asesoría'); return; }
    if (!form.descripcion_problema.trim()) { notify.warning('Describe tu problema'); return; }
    setSubmitting(true);
    try {
      const res = await asesoriaAPI.solicitar(form);
      notify.success(res.data.message || 'Solicitud enviada correctamente');
      setShowModal(false);
      setForm({ tipo_asesoria:'', descripcion_problema:'', prioridad:'Media' });
      setPreGroq(null);
      fetchSolicitudes();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error al enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = (tipo = '') => {
    setForm(f => ({ ...f, tipo_asesoria: tipo }));
    setPreGroq(null);
    setShowModal(true);
  };

  return (
    <div className="px-4 sm:px-6 py-6 space-y-5 bg-gray-50 dark:bg-gray-950 min-h-full">

      <div className="flex items-end justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Asesoría Especializada
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Conecta con agrónomos certificados · Puno
          </p>
        </div>
        <button onClick={() => openModal()}
          className="group flex items-center gap-2.5 h-11 pl-5 pr-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation shrink-0">
          Solicitar
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
            {Ic.arrow}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 animate-slide-up">
        {[
          { icon: Ic.msg,   val: stats.total > 0 ? stats.total : '65+',         lbl: stats.total > 0 ? 'Mis consultas'      : 'Expertos disponibles', color:'bg-violet-500' },
          { icon: Ic.check, val: stats.total > 0 ? stats.respondidas : '12-48h', lbl: stats.total > 0 ? 'Respondidas por IA' : 'Tiempo de respuesta',  color:'bg-emerald-500' },
          { icon: Ic.clock, val: stats.total > 0 ? stats.pendientes  : '98%',    lbl: stats.total > 0 ? 'Pendientes'          : 'Satisfacción',          color: stats.pendientes > 0 ? 'bg-amber-500' : 'bg-sky-500' },
        ].map(({ icon, val, lbl, color }) => (
          <div key={lbl} className="rounded-2xl p-1 bg-gray-100/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10">
            <div className="rounded-[calc(1rem-0.25rem)] bg-white dark:bg-gray-900 p-4 flex items-center gap-3 h-full">
              <div className={`${color} w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0`}>{icon}</div>
              <div>
                <p className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-white leading-none">{val}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{lbl}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[1.75rem] p-1.5 bg-gray-100/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 animate-slide-up">
        <div className="rounded-[calc(1.75rem-0.375rem)] bg-white dark:bg-gray-900 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-base font-bold tracking-tight text-gray-900 dark:text-white">Nuestras especialidades</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Expertos certificados en cada área</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ESPECIALIDADES.map(esp => (
              <button key={esp.tipo} type="button"
                onClick={() => openModal(esp.tipo)}
                className={`flex items-start gap-3 p-4 rounded-2xl ring-1 text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.99] touch-manipulation ${esp.light} ring-black/5 dark:ring-white/10`}>
                <div className={`${esp.iconBg} w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0`}>
                  {esp.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold tracking-tight ${esp.text}`}>{esp.tipo}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{esp.desc}</p>
                  <div className="flex items-center gap-3 mt-2.5 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">{Ic.user} {esp.expertos} expertos</span>
                    <span className="flex items-center gap-1">{Ic.clock} {esp.tiempo}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] p-1.5 bg-gray-100/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 animate-slide-up">
        <div className="rounded-[calc(1.75rem-0.375rem)] bg-white dark:bg-gray-900 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-bold tracking-tight text-gray-900 dark:text-white">Mis solicitudes</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Historial y estado de tus consultas</p>
            </div>
          </div>

          {solicitudes.length > 0 && (
            <div className="flex gap-1 bg-gray-100/80 dark:bg-white/[0.04] p-1 rounded-2xl mb-5 w-fit ring-1 ring-black/5 dark:ring-white/10">
              {['Todas', 'Pendiente', 'Respondida', 'En Proceso'].map(estado => (
                <button key={estado} onClick={() => setFiltroEstado(estado)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] touch-manipulation ${
                    filtroEstado === estado
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}>
                  {estado}
                  {estado !== 'Todas' && (
                    <span className="ml-1 text-[10px] opacity-70">
                      ({solicitudes.filter(s =>
                        estado === 'Respondida'
                          ? ['Respondida','Resuelta'].includes(s.estado)
                          : s.estado === estado
                      ).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="text-center py-12 bg-gray-50/80 dark:bg-white/[0.03] rounded-2xl ring-1 ring-black/5 dark:ring-white/10">
              <div className="w-14 h-14 bg-emerald-500/10 ring-1 ring-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">{Ic.msg}</div>
              <p className="font-display text-base font-bold tracking-tight text-gray-700 dark:text-gray-200 mb-1">Sin solicitudes todavía</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Obtén ayuda de agrónomos certificados del altiplano</p>
              <button onClick={() => openModal()}
                className="group inline-flex items-center gap-2.5 h-11 pl-5 pr-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation">
                Hacer mi primera consulta
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                  {Ic.arrow}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {solicitudesFiltradas.map(sol => (
                <div key={sol.id} className="rounded-2xl p-4 ring-1 ring-black/5 dark:ring-white/10 bg-gray-50/60 dark:bg-white/[0.02] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                    <div>
                      <p className="font-semibold tracking-tight text-sm text-gray-900 dark:text-white">{sol.tipo_asesoria}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ring-1 ring-black/5 dark:ring-white/10 ${estadoBadge(sol.estado)}`}>
                          {sol.estado}
                        </span>
                        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ring-1 ring-black/5 dark:ring-white/10 ${PRIORIDADES.find(p => p.val === sol.prioridad)?.cls || ''}`}>
                          {sol.prioridad}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                      {Ic.clock}
                      {new Date(sol.fecha_solicitud).toLocaleDateString('es-PE', { day:'numeric', month:'short', year:'numeric' })}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">{sol.descripcion_problema}</p>

                  {sol.respuesta && (() => {
                    const esIA = sol.asesor_asignado?.includes('AgroIA');
                    return (
                      <div className={`rounded-2xl p-4 ring-1 ${
                        esIA
                          ? 'bg-violet-50 dark:bg-violet-900/20 ring-violet-200/60 dark:ring-violet-800/40'
                          : 'bg-emerald-50 dark:bg-emerald-900/20 ring-emerald-200/60 dark:ring-emerald-800/40'
                      }`}>
                        <p className={`text-xs font-semibold flex items-center gap-1.5 mb-1.5 ${
                          esIA ? 'text-violet-700 dark:text-violet-400' : 'text-emerald-700 dark:text-emerald-400'
                        }`}>
                          {esIA ? Ic.brain : Ic.check}
                          {esIA ? 'Respuesta de AgroIA' : 'Respuesta del agrónomo'}
                          {sol.asesor_asignado && !esIA && <span className="font-normal">· {sol.asesor_asignado}</span>}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{sol.respuesta}</p>
                        {esIA && (
                          <p className="text-[10px] text-gray-400 mt-2">
                            Respuesta generada por IA · Groq llama-3.3-70b
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-50 sm:p-4"
          onClick={() => setShowModal(false)}>
          <div
            className="w-full sm:max-w-lg max-h-[92vh] rounded-t-[2rem] sm:rounded-2xl p-1.5 bg-white/10 dark:bg-white/[0.06] ring-1 ring-black/10 dark:ring-white/15 animate-slide-up overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="rounded-t-[calc(2rem-0.375rem)] sm:rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900 max-h-[calc(92vh-0.75rem)] overflow-hidden flex flex-col">

              <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/10">
                <div>
                  <h2 className="font-display text-base font-bold tracking-tight text-gray-900 dark:text-white">Solicitar asesoría</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Un experto te responderá en 12-48 horas</p>
                </div>
                <button onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] touch-manipulation">
                  {Ic.x}
                </button>
              </div>

              <div className="overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-5 space-y-5">

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                      Tipo de asesoría
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {ESPECIALIDADES.map(esp => (
                        <button key={esp.tipo} type="button"
                          onClick={() => setForm(f => ({ ...f, tipo_asesoria: esp.tipo }))}
                          className={`flex items-center gap-2 p-3 rounded-xl ring-1 text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] touch-manipulation ${
                            form.tipo_asesoria === esp.tipo
                              ? `${esp.light} ring-2 ring-emerald-500/60`
                              : 'bg-gray-50/80 dark:bg-white/[0.04] ring-black/5 dark:ring-white/10 hover:ring-black/10 dark:hover:ring-white/20'
                          }`}>
                          <div className={`${esp.iconBg} w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0`}>
                            {esp.icon}
                          </div>
                          <span className={`text-xs font-semibold truncate ${form.tipo_asesoria === esp.tipo ? esp.text : 'text-gray-700 dark:text-gray-300'}`}>
                            {esp.tipo}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                      Prioridad
                    </label>
                    <div className="flex gap-2">
                      {PRIORIDADES.map(p => (
                        <button key={p.val} type="button"
                          onClick={() => setForm(f => ({ ...f, prioridad: p.val }))}
                          className={`flex-1 h-9 rounded-xl ring-1 text-xs font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] touch-manipulation ${
                            form.prioridad === p.val ? p.cls + ' ring-2 ring-emerald-500/60' : 'bg-gray-50/80 dark:bg-white/[0.04] ring-black/5 dark:ring-white/10 text-gray-500 dark:text-gray-400 hover:ring-black/10 dark:hover:ring-white/20'
                          }`}>
                          {p.val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Descripción del problema
                    </label>
                    <textarea
                      value={form.descripcion_problema}
                      onChange={e => { setForm(f => ({ ...f, descripcion_problema: e.target.value })); setPreGroq(null); }}
                      rows={4}
                      placeholder="Describe detalladamente tu consulta: síntomas observados, cultivo afectado, tiempo que lleva el problema, condiciones del terreno..."
                      required
                      className={`${INP} h-auto py-2.5 resize-none`}
                    />
                    <div className="flex justify-between mt-1.5">
                      <p className="text-[10px] text-gray-400">Cuanto más detallado, mejor la respuesta</p>
                      <p className={`text-[10px] ${form.descripcion_problema.length > 900 ? 'text-red-400' : 'text-gray-400'}`}>
                        {form.descripcion_problema.length}/1000
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePreGroq}
                    disabled={preGroqLoading || form.descripcion_problema.trim().length < 20}
                    className="w-full flex items-center justify-center gap-2 h-11 bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-200/60 dark:ring-violet-800/40 text-violet-700 dark:text-violet-400 text-xs font-semibold rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/30 disabled:opacity-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.99] touch-manipulation"
                  >
                    {preGroqLoading
                      ? <><div className="w-3.5 h-3.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" /> AgroIA analizando…</>
                      : <>{Ic.brain} Obtener orientación rápida con IA antes de enviar</>}
                  </button>

                  {preGroq && (
                    <div className="bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-200/60 dark:ring-violet-800/40 rounded-2xl p-4 animate-slide-up">
                      <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 mb-2 flex items-center gap-1.5">
                        {Ic.brain} Orientación AgroIA (preliminar)
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                        {preGroq.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*/g, '')}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-2">
                        Esta es una orientación inicial. Para diagnóstico certificado, envía la solicitud al experto.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={submitting}
                      className="flex-1 h-11 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation">
                      {submitting
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enviando…</>
                        : <>{Ic.send} Enviar a experto</>}
                    </button>
                    <button type="button" onClick={() => setShowModal(false)}
                      className="flex-1 h-11 bg-gray-100 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 text-gray-700 dark:text-gray-300 font-semibold text-sm rounded-full hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation">
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AsesoriaEspecializada;
