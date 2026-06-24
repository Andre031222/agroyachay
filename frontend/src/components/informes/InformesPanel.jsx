import React, { useState, useEffect } from 'react';
import { informesAPI } from '../../services/api';
import { notify, confirmAction } from '../../utils/swal';

const Ic = {
  file:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  xls:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>,
  dl:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  plus:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  trend: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  leaf:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>,
  bug:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M8 2l1.88 1.88M14.12 3.88 16 2M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z"/></svg>,
  dollar:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  cloud: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
  x:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"/></svg>,
  arrow: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
};

const TIPOS = [
  { tipo:'Dashboard Ejecutivo', icono: Ic.trend,  color:'bg-blue-500',    light:'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40',         text:'text-blue-700 dark:text-blue-400',    desc:'Resumen completo: cultivos, sensores, alertas y rendimiento.' },
  { tipo:'Estado de Cultivos',  icono: Ic.leaf,   color:'bg-emerald-500', light:'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40',text:'text-emerald-700 dark:text-emerald-400',desc:'Analisis detallado de cada cultivo con progreso y salud.' },
  { tipo:'Analisis Financiero', icono: Ic.dollar, color:'bg-amber-500',   light:'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40',       text:'text-amber-700 dark:text-amber-400',   desc:'ROI, costos de insumos e ingresos estimados.' },
  { tipo:'Impacto Climatico',   icono: Ic.cloud,  color:'bg-sky-500',     light:'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800/40',               text:'text-sky-700 dark:text-sky-400',       desc:'Condiciones meteorologicas y su impacto en Puno.' },
];

const FORMATO_CFG = {
  PDF:   { color:'bg-red-500',     light:'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40',         text:'text-red-700 dark:text-red-400',     icono: Ic.file },
  EXCEL: { color:'bg-emerald-500', light:'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40', text:'text-emerald-700 dark:text-emerald-400', icono: Ic.xls  },
};

const MOTION = 'transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]';

const InformesPanel = () => {
  const [informes, setInformes]         = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [genTipo, setGenTipo]           = useState('Dashboard Ejecutivo');
  const [genFormato, setGenFormato]     = useState('PDF');
  const [generating, setGenerating]     = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [infRes, estRes] = await Promise.all([
        informesAPI.getMisInformes(),
        informesAPI.getEstadisticas(),
      ]);
      setInformes(infRes.data.data || []);
      setEstadisticas(estRes.data.data || null);
    } catch {
      setInformes([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (tipo = 'Dashboard Ejecutivo') => {
    setGenTipo(tipo);
    setGenFormato('PDF');
    setShowModal(true);
  };

  const handleGenerar = async () => {
    setGenerating(true);
    try {
      await informesAPI.generar({ tipo_informe: genTipo, formato: genFormato });
      notify.success(`Informe "${genTipo}" generado en ${genFormato}`);
      setShowModal(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error al generar el informe');
    } finally {
      setGenerating(false);
    }
  };

  const handleDescargar = async (inf) => {
    try {
      const response = await informesAPI.descargar(inf.id);
      const ext  = inf.formato === 'EXCEL' ? 'xlsx' : 'pdf';
      const name = `${inf.tipo_informe.replace(/\s+/g,'_')}_${new Date(inf.fecha_generacion).toISOString().slice(0,10)}.${ext}`;
      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const a    = Object.assign(document.createElement('a'), { href: url, download: name });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify.success('Informe descargado');
    } catch {
      notify.error('Error al descargar el informe');
    }
  };

  const totalPDF   = informes.filter(i => i.formato === 'PDF').length;
  const totalExcel = informes.filter(i => i.formato === 'EXCEL').length;
  const tipoDesc   = TIPOS.find(t => t.tipo === genTipo)?.desc ?? '';

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-full">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Informes</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Reportes PDF y Excel de tu produccion agricola</p>
        </div>
        <button onClick={() => openModal()}
          className={`group inline-flex items-center gap-2 h-11 pl-5 pr-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold ${MOTION} active:scale-[0.98] touch-manipulation`}>
          Nuevo informe
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 group-hover:translate-x-0.5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
            {Ic.plus}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icono: Ic.file,   val: estadisticas?.total_informes ?? 0,              lbl:'Informes generados',  color:'bg-blue-500'    },
              { icono: Ic.leaf,   val: estadisticas?.metricas?.total_cultivos ?? 0,    lbl:'Cultivos registrados',color:'bg-emerald-500'  },
              { icono: Ic.bug,    val: estadisticas?.metricas?.total_detecciones ?? 0, lbl:'Detecciones plagas',  color:'bg-red-500'      },
              { icono: Ic.file,   val: `${totalPDF}P / ${totalExcel}E`,                lbl:'PDF / Excel creados', color:'bg-violet-500'   },
            ].map(({ icono, val, lbl, color }) => (
              <div key={lbl} className="rounded-2xl p-1.5 bg-white/60 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10">
                <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900 p-4 flex items-center gap-3 h-full">
                  <div className={`${color} w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0`}>{icono}</div>
                  <div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">{val}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{lbl}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-1.5 bg-white/60 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10">
            <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900 p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-white">Tipos de informe disponibles</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Haz clic para generar rapidamente</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TIPOS.map(t => (
                  <button key={t.tipo} type="button" onClick={() => openModal(t.tipo)}
                    className={`group flex items-start gap-3 p-4 rounded-[1.25rem] ring-1 ring-black/5 dark:ring-white/10 text-left ${MOTION} hover:ring-emerald-400/50 active:scale-[0.99] touch-manipulation ${t.light}`}>
                    <div className={`${t.color} w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0`}>{t.icono}</div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold tracking-tight ${t.text}`}>{t.tipo}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{t.desc}</p>
                    </div>
                    <span className="text-gray-300 dark:text-gray-600 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shrink-0">
                      {Ic.arrow}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-1.5 bg-white/60 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10">
            <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900 p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-white">Historial de informes</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Reportes generados anteriormente</p>

              {informes.length === 0 ? (
                <div className="text-center py-12 rounded-[1.25rem] bg-gray-50 dark:bg-white/[0.03] ring-1 ring-black/5 dark:ring-white/10">
                  <div className="w-14 h-14 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-400">{Ic.file}</div>
                  <p className="text-sm font-semibold tracking-tight text-gray-700 dark:text-gray-300 mb-1">Sin informes generados</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Crea tu primer reporte para analizar tu produccion</p>
                  <button onClick={() => openModal()}
                    className={`group inline-flex items-center gap-2 h-10 pl-5 pr-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold ${MOTION} active:scale-[0.98] touch-manipulation`}>
                    Generar primer informe
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 group-hover:translate-x-0.5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                      {Ic.plus}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {informes.map(inf => {
                    const fmtCfg = FORMATO_CFG[inf.formato] || FORMATO_CFG.PDF;
                    return (
                      <div key={inf.id} className={`flex items-center gap-3 p-4 rounded-[1.25rem] ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-gray-900 ${MOTION} hover:ring-emerald-400/40`}>
                        <div className={`${fmtCfg.color} w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0`}>
                          {fmtCfg.icono}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white truncate">{inf.tipo_informe}</p>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ${fmtCfg.light} ${fmtCfg.text}`}>
                              {inf.formato || 'PDF'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-1">
                            {Ic.clock}
                            {new Date(inf.fecha_generacion).toLocaleDateString('es-PE', {
                              year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'
                            })}
                          </p>
                        </div>
                        <button onClick={() => handleDescargar(inf)}
                          className={`group flex items-center gap-1.5 h-9 pl-4 pr-2 rounded-full text-xs font-semibold text-white ${MOTION} active:scale-[0.98] touch-manipulation shrink-0 ${fmtCfg.color} hover:opacity-90`}>
                          Descargar
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 group-hover:translate-y-0.5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                            {Ic.dl}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-50 sm:p-4"
          onClick={() => !generating && setShowModal(false)}>
          <div
            className="w-full sm:max-w-lg max-h-[92vh] rounded-t-[2rem] sm:rounded-2xl p-1.5 bg-white/10 ring-1 ring-white/15 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
          <div className="rounded-t-[calc(2rem-0.375rem)] sm:rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900 flex flex-col max-h-[calc(92vh-0.75rem)]">
            <div className="flex items-center justify-between px-6 py-5 shrink-0">
              <div>
                <h2 className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-white">Generar informe</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Tipo y formato de salida</p>
              </div>
              {!generating && (
                <button onClick={() => setShowModal(false)}
                  className={`p-2 rounded-full text-gray-400 ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.06] ${MOTION} touch-manipulation`}>
                  {Ic.x}
                </button>
              )}
            </div>

            {generating ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-14 px-6">
                <div className="rounded-full p-1.5 bg-emerald-500/10 ring-1 ring-emerald-500/20">
                  <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-sm font-semibold tracking-tight text-gray-700 dark:text-gray-300">Generando informe...</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center max-w-xs">Procesando datos agricolas, puede tardar unos segundos</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 min-h-0">

                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2.5">Tipo de informe</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {TIPOS.map(t => (
                        <button key={t.tipo} type="button" onClick={() => setGenTipo(t.tipo)}
                          className={`flex flex-col gap-2 p-3.5 rounded-[1.25rem] ring-1 text-left ${MOTION} active:scale-[0.99] touch-manipulation ${
                            genTipo === t.tipo
                              ? `${t.light} ring-emerald-400`
                              : 'ring-black/5 dark:ring-white/10 hover:ring-black/10 dark:hover:ring-white/20'
                          }`}>
                          <div className="flex items-center justify-between">
                            <div className={`${t.color} w-8 h-8 rounded-2xl flex items-center justify-center text-white shrink-0`}>{t.icono}</div>
                            {genTipo === t.tipo && (
                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white">{Ic.check}</span>
                            )}
                          </div>
                          <p className={`text-xs font-semibold leading-tight tracking-tight ${genTipo === t.tipo ? t.text : 'text-gray-800 dark:text-gray-200'}`}>
                            {t.tipo}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2.5">Formato de salida</p>
                    <div className="flex gap-2.5">
                      {[
                        { fmt:'PDF',   label:'PDF',   sub:'Para imprimir y compartir', ext:'.pdf'  },
                        { fmt:'EXCEL', label:'Excel', sub:'Para analizar y editar',    ext:'.xlsx' },
                      ].map(({ fmt, label, sub, ext }) => (
                        <button key={fmt} type="button" onClick={() => setGenFormato(fmt)}
                          className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-[1.25rem] ring-1 text-left ${MOTION} active:scale-[0.99] touch-manipulation ${
                            genFormato === fmt
                              ? 'ring-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10'
                              : 'ring-black/5 dark:ring-white/10 bg-gray-50 dark:bg-white/[0.03] hover:ring-black/10 dark:hover:ring-white/20'
                          }`}>
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-[10px] font-bold ${
                            genFormato === fmt ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                          }`}>
                            {ext}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold tracking-tight ${genFormato === fmt ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{label}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">{sub}</p>
                          </div>
                          {genFormato === fmt && (
                            <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white shrink-0">{Ic.check}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] px-4 py-3.5 bg-gray-50 dark:bg-white/[0.03] ring-1 ring-black/5 dark:ring-white/10">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Se va a generar</p>
                    <p className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">{genTipo} — {genFormato}</p>
                    {tipoDesc && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">{tipoDesc}</p>}
                  </div>

                </div>

                <div className="flex gap-3 px-6 py-5 shrink-0">
                  <button onClick={handleGenerar}
                    className={`group flex-1 h-11 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-full ${MOTION} active:scale-[0.98] touch-manipulation`}>
                    Generar y descargar
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 group-hover:translate-y-0.5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                      {Ic.dl}
                    </span>
                  </button>
                  <button onClick={() => setShowModal(false)}
                    className={`flex-1 h-11 bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300 font-semibold text-sm rounded-full ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-200 dark:hover:bg-white/[0.1] ${MOTION} active:scale-[0.98] touch-manipulation`}>
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InformesPanel;
