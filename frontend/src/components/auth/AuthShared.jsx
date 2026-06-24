import React, { useState } from 'react';
import { authAPI } from '../../services/api';
import { notify } from '../../utils/swal';

export const fieldClass =
  'w-full h-11 px-3.5 rounded-xl text-sm transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ' +
  'bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 ' +
  'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:bg-white dark:focus:bg-white/[0.06]';

export const EyeOpen = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export const Spinner = () => (
  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".2" strokeWidth="3" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SHOWCASE_POINTS = [
  'Sensores ESP32 en tiempo real',
  'Detección de plagas con IA',
  'Predicción de cosecha y clima',
];

export const AuthShowcase = ({ eyebrow, title, subtitle }) => (
  <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#04140d] px-12 py-14 text-white">
    <div aria-hidden className="pointer-events-none absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-emerald-500/25 blur-[120px]" />
    <div aria-hidden className="pointer-events-none absolute bottom-[-10rem] right-[-6rem] w-[32rem] h-[32rem] rounded-full bg-teal-400/15 blur-[140px]" />

    <div className="relative flex items-center gap-3">
      <img src="/logo-claro-crop.png" alt="AgroYachay" className="h-10 w-10 object-contain" />
      <span className="text-lg font-semibold tracking-tight">AgroYachay</span>
    </div>

    <div className="relative max-w-md">
      <h2 className="font-display text-4xl xl:text-5xl font-bold leading-[1.05] tracking-tight">
        {title}
      </h2>
      <p className="mt-5 text-base leading-relaxed text-emerald-100/70">{subtitle}</p>

      <ul className="mt-9 space-y-3">
        {SHOWCASE_POINTS.map((point) => (
          <li key={point} className="flex items-center gap-3 text-sm text-emerald-50/90">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/15 ring-1 ring-emerald-300/20 text-emerald-300">
              <Check />
            </span>
            {point}
          </li>
        ))}
      </ul>
    </div>

    <p className="relative text-xs text-emerald-100/40">Puno, Perú · Altiplano andino · {new Date().getFullYear()}</p>
  </div>
);

export const NameStep = ({ user, onConfirm }) => {
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!nombre.trim() || nombre.trim().length < 2) {
      notify.error('Escribe al menos 2 caracteres');
      return;
    }
    setSaving(true);
    try {
      await authAPI.updateName(nombre.trim());
      onConfirm(nombre.trim());
    } catch {
      notify.error('No se pudo guardar el nombre');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl p-1.5 bg-white/10 ring-1 ring-white/15 animate-slide-up">
        <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900 p-8 text-center shadow-2xl">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user?.nombre || 'Avatar'}
              className="w-16 h-16 rounded-full mx-auto mb-4 ring-2 ring-emerald-300/40 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-8 h-8 text-emerald-600 dark:text-emerald-400">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-1">¿Cómo te llamamos?</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            <span className="font-medium text-gray-700 dark:text-gray-300">{user?.email}</span>
          </p>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            placeholder="Tu nombre"
            autoFocus
            className={fieldClass + ' mb-4'}
          />
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="w-full h-11 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <><Spinner /> Guardando…</> : 'Ir al panel'}
          </button>
        </div>
      </div>
    </div>
  );
};
