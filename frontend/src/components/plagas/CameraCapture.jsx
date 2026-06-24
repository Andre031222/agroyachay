import React, { useEffect, useRef, useState, useCallback } from 'react';
import { notify } from '../../utils/swal';

const IcFlip = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
    <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
    <circle cx="12" cy="12" r="4"/>
  </svg>
);

const IcX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IcCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IcRetake = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
  </svg>
);

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);

  const [ready,        setReady]        = useState(false);
  const [facingMode,   setFacingMode]   = useState('environment');
  const [captured,     setCaptured]     = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [hasMultiple,  setHasMultiple]  = useState(false);
  const [error,        setError]        = useState(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (facing) => {
    stopStream();
    setReady(false);
    setError(null);
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(d => d.kind === 'videoinput');
      setHasMultiple(cameras.length > 1);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Permiso de cámara denegado. Habilítalo en la configuración del navegador.'
        : 'No se pudo acceder a la cámara.';
      setError(msg);
    }
  }, [stopStream]);

  useEffect(() => {
    startCamera(facingMode);
    return () => stopStream();
  }, []);

  const flipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    setCaptured(null);
    setCapturedBlob(null);
    startCamera(next);
  };

  const capturePhoto = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !ready) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob(blob => {
      if (!blob) return;
      setCaptured(URL.createObjectURL(blob));
      setCapturedBlob(blob);
    }, 'image/jpeg', 0.92);
  };

  const retake = () => {
    if (captured) URL.revokeObjectURL(captured);
    setCaptured(null);
    setCapturedBlob(null);
  };

  const confirmCapture = () => {
    if (!capturedBlob) return;
    const file = new File([capturedBlob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
    stopStream();
    onCapture(file);
  };

  const handleClose = () => {
    stopStream();
    if (captured) URL.revokeObjectURL(captured);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" style={{ touchAction: 'none' }}>

      <div className="relative flex-1 overflow-hidden">
        {!captured ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />

            {ready && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-64 h-64 sm:w-80 sm:h-80">
                  <div className="absolute inset-0 rounded-full border-2 border-white/40" />
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-lg" />
                </div>
              </div>
            )}

            {!ready && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <p className="text-white/70 text-sm">Iniciando cámara…</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center px-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 max-w-sm">
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-6 h-6">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <p className="text-white font-semibold text-sm mb-1">Sin acceso a la cámara</p>
                  <p className="text-white/60 text-xs">{error}</p>
                </div>
              </div>
            )}

            <div className="absolute top-4 right-4">
              {ready && (
                <p className="text-white/60 text-xs text-center">
                  {facingMode === 'environment' ? 'Cámara trasera' : 'Cámara frontal'}
                </p>
              )}
            </div>

            {ready && (
              <div className="absolute bottom-24 left-0 right-0 flex justify-center">
                <p className="text-white/50 text-xs bg-black/30 px-3 py-1 rounded-full">
                  Centra la planta o insecto en el encuadre
                </p>
              </div>
            )}
          </>
        ) : (
          <img
            src={captured}
            alt="Captura"
            className="w-full h-full object-contain bg-black"
          />
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-black/90 backdrop-blur-sm px-6 py-6 flex items-center justify-between safe-area-pb">
        {!captured ? (
          <>
            <button
              onClick={handleClose}
              className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors touch-manipulation"
            >
              <IcX />
            </button>

            <button
              onClick={capturePhoto}
              disabled={!ready}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl disabled:opacity-40 active:scale-95 transition-all touch-manipulation"
            >
              <div className="w-12 h-12 rounded-full border-2 border-gray-400" />
            </button>

            <button
              onClick={flipCamera}
              disabled={!hasMultiple}
              className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-30 transition-colors touch-manipulation"
              title="Cambiar cámara"
            >
              <IcFlip />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={retake}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors touch-manipulation"
            >
              <IcRetake /> Repetir
            </button>

            <button
              onClick={confirmCapture}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 transition-colors touch-manipulation"
            >
              <IcCheck /> Usar foto
            </button>
          </>
        )}
      </div>
    </div>
  );
}
