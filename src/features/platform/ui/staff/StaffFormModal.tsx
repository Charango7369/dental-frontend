// src/features/platform/ui/staff/StaffFormModal.tsx
import { useState, type FormEvent } from 'react';
import {
  useCreateClinicStaff,
  useUpdateClinicStaff,
} from '../../hooks/useClinicStaff';
import type { ClinicRole, ClinicStaffMember } from '../../services/clinicStaff.service';

interface StaffFormModalProps {
  clinicId: string;
  member: ClinicStaffMember | null;
  onClose: () => void;
  onSuccess: () => void;
}

const AVAILABLE_ROLES: { id: ClinicRole; label: string; desc: string; icon: string }[] = [
  {
    id: 'ADMIN',
    label: 'Administrador / Dirección',
    desc: 'Acceso total a reportes, facturación y configuración de la clínica.',
    icon: '🛡️',
  },
  {
    id: 'DOCTOR',
    label: 'Odontólogo',
    desc: 'Atención clínica, odontograma, agenda y registro de tratamientos.',
    icon: '👨‍⚕️',
  },
  {
    id: 'RECEPTIONIST',
    label: 'Recepción',
    desc: 'Agendamiento de citas, registro de pacientes y cobros en caja.',
    icon: '📋',
  },
];

export const StaffFormModal = ({ clinicId, member, onClose, onSuccess }: StaffFormModalProps) => {
  const isEditing = Boolean(member);

  const { mutateAsync: createStaff, isPending: isCreating } = useCreateClinicStaff(clinicId);
  const { mutateAsync: updateStaff, isPending: isUpdating } = useUpdateClinicStaff(clinicId);

  const [fullName, setFullName] = useState(member?.full_name || '');
  const [email, setEmail] = useState(member?.email || '');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<ClinicRole[]>(
    member?.roles && member.roles.length > 0 ? member.roles : ['RECEPTIONIST']
  );
  const [isActive, setIsActive] = useState<boolean>(member ? member.is_active : true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPending = isCreating || isUpdating;

  const toggleRole = (role: ClinicRole) => {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        // Al menos debe quedar un rol
        if (prev.length === 1) return prev;
        return prev.filter((r) => r !== role);
      }
      return [...prev, role];
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (selectedRoles.length === 0) {
      setErrorMessage('Debes seleccionar al menos un rol para el personal.');
      return;
    }

    try {
      if (isEditing && member) {
        await updateStaff({
          userId: member.id,
          data: {
            full_name: fullName.trim(),
            email: email.trim(),
            roles: selectedRoles,
            is_active: isActive,
          },
        });
      } else {
        if (!password || password.length < 8) {
          setErrorMessage('La contraseña inicial debe tener mínimo 8 caracteres.');
          return;
        }
        await createStaff({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          roles: selectedRoles,
          is_active: isActive,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Error al guardar los datos del personal.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Editar Personal' : 'Nuevo Miembro del Personal'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing ? 'Actualiza los datos o roles del colaborador' : 'Registra un profesional o asistente en esta clínica'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-semibold border border-red-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          {/* Nombre completo */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Dr. Mario Perez"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm"
            />
          </div>

          {/* Correo electrónico */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Correo Electrónico <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="usuario@clinica.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm"
            />
          </div>

          {/* Contraseña inicial (solo en creación) */}
          {!isEditing && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Contraseña Inicial <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Podrás resetear o regenerar contraseñas temporales en cualquier momento.
              </p>
            </div>
          )}

          {/* Selección de Roles */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Roles en la Clínica <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {AVAILABLE_ROLES.map((r) => {
                const checked = selectedRoles.includes(r.id);
                return (
                  <div
                    key={r.id}
                    onClick={() => toggleRole(r.id)}
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      checked
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}} // Manejado por el onClick del contenedor
                      className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 font-bold text-sm text-slate-800">
                        <span>{r.icon}</span>
                        <span>{r.label}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Estado activo/inactivo */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs font-bold text-slate-700">Estado de la cuenta</p>
              <p className="text-[11px] text-slate-500">Permite o deshabilita el inicio de sesión del usuario.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-5 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : isEditing ? (
                'Actualizar Personal'
              ) : (
                'Registrar Personal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
