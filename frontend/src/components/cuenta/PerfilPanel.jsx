import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useProfilePanel } from '../../context/ProfilePanelContext';
import { authAPI } from '../../services/api';
import { resolveAvatar } from '../../utils/avatar';
import { notify } from '../../utils/swal';

const ROLE_BADGE = {
  superadmin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40',
  admin:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40',
  agricultor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40',
  usuario:    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700',
};

const SectionTitle = ({ children }) => (
  <div className="mb-4">
    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400">
      {children}
    </h3>
  </div>
);

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-medium tracking-tight text-gray-500 dark:text-gray-400">{label}</label>
    {children}
  </div>
);

const inputCls =
  'w-full h-11 px-3.5 rounded-xl text-sm transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ' +
  'bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 ' +
  'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:bg-white dark:focus:bg-white/[0.06]';

const EyeOpen  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeClose = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const Spinner  = () => <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>;

const AvatarSection = ({ user, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [reverting, setReverting] = useState(false);
  const fileRef = useRef();

  const avatarUrl = resolveAvatar(user?.avatar);
  const hasGoogleAvatar = Boolean(user?.google_avatar);
  const isUsingCustom  = user?.avatar && !user.avatar.startsWith('http');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await authAPI.uploadAvatar(file);
      onUpdate({ avatar: res.data.data.avatar });
      notify.success('Foto actualizada');
    } catch {
      notify.error('Error al subir la imagen');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRevert = async () => {
    setReverting(true);
    try {
      const res = await authAPI.revertAvatar();
      onUpdate({ avatar: res.data.data.avatar });
      notify.success('Foto de Google restaurada');
    } catch {
      notify.error('Error al restaurar la foto');
    } finally { setReverting(false); }
  };

  return (
    <div className="px-5 pt-6 pb-7">
      <div className="rounded-2xl p-1.5 bg-emerald-500/[0.07] dark:bg-white/[0.04] ring-1 ring-emerald-500/15 dark:ring-white/10">
        <div className="relative overflow-hidden rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900 px-6 py-7 flex flex-col items-center">
          <div aria-hidden className="pointer-events-none absolute -top-16 -right-12 w-48 h-48 rounded-full bg-emerald-500/15 blur-[80px]" />

          <div className="relative group mb-4">
            <div className="rounded-full p-1 ring-1 ring-emerald-400/40 bg-emerald-500/10">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.nombre}
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 rounded-full object-cover ring-2 ring-white dark:ring-gray-900"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                  <span className="text-white font-black text-3xl tracking-tight">
                    {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute inset-1 rounded-full bg-black/45 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer"
            >
              {uploading
                ? <Spinner />
                : <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              }
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleUpload} />
          </div>

          <p className="relative font-semibold tracking-tight text-gray-900 dark:text-white text-base">{user?.nombre}</p>
          <span className={`relative text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-2 ${ROLE_BADGE[user?.rol] || ROLE_BADGE.usuario}`}>
            {user?.rol?.toUpperCase()}
          </span>

          <div className="relative flex items-center gap-2 mt-5">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-xs px-3.5 py-2 rounded-full bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 text-gray-600 dark:text-gray-300 hover:ring-emerald-400/60 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] font-medium"
            >
              {uploading ? 'Subiendo…' : 'Subir foto'}
            </button>
            {hasGoogleAvatar && isUsingCustom && (
              <button
                onClick={handleRevert}
                disabled={reverting}
                className="text-xs px-3.5 py-2 rounded-full bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 text-gray-600 dark:text-gray-300 hover:ring-blue-400/60 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] font-medium"
              >
                {reverting ? 'Restaurando…' : 'Usar Google'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PerfilSection = ({ user, onUpdate }) => {
  const [nombre,   setNombre]   = useState(user?.nombre || '');
  const [telefono, setTelefono] = useState(user?.telefono || '');
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    setNombre(user?.nombre || '');
    setTelefono(user?.telefono || '');
  }, [user]);

  const save = async () => {
    if (!nombre.trim() || nombre.trim().length < 2) return notify.error('Nombre muy corto');
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({ nombre: nombre.trim(), telefono: telefono.trim() });
      onUpdate(res.data.data.user);
      notify.success('Perfil actualizado');
    } catch { notify.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  const dirty = nombre !== (user?.nombre || '') || telefono !== (user?.telefono || '');

  return (
    <div className="px-5 py-6 space-y-4">
      <SectionTitle>Perfil</SectionTitle>
      <Field label="Nombre">
        <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" className={inputCls} />
      </Field>
      <Field label="Email">
        <input value={user?.email || ''} readOnly className={inputCls + ' opacity-60 cursor-not-allowed'} />
      </Field>
      <Field label="Teléfono">
        <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Tu teléfono (opcional)" className={inputCls} />
      </Field>
      {dirty && (
        <button onClick={save} disabled={saving}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] flex items-center justify-center gap-2">
          {saving ? <><Spinner />Guardando…</> : 'Guardar cambios'}
        </button>
      )}
    </div>
  );
};

const SeguridadSection = () => {
  const [form,    setForm]    = useState({ current: '', next: '', confirm: '' });
  const [show,    setShow]    = useState({ current: false, next: false });
  const [saving,  setSaving]  = useState(false);

  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  const save = async () => {
    if (form.next !== form.confirm) return notify.error('Las contraseñas no coinciden');
    if (form.next.length < 8) return notify.error('Mínimo 8 caracteres');
    setSaving(true);
    try {
      await authAPI.changePassword({ current_password: form.current, new_password: form.next });
      notify.success('Contraseña actualizada');
      setForm({ current: '', next: '', confirm: '' });
    } catch (e) {
      notify.error(e.response?.data?.message || 'Error al cambiar contraseña');
    } finally { setSaving(false); }
  };

  return (
    <div className="px-5 py-6 space-y-4">
      <SectionTitle>Seguridad</SectionTitle>
      <Field label="Contraseña actual">
        <div className="relative">
          <input type={show.current ? 'text' : 'password'} value={form.current} onChange={e => set('current')(e.target.value)} placeholder="Tu contraseña actual" className={inputCls + ' pr-11'} />
          <button type="button" onClick={() => setShow(s => ({ ...s, current: !s.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
            {show.current ? <EyeClose /> : <EyeOpen />}
          </button>
        </div>
      </Field>
      <Field label="Nueva contraseña">
        <div className="relative">
          <input type={show.next ? 'text' : 'password'} value={form.next} onChange={e => set('next')(e.target.value)} placeholder="Mín. 8 caracteres" className={inputCls + ' pr-11'} />
          <button type="button" onClick={() => setShow(s => ({ ...s, next: !s.next }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
            {show.next ? <EyeClose /> : <EyeOpen />}
          </button>
        </div>
      </Field>
      <Field label="Confirmar contraseña">
        <input type="password" value={form.confirm} onChange={e => set('confirm')(e.target.value)} placeholder="Repite la nueva contraseña" className={inputCls} />
      </Field>
      {(form.current || form.next) && (
        <button onClick={save} disabled={saving}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] flex items-center justify-center gap-2">
          {saving ? <><Spinner />Guardando…</> : 'Cambiar contraseña'}
        </button>
      )}
    </div>
  );
};

const CuentaSection = ({ user }) => {
  const { logout }    = useAuth();
  const { close }     = useProfilePanel();
  const navigate      = useNavigate();

  const handleLogout = () => {
    close();
    logout();
    navigate('/');
  };

  return (
    <div className="px-5 py-6 space-y-4">
      <SectionTitle>Cuenta</SectionTitle>
      <div className="rounded-xl bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 px-4 py-3 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Rol</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_BADGE[user?.rol] || ROLE_BADGE.usuario}`}>
            {user?.rol?.toUpperCase()}
          </span>
        </div>
        {user?.fecha_registro && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Miembro desde</span>
            <span className="text-gray-700 dark:text-gray-300 text-xs font-medium tracking-tight">
              {new Date(user.fecha_registro).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        )}
      </div>
      <button
        onClick={handleLogout}
        className="w-full mt-1 h-11 flex items-center justify-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-500/10 hover:bg-red-500/15 ring-1 ring-red-500/20 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Cerrar sesión
      </button>
    </div>
  );
};

const PerfilPanel = () => {
  const { isOpen, close } = useProfilePanel();
  const { user, updateUser } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  const handleUpdate = (partial) => {
    const updated = { ...user, ...partial };
    updateUser(updated);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-md transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={close}
      />

      <aside className={`fixed top-0 right-0 z-50 h-full w-80 sm:w-[380px] p-2 sm:p-3 flex transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="w-full rounded-2xl p-1.5 bg-emerald-500/[0.07] dark:bg-white/[0.06] ring-1 ring-emerald-500/15 dark:ring-white/10">
          <div className="h-full rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/5 flex flex-col overflow-hidden">

            <div className="flex items-center justify-between h-16 px-6 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-6 rounded-full bg-emerald-500" />
                <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">Mi cuenta</h2>
              </div>
              <button onClick={close} className="p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 hover:ring-emerald-400/50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.95]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-black/5 dark:divide-white/5">
              <AvatarSection user={user} onUpdate={handleUpdate} />
              <PerfilSection user={user} onUpdate={handleUpdate} />
              <SeguridadSection />
              <CuentaSection user={user} />
            </div>

          </div>
        </div>
      </aside>
    </>
  );
};

export default PerfilPanel;
