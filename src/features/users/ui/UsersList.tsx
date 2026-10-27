// src/features/users/ui/UsersList.tsx
import { useState, useMemo } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useStaffUsers } from '../hooks/useUsers';
import type { StaffUser } from '../services/users.service';
import { UserCard } from './UserCard';
import { EditUserModal } from './EditUserModal';
import { CreateUserModal } from './CreateUserModal';

export const UsersList = () => {
  const currentUser = useAuthStore((s) => s.user);
  const { data: staff, isLoading, isError, refetch } = useStaffUsers();

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

  // Filtrado reactivo en cliente para búsqueda instantánea
  const filteredStaff = useMemo(() => {
    if (!staff) return [];
    if (!searchTerm.trim()) return staff;
    const term = searchTerm.toLowerCase();
    return staff.filter(
      (u) =>
        u.full_name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );
  }, [staff, searchTerm]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* ─── Encabezado con Jerarquía Visual y Alto Contraste ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>Usuarios</span>
            {staff && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-700/80 text-slate-200 font-semibold border border-slate-600">
                {staff.length}
              </span>
            )}
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Personal con acceso a esta clínica
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/30 transition-all flex items-center gap-2 w-fit transform hover:scale-[1.02]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Nuevo usuario</span>
        </button>
      </div>

      {/* ─── Barra de Filtro Rápido ─── */}
      {!isLoading && !isError && staff && staff.length > 0 && (
        <div className="relative max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-600/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
          />
        </div>
      )}

      {/* ─── Estado de Carga (Skeleton Cards) ─── */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse p-2">
              <div className="w-11 h-11 bg-slate-200 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="w-1/3 h-4 bg-slate-200 rounded-md" />
                <div className="w-1/4 h-3 bg-slate-100 rounded-md" />
              </div>
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex-shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* ─── Estado de Error ─── */}
      {isError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-5 rounded-2xl text-center">
          <p className="font-semibold text-sm">No se pudo cargar la lista del personal de la clínica.</p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ─── Lista Principal de Usuarios ─── */}
      {!isLoading && !isError && staff && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
          {filteredStaff.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <div className="text-3xl mb-2">👤</div>
              <p className="text-sm font-semibold text-slate-600">
                {searchTerm ? 'No se encontraron usuarios coincidentes' : 'No hay usuarios registrados'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-xs text-blue-600 hover:underline font-semibold"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredStaff.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isCurrentUser={user.id === currentUser?.id}
                  onEdit={setEditingUser}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Modales de Creación y Edición ─── */}
      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
};
