// src/utils/cookies.ts

/**
 * Extrae de forma segura el valor de una cookie por su nombre.
 * Usado para leer la cookie Anti-CSRF (csrf_token / XSRF-TOKEN).
 */
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
};
