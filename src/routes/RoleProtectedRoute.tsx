import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore'; // Ajusta la ruta a tu store

interface RoleProtectedRouteProps {
  allowedRoles: string[];
}

export const RoleProtectedRoute = ({ allowedRoles }: RoleProtectedRouteProps) => {
  const { user, token } = useAuthStore();

  // 1. Verificación base: ¿Hay sesión activa?
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Extracción segura de roles (Asumiendo que ya es un array de strings en Zustand)
  // Si por alguna razón sigue siendo un string, deberías parsearlo aquí.
  const userRoles: string[] = Array.isArray(user.roles) 
    ? user.roles 
    : JSON.parse(user.roles || '[]');

  // 3. Verificación de permisos: ¿El usuario tiene al menos uno de los roles requeridos?
  const hasPermission = userRoles.some(role => allowedRoles.includes(role));

  if (!hasPermission) {
    // Si es un Doctor intentando entrar a zona de Admin, lo regresamos al dashboard
    // 'replace' evita que pueda usar el botón "Atrás" del navegador para volver al error
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Acceso concedido: Renderiza la ruta protegida
  return <Outlet />;
};