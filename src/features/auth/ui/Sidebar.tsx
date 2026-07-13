// src/features/auth/ui/Sidebar.tsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const PatientsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const AgendaIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const BillingIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const ReportsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const UsersManageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PlatformIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2M19 21H5m0 0H3m4-14h2m-2 4h2m-2 4h2m4-8h2m-2 4h2m-2 4h2" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const ToothIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C9.5 2 7 3.5 6 5.5 5 7 5 8.5 5 10c0 2 .5 3.5 1 5 .5 1.5 1 3 1 4.5 0 .8.3 1.5 1 1.5s1-.7 1-1.5c0-1 .3-2 1-2s1 1 1 2c0 .8.3 1.5 1 1.5s1-.7 1-1.5c0-1.5.5-3 1-4.5.5-1.5 1-3 1-5 0-1.5 0-3-1-4.5C16.5 3.5 14.5 2 12 2z" />
  </svg>
);

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard',  icon: <DashboardIcon /> },
  { path: '/patients',  label: 'Pacientes',  icon: <PatientsIcon /> },
  { path: '/agenda',    label: 'Agenda',     icon: <AgendaIcon /> },
  { path: '/billing',   label: 'Cobros',     icon: <BillingIcon /> },
];

const adminItems: NavItem[] = [
  { path: '/reports',  label: 'Reportes',      icon: <ReportsIcon />,      roles: ['ADMIN'] },
  { path: '/users',    label: 'Usuarios',      icon: <UsersManageIcon />, roles: ['ADMIN'] },
  { path: '/settings', label: 'Configuración', icon: <SettingsIcon />,    roles: ['ADMIN'] },
];

// Navegación exclusiva para el dueño de la plataforma (SUPER_ADMIN).
// No incluye ningún módulo clínico: un super-admin no pertenece a una
// clínica real, así que Pacientes/Agenda/Cobros no tienen sentido para él.
const platformItems: NavItem[] = [
  { path: '/platform/tenants', label: 'Clínicas', icon: <PlatformIcon /> },
];

// Genera iniciales para el avatar
const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

// Parsea roles de forma segura (puede venir como string JSON o array)
const parseRoles = (roles: string | string[] | undefined): string[] => {
  if (!roles) return [];
  if (Array.isArray(roles)) return roles;
  try { return JSON.parse(roles); } catch { return []; }
};

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ mobileOpen, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const userRoles = parseRoles(user?.roles);
  const isAdmin = userRoles.includes('ADMIN');
  const isSuperAdmin = userRoles.includes('SUPER_ADMIN');

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.path);
    return (
      <button
        onClick={() => handleNav(item.path)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
        style={{
          backgroundColor: active ? 'rgba(0,0,0,0.18)' : 'transparent',
          color: active ? '#0f3d3a' : 'rgba(0,0,0,0.6)',
          fontWeight: active ? 700 : 500,
        }}
        onMouseEnter={e => {
          if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.1)';
        }}
        onMouseLeave={e => {
          if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
        }}
      >
        {item.icon}
        {item.label}
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full w-60" style={{ backgroundColor: '#5bddd5' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'rgba(0,0,0,0.15)', color: '#fff' }}>
          <ToothIcon />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight" style={{ color: '#0f3d3a' }}>ApoloDigital</p>
          <p className="text-xs" style={{ color: 'rgba(0,0,0,0.45)' }}>Dental SaaS</p>
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {isSuperAdmin ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-3"
              style={{ color: 'rgba(0,0,0,0.4)' }}>
              Plataforma
            </p>
            {platformItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-3"
              style={{ color: 'rgba(0,0,0,0.4)' }}>
              Módulos
            </p>
            {navItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}

            {isAdmin && (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest px-3 mt-6 mb-3"
                  style={{ color: 'rgba(0,0,0,0.4)' }}>
                  Administración
                </p>
                {adminItems.map((item) => (
                  <NavLink key={item.path} item={item} />
                ))}
              </>
            )}
          </>
        )}
      </nav>

      {/* Usuario y logout */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(0,0,0,0.12)' }}>
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl mb-2"
          style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
          {/* Avatar con iniciales */}
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff' }}>
            {getInitials(user?.full_name || 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: '#0f3d3a' }}>{user?.full_name}</p>
            <p className="text-xs truncate" style={{ color: 'rgba(0,0,0,0.45)' }}>{userRoles[0] || 'Usuario'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ color: 'rgba(0,0,0,0.55)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(220,38,38,0.12)';
            (e.currentTarget as HTMLButtonElement).style.color = '#dc2626';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(0,0,0,0.55)';
          }}
        >
          <LogoutIcon />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: sidebar fijo */}
      <aside className="hidden md:flex flex-col h-screen sticky top-0 flex-shrink-0 w-60">
        {sidebarContent}
      </aside>

      {/* Mobile: overlay + drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-60 md:hidden flex flex-col">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
};