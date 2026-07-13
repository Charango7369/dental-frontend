// src/features/platform/ui/TenantsList.tsx
import { useState, type FormEvent } from 'react';
import { useTenants, useCreateTenant, useUpdateTenant } from '../hooks/useTenants';

// ─── Modal: crear clínica + primer admin ──────────────────────────────────────

const CreateTenantModal = ({ onClose }: { onClose: () => void }) => {
  const { mutateAsync: createTenant, isPending, error } = useCreateTenant();
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    admin_full_name: '',
    admin_email: '',
    admin_password: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createTenant({
      name: form.name.trim(),
      address: form.address.trim() || undefined,
      phone: form.phone.trim() || undefined,
      admin_full_name: form.admin_full_name.trim(),
      admin_email: form.admin_email.trim(),
      admin_password: form.admin_password,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Nueva clínica</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
            {(error as any)?.message || 'Error al crear la clínica.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Datos de la clínica */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Datos de la clínica</p>
            <div className="space-y-3">
              <input
                type="text" required placeholder="Nombre de la clínica"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
              />
              <input
                type="text" placeholder="Dirección (opcional)"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
              />
              <input
                type="text" placeholder="Teléfono (opcional)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
              />
            </div>
          </div>

          {/* Primer administrador */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              Primer administrador de la clínica
            </p>
            <div className="space-y-3">
              <input
                type="text" required placeholder="Nombre completo"
                value={form.admin_full_name}
                onChange={(e) => setForm({ ...form, admin_full_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
              />
              <input
                type="email" required placeholder="Correo electrónico"
                value={form.admin_email}
                onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
              />
              <input
                type="password" required minLength={8} placeholder="Contraseña (mín. 8 caracteres)"
                value={form.admin_password}
                onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Esta persona podrá iniciar sesión de inmediato y gestionar el resto del personal de su clínica.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} disabled={isPending}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors">
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando...
                </>
              ) : 'Crear clínica'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Componente principal ────────────────────────────────────────────────────

export const TenantsList = () => {
  const { data: tenants, isLoading, isError, refetch } = useTenants();
  const { mutate: updateTenant } = useUpdateTenant();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const toggleActive = (id: string, current: boolean) => {
    updateTenant({ id, data: { is_active: !current } });
  };

  const activeCount = tenants?.filter((t) => t.is_active).length ?? 0;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clínicas</h1>
          <p className="text-slate-500 mt-1">
            {tenants?.length ?? 0} clínica{tenants?.length !== 1 ? 's' : ''} registrada{tenants?.length !== 1 ? 's' : ''} ·{' '}
            <span className="font-semibold text-emerald-600">{activeCount} activa{activeCount !== 1 ? 's' : ''}</span>
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2 w-fit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Nueva clínica
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm text-center">
          No se pudieron cargar las clínicas.{' '}
          <button onClick={() => refetch()} className="underline font-medium">Reintentar</button>
        </div>
      )}

      {!isLoading && !isError && tenants && tenants.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center text-slate-400">
          <p className="text-sm font-medium">Aún no hay clínicas registradas en la plataforma</p>
        </div>
      )}

      {!isLoading && !isError && tenants && tenants.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-bold text-slate-800">{tenant.name}</h3>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border flex-shrink-0 ${
                  tenant.is_active
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'bg-red-100 text-red-700 border-red-200'
                }`}>
                  {tenant.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              {tenant.address && <p className="text-sm text-slate-500">{tenant.address}</p>}
              {tenant.phone && <p className="text-sm text-slate-500">{tenant.phone}</p>}
              <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                Creada el {new Date(tenant.created_at).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <button
                onClick={() => toggleActive(tenant.id, tenant.is_active)}
                className={`w-full mt-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  tenant.is_active
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                }`}
              >
                {tenant.is_active ? 'Desactivar clínica' : 'Reactivar clínica'}
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && <CreateTenantModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
};