import { useMemo } from 'react';
import type { Patient } from '../../../types';

interface PatientCardProps {
  patient: Patient;
  onClick: () => void;
}

// ─── Iconografía Ligera (SVG) ────────────────────────────────────────────────

const MailIcon = () => (
  <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export const PatientCard = ({ patient, onClick }: PatientCardProps) => {
  // Formateador nativo de fecha seguro
  const formatDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat('es-BO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(dateString));
    } catch {
      return 'Fecha no disponible';
    }
  };

  // Iniciales del paciente para el avatar médico
  const initials = useMemo(() => {
    const first = (patient.first_name || '').trim().charAt(0);
    const last = (patient.last_name || '').trim().charAt(0);
    return `${first}${last}`.toUpperCase() || 'P';
  }, [patient.first_name, patient.last_name]);

  // Indicador de paciente nuevo (registrado en los últimos 30 días)
  const isNew = useMemo(() => {
    if (!patient.created_at) return false;
    const created = new Date(patient.created_at).getTime();
    const now = new Date().getTime();
    return now - created < 30 * 24 * 60 * 60 * 1000;
  }, [patient.created_at]);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer group flex flex-col justify-between space-y-4"
    >
      {/* ─── Cabecera de la tarjeta: Avatar, Nombre y Badges ─── */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          {/* Avatar médico e identidad */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 border border-blue-200/80 font-black text-sm flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white transition-all">
              {initials}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 capitalize">
                {patient.first_name} {patient.last_name}
              </h3>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                <CalendarIcon />
                <span>Registrado el {formatDate(patient.created_at)}</span>
              </p>
            </div>
          </div>

          {/* Badges de estado (Activo e indicador de Nuevo) */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                patient.is_active
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${patient.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {patient.is_active ? 'Activo' : 'Inactivo'}
            </span>
            {isNew && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                Nuevo
              </span>
            )}
          </div>
        </div>

        {/* ─── Datos de Contacto con Iconos y Badges para Ausencias ─── */}
        <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
          {/* Email: si no existe se muestra en Badge como requerido */}
          <div className="flex items-center gap-2">
            <MailIcon />
            {patient.email ? (
              <span className="text-slate-600 truncate font-medium">{patient.email}</span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Sin correo registrado
              </span>
            )}
          </div>

          {/* Teléfono */}
          <div className="flex items-center gap-2">
            <PhoneIcon />
            {patient.phone ? (
              <span className="text-slate-700 font-mono font-medium truncate">{patient.phone}</span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                Sin teléfono registrado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Pie de la Tarjeta: Identificador y Enlace a Ficha ─── */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-[11px] font-semibold text-slate-400">
          Ficha #{patient.id.slice(0, 6)}
        </span>
        <span className="font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
          <span>Ver ficha</span>
          <span>→</span>
        </span>
      </div>
    </div>
  );
};
