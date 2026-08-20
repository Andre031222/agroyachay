import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cultivosAPI, dispositivosAPI } from '../../services/api';
import { notify, confirmAction } from '../../utils/swal';
import { Ic } from './dispositivosIcons';
import ModalVincular from './ModalVincular';
import ModalConfigurar from './ModalConfigurar';
import ModalUSBWizard from './ModalUSBWizard';
import TarjetaPendiente from './TarjetaPendiente';
import { useLanguage } from '../../context/LanguageContext';
import TarjetaActivo from './TarjetaActivo';

export default function DispositivosPanel() {
  const { t, tList } = useLanguage();
  const [pendientes, setPendientes]       = useState([]);
  const [dispositivos, setDispositivos]   = useState([]);
  const [cultivos, setCultivos]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [modalVincular, setModalVincular] = useState(null);
  const [modalConfigurar, setModalConfigurar] = useState(null);
  const [tab, setTab]                     = useState('activos');
  const [modalUSB, setModalUSB]           = useState(false);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [resPend, resDev, resCult] = await Promise.all([
        dispositivosAPI.getPendientes(),
        dispositivosAPI.getMisDispositivos(),
        cultivosAPI.getAll().catch(() => ({ data: { data: [] } })),
      ]);

      setPendientes(resPend.data.success ? (resPend.data.pendientes || []) : []);
      setDispositivos(resDev.data.success  ? (resDev.data.dispositivos || []) : []);
      setCultivos(resCult.data?.data || []);
    } catch {
      notify.error(t('devices.loadError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
    const iv = setInterval(cargarDatos, 30_000);
    return () => clearInterval(iv);
  }, [cargarDatos]);

  const totalOnline = useMemo(() => dispositivos.filter(d => d.conectado).length, [dispositivos]);

  const handleDesvincular = useCallback(async (sensor) => {
    const ok = await confirmAction({
      title: t('devices.unlinkTitle', { name: sensor.nombre }),
      text: t('devices.unlinkText'),
      confirmText: t('devices.unlinkConfirm'),
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await dispositivosAPI.desvincular(sensor.id);
      if (res.data.success) {
        notify.success(res.data.message || t('devices.unlinked'));
        setTab('pendientes');
        cargarDatos();
      } else {
        notify.error(res.data.message || t('devices.unlinkError'));
      }
    } catch {
      notify.error(t('devices.connectionError'));
    }
  }, [cargarDatos]);

  const kpis = [
    { value: dispositivos.length, label: t('devices.kpiLinked'), color: 'text-emerald-500' },
    { value: totalOnline,         label: t('devices.kpiOnline'), color: totalOnline > 0 ? 'text-emerald-500' : 'text-gray-400' },
    { value: pendientes.length,   label: t('devices.kpiPending'), color: pendientes.length > 0 ? 'text-amber-500' : 'text-gray-400' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 bg-gray-50 dark:bg-gray-950 min-h-full">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{t('devices.pageTitle')}</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('devices.pageSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setModalUSB(true)}
            className="group/cta flex items-center gap-2 h-10 pl-4 pr-2.5 text-sm font-semibold rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation">
            {Ic.usb}
            <span className="hidden sm:inline">{t('devices.connectNew')}</span>
            <span className="sm:hidden">{t('devices.new')}</span>
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/cta:translate-x-0.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-3.5 h-3.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </span>
          </button>
          <button onClick={cargarDatos} disabled={loading}
            className="flex items-center gap-1.5 h-10 px-3.5 text-sm font-semibold rounded-full ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-white/[0.04] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.07] disabled:opacity-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 touch-manipulation">
            <span className={loading ? 'animate-spin' : ''}>{Ic.refresh}</span>
            <span className="hidden sm:inline">{t('devices.refresh')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {kpis.map((k, i) => (
          <div key={i} className="rounded-[1.75rem] p-1.5 bg-gray-50/60 dark:bg-white/[0.03] ring-1 ring-black/5 dark:ring-white/10">
            <div className="rounded-[calc(1.75rem-0.375rem)] bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/5 p-4 text-center">
              <p className={`text-2xl font-bold tracking-tight leading-none ${k.color}`}>{k.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {pendientes.length > 0 && (
        <button
          onClick={() => setTab('pendientes')}
          className="w-full flex items-center gap-3 bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-500/20 dark:ring-amber-400/20 rounded-2xl px-4 py-3 hover:bg-amber-100/70 dark:hover:bg-amber-500/[0.15] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] text-left touch-manipulation"
        >
          <span className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-500">{Ic.alert}</span>
          <p className="text-sm text-amber-700 dark:text-amber-300 font-semibold">
            {t('devices.pendingBanner', { count: pendientes.length })}
          </p>
        </button>
      )}

      <div className="flex gap-1 bg-gray-100/80 dark:bg-white/[0.04] p-1 rounded-full w-fit ring-1 ring-black/5 dark:ring-white/10">
        {[
          { key: 'activos',    label: t('devices.tabLinked', { count: dispositivos.length }) },
          { key: 'pendientes', label: pendientes.length > 0 ? t('devices.tabPendingCount', { count: pendientes.length }) : t('devices.tabPending') },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] touch-manipulation ${
              tab === key
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">{t('devices.loading')}</p>
        </div>
      ) : tab === 'activos' ? (
        dispositivos.length === 0 ? (
          <div className="rounded-2xl p-1.5 bg-gray-50/60 dark:bg-white/[0.03] ring-1 ring-black/5 dark:ring-white/10">
          <div className="bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/5 rounded-[calc(1rem-0.375rem)] py-16 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 bg-gray-50 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 rounded-2xl flex items-center justify-center text-gray-400">
              {Ic.cpu}
            </div>
            <p className="text-sm font-semibold tracking-tight text-gray-600 dark:text-gray-400">{t('devices.emptyLinked')}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs">
              {t('devices.emptyLinkedHint')}
            </p>
          </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dispositivos.map(d => (
              <TarjetaActivo
                key={d.id}
                sensor={d}
                onConfigurar={setModalConfigurar}
                onDesvincular={handleDesvincular}
              />
            ))}
          </div>
        )
      ) : (
        pendientes.length === 0 ? (
          <div className="rounded-2xl p-1.5 bg-gray-50/60 dark:bg-white/[0.03] ring-1 ring-black/5 dark:ring-white/10">
          <div className="bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/5 rounded-[calc(1rem-0.375rem)] py-16 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/20 dark:ring-emerald-400/20 rounded-2xl flex items-center justify-center text-emerald-500">
              {Ic.check}
            </div>
            <p className="text-sm font-semibold tracking-tight text-gray-600 dark:text-gray-400">{t('devices.emptyPending')}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs">
              {t('devices.emptyPendingHint')}
            </p>
          </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendientes.map(d => (
              <TarjetaPendiente
                key={d.id}
                sensor={d}
                onVincular={setModalVincular}
              />
            ))}
          </div>
        )
      )}

      <div className="rounded-2xl p-1.5 bg-gray-50/60 dark:bg-white/[0.03] ring-1 ring-black/5 dark:ring-white/10">
      <div className="bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/5 rounded-[calc(1rem-0.375rem)] p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/20 dark:ring-emerald-400/20 text-emerald-500">{Ic.wifi}</span>
          <h3 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">{t('devices.howToConnect')}</h3>
        </div>
        <ol className="space-y-3">
          {tList('devices.connectionSteps').map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/20 dark:ring-emerald-400/20 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px] mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <div className="mt-4 flex items-start gap-2.5 bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-500/20 dark:ring-amber-400/20 rounded-2xl px-3 py-3">
          <span className="text-amber-500 shrink-0 mt-0.5">{Ic.power}</span>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <strong>{t('devices.reconnectTitle')}</strong> {t('devices.reconnectText')}
          </p>
        </div>
      </div>
      </div>

      {modalUSB && (
        <ModalUSBWizard
          onClose={() => setModalUSB(false)}
          onDone={() => { cargarDatos(); setTab('pendientes'); }}
        />
      )}

      {modalVincular && (
        <ModalVincular
          sensor={modalVincular}
          cultivos={cultivos}
          onClose={() => setModalVincular(null)}
          onSuccess={msg => { notify.success(msg); cargarDatos(); }}
        />
      )}

      {modalConfigurar && (
        <ModalConfigurar
          sensor={modalConfigurar}
          onClose={() => setModalConfigurar(null)}
          onSuccess={msg => { notify.success(msg); cargarDatos(); }}
        />
      )}

    </div>
  );
}
