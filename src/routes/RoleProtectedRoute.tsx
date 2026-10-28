// src/routes/RoleProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface RoleProtectedRouteProps {
  allowedRoles: string[];
}

export const RoleProtectedRoute = ({ allowedRoles }: RoleProtectedRouteProps) => {
  const { user, token, isInitializing } = useAuthStore();

  // 1. Estado de carga silenciosa
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

  // 2. Verificación base: ¿Hay sesión activa en memoria?
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Extracción segura de roles
  const userRoles: string[] = Array.isArray(user.roles) 
    ? user.roles 
    : JSON.parse(user.roles || '[]');

  if (userRoles.includes('SUPER_ADMIN')) {
    return <Outlet />;
  }

  // 4. Verificación de permisos con Default Deny
  const hasPermission = userRoles.some((role) => allowedRoles.includes(role));
  if (!hasPermission) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
