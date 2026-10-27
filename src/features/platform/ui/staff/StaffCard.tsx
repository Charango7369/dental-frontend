// src/features/platform/ui/staff/StaffCard.tsx
import { useState } from 'react';
import type { ClinicStaffMember } from '../../services/clinicStaff.service';

interface StaffCardProps {
  member: ClinicStaffMember;
  onEdit: (member: ClinicStaffMember) => void;
  onResetPassword: (member: ClinicStaffMember) => void;
}

const getInitials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

const roleBadgeMap: Record<string, { label: string; badgeClass: string; icon: string }> = {
  ADMIN: {
    label: 'Administrador / Director',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
    icon: '🛡️',
  },
  DOCTOR: {
    label: 'Odontólogo',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
    icon: '👨‍⚕️',
  },
  RECEPTIONIST: {
    label: 'Recepción',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    icon: '📋',
  },
};

export const StaffCard = ({ member, onEdit, onResetPassword }: StaffCardProps) => {
  const [showHash, setShowHash] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(member.hashed_password);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md p-5 flex flex-col justify-between ${
        member.is_active ? 'border-slate-200' : 'border-slate-200/70 bg-slate-50/50 opacity-80'
      }`}
    >
      <div>
        {/* Cabecera: Avatar, Nombre y Estado */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
              {getInitials(member.full_name || 'U')}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 text-base leading-snug truncate">
                {member.full_name}
              </h3>
              <p className="text-xs text-slate-500 truncate mt-0.5">{member.email}</p>
            </div>
          </div>

          <span
            className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border flex-shrink-0 ${
              member.is_active
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {member.is_active ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        {/* Roles asignados */}
        <div className="flex flex-wrap gap-1.5 my-3">
          {member.roles && member.roles.length > 0 ? (
            member.roles.map((role) => {
              const cfg = roleBadgeMap[role] || {
                label: role,
                badgeClass: 'bg-slate-50 text-slate-600 border-slate-200',
                icon: '👤',
              };
              return (
                <span
                  key={role}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border ${cfg.badgeClass}`}
                >
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </span>
              );
            })
          ) : (
            <span className="text-xs text-slate-400 italic">Sin roles asignados</span>
          )}
        </div>

        {/* Inspección de Hash de Contraseña Seguro */}
        <div className="my-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowHash((prev) => !prev)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>{showHash ? 'Ocultar hash de credenciales' : 'Ver hash seguro'}</span>
            </button>

            {showHash && (
              <button
                type="button"
                onClick={handleCopyHash}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                {copiedHash ? '✓ Copiado' : 'Copiar hash'}
              </button>
            )}
          </div>

          {showHash && (
            <div className="mt-2 p-2.5 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono break-all select-all border border-slate-800 shadow-inner animate-fade-in">
              <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1 font-sans">
                <span>Algoritmo: Bcrypt (64-byte salt)</span>
                <span className="text-emerald-400 font-bold">Unidireccional</span>
              </div>
              <p className="text-emerald-300 font-medium">{member.hashed_password}</p>
            </div>
          )}
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onEdit(member)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>Editar</span>
        </button>

        <button
          type="button"
          onClick={() => onResetPassword(member)}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 transition flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <span>Resetear Clave</span>
        </button>
      </div>
    </div>
  );
};
