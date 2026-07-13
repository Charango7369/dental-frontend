// src/features/users/ui/UsersList.tsx
import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useStaffUsers, useCreateStaffUser, useUpdateStaffUser } from '../hooks/useUsers';
import type { StaffUser, StaffRole } from '../services/users.service';

const ROLE_OPTIONS: { value: StaffRole; label: string; color: string }[] = [
  { value: 'ADMIN',        label: 'Administrador', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'DOCTOR',       label: 'Doctor',         color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'RECEPTIONIST', label: 'Recepción',      color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
];

const roleConfig = (role: string) => ROLE_OPTIONS.find((r) => r.value === role) ?? ROLE_OPTIONS[2];

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

// ─── Modal: crear nuevo miembro del equipo ────────────────────────────────────

const CreateUserModal = ({ onClose }: { onClose: () => void }) => {
  const { mutateAsync: createUser, isPending, error } = useCreateStaffUser();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', roles: ['RECEPTIONIST'] as StaffRole[] });

  const toggleRole = (role: StaffRole) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role) ? prev.roles.filter((r) => r !== role) : [...prev.roles, role],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.roles.length === 0) return;
    await createUser(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Nuevo miembro del equipo</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
            {(error as any)?.message || 'Error al crear el usuario.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text" required placeholder="Nombre completo"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
          />
          <input
            type="email" required placeholder="Correo electrónico"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
          />
          <input
            type="password" required minLength={8} placeholder="Contraseña (mín. 8 caracteres)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Roles</label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => toggleRole(r.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                    form.roles.includes(r.value)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {form.roles.length === 0 && (
              <p className="text-xs text-red-500 mt-1.5">Selecciona al menos un rol.</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} disabled={isPending}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isPending || form.roles.length === 0}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors">
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando...
                </>
              ) : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Modal: editar roles / estado de un usuario existente ─────────────────────

const EditUserModal = ({ user, onClose }: { user: StaffUser; onClose: () => void }) => {
  const { mutateAsync: updateUser, isPending, error } = useUpdateStaffUser();
  const [roles, setRoles] = useState<StaffRole[]>(user.roles);
  const [isActive, setIsActive] = useState(user.is_active);

  const toggleRole = (role: StaffRole) => {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (roles.length === 0) return;
    await updateUser({ id: user.id, data: { roles, is_active: isActive } });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Editar usuario</h2>
            <p className="text-sm text-slate-500 mt-0.5">{user.full_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
            {(error as any)?.message || 'Error al actualizar el usuario.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Roles</label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => toggleRole(r.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                    roles.includes(r.value)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {roles.length === 0 && (
              <p className="text-xs text-red-500 mt-1.5">Selecciona al menos un rol.</p>
            )}
          </div>

          <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
            <span className="text-sm font-medium text-slate-700">Usuario activo</span>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} disabled={isPending}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isPending || roles.length === 0}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors">
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Componente principal ────────────────────────────────────────────────────

export const UsersList = () => {
  const currentUser = useAuthStore((s) => s.user);
  const { data: staff, isLoading, isError, refetch } = useStaffUsers();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-slate-500 mt-1">Personal con acceso a esta clínica</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2 w-fit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo usuario
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm text-center">
          No se pudo cargar el equipo.{' '}
          <button onClick={() => refetch()} className="underline font-medium">Reintentar</button>
        </div>
      )}

      {!isLoading && !isError && staff && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {staff.map((user) => (
              <div key={user.id} className={`p-4 flex items-center gap-4 ${!user.is_active ? 'opacity-50' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {getInitials(user.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 truncate">{user.full_name}</p>
                    {user.id === currentUser?.id && (
                      <span className="text-xs text-slate-400">(tú)</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {user.roles.map((r) => {
                      const cfg = roleConfig(r);
                      return (
                        <span key={r} className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      );
                    })}
                    {!user.is_active && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full border bg-slate-100 text-slate-500 border-slate-200">
                        Inactivo
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setEditingUser(user)}
                  className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0"
                  title="Editar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreateModal && <CreateUserModal onClose={() => setShowCreateModal(false)} />}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />}
    </div>
  );
};