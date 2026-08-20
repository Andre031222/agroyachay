import { useState, useEffect, useMemo } from 'react';
import { publicConfigAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const CACHE_TTL = 10 * 60 * 1000;

export const DEFAULT_CONFIG = {
  site_name: 'AgroYachay',
  site_tagline: '',
  hero_title: '',
  hero_description: '',
  hero_cta: '',
  ecosystem_title: '',
  ecosystem_description: '',
  announcement_enabled: 'false',
  announcement_text: '',
  announcement_color: '#10b981',
  nav_items: '[]',
  footer_description: '',
  footer_institution: '',
  footer_contact: 'mvladimir290@gmail.com',
  footer_copyright: '',
  social_twitter: '',
  social_facebook: '',
  social_instagram: '',
  social_linkedin: '',
  maintenance_mode: 'false',
  maintenance_message: '',
  ga4_id: '',
  logo: '',
  favicon: '',
  institution_logo: '',
  cover_image: '',
};

const TRANSLATABLE_KEYS = [
  'site_tagline',
  'hero_title',
  'hero_description',
  'hero_cta',
  'ecosystem_title',
  'ecosystem_description',
  'footer_description',
  'maintenance_message',
];

let _cache = null;
let _cacheTs = 0;

export function useSystemConfig() {
  const { t } = useLanguage();
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

  const localizedConfig = useMemo(() => {
    const merged = { ...config };
    for (const key of TRANSLATABLE_KEYS) {
      if (!merged[key]) merged[key] = t(`siteDefaults.${key}`);
    }
    return merged;
  }, [config, t]);

  const bool = (key) => config[key] === 'true' || config[key] === true;
  const json = (key) => {
    try { return JSON.parse(config[key] || '[]'); }
    catch { return []; }
  };
  const imageUrl = (key) =>
    config[key] ? publicConfigAPI.imageUrl(key) : null;

  return { config: localizedConfig, loading, error, refresh, bool, json, imageUrl };
}

export function invalidateSystemConfigCache() {
  _cache = null;
  _cacheTs = 0;
}
