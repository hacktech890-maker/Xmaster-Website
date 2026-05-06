// src/hooks/useDebounce.js
// Debounce hook for search inputs

import { useState, useEffect } from 'react';

/**
 * useDebounce — returns debounced value
 *
 * @param {*} value — value to debounce
 * @param {number} delay — debounce delay in ms
 *
 * @example
 * const debouncedSearch = useDebounce(searchQuery, 400);
 */
export const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;