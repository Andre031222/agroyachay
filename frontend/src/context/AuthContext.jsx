import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { notify } from '../utils/swal';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]                       = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = () => {
    const token      = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) throw new Error('expired');
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  };

  const _persist = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const login = async (credentials) => {
    try {
      const { data } = await authAPI.login(credentials);
      _persist(data.data.token, data.data.user);
      notify.success('¡Bienvenido a AgroYachay!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      notify.error(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await authAPI.register(userData);
      _persist(data.data.token, data.data.user);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al registrar usuario';
      notify.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    sessionStorage.setItem('intentional_logout', '1');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    const merged = { ...user, ...userData };
    localStorage.setItem('user', JSON.stringify(merged));
    setUser(merged);
  };

  const loginWithGoogle = async (tokenResponse) => {
    try {
      const { data } = await authAPI.googleAuth(tokenResponse);
      const payload  = data.data || data;
      _persist(payload.token || payload.access_token, payload.user);
      return { success: true, isNewUser: payload.is_new_user || false, user: payload.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al autenticar con Google';
      notify.error(message);
      return { success: false, message };
    }
  };

  const updateName = async (nombre) => {
    try {
      const { data } = await authAPI.updateName(nombre);
      updateUser({ nombre, ...(data.data?.user || {}) });
      return { success: true };
    } catch { return { success: false }; }
  };

  const value = {
    user, loading, isAuthenticated,
    login, register, logout, updateUser, updateName, loginWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
