import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  // 1. Barrera de Autenticación Primaria: ¿Existe sesión?
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2. Barrera de Autorización Secundaria: ¿Tiene el Rol Requerido?
  if (allowedRoles) {
    // Normalización defensiva por si el JSON no se parseó en el store
    const userRoles: string[] = Array.isArray(user?.roles)
      ? user.roles
      : JSON.parse(user?.roles || '[]');

    // Evaluamos si el usuario cumple con al menos uno de los roles autorizados
    const hasPermission = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasPermission) {
      // Si no tiene permisos, lo devolvemos al Dashboard de forma silenciosa.
      // Usamos replace para limpiar el historial y evitar bucles de navegación.
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 3. Acceso concedido: Renderiza el Layout o los componentes hijos
  return <Outlet />;
};