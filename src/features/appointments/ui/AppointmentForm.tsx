// src/features/appointments/ui/AppointmentForm.tsx
import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { useCreateAppointment } from '../hooks/useAppointments';
import { usePatients } from '../../patients/hooks/usePatients';
import { useStaffUsers } from '../../users/hooks/useUsers';
import { useAuthStore } from '../../../store/authStore';

interface AppointmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  selectedDate: Date; // Para pre-llenar el día
}

export const AppointmentForm = ({ onSuccess, onCancel, selectedDate }: AppointmentFormProps) => {
  const user = useAuthStore((state) => state.user);

  // Determinar si el usuario autenticado tiene rol de odontólogo o director médico
  const isCurrentUserDoctor = Boolean(
    user?.roles?.some((r) => r === 'DOCTOR' || r === 'ADMIN')
  );

  // Pacientes y Odontólogos de la clínica
  const { data: patientsData, isLoading: isLoadingPatients } = usePatients({ limit: 100, active_only: true });
  const { data: staffList, isLoading: isLoadingStaff } = useStaffUsers();
  const { mutateAsync: createAppointment, isPending, error } = useCreateAppointment();

  // Filtrar exclusivamente usuarios activos con rol DOCTOR o ADMIN (profesionales de salud habilitados)
  const doctors = useMemo(() => {
    return (staffList ?? []).filter((u) => {
      if (u.is_active === false) return false;
      const roles = Array.isArray(u.roles) ? u.roles : [];
      return roles.includes('DOCTOR') || roles.includes('ADMIN');
    });
  }, [staffList]);

  // Pre-formatear fecha y hora
  const pad = (n: number) => n.toString().padStart(2, '0');
  const defaultDateTime = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}T09:00`;

  const [formData, setFormData] = useState({
    patient_id: '',
    // Si el usuario es doctor se pre-asigna a sí mismo; si es recepcionista inicia vacío para selección explícita
    doctor_id: isCurrentUserDoctor ? (user?.id || '') : '',
    start_time: defaultDateTime,
    durationMinutes: 30,
    reason: '',
  });

  // Si el usuario es recepcionista y la clínica sólo tiene 1 odontólogo registrado, pre-seleccionarlo
  useEffect(() => {
    if (!isCurrentUserDoctor && !formData.doctor_id && doctors.length === 1) {
      setFormData((prev) => ({ ...prev, doctor_id: doctors[0].id }));
    }
  }, [doctors, isCurrentUserDoctor, formData.doctor_id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.doctor_id) {
      console.error('No se ha seleccionado el odontólogo asignado.');
      return;
    }

    try {
      const startDate = new Date(formData.start_time);
      const endDate = new Date(startDate.getTime() + formData.durationMinutes * 60000);

      await createAppointment({
        patient_id: formData.patient_id,
        doctor_id: formData.doctor_id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        reason: formData.reason.trim() || undefined,
      });

      onSuccess();
    } catch (err) {
      console.error('Fallo al crear cita:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-sm font-medium border border-red-500/30">
          {(error as any)?.response?.data?.detail || error.message || 'Error al agendar la cita. Verifica que no haya solapamiento de horario.'}
        </div>
      )}

      {/* Selector de Paciente */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
          Paciente <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={formData.patient_id}
          onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
          disabled={isLoadingPatients || isPending}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626] outline-none text-sm text-slate-800 transition"
        >
          <option value="">Seleccione un paciente registrado...</option>
          {patientsData?.items.map((p) => (
            <option key={p.id} value={p.id}>
              {p.first_name} {p.last_name} {p.phone ? `(${p.phone})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Selector de Odontólogo */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Odontólogo Asignado <span className="text-red-500">*</span>
          </label>
          {!isCurrentUserDoctor && (
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              Asignación por Recepción
            </span>
          )}
        </div>
        <select
          required
          value={formData.doctor_id}
          onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
          disabled={isLoadingStaff || isPending}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626] outline-none text-sm text-slate-800 transition"
        >
          <option value="">
            {isLoadingStaff ? 'Cargando odontólogos...' : 'Seleccione el profesional...'}
          </option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              👨‍⚕️ {d.full_name} {d.id === user?.id ? '(Tú)' : ''} ({d.roles.includes('ADMIN') ? 'Director Odontólogo' : 'Odontólogo'})
            </option>
          ))}
        </select>
        {doctors.length === 0 && !isLoadingStaff && (
          <p className="mt-1 text-xs text-amber-600 font-medium">
            ⚠️ No se encontraron odontólogos activos en este consultorio.
          </p>
        )}
      </div>

      {/* Fecha y Duración */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Fecha y Hora <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            required
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            disabled={isPending}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626] outline-none text-sm text-slate-800 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Duración Estimada <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.durationMinutes}
            onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
            disabled={isPending}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626] outline-none text-sm text-slate-800 transition"
          >
            <option value={15}>⏱️ 15 minutos</option>
            <option value={30}>⏱️ 30 minutos (Estándar)</option>
            <option value={45}>⏱️ 45 minutos</option>
            <option value={60}>⏱️ 1 hora</option>
            <option value={90}>⏱️ 1.5 horas</option>
            <option value={120}>⏱️ 2 horas (Cirugías/Implantes)</option>
          </select>
        </div>
      </div>

      {/* Motivo de consulta */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
          Motivo / Tratamiento Odontológico
        </label>
        <input
          type="text"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          disabled={isPending}
          placeholder="Ej. Limpieza con ultrasonido, endodoncia, ortodoncia..."
          maxLength={250}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#dc2626] focus:border-[#dc2626] outline-none text-sm text-slate-800 transition"
        />
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-semibold text-sm rounded-xl transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending || !formData.patient_id || !formData.doctor_id}
          className="px-5 py-2.5 bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:from-[#ef4444] hover:to-[#dc2626] text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-2 transition disabled:opacity-50"
        >
          {isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Agendando...</span>
            </>
          ) : (
            <>
              <span>✚</span>
              <span>Confirmar Cita</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
