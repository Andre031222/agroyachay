import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AutoLogin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hash     = new URLSearchParams(window.location.hash.slice(1));
    const search   = new URLSearchParams(window.location.search);
    const token    = hash.get('token') || search.get('token');
    const redirect = hash.get('redirect') || search.get('redirect') || 'dispositivos';

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    localStorage.setItem('token', token);

    api.get('/auth/profile')
      .then(({ data }) => {
        const usuario = data?.data?.user || data?.usuario || data;
        localStorage.setItem('user', JSON.stringify(usuario));
        window.location.replace(`/${redirect}`);
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Abriendo AgroYachay...</p>
      </div>
    </div>
  );
};

export default AutoLogin;
