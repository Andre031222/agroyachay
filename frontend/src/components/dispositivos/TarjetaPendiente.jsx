import React, { memo } from 'react';
import { Ic, tiempoRelativo } from './dispositivosIcons';

function TarjetaPendiente({ sensor, onVincular }) {
  const diff     = sensor.fecha_ultima_lectura
    ? (Date.now() - new Date(sensor.fecha_ultima_lectura).getTime()) / 1000
    : null;
  const reciente = diff !== null && diff < 120;

  return (
    <div className="group rounded-2xl p-1.5 bg-amber-100/50 dark:bg-amber-500/10 ring-1 ring-amber-500/20 dark:ring-amber-400/20 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5">
      <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900 ring-1 ring-amber-500/10 dark:ring-amber-400/10 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-500/20 dark:ring-amber-400/20 flex items-center justify-center text-amber-500">
            {Ic.cpu}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm tracking-tight text-gray-900 dark:text-white truncate">{sensor.nombre}</p>
            <p className="font-mono text-xs text-gray-400 dark:text-gray-500">{sensor.esp32_id}</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 shrink-0 ml-2 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 bg-amber-50 dark:bg-amber-500/10 ring-amber-500/20 dark:ring-amber-400/20 text-amber-700 dark:text-amber-300">
          <span className={`w-1.5 h-1.5 rounded-full ${reciente ? 'bg-amber-500 animate-pulse' : 'bg-gray-400'}`} />
          {reciente ? 'Activo' : 'Sin señal'}
        </span>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="shrink-0">{Ic.clock}</span>
          <span>Última señal: <strong className="text-gray-700 dark:text-gray-300">{tiempoRelativo(sensor.fecha_ultima_lectura)}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="shrink-0 text-amber-500">{Ic.alert}</span>
          <span className="text-amber-600 dark:text-amber-400 font-medium">Sin cultivo asignado — lecturas no guardadas</span>
        </div>
      </div>

      <button
        onClick={() => onVincular(sensor)}
        className="group/btn w-full flex items-center justify-center gap-2 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] touch-manipulation"
      >
        {Ic.link}
        Vincular a cultivo
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/btn:translate-x-0.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-3 h-3"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </span>
      </button>
      </div>
    </div>
  );
}

export default memo(TarjetaPendiente);
