import React, { memo } from 'react';
import { Ic, tiempoRelativo } from './dispositivosIcons';

const ESTADO_BADGE = {
  activo:        'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 ring-emerald-500/20 dark:ring-emerald-400/20',
  inactivo:      'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.04] ring-black/5 dark:ring-white/10',
  mantenimiento: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 ring-amber-500/20 dark:ring-amber-400/20',
};

function TarjetaActivo({ sensor, onConfigurar, onDesvincular }) {
  const diff       = sensor.fecha_ultima_lectura
    ? (Date.now() - new Date(sensor.fecha_ultima_lectura).getTime()) / 1000
    : null;
  const conectado  = sensor.conectado ?? (diff !== null && diff < 60);
  const badgeCls   = ESTADO_BADGE[sensor.estado] || ESTADO_BADGE.inactivo;
  const estadoText = sensor.estado ? sensor.estado.charAt(0).toUpperCase() + sensor.estado.slice(1) : '—';

  return (
    <div className="group rounded-2xl p-1.5 bg-gray-50/60 dark:bg-white/[0.03] ring-1 ring-black/5 dark:ring-white/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5">
      <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/5 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ring-1 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            conectado
              ? 'bg-emerald-50 dark:bg-emerald-500/10 ring-emerald-500/20 dark:ring-emerald-400/20 text-emerald-500'
              : 'bg-gray-50 dark:bg-white/[0.04] ring-black/5 dark:ring-white/10 text-gray-400'
          }`}>
            {Ic.cpu}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm tracking-tight text-gray-900 dark:text-white truncate">{sensor.nombre}</p>
            <p className="font-mono text-xs text-gray-400 dark:text-gray-500">{sensor.esp32_id}</p>
          </div>
        </div>
        <span className={`flex items-center gap-1.5 shrink-0 ml-2 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${
          conectado
            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 ring-emerald-500/20 dark:ring-emerald-400/20'
            : 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.04] ring-black/5 dark:ring-white/10'
        }`}>
          <span className={`w-2 h-2 rounded-full shrink-0 ${conectado ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
          {conectado ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="space-y-1.5 mb-4">
        {sensor.cultivo_nombre && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="shrink-0">{Ic.sprout}</span>
            <span className="truncate">Cultivo: <strong className="text-gray-700 dark:text-gray-300">{sensor.cultivo_nombre}</strong></span>
          </div>
        )}
        {sensor.ubicacion && sensor.ubicacion !== 'Sin asignar' && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="shrink-0">{Ic.pin}</span>
            <span className="truncate">{sensor.ubicacion}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="shrink-0">{Ic.clock}</span>
          <span>Última señal: <strong className="text-gray-700 dark:text-gray-300">{tiempoRelativo(sensor.fecha_ultima_lectura)}</strong></span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ring-1 flex-1 text-center ${badgeCls}`}>
          {estadoText}
        </span>
        <button
          onClick={() => onConfigurar(sensor)}
          title="Configurar"
          className="flex items-center justify-center h-8 w-8 rounded-full ring-1 ring-black/5 dark:ring-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 touch-manipulation"
        >
          {Ic.edit}
        </button>
        <button
          onClick={() => onDesvincular(sensor)}
          title="Desvincular"
          className="flex items-center justify-center h-8 w-8 rounded-full ring-1 ring-red-500/20 dark:ring-red-400/20 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 touch-manipulation"
        >
          {Ic.unlink}
        </button>
      </div>
      </div>
    </div>
  );
}

export default memo(TarjetaActivo);
