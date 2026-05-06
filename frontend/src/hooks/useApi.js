// src/hooks/useApi.js
// Reusable API hook — replaces the empty 32-byte placeholder
// Provides: data, loading, error, refetch

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useApi — generic data fetching hook
 *
 * @param {Function} apiFn — the API function to call (from services/api.js)
 * @param {Array} params — parameters to pass to apiFn
 * @param {Object} options — { immediate: bool, deps: [] }
 *
 * @example
 * const { data, loading, error } = useApi(publicAPI.getLatestVideos, [20]);
 */
export const useApi = (apiFn, params = [], options = {}) => {
  const { immediate = true, initialData = null } = options;

  const [data, setData]       = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError]     = useState(null);

  // Prevent state updates on unmounted components
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async (...overrideParams) => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const callParams = overrideParams.length > 0 ? overrideParams : params;
      const response = await apiFn(...callParams);
      const result = response?.data || response;

      if (mountedRef.current) {
        setData(result);
        setError(null);
      }

      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err?.response?.data?.message || err?.message || 'Something went wrong');
        setData(null);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiFn, JSON.stringify(params)]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate]);

  return {
    data,
    loading,
    error,
    refetch: execute,
    setData,
  };
};

export default useApi;