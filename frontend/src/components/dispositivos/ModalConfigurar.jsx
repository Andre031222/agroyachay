import React, { useState } from 'react';
import { dispositivosAPI } from '../../services/api';
import { Ic } from './dispositivosIcons';
import { fieldClass } from '../auth/AuthShared';

export default function ModalConfigurar({ sensor, onClose, onSuccess }) {
  const [nombre, setNombre] = useState(sensor.nombre || '');
  const [ubicacion, setUbicacion] = useState(sensor.ubicacion || '');
  const [estado, setEstado] = useState(sensor.estado || 'activo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGuardar = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dispositivosAPI.configurar(sensor.id, { nombre, ubicacion, estado });
      if (res.data.success) {
        onSuccess('Dispositivo actualizado correctamente');
        onClose();
      } else {
        setError(res.data.message || 'Error al guardar');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl p-1.5 bg-white/10 ring-1 ring-black/5 dark:ring-white/10 animate-slide-up">
      <div className="bg-white dark:bg-gray-900 rounded-[calc(1rem-0.375rem)] ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/20 dark:ring-emerald-400/20 text-emerald-500">{Ic.edit}</span>
            <h3 className="font-semibold tracking-tight text-gray-900 dark:text-white text-sm">Configurar dispositivo</h3>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] hover:text-gray-600 dark:hover:text-gray-200 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">{Ic.x}</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">ESP32 ID</p>
            <p className="font-mono font-bold text-sm text-gray-900 dark:text-white">{sensor.esp32_id}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Ubicación</label>
            <input
              type="text"
              value={ubicacion}
              onChange={e => setUbicacion(e.target.value)}
              placeholder="Ej: Parcela norte, fila 3"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Estado</label>
            <select
              value={estado}
              onChange={e => setEstado(e.target.value)}
              className={fieldClass}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="mantenimiento">En mantenimiento</option>
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 dark:bg-red-500/10 ring-1 ring-red-500/20 px-3 py-2 rounded-xl">
              {Ic.alert}<span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-black/5 dark:border-white/10">
          <button onClick={onClose} className="flex-1 h-11 px-4 text-sm font-medium rounded-full ring-1 ring-black/5 dark:ring-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={loading}
            className="flex-1 h-11 px-4 text-sm font-semibold rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : Ic.check}
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
