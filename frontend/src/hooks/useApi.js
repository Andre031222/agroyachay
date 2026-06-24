import { useState, useEffect } from 'react';
import { notify } from '../utils/swal';

export const useApi = (apiFunction, params = null, dependencies = []) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFunction(params);
      setData(response.data.data || response.data);
    } catch (err) {
      setError(err);
      notify.error(err.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
};
