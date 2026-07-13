import { useState, type FormEvent } from 'react';
import { useCreateAppointment } from '../hooks/useAppointments';
import { usePatients } from '../../patients/hooks/usePatients'; 
import { useAuthStore } from '../../../store/authStore';

interface AppointmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  selectedDate: Date; // Para pre-llenar el día
}

export const AppointmentForm = ({ onSuccess, onCancel, selectedDate }: AppointmentFormProps) => {
  // 🚨 1. EXTRAEMOS AL USUARIO (DOCTOR) DEL ESTADO GLOBAL
  const user = useAuthStore((state) => state.user);

  // Obtenemos la lista de pacientes para el dropdown
  const { data: patientsData, isLoading: isLoadingPatients } = usePatients({ limit: 50, active_only: true });
  const { mutateAsync: createAppointment, isPending, error } = useCreateAppointment();

  // Pre-formateamos la fecha actual para el input datetime-local (YYYY-MM-DDThh:mm)
  const pad = (n: number) => n.toString().padStart(2, '0');
  const defaultDateTime = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}T09:00`;

  const [formData, setFormData] = useState({
    patient_id: '',
    start_time: defaultDateTime,
    durationMinutes: 30, // Default 30 min
    reason: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // 🚨 2. GUARDIA DE SEGURIDAD: Evita crashes si se pierde la sesión
    if (!user?.id) {
      console.error("Error crítico: No se encontró el ID del doctor en la sesión actual.");
      return;
    }

    try {
      // BLINDAJE DE TIEMPO: Convertimos local a UTC
      const startDate = new Date(formData.start_time);
      
      // Calculamos el final sumando los minutos
      const endDate = new Date(startDate.getTime() + formData.durationMinutes * 60000);

      await createAppointment({
        patient_id: formData.patient_id,
        doctor_id: user.id, // 🚨 3. INYECTAMOS TU ID REAL
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        reason: formData.reason.trim() || undefined,
      });

      onSuccess();
    } catch (err) {
      console.error("Fallo al crear cita:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-200">
          {error.message || 'Error al agendar la cita. Verifica la disponibilidad del horario.'}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Paciente <span className="text-red-500">*</span></label>
        <select
          required
          value={formData.patient_id}
          onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
          disabled={isLoadingPatients || isPending}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white"
        >
          <option value="">Seleccione un paciente...</option>
          {patientsData?.items.map((p) => (
            <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha y Hora <span className="text-red-500">*</span></label>
          <input
            type="datetime-local"
            required
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            disabled={isPending}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Duración <span className="text-red-500">*</span></label>
          <select
            value={formData.durationMinutes}
            onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
            disabled={isPending}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white"
          >
            <option value={15}>15 minutos</option>
            <option value={30}>30 minutos</option>
            <option value={45}>45 minutos</option>
            <option value={60}>1 hora</option>
            <option value={90}>1.5 horas</option>
            <option value={120}>2 horas</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Motivo (Opcional)</label>
        <input
          type="text"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          disabled={isPending}
          placeholder="Ej. Limpieza dental, Dolor de muela..."
          maxLength={250}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} disabled={isPending} className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={isPending || !formData.patient_id} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2">
          {isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Agendando...
            </>
          ) : (
            'Confirmar Cita'
          )}
        </button>
      </div>
    </form>
  );
};