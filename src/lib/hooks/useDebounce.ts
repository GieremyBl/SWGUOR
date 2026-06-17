'use client';

import { useState, useEffect } from 'react';

/**
 * Retrasa la actualización de un valor hasta que haya pasado el delay.
 * Útil para evitar llamadas excesivas al servidor mientras el usuario escribe.
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
