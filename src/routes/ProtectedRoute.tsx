// src/routes/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const location = useLocation();

  // 1. Durante la inicialización silenciosa (Silent Refresh con HttpOnly Cookie),
  // se muestra un indicador de carga para evitar redirecciones prematuras a /login.
  if (isInitializing) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-300">Verificando sesión segura...</p>
        </div>
      </div>
    );
  }

  // 2. Barrera de Autenticación Primaria: ¿Existe sesión en memoria?
  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 3. Barrera de Autorización Secundaria con Default Deny
  if (allowedRoles) {
    const userRoles: string[] = Array.isArray(user.roles)
      ? user.roles
      : JSON.parse(user.roles || '[]');

    // SUPER_ADMIN de la plataforma posee acceso global
    if (userRoles.includes('SUPER_ADMIN')) {
      return <Outlet />;
    }

    const hasPermission = userRoles.some((role) => allowedRoles.includes(role));
    if (!hasPermission) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 4. Acceso concedido
  return <Outlet />;
};
