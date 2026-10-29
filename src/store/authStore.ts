import { queryClient } from '../api/queryClient';
// src/store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  // 🔐 ALMACENAMIENTO SEGURO EN MEMORIA (RAM):
  // El Access Token efímero (15 min) y el token CSRF NUNCA se guardan en localStorage/sessionStorage.
  // El Refresh Token se delega 100% a la Cookie HttpOnly administrada por el navegador.
  token: string | null;
  csrfToken: string | null;
  user: User | null;
  isInitializing: boolean;

  setAuth: (token: string, user: User, csrfToken?: string | null) => void;
  setToken: (token: string | null) => void;
  setCsrfToken: (csrfToken: string | null) => void;
  setUser: (user: User | null) => void;
  setInitializing: (isInitializing: boolean) => void;
  logout: () => void;
}

// 🛡️ Limpieza preventiva de posibles tokens almacenados en versiones anteriores en localStorage
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('access_token');
    window.localStorage.removeItem('refresh_token');
    window.localStorage.removeItem('jwt');
  }
} catch {
  // Entorno sin acceso a DOM / SSR
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      csrfToken: null,
      user: null,
      isInitializing: true,

      setAuth: (token, user, csrfToken = null) =>
        set({ token, user, csrfToken, isInitializing: false }),
      setToken: (token) => set({ token }),
      setCsrfToken: (csrfToken) => set({ csrfToken }),
      setUser: (user) => set({ user }),
      setInitializing: (isInitializing) => set({ isInitializing }),
      logout: () => {
        try {
          queryClient.clear();
        } catch {
          // ignore
        }
        set({ token: null, csrfToken: null, user: null, isInitializing: false });
      },
    }),
    {
      name: 'dental-auth-storage',
      storage: createJSONStorage(() => localStorage),
      // 🛡️ CRÍTICO OWASP A07: 'partialize' restringe la persistencia exclusivamente
      // a datos de usuario no confidenciales. Tokens de sesión quedan excluidos de disco.
      partialize: (state) => ({ user: state.user }),
    }
  )
);
