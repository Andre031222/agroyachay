import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { invalidateSystemConfigCache } from '../../hooks/useSystemConfig';
import { notify, confirmAction } from '../../utils/swal';
import { superadminAPI, API_URL as API } from '../../services/api';

const Icons = {
  BarChart: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>,
  Users:   () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Image:   () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Home:    () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Nav:     () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Footer:  () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Cog:     () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Tool:    () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  Shield:  () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Upload:  () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Trash:   () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
  Plus:    () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Eye:     () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Lock:    () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Check:   () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  Users2:  () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Admin:   () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

const Spinner = () => (
  <div className="flex justify-center py-20">
    <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const fieldClass =
  'w-full px-3.5 py-2.5 rounded-xl text-sm transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ' +
  'bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 ' +
  'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:bg-white dark:focus:bg-white/[0.06]';

const Input = ({ label, value, onChange, placeholder, maxLength, type = 'text', hint }) => (
  <div>
    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
      {label}
      {maxLength && <span className="text-gray-400 dark:text-gray-600 normal-case font-normal">(máx {maxLength})</span>}
    </label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} maxLength={maxLength}
      className={fieldClass}
    />
    {hint && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{hint}</p>}
  </div>
);

const Textarea = ({ label, value, onChange, rows = 3, placeholder }) => (
  <div>
    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
    <textarea
      value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
      className={fieldClass + ' resize-none'}
    />
  </div>
);

const Toggle = ({ label, checked, onChange, description }) => (
  <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</p>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
    </div>
    <button
      type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full shrink-0 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus:outline-none focus:ring-2 focus:ring-emerald-500/60 ${checked ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-white/15'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

const SaveBtn = ({ loading, onClick, label = 'Guardar cambios' }) => (
  <button type="button" onClick={onClick} disabled={loading}
    className="flex items-center gap-2 px-6 h-11 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
    {loading
      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Guardando…</span></>
      : <><Icons.Check /><span>{label}</span></>
    }
  </button>
);

const SectionCard = ({ title, children, accent }) => (
  <div className={`rounded-2xl p-1.5 ring-1 ${
    accent ? 'ring-emerald-500/20 dark:ring-emerald-400/15 bg-emerald-500/[0.03]' : 'ring-black/5 dark:ring-white/10 bg-black/[0.015] dark:bg-white/[0.02]'
  }`}>
    <div className="rounded-[calc(1rem-0.375rem)] bg-white dark:bg-gray-900 p-5 space-y-4">
      {title && (
        <div className="flex items-center gap-2">
          <div className={`w-1 h-3.5 rounded-full ${accent ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/20'}`} />
          <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.18em]">{title}</h3>
        </div>
      )}
      {children}
    </div>
  </div>
);

const ImageUploader = ({ configKey, label, hint, currentUrl }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);
  const [dragging, setDragging] = useState(false);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      await superadminAPI.uploadImage(configKey, file);
      setPreview(`${API}/public/config/image/${configKey}?t=${Date.now()}`);
      invalidateSystemConfigCache();
      notify.success(`${label} actualizado`);
    } catch { notify.error('Error al subir imagen'); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
      {hint && <p className="text-[11px] text-gray-400 dark:text-gray-500">{hint}</p>}
      {preview && (
        <div className="relative inline-block group">
          <img src={preview} alt={label} className="h-16 w-auto rounded-xl ring-1 ring-black/5 dark:ring-white/10 object-contain bg-gray-50/80 dark:bg-white/[0.04] p-2 max-w-[200px]" />
          <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-center">
            <span className="text-white text-xs font-semibold">Cambiar</span>
          </div>
        </div>
      )}
      <label
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files[0]); }}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] text-sm font-medium ${
          dragging
            ? 'border-emerald-500/60 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
            : 'border-emerald-500/20 dark:border-emerald-400/20 hover:border-emerald-500/50 dark:hover:border-emerald-400/40 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'
        }`}
      >
        <Icons.Upload />
        {uploading ? 'Subiendo…' : 'Subir imagen o arrastra aquí'}
        <input type="file" accept="image/*,.ico,.svg" className="hidden" onChange={e => upload(e.target.files[0])} disabled={uploading} />
      </label>
    </div>
  );
};

const ROLES = ['superadmin', 'admin', 'agricultor', 'usuario'];

const ROLE_BADGE = {
  superadmin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40',
  admin:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40',
  agricultor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40',
  usuario:    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700',
};

const ROLE_AVATAR = {
  superadmin: 'from-purple-500 to-purple-700',
  admin:      'from-blue-500 to-blue-700',
  agricultor: 'from-emerald-500 to-teal-600',
  usuario:    'from-gray-400 to-gray-600',
};

const StatsTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superadminAPI.getUsers()
      .then(({ data }) => { if (data.success) setUsers(data.data.users); })
      .catch(() => notify.error('Error cargando estadísticas'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const now = Date.now();
  const msDay = 1000 * 60 * 60 * 24;

  const last7  = users.filter(u => u.fecha_registro && (now - new Date(u.fecha_registro)) / msDay <= 7).length;
  const last30 = users.filter(u => u.fecha_registro && (now - new Date(u.fecha_registro)) / msDay <= 30).length;
  const active   = users.filter(u => u.activo).length;
  const inactive = users.length - active;
  const byRole   = ROLES.reduce((acc, r) => ({ ...acc, [r]: users.filter(u => u.rol === r).length }), {});

  const recent = users
    .slice()
    .sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro))
    .slice(0, 8);

  const summary = [
    { label: 'Total', value: users.length, color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
    { label: 'Activos', value: active,    color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' },
    { label: 'Últimos 30 días', value: last30, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
    { label: 'Últimos 7 días', value: last7,  color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' },
  ];

  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-white">Estadísticas de Plataforma</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summary.map(s => (
          <div key={s.label} className={`rounded-2xl ring-1 ring-black/5 dark:ring-white/10 p-5 text-center ${s.color}`}>
            <p className="font-display text-3xl font-bold leading-none tracking-tight">{s.value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide mt-2 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      <SectionCard title="Por Rol" accent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ROLES.map(r => (
            <div key={r} className={`text-center py-4 rounded-xl text-sm ${ROLE_BADGE[r]}`}>
              <p className="font-display text-2xl font-bold tracking-tight">{byRole[r] || 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide mt-1">{r}</p>
            </div>
          ))}
        </div>
        {inactive > 0 && (
          <div className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-500/15 rounded-xl px-4 py-2.5">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            {inactive} {inactive === 1 ? 'cuenta inactiva' : 'cuentas inactivas'} en el sistema
          </div>
        )}
      </SectionCard>

      <SectionCard title="Últimos Registrados">
        <div className="space-y-2">
          {recent.map(u => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white font-display font-bold text-sm bg-gradient-to-br ${ROLE_AVATAR[u.rol] || ROLE_AVATAR.usuario}`}>
                {u.nombre?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{u.nombre}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{u.email}</p>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_BADGE[u.rol] || ROLE_BADGE.usuario}`}>
                  {u.rol?.toUpperCase()}
                </span>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                  {u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString('es-PE') : '—'}
                </p>
              </div>
            </div>
          ))}
          {recent.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Sin registros</p>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

const UsersTab = ({ isSuperAdmin }) => {
  const { user: me } = useAuth();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const [editPwd, setEditPwd] = useState(null);
  const [newPwd, setNewPwd]   = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await superadminAPI.getUsers();
      if (data.success) setUsers(data.data.users);
    } catch { notify.error('Error cargando usuarios'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const canManage = (u) => {
    if (u.id === me?.id) return false;
    if (isSuperAdmin) return true;
    return u.rol !== 'superadmin' && u.rol !== 'admin';
  };

  const rolesAllowed = isSuperAdmin ? ROLES : ['agricultor', 'usuario'];

  const changeRole = async (id, rol) => {
    try {
      await superadminAPI.changeRole(id, rol);
      notify.success('Rol actualizado');
      load();
    } catch (e) { notify.error(e.response?.data?.message || 'Error'); }
  };

  const toggleActive = async (id) => {
    try {
      const { data } = await superadminAPI.toggleActive(id);
      notify.success(data.message);
      load();
    } catch { notify.error('Error'); }
  };

  const resetPassword = async (id) => {
    if (!newPwd || newPwd.length < 8) return notify.error('Mínimo 8 caracteres');
    try {
      await superadminAPI.resetPassword(id, newPwd);
      notify.success('Contraseña actualizada');
      setEditPwd(null);
      setNewPwd('');
    } catch (e) { notify.error(e.response?.data?.message || 'Error'); }
  };

  const stats = { total: users.length, inactivos: users.filter(u => !u.activo).length };
  ROLES.forEach(r => { stats[r] = users.filter(u => u.rol === r).length; });

  const filtered = users.filter(u => {
    const matchSearch = !search
      || u.nombre?.toLowerCase().includes(search.toLowerCase())
      || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || u.rol === filter || (filter === 'inactivo' && !u.activo);
    return matchSearch && matchFilter;
  });

  if (loading) return <Spinner />;

  const filterOptions = [
    { key: 'all',        label: 'Todos',      n: stats.total,      color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
    { key: 'superadmin', label: 'SuperAdmin', n: stats.superadmin, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' },
    { key: 'admin',      label: 'Admin',      n: stats.admin,      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
    { key: 'agricultor', label: 'Agricultor', n: stats.agricultor, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' },
    { key: 'inactivo',   label: 'Inactivos',  n: stats.inactivos,  color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-white">Gestión de Usuarios</h2>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 px-3 py-1.5 rounded-full">
          {stats.total} usuarios
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {filterOptions.map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`flex flex-col items-center py-2.5 rounded-xl ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              filter === s.key
                ? 'ring-emerald-500/60 ' + s.color
                : 'ring-transparent ' + s.color + ' opacity-60 hover:opacity-90'
            }`}
          >
            <span className="font-display text-xl font-bold tracking-tight">{s.n}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o email…"
          className={fieldClass + ' pl-10'}
        />
      </div>

      <div className="space-y-2">
        {filtered.map(u => (
          <div key={u.id} className={`rounded-2xl p-4 ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            u.activo ? 'bg-white dark:bg-gray-900 ring-black/5 dark:ring-white/10' : 'bg-white dark:bg-gray-900 ring-red-500/20 opacity-60'
          }`}>
            <div className="flex items-start gap-3 flex-wrap">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-display font-bold text-sm bg-gradient-to-br ${ROLE_AVATAR[u.rol] || ROLE_AVATAR.usuario}`}>
                {u.nombre?.charAt(0)?.toUpperCase() || '?'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{u.nombre}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_BADGE[u.rol] || ROLE_BADGE.usuario}`}>
                    {u.rol?.toUpperCase()}
                  </span>
                  {!u.activo && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/40">
                      INACTIVO
                    </span>
                  )}
                  {me?.id === u.id && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30">
                      TÚ
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{u.email}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                  Desde {u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString('es-PE') : '—'}
                </p>
              </div>

              {canManage(u) && (
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <select value={u.rol} onChange={e => changeRole(u.id, e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 outline-none cursor-pointer">
                    {rolesAllowed.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button onClick={() => toggleActive(u.id)}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
                      u.activo
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30'
                    }`}>
                    {u.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => setEditPwd(editPwd === u.id ? null : u.id)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold bg-gray-50/80 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.08] ring-1 ring-black/5 dark:ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
                    <Icons.Lock /> Contraseña
                  </button>
                </div>
              )}
            </div>

            {editPwd === u.id && (
              <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input type={showPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)}
                      placeholder="Nueva contraseña (mín. 8 caracteres)"
                      className={fieldClass + ' pr-10'}
                    />
                    <button onClick={() => setShowPwd(!showPwd)} type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <Icons.Eye />
                    </button>
                  </div>
                  <button onClick={() => resetPassword(u.id)}
                    className="px-4 h-10 text-xs font-semibold bg-emerald-600 text-white rounded-full hover:bg-emerald-500 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
                    Guardar
                  </button>
                  <button onClick={() => { setEditPwd(null); setNewPwd(''); }}
                    className="px-3 h-10 text-xs text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600">
            <Icons.Users2 />
            <p className="mt-3 text-sm font-medium">No se encontraron usuarios</p>
          </div>
        )}
      </div>
    </div>
  );
};

const LogoTab = ({ cfg }) => (
  <div className="space-y-5">
    <h2 className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-white">Logo y Marca</h2>
    <SectionCard title="Imágenes de Marca" accent>
      <ImageUploader configKey="logo" label="Logo principal" hint="SVG o PNG transparente, mín. 200×60px" currentUrl={cfg.logo ? `${API}/public/config/image/logo` : null} />
      <ImageUploader configKey="favicon" label="Favicon" hint="ICO o PNG 32×32px" currentUrl={cfg.favicon ? `${API}/public/config/image/favicon` : null} />
      <ImageUploader configKey="institution_logo" label="Logo de institución" hint="Logo de la organización o universidad asociada" currentUrl={cfg.institution_logo ? `${API}/public/config/image/institution_logo` : null} />
      <ImageUploader configKey="cover_image" label="Imagen de portada (hero)" hint="Recomendado: 1920×1080px" currentUrl={cfg.cover_image ? `${API}/public/config/image/cover_image` : null} />
    </SectionCard>
  </div>
);

const HomepageTab = ({ cfg }) => {
  const [form, setForm] = useState({
    site_name:             cfg.site_name || '',
    site_tagline:          cfg.site_tagline || '',
    hero_title:            cfg.hero_title || '',
    hero_description:      cfg.hero_description || '',
    hero_cta:              cfg.hero_cta || '',
    ecosystem_title:       cfg.ecosystem_title || '',
    ecosystem_description: cfg.ecosystem_description || '',
    announcement_enabled:  cfg.announcement_enabled === 'true',
    announcement_text:     cfg.announcement_text || '',
    announcement_color:    cfg.announcement_color || '#10b981',
  });
  const [saving, setSaving] = useState(false);
  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  const save = async () => {
    setSaving(true);
    try {
      await superadminAPI.saveConfig({ ...form, announcement_enabled: String(form.announcement_enabled) });
      invalidateSystemConfigCache();
      notify.success('Página de inicio guardada');
    } catch { notify.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-white">Página de Inicio</h2>

      <SectionCard title="Identidad del sitio">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Nombre del sitio" value={form.site_name} onChange={set('site_name')} placeholder="AgroYachay" />
          <Input label="Tagline" value={form.site_tagline} onChange={set('site_tagline')} placeholder="Agricultura inteligente..." />
        </div>
      </SectionCard>

      <SectionCard title="Sección Hero">
        <Input label="Título hero" value={form.hero_title} onChange={set('hero_title')} maxLength={7} placeholder="Agro" hint="Texto grande del banner principal (máx 7 caracteres)" />
        <Textarea label="Descripción" value={form.hero_description} onChange={set('hero_description')} placeholder="Plataforma de gestión agrícola..." />
        <Input label="Botón CTA" value={form.hero_cta} onChange={set('hero_cta')} placeholder="Comenzar ahora" />
      </SectionCard>

      <SectionCard title="Sección Ecosistema">
        <Input label="Título" value={form.ecosystem_title} onChange={set('ecosystem_title')} placeholder="Ecosistema Agrícola Inteligente" />
        <Textarea label="Descripción" value={form.ecosystem_description} onChange={set('ecosystem_description')} placeholder="Conectamos tecnología..." />
      </SectionCard>

      <SectionCard title="Banner de Anuncio">
        <Toggle label="Mostrar banner de anuncio" description="Aparece en la parte superior de todas las páginas públicas" checked={form.announcement_enabled} onChange={set('announcement_enabled')} />
        {form.announcement_enabled && (
          <>
            <Input label="Texto del banner" value={form.announcement_text} onChange={set('announcement_text')} placeholder="¡Novedad! Prueba nuestras nuevas funciones IoT" />
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Color del banner</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.announcement_color} onChange={e => set('announcement_color')(e.target.value)}
                  className="h-10 w-14 rounded-lg ring-1 ring-black/5 dark:ring-white/10 cursor-pointer p-0.5 bg-gray-50/80 dark:bg-white/[0.04]" />
                <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">{form.announcement_color}</span>
                <div className="flex-1 h-8 rounded-lg ring-1 ring-black/5 dark:ring-white/10" style={{ backgroundColor: form.announcement_color }} />
              </div>
            </div>
            <div className="rounded-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
              <div className="text-center py-2 px-4 text-sm font-semibold text-white" style={{ backgroundColor: form.announcement_color }}>
                {form.announcement_text || 'Vista previa del banner…'}
              </div>
              <div className="p-3 bg-gray-50/80 dark:bg-white/[0.04]">
                <span className="text-xs text-gray-500 dark:text-gray-400">Vista previa en tiempo real</span>
              </div>
            </div>
          </>
        )}
      </SectionCard>

      <div className="flex justify-end"><SaveBtn loading={saving} onClick={save} /></div>
    </div>
  );
};

const NavTab = ({ cfg }) => {
  const [items, setItems] = useState(() => { try { return JSON.parse(cfg.nav_items || '[]'); } catch { return []; } });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await superadminAPI.saveConfig({ nav_items: JSON.stringify(items) });
      invalidateSystemConfigCache();
      notify.success('Navegación guardada');
    } catch { notify.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-white">Navegación</h2>
      <SectionCard>
        <p className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500/15 rounded-xl px-3 py-2">
          Personaliza los links del menú principal. Deja vacío para usar la navegación por defecto.
        </p>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 text-xs font-bold text-gray-400 shrink-0">{i + 1}</div>
              <input value={item.label} onChange={e => setItems(items.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                placeholder="Etiqueta" className={fieldClass + ' flex-1'} />
              <input value={item.href} onChange={e => setItems(items.map((x, j) => j === i ? { ...x, href: e.target.value } : x))}
                placeholder="/ruta o https://..." className={fieldClass + ' flex-1'} />
              <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                <Icons.Trash />
              </button>
            </div>
          ))}
          <button onClick={() => setItems([...items, { label: '', href: '' }])}
            className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold transition-colors">
            <Icons.Plus /> Agregar item
          </button>
        </div>
      </SectionCard>
      <div className="flex justify-end"><SaveBtn loading={saving} onClick={save} /></div>
    </div>
  );
};

const FooterTab = ({ cfg }) => {
  const [form, setForm] = useState({
    footer_description: cfg.footer_description || '',
    footer_institution: cfg.footer_institution || '',
    footer_contact:     cfg.footer_contact || '',
    footer_copyright:   cfg.footer_copyright || '',
    social_twitter:     cfg.social_twitter || '',
    social_facebook:    cfg.social_facebook || '',
    social_instagram:   cfg.social_instagram || '',
    social_linkedin:    cfg.social_linkedin || '',
  });
  const [saving, setSaving] = useState(false);
  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  const save = async () => {
    setSaving(true);
    try {
      await superadminAPI.saveConfig(form);
      invalidateSystemConfigCache();
      notify.success('Pie de página guardado');
    } catch { notify.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-white">Pie de Página</h2>
      <SectionCard title="Información General">
        <Textarea label="Descripción" value={form.footer_description} onChange={set('footer_description')} placeholder="Sistema de gestión agrícola..." />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Institución" value={form.footer_institution} onChange={set('footer_institution')} placeholder="Universidad Nacional..." />
          <Input label="Email de contacto" value={form.footer_contact} onChange={set('footer_contact')} type="email" placeholder="contacto@agroyachay.pe" />
        </div>
        <Input label="Copyright" value={form.footer_copyright} onChange={set('footer_copyright')} placeholder={`© ${new Date().getFullYear()} AgroYachay`} />
      </SectionCard>
      <SectionCard title="Redes Sociales">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Twitter / X" value={form.social_twitter} onChange={set('social_twitter')} placeholder="https://twitter.com/..." />
          <Input label="Facebook" value={form.social_facebook} onChange={set('social_facebook')} placeholder="https://facebook.com/..." />
          <Input label="Instagram" value={form.social_instagram} onChange={set('social_instagram')} placeholder="https://instagram.com/..." />
          <Input label="LinkedIn" value={form.social_linkedin} onChange={set('social_linkedin')} placeholder="https://linkedin.com/..." />
        </div>
      </SectionCard>
      <div className="flex justify-end"><SaveBtn loading={saving} onClick={save} /></div>
    </div>
  );
};

const SystemTab = ({ cfg }) => {
  const [form, setForm] = useState({
    maintenance_mode:    cfg.maintenance_mode === 'true',
    maintenance_message: cfg.maintenance_message || '',
    ga4_id:              cfg.ga4_id || '',
  });
  const [saving, setSaving] = useState(false);
  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  const save = async () => {
    setSaving(true);
    try {
      await superadminAPI.saveConfig({ ...form, maintenance_mode: String(form.maintenance_mode) });
      invalidateSystemConfigCache();
      notify.success('Configuración del sistema guardada');
    } catch { notify.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-white">Sistema</h2>
      <SectionCard title="Modo Mantenimiento">
        <Toggle label="Activar modo mantenimiento" description="Muestra una página de mantenimiento a usuarios no-admin" checked={form.maintenance_mode} onChange={set('maintenance_mode')} />
        {form.maintenance_mode && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-500/20 rounded-2xl space-y-3">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">El sitio estará inaccesible para usuarios regulares</p>
            <Textarea label="Mensaje de mantenimiento" value={form.maintenance_message} onChange={set('maintenance_message')} rows={2} placeholder="El sistema está en mantenimiento..." />
          </div>
        )}
      </SectionCard>
      <SectionCard title="Analytics">
        <Input label="Google Analytics GA4 ID" value={form.ga4_id} onChange={set('ga4_id')} placeholder="G-XXXXXXXXXX" hint="Deja vacío para deshabilitar el seguimiento analítico" />
      </SectionCard>
      <div className="flex justify-end"><SaveBtn loading={saving} onClick={save} /></div>
    </div>
  );
};

const AdvancedTab = () => {
  const [resetting, setResetting] = useState(false);

  const doReset = async () => {
    const ok = await confirmAction({
      title: '¿Restablecer configuración?',
      text: 'Todos los textos volverán a sus valores por defecto. Las imágenes no se eliminan.',
      confirmText: 'Sí, restablecer',
      danger: true,
    });
    if (!ok) return;
    setResetting(true);
    try {
      await superadminAPI.resetConfig();
      invalidateSystemConfigCache();
      notify.success('Configuración restablecida');
    } catch { notify.error('Error al restablecer'); }
    finally { setResetting(false); }
  };

  return (
    <div className="space-y-5">
      <h2 className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-white">Configuración Avanzada</h2>
      <SectionCard title="Restablecer configuración">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Restablece todos los textos a sus valores por defecto. Las imágenes subidas <strong className="text-gray-800 dark:text-gray-200">no se eliminan</strong>.
        </p>
        <button onClick={doReset} disabled={resetting}
          className="px-6 h-11 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 ring-1 ring-red-500/20 text-sm font-semibold rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-60 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
          {resetting ? 'Restableciendo…' : 'Restablecer valores por defecto'}
        </button>
      </SectionCard>
    </div>
  );
};

const TABS_SUPERADMIN = [
  { id: 'stats',    label: 'Estadísticas', Icon: Icons.BarChart },
  { id: 'users',    label: 'Usuarios',     Icon: Icons.Users    },
  { id: 'logo',     label: 'Logo',         Icon: Icons.Image    },
  { id: 'homepage', label: 'Inicio',       Icon: Icons.Home     },
  { id: 'nav',      label: 'Navegación',   Icon: Icons.Nav      },
  { id: 'footer',   label: 'Footer',       Icon: Icons.Footer   },
  { id: 'system',   label: 'Sistema',      Icon: Icons.Cog      },
  { id: 'advanced', label: 'Avanzado',     Icon: Icons.Tool     },
];

const TABS_ADMIN = [
  { id: 'stats', label: 'Estadísticas', Icon: Icons.BarChart },
  { id: 'users', label: 'Usuarios',     Icon: Icons.Users    },
];

const AdminPanel = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.rol === 'superadmin';
  const TABS = isSuperAdmin ? TABS_SUPERADMIN : TABS_ADMIN;

  const [activeTab, setActiveTab]     = useState('stats');
  const [cfg, setCfg]                 = useState(null);
  const [cfgLoading, setCfgLoading]   = useState(true);

  useEffect(() => {
    if (!isSuperAdmin) { setCfgLoading(false); return; }
    superadminAPI.getAllConfig()
      .then(({ data }) => {
        if (data.success) {
          const flat = {};
          Object.entries(data.data).forEach(([k, v]) => { flat[k] = v.config_value || ''; });
          setCfg(flat);
        }
      })
      .catch(() => notify.error('Error cargando configuración'))
      .finally(() => setCfgLoading(false));
  }, [isSuperAdmin]);

  const renderTab = () => {
    if (cfgLoading) return <Spinner />;
    switch (activeTab) {
      case 'stats':    return <StatsTab />;
      case 'users':    return <UsersTab isSuperAdmin={isSuperAdmin} />;
      case 'logo':     return <LogoTab cfg={cfg || {}} />;
      case 'homepage': return <HomepageTab cfg={cfg || {}} />;
      case 'nav':      return <NavTab cfg={cfg || {}} />;
      case 'footer':   return <FooterTab cfg={cfg || {}} />;
      case 'system':   return <SystemTab cfg={cfg || {}} />;
      case 'advanced': return <AdvancedTab />;
      default:         return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 bg-gray-50 dark:bg-gray-950 min-h-full">

      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white ${
          isSuperAdmin ? 'bg-purple-500' : 'bg-blue-500'
        }`}>
          {isSuperAdmin ? <Icons.Shield /> : <Icons.Admin />}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
            {isSuperAdmin ? 'Panel SuperAdmin' : 'Panel Admin'}
          </h1>
        </div>
        <span className={`shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full tracking-[0.18em] uppercase ring-1 ${
          isSuperAdmin
            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-purple-500/20'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-blue-500/20'
        }`}>
          {user?.rol}
        </span>
      </div>

      <div className="flex gap-1 flex-wrap bg-black/[0.03] dark:bg-white/[0.04] p-1.5 rounded-full ring-1 ring-black/5 dark:ring-white/10">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] touch-manipulation active:scale-[0.98] ${
              activeTab === id
                ? 'bg-emerald-600 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-white/60 dark:hover:bg-white/[0.06]'
            }`}
          >
            <Icon />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[300px]">{renderTab()}</div>
    </div>
  );
};

export default AdminPanel;
