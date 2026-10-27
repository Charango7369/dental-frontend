// src/features/users/ui/UserCard.tsx
import React from 'react';
import type { StaffUser } from '../services/users.service';
import { RoleBadge } from './RoleBadge';

interface UserCardProps {
  user: StaffUser;
  isCurrentUser: boolean;
  onEdit: (user: StaffUser) => void;
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

export const UserCard: React.FC<UserCardProps> = ({
  user,
  isCurrentUser,
  onEdit,
}) => {
  return (
    <div
      className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors hover:bg-slate-50/70 group ${
        !user.is_active ? 'opacity-60 bg-slate-50/30' : ''
      }`}
    >
      {/* Columna Izquierda: Avatar + Info */}
      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
        {/* Avatar con presencia */}
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm tracking-tight">
            {getInitials(user.full_name)}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
              user.is_active ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
            title={user.is_active ? 'Usuario activo' : 'Usuario inactivo'}
          />
        </div>

        {/* Datos del usuario */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">
              {user.full_name}
            </h3>
            {isCurrentUser && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                tú
              </span>
            )}
            {!user.is_active && (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                Inactivo
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{user.email}</span>
          </p>

          {/* Badges de Roles */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {user.roles.map((r) => (
              <RoleBadge key={r} role={r} />
            ))}
          </div>
        </div>
      </div>

      {/* Columna Derecha: Acción Editar */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onEdit(user)}
          className="p-2.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          title={`Editar a ${user.full_name}`}
          aria-label={`Editar a ${user.full_name}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
