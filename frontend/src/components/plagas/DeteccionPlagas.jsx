import React, { useState, useEffect, useRef, useCallback } from 'react';
import { plagasAPI, cultivosAPI, asistenteAPI } from '../../services/api';
import { notify } from '../../utils/swal';
import CameraCapture from './CameraCapture';

const Ic = {
  bug:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M8 2l1.88 1.88M14.12 3.88 16 2M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>,
  upload:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  camera:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  book:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  chat:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  history: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>,
  warn:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  check:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>,
  leaf:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>,
  drop:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  shield:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  zap:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  x:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  send:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  brain:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.66z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.66z"/></svg>,
  info:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
};

const URGENCIA_CFG = {
  inmediata:   { label:'Urgente — actuar hoy',  cls:'bg-red-500/10 text-red-700 dark:text-red-400 ring-red-500/20',       dot:'bg-red-500'     },
  '24h':       { label:'Actuar en 24 horas',     cls:'bg-orange-500/10 text-orange-700 dark:text-orange-400 ring-orange-500/20', dot:'bg-orange-500' },
  esta_semana: { label:'Esta semana',            cls:'bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20',   dot:'bg-amber-500'   },
  monitorear:  { label:'Monitorear',             cls:'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20', dot:'bg-emerald-500' },
};

const SEVER_CFG = {
  severa:   { bar:'bg-red-500',     badge:'bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20'       },
  moderada: { bar:'bg-amber-400',   badge:'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20' },
  leve:     { bar:'bg-emerald-500', badge:'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20' },
};

const INP = 'w-full h-11 px-3.5 rounded-xl text-sm transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:bg-white dark:focus:bg-white/[0.06]';

const Spinner = ({ sm }) => (
  <div className={`${sm ? 'w-4 h-4 border-2' : 'w-6 h-6 border-2'} border-current border-t-transparent rounded-full animate-spin`} />
);

// Presentational helpers — double-bezel card consistent with AuthShared
const Bezel = ({ className = '', innerClassName = '', children, accent }) => (
  <div className={`rounded-[1.75rem] p-1.5 bg-gradient-to-b from-black/[0.05] to-transparent dark:from-white/10 dark:to-white/[0.02] ring-1 ring-black/5 dark:ring-white/10 ${className}`}>
    {accent}
    <div className={`relative rounded-[calc(1.75rem-0.375rem)] bg-white dark:bg-gray-900 overflow-hidden ${innerClassName}`}>
      {children}
    </div>
  </div>
);

const ArrowCircle = () => (
  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

const DeteccionPlagas = () => {
  const [tab, setTab]                     = useState('imagen');
  const [cultivos, setCultivos]           = useState([]);
  const [cultivo, setCultivo]             = useState('');
  const [biblioteca, setBiblioteca]       = useState([]);
  const [historial, setHistorial]         = useState([]);
  const [showCamera, setShowCamera]       = useState(false);

  const [imageFile, setImageFile]         = useState(null);
  const [imagePreview, setImagePreview]   = useState(null);
  const [dragOver, setDragOver]           = useState(false);
  const [detecting, setDetecting]         = useState(false);
  const [detection, setDetection]         = useState(null);
  const [groqLoading, setGroqLoading]     = useState(false);
  const [groqPlan, setGroqPlan]           = useState(null);

  const [sintomas, setSintomas]           = useState('');
  const [consultaLoading, setConsultaLoading] = useState(false);
  const [consultaResp, setConsultaResp]   = useState(null);

  const fileRef = useRef();

  useEffect(() => {
    Promise.all([
      cultivosAPI.getAll().then(r => setCultivos(r.data?.data || [])).catch(() => {}),
      plagasAPI.getBiblioteca().then(r => setBiblioteca(r.data?.data || [])).catch(() => {}),
    ]);
  }, []);

  useEffect(() => {
    if (tab === 'historial') {
      plagasAPI.getDetecciones().then(r => setHistorial(r.data?.data || [])).catch(() => {});
    }
  }, [tab]);

  const applyFile = (file) => {
    if (!file || !file.type.startsWith('image/')) { notify.error('Selecciona una imagen válida'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    setDetection(null);
    setGroqPlan(null);
  };

  const callGroqPlan = useCallback(async (det, cultivoNombre) => {
    if (!det || det.is_healthy) return;
    setGroqLoading(true);
    try {
      const res = await plagasAPI.consejoPlagaIA({
        nombre_plaga: det.nombre_plaga,
        confianza:    det.confianza,
        severidad:    det.severidad,
        cultivo:      cultivoNombre || 'no especificado',
        descripcion:  det.descripcion || '',
      });
      if (res.data.success) setGroqPlan(res.data.data);
    } catch {
      notify.error('No se pudo generar el plan de manejo');
    } finally {
      setGroqLoading(false);
    }
  }, []);

  const handleDetectar = async () => {
    if (!imageFile) { notify.warning('Selecciona o toma una foto primero'); return; }
    setDetecting(true);
    setDetection(null);
    setGroqPlan(null);
    const cultivoObj = cultivos.find(c => String(c.id) === String(cultivo));
    const fd = new FormData();
    fd.append('imagen', imageFile);
    if (cultivo) fd.append('cultivo_id', cultivo);
    if (cultivoObj) fd.append('cultivo_nombre', cultivoObj.tipo_cultivo);
    try {
      const res = await plagasAPI.detectarConGroq(fd);
      if (res.data.success) {
        setDetection(res.data.data);
        callGroqPlan(res.data.data, cultivoObj?.tipo_cultivo || '');
        notify.success(res.data.data.is_healthy ? 'Planta saludable' : `Detectado: ${res.data.data.nombre_plaga}`);
      } else {
        notify.error(res.data.message || 'Error en la detección');
      }
    } catch {
      notify.error('Error al analizar la imagen con IA');
    } finally {
      setDetecting(false);
    }
  };

  const handleConsulta = async () => {
    if (sintomas.trim().length < 10) { notify.warning('Describe los síntomas con más detalle'); return; }
    setConsultaLoading(true);
    setConsultaResp(null);
    const cultivoObj = cultivos.find(c => String(c.id) === String(cultivo));
    try {
      const res = await asistenteAPI.consulta(sintomas.trim(), {
        region: 'Puno, Perú — Altiplano 3800-4500 msnm',
        cultivos: cultivoObj ? [cultivoObj.tipo_cultivo] : [],
      });
      if (res.data.success) setConsultaResp(res.data.data.respuesta);
      else notify.error(res.data.message || 'Error en la consulta');
    } catch {
      notify.error('Error al conectar con AgroIA');
    } finally {
      setConsultaLoading(false);
    }
  };

  const resetImagen = () => {
    setImageFile(null);
    setImagePreview(null);
    setDetection(null);
    setGroqPlan(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const severCfg = detection ? (SEVER_CFG[detection.severidad] || SEVER_CFG.leve) : null;

  return (
    <div className="relative p-4 sm:p-6 space-y-5 bg-gray-50 dark:bg-gray-950 min-h-full overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-40 -right-24 w-[30rem] h-[30rem] rounded-full bg-emerald-500/10 dark:bg-emerald-500/[0.07] blur-[130px]" />

      <div className="relative flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Detección de Plagas
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400 max-w-md">
            Groq Vision · AgroIA · Diagnóstico inteligente para el Altiplano
          </p>
        </div>
      </div>

      <div className="relative inline-flex gap-1 bg-gray-100/80 dark:bg-white/[0.04] p-1 rounded-full ring-1 ring-black/5 dark:ring-white/10 w-fit animate-slide-up">
        {[
          { id:'imagen',    label:'Por imagen', icon: Ic.camera  },
          { id:'sintomas',  label:'Consulta IA', icon: Ic.brain  },
          { id:'historial', label:'Historial',   icon: Ic.history},
          { id:'guia',      label:'Guía',        icon: Ic.book   },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] touch-manipulation ${
              tab === t.id
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'imagen' && (
        <div className="space-y-4">
          <Bezel className="animate-slide-up">
            <div className="p-5 space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.18em] mb-2">
                Cultivo a analizar (opcional)
              </label>
              <select value={cultivo} onChange={e => setCultivo(e.target.value)} className={INP}>
                <option value="">Sin especificar</option>
                {cultivos.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} — {c.tipo_cultivo}</option>
                ))}
              </select>
            </div>

            {!imagePreview ? (
              <div className="space-y-3">
                <label
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); applyFile(e.dataTransfer.files[0]); }}
                  className={`group flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer py-12 ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    dragOver
                      ? 'ring-2 ring-dashed ring-emerald-400/70 bg-emerald-50/70 dark:bg-emerald-900/20 scale-[0.99]'
                      : 'ring-dashed ring-black/10 dark:ring-white/10 bg-gray-50/60 dark:bg-white/[0.02] hover:ring-emerald-300/60 dark:hover:ring-emerald-700/60 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10'
                  }`}>
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/[0.06] ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center text-emerald-500 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5">
                    {Ic.upload}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Arrastra una imagen aquí</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">o haz clic para seleccionar · JPG, PNG, WEBP</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-3.5 py-1.5 rounded-full ring-1 ring-emerald-500/20">
                    Seleccionar archivo
                  </span>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => applyFile(e.target.files[0])} />
                </label>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-black/5 dark:bg-white/10" />
                  <span className="text-[10px] uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">o</span>
                  <div className="flex-1 h-px bg-black/5 dark:bg-white/10" />
                </div>

                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="group w-full flex items-center justify-center gap-2.5 h-12 bg-gray-900 dark:bg-white/[0.06] hover:bg-gray-800 dark:hover:bg-white/[0.1] text-white rounded-full ring-1 ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation"
                >
                  {Ic.camera}
                  <span className="text-sm font-semibold">Tomar foto con la cámara</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="relative rounded-2xl p-1.5 bg-gradient-to-b from-black/[0.05] to-transparent dark:from-white/10 dark:to-white/[0.02] ring-1 ring-black/5 dark:ring-white/10 w-full sm:w-48 shrink-0">
                  <div className="relative rounded-[calc(1rem-0.25rem)] overflow-hidden h-48 bg-gray-100 dark:bg-gray-800">
                    <img src={imagePreview} alt="Vista previa de la imagen a analizar" className="w-full h-full object-cover" />
                    {detecting && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2.5">
                        <div className="w-8 h-8 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                        <span className="text-white text-xs font-semibold tracking-tight">Analizando con IA…</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="bg-gray-50/80 dark:bg-white/[0.04] rounded-xl px-3.5 py-3 ring-1 ring-black/5 dark:ring-white/10">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{imageFile?.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{imageFile ? (imageFile.size / 1024).toFixed(1) + ' KB' : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleDetectar} disabled={detecting}
                      className="group flex-1 flex items-center justify-center gap-2 h-11 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation">
                      {detecting ? <><Spinner sm /> Analizando…</> : <>{Ic.bug} Detectar plaga <ArrowCircle /></>}
                    </button>
                    <button onClick={resetImagen} disabled={detecting}
                      className="h-11 w-11 flex items-center justify-center bg-gray-50/80 dark:bg-white/[0.04] text-gray-500 rounded-full ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 touch-manipulation">
                      {Ic.x}
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
          </Bezel>

          {detection && severCfg && (
            <Bezel className="animate-slide-up">
              <div className={`h-1.5 ${severCfg.bar}`} />
              <div className="p-5 space-y-5">

                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ring-1 ${
                    detection.is_healthy
                      ? 'bg-emerald-500/10 ring-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-500/10 ring-red-500/20 text-red-500'
                  }`}>
                    {detection.is_healthy ? Ic.check : Ic.bug}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-white truncate">{detection.nombre_plaga}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ring-1 ${severCfg.badge}`}>
                        {detection.is_healthy ? 'Saludable' : detection.severidad}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Confianza: <strong>{detection.confianza}%</strong>
                      </span>
                      <span className="text-[10px] text-violet-500 font-semibold">Groq Vision</span>
                    </div>
                  </div>
                </div>

                <div className="w-full h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${severCfg.bar}`}
                    style={{ width: `${detection.confianza}%` }} />
                </div>

                {detection.is_healthy ? (
                  <div className="flex items-center gap-3 bg-emerald-500/10 ring-1 ring-emerald-500/20 rounded-2xl px-4 py-3.5">
                    <span className="text-emerald-500 shrink-0">{Ic.check}</span>
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Planta sin signos de enfermedad</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Continúa el monitoreo preventivo habitual.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key:'descripcion', label:'Descripción', icon: Ic.info,   cls:'bg-blue-500/[0.06] ring-blue-500/20',     text:'text-blue-700 dark:text-blue-400'     },
                      { key:'causas',      label:'Causas',      icon: Ic.warn,   cls:'bg-amber-500/[0.06] ring-amber-500/20', text:'text-amber-700 dark:text-amber-400'   },
                      { key:'tratamiento', label:'Tratamiento', icon: Ic.drop,   cls:'bg-emerald-500/[0.06] ring-emerald-500/20', text:'text-emerald-700 dark:text-emerald-400' },
                      { key:'prevencion',  label:'Prevención',  icon: Ic.shield, cls:'bg-violet-500/[0.06] ring-violet-500/20', text:'text-violet-700 dark:text-violet-400' },
                    ].filter(f => detection[f.key]).map(({ key, label, icon, cls, text }) => (
                      <div key={key} className={`rounded-2xl ring-1 p-3.5 ${cls}`}>
                        <p className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] mb-2 ${text}`}>{icon} {label}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{detection[key]}</p>
                      </div>
                    ))}
                  </div>
                )}

                {!detection.is_healthy && (
                  <div className="border-t border-black/5 dark:border-white/10 pt-5">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 bg-violet-500/10 ring-1 ring-violet-500/20 rounded-xl flex items-center justify-center text-violet-500">{Ic.brain}</div>
                      <div>
                        <h4 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">Plan de manejo — AgroIA</h4>
                        <p className="text-[10px] text-gray-400">Groq · llama-3.3-70b-versatile</p>
                      </div>
                    </div>

                    {groqLoading ? (
                      <div className="flex items-center gap-3 bg-violet-500/[0.06] ring-1 ring-violet-500/20 rounded-2xl px-4 py-4">
                        <div className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                        <span className="text-sm text-violet-700 dark:text-violet-400 font-medium">AgroIA generando plan de manejo…</span>
                      </div>
                    ) : groqPlan ? (
                      <div className="space-y-3">
                        {groqPlan.urgencia && (() => {
                          const u = URGENCIA_CFG[groqPlan.urgencia] || URGENCIA_CFG.monitorear;
                          return (
                            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl ring-1 ${u.cls}`}>
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${u.dot}`} />
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Nivel de urgencia</p>
                                <p className="text-sm font-bold tracking-tight">{u.label}</p>
                              </div>
                            </div>
                          );
                        })()}

                        {groqPlan.confirmacion && (
                          <div className="bg-gray-50/80 dark:bg-white/[0.04] rounded-2xl px-4 py-3 ring-1 ring-black/5 dark:ring-white/10">
                            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.14em] mb-1">Evaluación</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{groqPlan.confirmacion}</p>
                          </div>
                        )}

                        {groqPlan.plan_accion?.length > 0 && (
                          <div className="bg-white dark:bg-white/[0.03] rounded-2xl ring-1 ring-black/5 dark:ring-white/10 p-4">
                            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.14em] mb-3 flex items-center gap-1.5">{Ic.zap} Plan de acción</p>
                            <ol className="space-y-2">
                              {groqPlan.plan_accion.map((paso, i) => (
                                <li key={i} className="flex items-start gap-3">
                                  <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{paso}</p>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {groqPlan.productos_quimicos?.length > 0 && (
                          <div className="bg-white dark:bg-white/[0.03] rounded-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-black/5 dark:border-white/10">
                              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.14em]">Productos recomendados</p>
                            </div>
                            <div className="divide-y divide-black/5 dark:divide-white/[0.06]">
                              {groqPlan.productos_quimicos.map((p, i) => (
                                <div key={i} className="grid grid-cols-3 gap-2 px-4 py-2.5 text-xs">
                                  <p className="font-semibold text-gray-800 dark:text-gray-200">{p.nombre}</p>
                                  <p className="text-gray-500 dark:text-gray-400">Dosis: <span className="font-semibold text-gray-700 dark:text-gray-300">{p.dosis}</span></p>
                                  <p className="text-gray-500 dark:text-gray-400">Cada: <span className="font-semibold text-gray-700 dark:text-gray-300">{p.frecuencia}</span></p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {groqPlan.alternativa_organica && (
                          <div className="bg-emerald-500/[0.06] ring-1 ring-emerald-500/20 rounded-2xl p-3.5">
                            <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-[0.14em] mb-1.5 flex items-center gap-1.5">{Ic.leaf} Alternativa orgánica</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{groqPlan.alternativa_organica}</p>
                          </div>
                        )}

                        {groqPlan.prevencion_futura?.length > 0 && (
                          <div className="bg-sky-500/[0.06] ring-1 ring-sky-500/20 rounded-2xl p-3.5">
                            <p className="text-[10px] font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-[0.14em] mb-2 flex items-center gap-1.5">{Ic.shield} Prevención futura</p>
                            <ul className="space-y-1.5">
                              {groqPlan.prevencion_futura.map((m, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                  <span className="text-sky-500 shrink-0 mt-0.5">{Ic.check}</span>
                                  {m}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {groqPlan.cuando_consultar_especialista && (
                          <div className="flex items-start gap-2.5 bg-amber-500/[0.06] ring-1 ring-amber-500/20 rounded-2xl px-3.5 py-3">
                            <span className="text-amber-500 shrink-0 mt-0.5">{Ic.warn}</span>
                            <div>
                              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">Consulta con agrónomo si…</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{groqPlan.cuando_consultar_especialista}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </Bezel>
          )}
        </div>
      )}

      {tab === 'sintomas' && (
        <div className="space-y-4">
          <Bezel className="animate-slide-up">
            <div className="p-5 space-y-4">
            <div className="flex items-start gap-3 bg-violet-500/[0.06] ring-1 ring-violet-500/20 rounded-2xl px-4 py-3.5">
              <span className="text-violet-500 shrink-0 mt-0.5">{Ic.brain}</span>
              <div>
                <p className="text-sm font-semibold text-violet-700 dark:text-violet-400">Consulta por síntomas — AgroIA</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Describe lo que observas. AgroIA generará diagnóstico y plan de manejo especializado para el Altiplano puneño.</p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.18em] mb-2">Cultivo afectado (opcional)</label>
              <select value={cultivo} onChange={e => setCultivo(e.target.value)} className={INP}>
                <option value="">Sin especificar</option>
                {cultivos.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.tipo_cultivo}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.18em] mb-2">Describe los síntomas</label>
              <textarea
                value={sintomas}
                onChange={e => setSintomas(e.target.value)}
                rows={5}
                placeholder="Ej: Las hojas de la papa tienen manchas marrones con bordes amarillos. Las manchas aparecieron después de las lluvias. El tallo se ve oscuro en la base. Afecta a unas 20 plantas en la parcela norte."
                className={`${INP} h-auto py-3 resize-none`}
              />
              <div className="flex justify-between mt-1">
                <p className="text-[10px] text-gray-400">Cuanto más detallado, mejor el diagnóstico</p>
                <p className={`text-[10px] ${sintomas.length > 900 ? 'text-red-400' : 'text-gray-400'}`}>{sintomas.length}/1000</p>
              </div>
            </div>

            <button onClick={handleConsulta} disabled={consultaLoading || sintomas.trim().length < 10}
              className="group w-full h-11 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation">
              {consultaLoading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> AgroIA analizando…</>
                : <>{Ic.send} Consultar AgroIA <ArrowCircle /></>}
            </button>
            </div>
          </Bezel>

          {consultaResp && (
            <Bezel className="animate-slide-up">
              <div className="p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-violet-500/10 ring-1 ring-violet-500/20 rounded-xl flex items-center justify-center text-violet-500">{Ic.brain}</div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">Respuesta de AgroIA</h3>
                  <p className="text-[10px] text-gray-400">Groq · llama-3.3-70b-versatile</p>
                </div>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line bg-gray-50/80 dark:bg-white/[0.04] rounded-2xl px-4 py-4 ring-1 ring-black/5 dark:ring-white/10">
                {consultaResp}
              </div>
              <button onClick={() => { setSintomas(''); setConsultaResp(null); }}
                className="mt-3 text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline touch-manipulation">
                Nueva consulta
              </button>
              </div>
            </Bezel>
          )}
        </div>
      )}

      {tab === 'historial' && (
        <div className="space-y-3">
          {historial.length === 0 ? (
            <Bezel className="animate-slide-up">
              <div className="py-14 flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 rounded-2xl flex items-center justify-center text-gray-400">{Ic.history}</div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Sin detecciones registradas</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Las detecciones aparecerán aquí</p>
              </div>
            </Bezel>
          ) : historial.map(d => {
            const sc = SEVER_CFG[d.severidad] || SEVER_CFG.leve;
            return (
              <Bezel key={d.id} className="animate-slide-up">
                <div className={`h-1 ${sc.bar}`} />
                <div className="p-4 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ${sc.badge}`}>{Ic.bug}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white truncate">{d.tipo_plaga}</p>
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ring-1 ${sc.badge}`}>{d.severidad}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
                      <span>Confianza: <strong>{parseFloat(d.confianza || 0).toFixed(1)}%</strong></span>
                      <span>{d.fecha_deteccion ? new Date(d.fecha_deteccion).toLocaleDateString('es-PE', { day:'numeric', month:'short', year:'numeric' }) : '—'}</span>
                      {d.tratamiento_aplicado && <span className="flex items-center gap-1 text-emerald-500 font-semibold">{Ic.check} Tratado</span>}
                    </div>
                  </div>
                </div>
              </Bezel>
            );
          })}
        </div>
      )}

      {tab === 'guia' && (
        <div className="space-y-3">
          <Bezel className="animate-slide-up">
            <div className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-violet-500/10 ring-1 ring-violet-500/20 rounded-xl flex items-center justify-center text-violet-500">{Ic.book}</div>
              <h3 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">Plagas comunes del Altiplano puneño</h3>
            </div>
            {biblioteca.length === 0
              ? <p className="text-sm text-gray-400">Cargando…</p>
              : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {biblioteca.map((p, i) => (
                    <div key={i} className="rounded-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
                      <div className="bg-gray-50/80 dark:bg-white/[0.04] px-4 py-3 flex items-start gap-3 border-b border-black/5 dark:border-white/10">
                        <div className="w-8 h-8 bg-violet-500/10 ring-1 ring-violet-500/20 text-violet-500 rounded-xl flex items-center justify-center shrink-0">{Ic.bug}</div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm tracking-tight text-gray-900 dark:text-white truncate">{p.nombre}</p>
                          <p className="text-xs text-gray-400 italic truncate">{p.nombre_cientifico}</p>
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        {[
                          { icon: Ic.leaf,   label:'Cultivos',    val: p.cultivos_afectados?.join(', '), color:'text-emerald-500' },
                          { icon: Ic.warn,   label:'Síntomas',    val: p.sintomas,                      color:'text-amber-500'   },
                          { icon: Ic.drop,   label:'Tratamiento', val: p.tratamiento,                   color:'text-sky-500'     },
                          { icon: Ic.shield, label:'Prevención',  val: p.prevencion,                    color:'text-violet-500'  },
                        ].filter(r => r.val).map(({ icon, label, val, color }) => (
                          <div key={label} className="flex items-start gap-2 text-xs">
                            <span className={`${color} shrink-0 mt-0.5`}>{icon}</span>
                            <span className="text-gray-600 dark:text-gray-400"><strong className="text-gray-700 dark:text-gray-300">{label}:</strong> {val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
            </div>
          </Bezel>

          <div className="bg-violet-500/[0.06] ring-1 ring-violet-500/20 rounded-2xl p-4 animate-slide-up">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-violet-500">{Ic.brain}</span>
              <p className="text-sm font-semibold text-violet-700 dark:text-violet-400">Diagnóstico avanzado con AgroIA</p>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Si no encuentras tu plaga en esta guía, describe los síntomas o sube una foto para diagnóstico con IA.</p>
            <button onClick={() => setTab('sintomas')}
              className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline touch-manipulation">
              {Ic.send} Abrir consulta IA
            </button>
          </div>
        </div>
      )}

      {showCamera && (
        <CameraCapture
          onCapture={file => { setShowCamera(false); applyFile(file); }}
          onClose={() => setShowCamera(false)}
        />
      )}

    </div>
  );
};

export default DeteccionPlagas;
