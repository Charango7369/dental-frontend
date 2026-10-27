// src/features/users/ui/RoleBadge.tsx
import React from 'react';
import type { StaffRole } from '../services/users.service';

interface RoleBadgeConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
  icon?: string;
}

const ROLE_MAP: Record<string, RoleBadgeConfig> = {
  ADMIN: {
    label: 'Administrador',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
    dotClass: 'bg-purple-500',
    icon: '🛡️',
  },
  DOCTOR: {
    label: 'Doctor',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dotClass: 'bg-blue-500',
    icon: '👨‍⚕️',
  },
  RECEPTIONIST: {
    label: 'Recepción',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotClass: 'bg-emerald-500',
    icon: '📋',
  },
  SUPER_ADMIN: {
    label: 'Superadmin',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dotClass: 'bg-rose-500',
    icon: '⚡',
  },
};

const DEFAULT_CONFIG: RoleBadgeConfig = {
  label: 'Miembro',
  badgeClass: 'bg-slate-50 text-slate-600 border-slate-200',
  dotClass: 'bg-slate-400',
};

interface RoleBadgeProps {
  role: StaffRole | string;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  showDot = false,
  size = 'sm',
}) => {
  const config = ROLE_MAP[role] ?? DEFAULT_CONFIG;
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-xs transition-colors ${sizeClasses} ${config.badgeClass}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />}
      <span>{config.label}</span>
    </span>
  );
};
