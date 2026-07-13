// src/features/auth/ui/TopBar.tsx
// Barra superior minimalista que muestra el título de la página actual
// y el botón hamburguesa en mobile para abrir el Sidebar.

import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/patients':  'Pacientes',
  '/agenda':    'Agenda del día',
  '/billing':   'Cobros',
  '/reports':   'Reportes',
  '/users':     'Usuarios',
  '/platform/tenants': 'Clínicas',
  '/settings':  'Configuración',
};

const HamburgerIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

interface TopBarProps {
  onMenuOpen: () => void;
}

export const TopBar = ({ onMenuOpen }: TopBarProps) => {
  const location = useLocation();

  // Buscamos el título más específico que matchee la ruta actual
  const title =
    Object.entries(pageTitles)
      .sort((a, b) => b[0].length - a[0].length) // más largo primero
      .find(([path]) => location.pathname.startsWith(path))?.[1] ?? 'ApoloDigital';

  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-6 bg-white border-b border-slate-100 flex-shrink-0">
      {/* Hamburguesa (solo mobile) */}
      <button
        onClick={onMenuOpen}
        className="md:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        aria-label="Abrir menú"
      >
        <HamburgerIcon />
      </button>

      {/* Título de la página */}
      <h1 className="text-base md:text-lg font-semibold text-slate-800 tracking-tight">
        {title}
      </h1>

      {/* Espacio derecho — puedes añadir notificaciones u otros elementos aquí */}
      <div className="w-8 md:hidden" /> {/* Balanceo visual en mobile */}
    </header>
  );
};
