// src/features/auth/ui/Sidebar.tsx
import { useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';

// ==========================================
// 1. TIPOS Y CONTRATOS DE NAVEGACIÓN
// ==========================================

export interface NavItemConfig {
  path: string;
  label: string;
  icon: ReactNode;
  roles?: string[];
  badge?: string | number;
}

export interface NavGroupConfig {
  id: string;
  title: string;
  roles?: string[];
  items: NavItemConfig[];
}

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

// ==========================================
// 2. ICONOGRAFÍA MÉDICA Y SISTEMA (SVG NATIVO)
// ==========================================

const ApoloIsotipo = ({ className = "w-7 h-7" }: { className?: string }) => (
  <img
    src="/logo-isotipo.png"
    alt="ApoloDigital Isotipo"
    className={`${className} object-contain select-none pointer-events-none drop-shadow-[0_2px_6px_rgba(0,212,255,0.35)]`}
  />
);

const DashboardIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const PatientsIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const AgendaIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const BillingIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const ReportsIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const UsersManageIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PlatformIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2M19 21H5m0 0H3m4-14h2m-2 4h2m-2 4h2m4-8h2m-2 4h2m-2 4h2" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
  </svg>
);

const CollapseIcon = ({ isCollapsed }: { isCollapsed: boolean }) => (
  <svg className="w-4 h-4 flex-shrink-0 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    {isCollapsed ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
    )}
  </svg>
);

// ==========================================
// 3. ESTRUCTURA DE NAVEGACIÓN AGRUPADA POR CATEGORÍAS
// ==========================================

const navigationConfig: NavGroupConfig[] = [
  {
    id: 'operations',
    title: 'Operativos',
    roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'],
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
      { path: '/patients',  label: 'Pacientes', icon: <PatientsIcon /> },
      { path: '/agenda',    label: 'Agenda',    icon: <AgendaIcon /> },
      { path: '/billing',   label: 'Cobros',    icon: <BillingIcon /> },
    ],
  },
  {
    id: 'management',
    title: 'Administración',
    roles: ['ADMIN'],
    items: [
      { path: '/reports', label: 'Reportes', icon: <ReportsIcon />, roles: ['ADMIN'] },
      { path: '/users',   label: 'Usuarios', icon: <UsersManageIcon />, roles: ['ADMIN'] },
    ],
  },
  {
    id: 'system',
    title: 'Sistema',
    roles: ['ADMIN', 'SUPER_ADMIN'],
    items: [
      { path: '/settings', label: 'Configuración', icon: <SettingsIcon />, roles: ['ADMIN'] },
      { path: '/platform/tenants', label: 'Clínicas', icon: <PlatformIcon />, roles: ['SUPER_ADMIN'] },
    ],
  },
];

// ==========================================
// 4. HELPERS DE PERMISOS E IDENTIDAD
// ==========================================

const parseRoles = (roles: string | string[] | undefined): string[] => {
  if (!roles) return [];
  if (Array.isArray(roles)) return roles;
  try {
    return JSON.parse(roles);
  } catch {
    return [];
  }
};

const getInitials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

const formatRoleLabel = (role: string): string => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'ADMIN':
      return 'Director / Admin';
    case 'DOCTOR':
      return 'Odontólogo';
    case 'RECEPTIONIST':
      return 'Recepción';
    default:
      return role;
  }
};

// ==========================================
// 5. SUBCOMPONENTES MODULARES
// ==========================================

interface SidebarItemProps {
  item: NavItemConfig;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

const SidebarItem = ({ item, isActive, isCollapsed, onClick }: SidebarItemProps) => {
  return (
    <button
      onClick={onClick}
      title={isCollapsed ? item.label : undefined}
      aria-current={isActive ? 'page' : undefined}
      aria-label={item.label}
      className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#0f3d3a] ${
        isCollapsed ? 'justify-center px-2' : 'justify-between'
      } ${
        isActive
          ? 'bg-white text-[#0f3d3a] shadow-md shadow-black/10 font-bold'
          : 'text-[#0f3d3a]/75 hover:text-[#0f3d3a] hover:bg-black/10'
      }`}
    >
      <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'min-w-0'}`}>
        <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
          {item.icon}
        </span>
        {!isCollapsed && (
          <span className="truncate text-left">{item.label}</span>
        )}
      </div>

      {/* Indicador de activo: Dot lateral en modo extendido / badge indicador en colapsado */}
      {isActive && (
        <span
          className={`${
            isCollapsed
              ? 'absolute right-1.5 top-1.5 w-2 h-2 rounded-full bg-[#0f3d3a]'
              : 'w-2 h-2 rounded-full bg-[#0f3d3a] flex-shrink-0'
          }`}
          aria-hidden="true"
        />
      )}

      {/* Tooltip flotante nativo en estado colapsado (para accesibilidad y orientación) */}
      {isCollapsed && (
        <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#0f3d3a] text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
          {item.label}
        </div>
      )}
    </button>
  );
};

interface SidebarGroupProps {
  group: NavGroupConfig;
  userRoles: string[];
  isCollapsed: boolean;
  currentPath: string;
  onNavigate: (path: string) => void;
}

const SidebarGroup = ({ group, userRoles, isCollapsed, currentPath, onNavigate }: SidebarGroupProps) => {
  // Filtrar si el grupo entero no aplica a los roles del usuario
  if (group.roles && !group.roles.some((r) => userRoles.includes(r))) {
    return null;
  }

  // Filtrar ítems permitidos dentro del grupo
  const visibleItems = group.items.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.some((r) => userRoles.includes(r));
  });

  if (visibleItems.length === 0) return null;

  return (
    <div className="mb-4">
      {/* Título de la sección o divisor si está colapsado */}
      {!isCollapsed ? (
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#0f3d3a]/60 px-3 mb-1.5 select-none">
          {group.title}
        </p>
      ) : (
        <div className="h-px bg-black/10 my-2 mx-2" aria-hidden="true" />
      )}

      <div className="space-y-1" role="list">
        {visibleItems.map((item) => {
          const active = currentPath.startsWith(item.path);
          return (
            <SidebarItem
              key={item.path}
              item={item}
              isActive={active}
              isCollapsed={isCollapsed}
              onClick={() => onNavigate(item.path)}
            />
          );
        })}
      </div>
    </div>
  );
};

interface QuickActionsProps {
  isCollapsed: boolean;
  onNavigate: (path: string) => void;
}

const QuickActions = ({ isCollapsed, onNavigate }: QuickActionsProps) => {
  return (
    <div className="px-3 mb-4">
      {!isCollapsed ? (
        <button
          onClick={() => onNavigate('/agenda')}
          title="Agendar nueva cita médica"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#0f3d3a] hover:bg-[#134e4a] text-white rounded-xl text-xs font-bold shadow-md shadow-black/15 transition-all duration-200 hover:shadow-lg active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <PlusIcon />
          <span>Nueva Cita</span>
        </button>
      ) : (
        <div className="relative group flex justify-center">
          <button
            onClick={() => onNavigate('/agenda')}
            aria-label="Nueva Cita"
            className="w-10 h-10 flex items-center justify-center bg-[#0f3d3a] hover:bg-[#134e4a] text-white rounded-xl shadow-md transition-all duration-200 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <PlusIcon />
          </button>
          <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#0f3d3a] text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
            Nueva Cita
          </div>
        </div>
      )}
    </div>
  );
};

interface UserProfileFooterProps {
  user: any;
  userRoles: string[];
  isCollapsed: boolean;
  onLogout: () => void;
}

const UserProfileFooter = ({ user, userRoles, isCollapsed, onLogout }: UserProfileFooterProps) => {
  const primaryRole = userRoles[0] || 'RECEPTIONIST';
  const roleDisplay = formatRoleLabel(primaryRole);
  const fullName = user?.full_name || 'Usuario';
  const initials = getInitials(fullName);

  return (
    <footer className="p-3 border-t border-black/10 bg-black/5" role="contentinfo">
      {!isCollapsed ? (
        <div className="flex items-center gap-3 px-2.5 py-2 rounded-xl mb-2 bg-[#0f3d3a]/10 border border-[#0f3d3a]/10">
          {/* Avatar con iniciales */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 bg-[#0f3d3a] text-white shadow-xs"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#0f3d3a] truncate leading-tight">
              {fullName}
            </p>
            <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded bg-[#0f3d3a]/15 text-[#0f3d3a] border border-[#0f3d3a]/20">
              {primaryRole}
            </span>
          </div>
        </div>
      ) : (
        <div className="relative group flex justify-center mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black bg-[#0f3d3a] text-white shadow-xs cursor-default"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#0f3d3a] text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
            {fullName} • {roleDisplay}
          </div>
        </div>
      )}

      {/* Botón de Logout */}
      <button
        onClick={onLogout}
        aria-label="Cerrar sesión"
        title={isCollapsed ? 'Cerrar sesión' : undefined}
        className={`w-full flex items-center rounded-xl text-xs font-semibold text-[#0f3d3a]/75 hover:text-red-700 hover:bg-red-500/15 transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-600 ${
          isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'
        }`}
      >
        <LogoutIcon />
        {!isCollapsed && <span>Cerrar sesión</span>}
      </button>
    </footer>
  );
};

// ==========================================
// 6. COMPONENTE PRINCIPAL: SIDEBAR
// ==========================================

export const Sidebar = ({ mobileOpen, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  // Preferencia de colapsado con persistencia local
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dental_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('dental_sidebar_collapsed', String(next));
      } catch {
        // Ignorar fallos de almacenamiento
      }
      return next;
    });
  };

  const userRoles = parseRoles(user?.roles);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const renderContent = (collapsed: boolean) => (
    <div className="flex flex-col h-full bg-[#5bddd5] text-[#0f3d3a] select-none">
      {/* Cabecera / Identidad Clínica */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-black/10">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#0f3d3a] shadow-sm shadow-black/20 p-1.5 transition-transform duration-200 hover:scale-105"
            aria-hidden="true"
          >
            <ApoloIsotipo className="w-full h-full" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <h2 className="font-bold text-sm text-[#0f3d3a] leading-tight truncate">
                ApoloDigital
              </h2>
              <p className="text-[11px] text-[#0f3d3a]/70 font-medium">Dental SaaS</p>
            </div>
          )}
        </div>

        {/* Botón de colapsar / expandir (solo visible en desktop) */}
        <button
          onClick={toggleCollapse}
          aria-label={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          className="hidden md:flex p-1.5 rounded-lg text-[#0f3d3a]/70 hover:text-[#0f3d3a] hover:bg-black/10 transition-colors"
        >
          <CollapseIcon isCollapsed={collapsed} />
        </button>
      </div>

      {/* Acceso Rápido */}
      <div className="pt-3">
        <QuickActions isCollapsed={collapsed} onNavigate={handleNav} />
      </div>

      {/* Lista de navegación con scroll limpio */}
      <nav
        className="flex-1 px-3 py-1 overflow-y-auto space-y-1 focus:outline-none"
        aria-label="Navegación principal"
      >
        {navigationConfig.map((group) => (
          <SidebarGroup
            key={group.id}
            group={group}
            userRoles={userRoles}
            isCollapsed={collapsed}
            currentPath={location.pathname}
            onNavigate={handleNav}
          />
        ))}
      </nav>

      {/* Pie de usuario autenticado y logout */}
      <UserProfileFooter
        user={user}
        userRoles={userRoles}
        isCollapsed={collapsed}
        onLogout={handleLogout}
      />
    </div>
  );

  return (
    <>
      {/* Desktop: Sidebar animado y colapsable */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 flex-shrink-0 transition-all duration-300 ease-in-out border-r border-black/10 z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderContent(isCollapsed)}
      </aside>

      {/* Mobile: Drawer desplegable completo sobre fondo atenuado */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden animate-fade-in"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 w-64 md:hidden flex flex-col shadow-2xl animate-slide-in"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            {renderContent(false)}
          </aside>
        </>
      )}
    </>
  );
};
