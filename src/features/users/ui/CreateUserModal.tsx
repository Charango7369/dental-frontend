// src/features/users/ui/CreateUserModal.tsx
import React, { useState, type FormEvent } from 'react';
import type { StaffRole } from '../services/users.service';
import { useCreateStaffUser } from '../hooks/useUsers';

interface CreateUserModalProps {
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

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ onClose }) => {
  const { mutateAsync: createUser, isPending, error } = useCreateStaffUser();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    roles: ['RECEPTIONIST'] as StaffRole[],
  });

  const toggleRole = (role: StaffRole) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.roles.length === 0 || isPending) return;

    try {
      await createUser(form);
      onClose();
    } catch {
      // Manejado por React Query
    }
  };

  const hasNoRoles = form.roles.length === 0;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-create-user-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              ✚
            </div>
            <h2 id="modal-create-user-title" className="text-base font-bold text-slate-900">
              Nuevo usuario
            </h2>
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

        {/* Error Alert */}
        {error && (
          <div className="mb-4 bg-red-50 text-red-700 p-3.5 rounded-xl text-xs font-medium border border-red-200 flex items-start gap-2">
            <span className="text-sm">⚠️</span>
            <span>{(error as any)?.response?.data?.detail || error.message || 'Error al crear el usuario.'}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Dr. Mario Soto"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-800 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Correo Electrónico <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="mario.soto@clinica.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-800 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Contraseña de Acceso <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-800 transition"
            />
          </div>

          {/* Roles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Roles de acceso <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {form.roles.length} seleccionado{form.roles.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {AVAILABLE_ROLES.map((r) => {
                const isSelected = form.roles.includes(r.value);
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
                  <span>Creando...</span>
                </>
              ) : (
                <span>Crear usuario</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
