import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../common/ThemeToggle';
import { notify } from '../../utils/swal';
import { NameStep, GoogleIcon, Spinner, EyeOpen, EyeClose, fieldClass } from './AuthShared';

const Register = () => {
  const [formData, setFormData] = useState({ nombre: '', email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [nameStep, setNameStep] = useState(null);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm) {
      notify.error('Las contraseñas no coinciden');
      return;
    }
    if (formData.password.length < 8) {
      notify.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true);
    try {
      const result = await register({
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
      });
      if (result.success) {
        notify.success(`¡Bienvenido, ${formData.nombre}!`);
        navigate('/dashboard', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (token) => {
      setLoading(true);
      try {
        const r = await loginWithGoogle(token);
        if (r.success) {
          if (r.isNewUser) {
            setNameStep(r.user);
          } else {
            notify.success('¡Bienvenido de nuevo!');
            navigate('/dashboard', { replace: true });
          }
        }
      } finally { setLoading(false); }
    },
    onError: () => notify.error('No se pudo conectar con Google'),
  });

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8 bg-gray-50 dark:bg-gray-950">

      {nameStep && (
        <NameStep
          user={nameStep}
          onConfirm={(nombre) => {
            notify.success(`¡Bienvenido, ${nombre}!`);
            navigate('/dashboard', { replace: true });
          }}
        />
      )}

      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[420px] animate-slide-up">

        <div className="flex flex-col items-center mb-8">
          <img src="/logo-oscuro-crop.png" alt="AgroYachay" className="h-12 w-12 object-contain mb-3 dark:hidden" />
          <img src="/logo-claro-crop.png"  alt="AgroYachay" className="h-12 w-12 object-contain mb-3 hidden dark:block" />
          <h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">AgroYachay</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Crea tu cuenta gratis</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/10 p-7">

          <button
            type="button"
            onClick={() => googleLogin()}
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-3 rounded-xl ring-1 ring-black/8 dark:ring-white/12 text-sm font-medium text-gray-700 dark:text-gray-100 bg-white dark:bg-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.08] transition-colors active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? <Spinner /> : <GoogleIcon />}
            Registrarse con Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
            <span className="text-xs text-gray-400 dark:text-gray-500">o con email</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nombre" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Nombre</label>
                <input id="nombre" type="text" name="nombre" value={formData.nombre}
                  onChange={handleChange} placeholder="Tu nombre" required className={fieldClass} />
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Email</label>
                <input id="email" type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="tu@email.com" required className={fieldClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Contraseña</label>
                <div className="relative">
                  <input id="password" type={showPwd ? 'text' : 'password'} name="password"
                    value={formData.password} onChange={handleChange}
                    placeholder="Mín. 8 caracteres" required className={fieldClass + ' pr-11'} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} aria-label="Mostrar u ocultar contraseña"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors">
                    {showPwd ? <EyeClose /> : <EyeOpen />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirm" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Confirmar</label>
                <input id="confirm" type="password" name="confirm" value={formData.confirm}
                  onChange={handleChange} placeholder="Repite la contraseña" required className={fieldClass} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><Spinner /> Creando cuenta…</> : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors">
            Iniciar sesión
          </Link>
        </p>
        <p className="mt-3 text-center">
          <Link to="/" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
