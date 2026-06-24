import { useState, useEffect } from 'react';
import { publicConfigAPI } from '../services/api';

const CACHE_TTL = 10 * 60 * 1000;

export const DEFAULT_CONFIG = {
  site_name: 'AgroYachay',
  site_tagline: 'Agricultura Inteligente',
  hero_title: 'campo agrícola',
  hero_description: 'IoT, inteligencia artificial y análisis predictivo en una sola plataforma. Diseñado para zonas remotas del Perú donde el agricultor opera solo.',
  hero_cta: 'Comenzar gratis',
  ecosystem_title: 'Todo lo que necesitas en una plataforma',
  ecosystem_description: '8 módulos integrados que se alimentan entre sí. Los datos del sensor mejoran la predicción, el clima informa las alertas, la IA conecta todo.',
  announcement_enabled: 'false',
  announcement_text: '',
  announcement_color: '#10b981',
  nav_items: '[]',
  footer_description: 'Plataforma agrícola con IoT, inteligencia artificial y análisis predictivo. Diseñada para zonas remotas del Perú donde el agricultor trabaja solo y necesita control total de su campo.',
  footer_institution: '',
  footer_contact: 'mvladimir290@gmail.com',
  footer_copyright: '',
  social_twitter: '',
  social_facebook: '',
  social_instagram: '',
  social_linkedin: '',
  maintenance_mode: 'false',
  maintenance_message: 'El sistema está en mantenimiento. Por favor intente más tarde.',
  ga4_id: '',
  logo: '',
  favicon: '',
  institution_logo: '',
  cover_image: '',
};

let _cache = null;
let _cacheTs = 0;

export function useSystemConfig() {
  const [config, setConfig] = useState({ ...DEFAULT_CONFIG });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (_cache && Date.now() - _cacheTs < CACHE_TTL) {
        if (!cancelled) {
          setConfig({ ...DEFAULT_CONFIG, ..._cache });
          setLoading(false);
        }
        return;
      }

      try {
        const { data } = await publicConfigAPI.getConfig();
        if (data.success) {
          _cache = data.data;
          _cacheTs = Date.now();
          if (!cancelled) setConfig({ ...DEFAULT_CONFIG, ...data.data });
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const refresh = () => {
    _cache = null;
    _cacheTs = 0;
    setLoading(true);
    setConfig({ ...DEFAULT_CONFIG });
  };

  const bool = (key) => config[key] === 'true' || config[key] === true;
  const json = (key) => {
    try { return JSON.parse(config[key] || '[]'); }
    catch { return []; }
  };
  const imageUrl = (key) =>
    config[key] ? publicConfigAPI.imageUrl(key) : null;

  return { config, loading, error, refresh, bool, json, imageUrl };
}

export function invalidateSystemConfigCache() {
  _cache = null;
  _cacheTs = 0;
}
