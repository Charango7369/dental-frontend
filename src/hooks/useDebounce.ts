import { useState, useEffect } from 'react';

// Atrapa un valor y lo devuelve X milisegundos después de que dejó de cambiar
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpieza si el valor cambia antes de que expire el tiempo
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}