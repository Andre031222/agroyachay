import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const tokenAun = localStorage.getItem('token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (tokenAun) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const _cache = new Map();

export function cachedGet(url, params = {}, ttlMs = 60_000) {
  const key = url + JSON.stringify(params);
  const hit = _cache.get(key);
  if (hit && Date.now() - hit.ts < ttlMs) return Promise.resolve(hit.data);

  return api.get(url, { params }).then((res) => {
    _cache.set(key, { data: res, ts: Date.now() });
    return res;
  });
}

export function invalidateCache(urlPrefix) {
  for (const key of _cache.keys()) {
    if (key.startsWith(urlPrefix)) _cache.delete(key);
  }
}

export const authAPI = {
  login:          (credentials) => api.post('/auth/login', credentials),
  register:       (userData)    => api.post('/auth/register', userData),
  googleAuth:     (tokenResp)   => api.post('/auth/google', { token: tokenResp.access_token }),
  logout:         ()            => api.post('/auth/logout'),
  getProfile:     ()            => api.get('/auth/profile'),
  updateName:     (nombre)      => api.put('/auth/update-name', { nombre }),
  updateProfile:  (data)        => api.put('/auth/profile', data),
  changePassword: (data)        => api.put('/auth/change-password', data),
  uploadAvatar:   (file)        => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/auth/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  revertAvatar:   ()            => api.delete('/auth/avatar'),
};

export const climaAPI = {
  getClima:      (params) => cachedGet('/clima/actual', params, 10 * 60_000),
  getPronostico: (params) => cachedGet('/clima/pronostico', params, 15 * 60_000),
  getAlertas:    ()       => api.get('/clima/alertas'),
};

export const cultivosAPI = {
  getAll:         ()          => api.get('/cultivos'),
  getCultivo:     (id)        => api.get(`/cultivos/${id}`),
  createCultivo:  (data)      => api.post('/cultivos', data),
  updateCultivo:  (id, data)  => api.put(`/cultivos/${id}`, data),
  deleteCultivo:  (id)        => api.delete(`/cultivos/${id}`),
};

export const plagasAPI = {
  detectar: (formData) => api.post('/plagas/detectar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60_000,
  }),
  detectarConGroq:(formData)   => api.post('/plagas/detectar-groq', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60_000 }),
  consejoPlagaIA: (data)       => api.post('/plagas/consejo-ia', data, { timeout: 30_000 }),
  getBiblioteca:  ()           => api.get('/plagas/biblioteca'),
  getDetecciones: ()           => api.get('/plagas/detecciones'),
  getDeteccion:   (id)         => api.get(`/plagas/detecciones/${id}`),
  getByCultivo:   (cultivoId)  => api.get(`/plagas/cultivo/${cultivoId}`),
};

export const asistenteAPI = {
  consulta: (pregunta, contexto = {}) => api.post('/asistente/consulta', { pregunta, contexto }, { timeout: 30_000 }),
};

export const prediccionAPI = {
  predecirCosecha: (data) => api.post('/prediccion/cosecha', data),
  getPredicciones: ()     => api.get('/prediccion/historial'),
  getPrediccion:   (id)   => api.get(`/prediccion/${id}`),
};

export const marketplaceAPI = {
  getProductos:  (params)     => cachedGet('/marketplace/productos', params, 5 * 60_000),
  getProducto:   (id)         => api.get(`/marketplace/productos/${id}`),
  createProducto: (data)      => api.post('/marketplace/productos', data),
  updateProducto: (id, data)  => api.put(`/marketplace/productos/${id}`, data),
  deleteProducto: (id)        => api.delete(`/marketplace/productos/${id}`),
};

export const informesAPI = {
  getMisInformes:  ()     => api.get('/informes/mis-informes'),
  getEstadisticas: ()     => api.get('/informes/estadisticas'),
  generar:         (data) => api.post('/informes/generar', data, { timeout: 120_000 }),
  descargar:       (id)   => api.get(`/informes/descargar/${id}`, { responseType: 'blob' }),
};

export const asesoriaAPI = {
  solicitar:        (data) => api.post('/asesoria/solicitar', data),
  getMisSolicitudes: ()    => api.get('/asesoria/mis-solicitudes'),
  getSolicitud:     (id)   => api.get(`/asesoria/${id}`),
  getEspecialidades: ()    => api.get('/asesoria/especialidades'),
};

export const insumosAPI = {
  calcularInsumos: (data) => api.post('/insumos/calcular', data),
};

export const serialAPI = {
  detectar:   ()     => api.get('/serial/detectar'),
  identificar: (port) => api.post('/serial/identificar', { port }),
  scanWifi:   (port) => api.post('/serial/scan-wifi', { port }),
  configurar: (data) => api.post('/serial/configurar', data),
  serverInfo: ()     => api.get('/serial/server-info'),
};

export const superadminAPI = {
  getUsers:         ()              => api.get('/admin/users'),
  changeRole:       (id, rol)       => api.put(`/admin/users/${id}/role`, { rol }),
  toggleActive:     (id)            => api.put(`/admin/users/${id}/toggle`),
  resetPassword:    (id, pwd)       => api.put(`/admin/users/${id}/reset-password`, { new_password: pwd }),
  getAllConfig:      ()              => api.get('/admin/super/config'),
  saveConfig:       (data)          => api.post('/admin/super/config', data),
  resetConfig:      ()              => api.post('/admin/super/config/reset'),
  uploadImage:      (key, file)     => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/admin/super/config/upload/${key}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  promoteFirstSuperadmin: (data)    => api.post('/admin/super/promote', data),
};

export const publicConfigAPI = {
  getConfig: () => api.get('/public/config'),
  imageUrl:  (key) => `${API_URL}/public/config/image/${key}`,
};

export const dispositivosAPI = {
  getPendientes:      ()                    => api.get('/sensores/pendientes'),
  getMisDispositivos: ()                    => api.get('/sensores/mis-dispositivos'),
  vincular:           (sensorId, data)      => api.post(`/sensores/${sensorId}/vincular`, data),
  configurar:         (sensorId, data)      => api.put(`/sensores/${sensorId}/configurar`, data),
  getEstado:          (esp32Id)             => api.get(`/sensores/esp32/${esp32Id}/estado`),
  getLecturas:        (sensorId, limite = 40) => api.get(`/sensores/${sensorId}/lecturas`, { params: { limite } }),
  getResumen:         ()                    => api.get('/sensores/resumen'),
  desvincular:        (sensorId)            => api.post(`/sensores/${sensorId}/desvincular`),
};

export default api;
