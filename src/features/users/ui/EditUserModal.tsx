// src/features/users/ui/EditUserModal.tsx
import React, { useState, type FormEvent } from 'react';
import type { StaffUser, StaffRole } from '../services/users.service';
import { useUpdateStaffUser } from '../hooks/useUsers';

interface EditUserModalProps {
  user: StaffUser;
  onClose: () => void;
}

const AVAILABLE_ROLES: { value: StaffRole; label: string; activeStyle: string; icon: string }[] = [
  {
    value: 'ADMIN',
    label: 'Administrador',
    activeStyle: 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm',
    icon: '🛡️',
  },
  {
    value: 'DOCTOR',
    label: 'Doctor',
    activeStyle: 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm',
    icon: '👨‍⚕️',
  },
  {
    value: 'RECEPTIONIST',
    label: 'Recepción',
    activeStyle: 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm',
    icon: '📋',
  },
];

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose }) => {
  const { mutateAsync: updateUser, isPending, error } = useUpdateStaffUser();
  const [roles, setRoles] = useState<StaffRole[]>(user.roles);
  const [isActive, setIsActive] = useState<boolean>(user.is_active);

  const toggleRole = (role: StaffRole) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (roles.length === 0 || isPending) return;

    try {
      await updateUser({
        id: user.id,
        data: { roles, is_active: isActive },
      });
      onClose();
    } catch {
      // Error manejado por React Query
    }
  };

  const hasNoRoles = roles.length === 0;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-edit-user-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 text-slate-800 transform transition-all">
        
        {/* Header con Info del Usuario */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm border border-blue-100">
              {user.full_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 id="modal-edit-user-title" className="text-base font-bold text-slate-900">
                Editar usuario
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{user.full_name} · {user.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="mb-4 bg-red-50 text-red-700 p-3.5 rounded-xl text-xs font-medium border border-red-200 flex items-start gap-2">
            <span className="text-sm">⚠️</span>
            <span>{(error as any)?.response?.data?.detail || error.message || 'Error al actualizar el usuario.'}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Selector de Roles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Roles de acceso <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {roles.length} seleccionado{roles.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {AVAILABLE_ROLES.map((r) => {
                const isSelected = roles.includes(r.value);
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => toggleRole(r.value)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? r.activeStyle
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base">{r.icon}</span>
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>

            {hasNoRoles && (
              <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
                <span>⚠️</span> Selecciona al menos un rol para el usuario.
              </p>
            )}
          </div>

          {/* Toggle Usuario Activo */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
            <div>
              <span className="text-sm font-bold text-slate-800 block">Usuario activo</span>
              <span className="text-xs text-slate-500">
                {isActive ? 'Tiene acceso para iniciar sesión' : 'Acceso bloqueado en esta clínica'}
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive((v) => !v)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                isActive ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs sm:text-sm text-slate-600 hover:bg-slate-100 font-semibold rounded-xl transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending || hasNoRoles}
              className="px-5 py-2.5 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar cambios</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
