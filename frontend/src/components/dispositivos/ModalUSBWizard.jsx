import React, { useState, useEffect } from 'react';
import { serialAPI } from '../../services/api';
import { Ic, rssiToIcon, rssiToColor } from './dispositivosIcons';
import { fieldClass } from '../auth/AuthShared';

export default function ModalUSBWizard({ onClose, onDone }) {
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [puertosList, setPuertosList] = useState(null);
  const [todosLos, setTodosLos] = useState([]);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [puertoSel, setPuertoSel] = useState('');

  const [deviceId, setDeviceId] = useState('');
  const [firmwareVer, setFirmwareVer] = useState('');

  const [redes, setRedes] = useState([]);
  const [redSel, setRedSel] = useState('');
  const [wifiPass, setWifiPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [serverOptions, setServerOptions] = useState([]);
  const [serverSel, setServerSel] = useState('');
  const [serverManual, setServerManual] = useState('');
  const [loadingServer, setLoadingServer] = useState(false);

  const [configurado, setConfigurado] = useState(false);

  const serverUrl = serverManual || serverSel;

  const setErr = (msg) => { setError(msg); setLoading(false); };

  useEffect(() => {
    const fetchServerInfo = async () => {
      setLoadingServer(true);
      try {
        const res = await serialAPI.serverInfo();
        const { options, suggested } = res.data;
        if (options && options.length > 0) {
          setServerOptions(options);
          setServerSel(suggested || options[0].url);
        }
      } catch {
        const fallback = `http://${window.location.hostname}:5000`;
        setServerOptions([{ ip: window.location.hostname, url: fallback, label: fallback }]);
        setServerSel(fallback);
      } finally {
        setLoadingServer(false);
      }
    };
    fetchServerInfo();
  }, []);

  const buscarPuertos = async () => {
    setLoading(true);
    setError('');
    setPuertosList(null);
    try {
      const res = await serialAPI.detectar();
      const { puertos, todos } = res.data;
      setPuertosList(puertos || []);
      setTodosLos(todos || []);
      if (puertos && puertos.length === 1) setPuertoSel(puertos[0].port);
    } catch (e) {
      setErr(e.response?.data?.message || 'No se pudo conectar con el backend');
    } finally {
      setLoading(false);
    }
  };

  const identificar = async () => {
    if (!puertoSel) { setError('Selecciona un puerto primero'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await serialAPI.identificar(puertoSel);
      const d = res.data;
      if (d.success) {
        setDeviceId(d.device_id || '');
        setFirmwareVer(d.firmware || '');
        setPaso(2);
      } else {
        setErr(d.message || 'Error al identificar el dispositivo');
      }
    } catch (e) {
      setErr(e.response?.data?.message || 'Error de conexión. Verifica que el ESP32 esté en modo Setup.');
    } finally {
      setLoading(false);
    }
  };

  const escanearWifi = async () => {
    setLoading(true);
    setError('');
    setRedes([]);
    try {
      const res = await serialAPI.scanWifi(puertoSel);
      const d = res.data;
      if (d.success) {
        const sorted = [...(d.networks || [])].sort((a, b) => b.rssi - a.rssi);
        setRedes(sorted);
        if (sorted.length > 0) setRedSel(sorted[0].ssid);
      } else {
        setErr(d.message || 'Error al escanear redes WiFi');
      }
    } catch (e) {
      setErr(e.response?.data?.message || 'Error al escanear. Verifica conexión USB.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paso === 3) escanearWifi();
  }, [paso]);

  const configurar = async () => {
    if (!redSel) { setError('Selecciona una red WiFi'); return; }
    if (!serverUrl) { setError('La URL del servidor es requerida'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await serialAPI.configurar({
        port: puertoSel,
        ssid: redSel,
        pass: wifiPass,
        server_url: serverUrl,
      });
      const d = res.data;
      if (d.success) {
        setConfigurado(true);
        setPaso(4);
        setTimeout(() => { onDone(); onClose(); }, 8000);
      } else {
        setErr(d.message || 'Error al configurar el ESP32');
      }
    } catch (e) {
      setErr(e.response?.data?.message || 'Error al enviar configuración al ESP32.');
    } finally {
      setLoading(false);
    }
  };

  const listaPuertos = mostrarTodos ? todosLos : (puertosList || []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-2xl p-1.5 bg-white/10 ring-1 ring-black/5 dark:ring-white/10 animate-slide-up flex flex-col max-h-[90vh]">
      <div className="bg-white dark:bg-gray-900 rounded-[calc(1rem-0.375rem)] ring-1 ring-black/5 dark:ring-white/5 flex flex-col overflow-hidden min-h-0">

        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/20 dark:ring-emerald-400/20 text-emerald-500">{Ic.usb}</span>
            <h3 className="font-semibold tracking-tight text-gray-900 dark:text-white text-sm">Conectar nuevo dispositivo por USB</h3>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] hover:text-gray-600 dark:hover:text-gray-200 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">{Ic.x}</button>
        </div>

        <div className="flex items-center gap-0 px-6 pt-4 pb-2 shrink-0">
          {[1, 2, 3, 4].map((n) => (
            <React.Fragment key={n}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  paso > n ? 'bg-emerald-600 text-white' :
                  paso === n ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/15 dark:ring-emerald-400/20' :
                  'bg-gray-50 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 text-gray-400'
                }`}>
                  {paso > n ? Ic.check : n}
                </div>
                <span className={`text-[10px] font-semibold whitespace-nowrap ${paso >= n ? 'text-emerald-600 dark:text-emerald-300' : 'text-gray-400'}`}>
                  {n === 1 ? 'Detectar' : n === 2 ? 'Verificar' : n === 3 ? 'WiFi' : 'Configurar'}
                </span>
              </div>
              {n < 4 && (
                <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${paso > n ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/10'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1">

          {paso === 1 && (
            <div className="space-y-4">
              <div className="bg-emerald-50/60 dark:bg-emerald-500/[0.07] ring-1 ring-emerald-500/15 dark:ring-emerald-400/15 rounded-2xl px-4 py-3">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Antes de continuar</p>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-200/70">
                  Conecta tu ESP32 al PC por USB. El LED debe parpadear muy rápido (modo Setup). Si no, mantén BOOT 5s para resetear.
                </p>
              </div>

              <button
                onClick={buscarPuertos}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 h-11 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : Ic.usb}
                {loading ? 'Buscando...' : 'Buscar dispositivo USB'}
              </button>

              {puertosList !== null && (
                <div>
                  {listaPuertos.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No se encontraron dispositivos ESP32</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Verifica que el cable USB transmita datos (no solo carga) y que el driver CP210x esté instalado.
                      </p>
                      {!mostrarTodos && todosLos.length > 0 && (
                        <button onClick={() => setMostrarTodos(true)} className="mt-2 text-xs text-emerald-500 underline">
                          Mostrar todos los puertos COM ({todosLos.length})
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {puertosList.length} dispositivo{puertosList.length > 1 ? 's' : ''} encontrado{puertosList.length > 1 ? 's' : ''}:
                      </p>
                      {listaPuertos.map((p) => (
                        <button
                          key={p.port}
                          onClick={() => setPuertoSel(p.port)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl ring-1 text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                            puertoSel === p.port
                              ? 'ring-2 ring-emerald-500/60 bg-emerald-50 dark:bg-emerald-500/10'
                              : 'ring-black/5 dark:ring-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                          }`}
                        >
                          <span className={`text-lg font-mono font-bold ${puertoSel === p.port ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {p.port}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-1 truncate">{p.descripcion}</span>
                          {puertoSel === p.port && <span className="text-emerald-500 shrink-0">{Ic.check}</span>}
                        </button>
                      ))}
                      {!mostrarTodos && todosLos.length > listaPuertos.length && (
                        <button onClick={() => setMostrarTodos(true)} className="text-xs text-gray-400 underline mt-1">
                          Ver también otros puertos ({todosLos.length - listaPuertos.length} más)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 dark:bg-red-500/10 ring-1 ring-red-500/20 px-3 py-2 rounded-xl">
                  {Ic.alert}<span>{error}</span>
                </div>
              )}
            </div>
          )}

          {paso === 2 && (
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/20 dark:ring-emerald-400/20 rounded-2xl px-4 py-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 ring-1 ring-emerald-500/20 dark:ring-emerald-400/20 flex items-center justify-center text-emerald-500 shrink-0">
                  {Ic.cpu}
                </div>
                <div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-300 font-semibold mb-0.5">ESP32 detectado</p>
                  <p className="font-mono font-bold tracking-tight text-gray-900 dark:text-white text-base">{deviceId}</p>
                  {firmwareVer && <p className="text-xs text-gray-400 mt-0.5">Firmware v{firmwareVer} — Modo Setup activo</p>}
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-500/20 dark:ring-amber-400/20 rounded-2xl px-3 py-2.5 flex items-start gap-2">
                <span className="text-amber-500 shrink-0 mt-0.5">{Ic.alert}</span>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  El LED está parpadeando rápido: el ESP32 está listo para recibir configuración WiFi.
                </p>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Puerto seleccionado: <strong className="font-mono text-gray-700 dark:text-gray-300">{puertoSel}</strong>
              </p>
            </div>
          )}

          {paso === 3 && (
            <div className="space-y-4">
              {loading && redes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Escaneando redes WiFi... (puede tardar ~5-10s)</p>
                </div>
              ) : redes.length > 0 ? (
                <>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
                      Redes disponibles ({redes.filter(r => r.ssid).length})
                      <button onClick={escanearWifi} disabled={loading} className="ml-2 text-emerald-500 hover:text-emerald-600 disabled:opacity-50">
                        <span className={loading ? 'inline-block animate-spin' : ''}>{Ic.refresh}</span>
                      </button>
                    </p>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {redes.filter(r => r.ssid && r.ssid.trim() !== '').map((r, idx) => (
                        <button
                          key={`${r.ssid}-${idx}`}
                          onClick={() => setRedSel(r.ssid)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl ring-1 text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                            redSel === r.ssid
                              ? 'ring-2 ring-emerald-500/60 bg-emerald-50 dark:bg-emerald-500/10'
                              : 'ring-black/5 dark:ring-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                          }`}
                        >
                          <span className={rssiToColor(r.rssi)}>{rssiToIcon(r.rssi)}</span>
                          <span className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{r.ssid}</span>
                          <span className="text-xs text-gray-400">{r.rssi} dBm</span>
                          {r.secure && <span className="text-gray-400">{Ic.lock}</span>}
                          {redSel === r.ssid && <span className="text-emerald-500">{Ic.check}</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                      Contraseña WiFi {redes.find(r => r.ssid === redSel)?.secure && <span className="text-red-400">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={wifiPass}
                        onChange={e => setWifiPass(e.target.value)}
                        placeholder="Contraseña de la red seleccionada"
                        autoComplete="off"
                        className={fieldClass + ' pr-10'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPass
                          ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        }
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                        Servidor AgroYachay
                      </label>
                      {loadingServer
                        ? <span className="text-xs text-gray-400 animate-pulse">Detectando IPs...</span>
                        : <span className="text-xs text-emerald-600 dark:text-emerald-300 font-medium">
                            {serverOptions.length} interfaz{serverOptions.length !== 1 ? 'ces' : ''} detectada{serverOptions.length !== 1 ? 's' : ''}
                          </span>
                      }
                    </div>

                    {serverOptions.length > 0 && (
                      <div className="flex flex-col gap-1 mb-2">
                        {serverOptions.map(opt => (
                          <button
                            key={opt.url}
                            type="button"
                            onClick={() => { setServerSel(opt.url); setServerManual(''); }}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl ring-1 text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                              serverUrl === opt.url && !serverManual
                                ? 'ring-2 ring-emerald-500/60 bg-emerald-50 dark:bg-emerald-500/10'
                                : 'ring-black/5 dark:ring-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                            }`}
                          >
                            <div>
                              <p className="font-mono text-xs font-bold text-gray-900 dark:text-white">{opt.url}</p>
                              <p className="text-xs text-gray-400">{opt.label}</p>
                            </div>
                            {serverUrl === opt.url && !serverManual && (
                              <span className="text-emerald-500 shrink-0 ml-2">{Ic.check}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    <input
                      type="text"
                      value={serverManual}
                      onChange={e => setServerManual(e.target.value)}
                      placeholder={serverSel || 'http://192.168.x.x:5000'}
                      className={fieldClass + ' font-mono text-xs'}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {serverManual ? 'Usando URL manual.' : 'Selección automática. Escribe para sobreescribir.'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No se encontraron redes WiFi.</p>
                  <button onClick={escanearWifi} className="mt-2 text-sm text-emerald-500 underline">Reintentar escaneo</button>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 dark:bg-red-500/10 ring-1 ring-red-500/20 px-3 py-2 rounded-xl">
                  {Ic.alert}<span>{error}</span>
                </div>
              )}
            </div>
          )}

          {paso === 4 && configurado && (
            <div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
              <div className="w-16 h-16 rounded-[1.25rem] bg-emerald-100 dark:bg-emerald-500/15 ring-1 ring-emerald-500/20 dark:ring-emerald-400/20 flex items-center justify-center text-emerald-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold tracking-tight text-gray-900 dark:text-white text-base">ESP32 configurado</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  El dispositivo se está conectando a <strong className="text-gray-700 dark:text-gray-300">{redSel}</strong>...
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/20 dark:ring-emerald-400/20 rounded-2xl px-4 py-3 w-full">
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  En unos segundos aparecerá como <strong>Pendiente</strong> en este panel. La lista se actualizará automáticamente.
                </p>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="w-4 h-4 border-2 border-gray-300 border-t-emerald-400 rounded-full animate-spin" />
                <span className="text-xs">Esperando conexión del ESP32...</span>
              </div>
            </div>
          )}

          {paso === 4 && !configurado && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Enviando configuración al ESP32...</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-black/5 dark:border-white/10 shrink-0">
          {paso > 1 && paso < 4 && (
            <button
              onClick={() => { setError(''); setPaso(p => p - 1); }}
              disabled={loading}
              className="flex items-center gap-1.5 h-11 px-4 text-sm font-medium rounded-full ring-1 ring-black/5 dark:ring-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-50"
            >
              {Ic.arrowL} Atrás
            </button>
          )}

          {paso === 1 && (
            <button onClick={onClose} className="flex-1 h-11 px-4 text-sm font-medium rounded-full ring-1 ring-black/5 dark:ring-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
              Cancelar
            </button>
          )}

          {paso === 1 && (
            <button
              onClick={identificar}
              disabled={!puertoSel || loading}
              className="group/nav flex-1 flex items-center justify-center gap-2 h-11 px-4 text-sm font-semibold rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : null}
              {loading ? 'Verificando...' : 'Verificar dispositivo'}
              {!loading && <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/nav:translate-x-0.5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-3 h-3"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>}
            </button>
          )}

          {paso === 2 && (
            <button
              onClick={() => { setError(''); setPaso(3); }}
              disabled={loading}
              className="group/nav flex-1 flex items-center justify-center gap-2 h-11 px-4 text-sm font-semibold rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-50"
            >
              Seleccionar red WiFi
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/nav:translate-x-0.5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-3 h-3"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>
            </button>
          )}

          {paso === 3 && (
            <button
              onClick={configurar}
              disabled={loading || !redSel || !serverUrl || redes.length === 0}
              className="flex-1 flex items-center justify-center gap-2 h-11 px-4 text-sm font-semibold rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : Ic.wifi}
              {loading ? 'Configurando...' : 'Configurar y conectar'}
            </button>
          )}

          {paso === 4 && (
            <button onClick={onClose} className="flex-1 h-11 px-4 text-sm font-medium rounded-full ring-1 ring-black/5 dark:ring-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
              Cerrar
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
