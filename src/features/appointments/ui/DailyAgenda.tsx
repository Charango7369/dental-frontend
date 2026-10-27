// src/features/appointments/ui/DailyAgenda.tsx
import { useState, useMemo, type FormEvent, type DragEvent } from 'react';
import {
  useDailyAppointments,
  useMonthlyAppointments,
  useUpdateAppointment,
  useRescheduleAppointment,
  useCompleteAppointment,
  useSendReminder,
  useTodayMetrics,
} from '../hooks/useAppointments';
import { useStaffUsers } from '../../users/hooks/useUsers';
import { AppointmentForm } from './AppointmentForm';
import type { Appointment, AppointmentStatus } from '../services/appointments.service';

// ─── Configuración de paleta médica y estados ───────────────────────────────

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; badge: string; border: string; dot: string; bg: string }
> = {
  PENDING: {
    label: 'Pendiente',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    border: 'border-l-amber-500',
    dot: 'bg-amber-400',
    bg: 'bg-amber-50',
  },
  CONFIRMED: {
    label: 'Confirmado',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    border: 'border-l-blue-500',
    dot: 'bg-blue-500',
    bg: 'bg-blue-50',
  },
  COMPLETED: {
    label: 'Completado',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    border: 'border-l-emerald-500',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50',
  },
  CANCELLED: {
    label: 'Cancelado',
    badge: 'bg-red-50 text-red-700 border-red-200',
    border: 'border-l-red-500',
    dot: 'bg-red-500',
    bg: 'bg-red-50',
  },
  NO_SHOW: {
    label: 'No asistió',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    border: 'border-l-slate-400',
    dot: 'bg-slate-400',
    bg: 'bg-slate-100',
  },
};

const NEXT_ACTIONS: Record<
  AppointmentStatus,
  { status: AppointmentStatus; label: string; color: string }[]
> = {
  PENDING: [
    { status: 'CONFIRMED', label: 'Confirmar', color: 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100' },
    { status: 'CANCELLED', label: 'Cancelar', color: 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100' },
    { status: 'NO_SHOW', label: 'No asistió', color: 'text-slate-700 bg-slate-100 border-slate-200 hover:bg-slate-200' },
  ],
  CONFIRMED: [
    { status: 'CANCELLED', label: 'Cancelar', color: 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100' },
    { status: 'NO_SHOW', label: 'No asistió', color: 'text-slate-700 bg-slate-100 border-slate-200 hover:bg-slate-200' },
  ],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

// ─── Helpers de formato, moneda y fechas ────────────────────────────────────

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

const formatHeaderDate = (date: Date) =>
  date.toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatCurrency = (amount: number | undefined | null): string => {
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const DAYS_ES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const buildCalendarDays = (year: number, month: number): (Date | null)[] => {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
};

// Generador de URL directa para Google Calendar
const createGoogleCalendarUrl = (apt: Appointment) => {
  const patientName = apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : 'Paciente';
  const title = encodeURIComponent(`Cita Odontológica: ${patientName}`);
  const details = encodeURIComponent(
    `Atención dental: ${apt.reason || 'Consulta'}\nPaciente: ${patientName}\nTeléfono: ${apt.patient?.phone || 'N/A'}`
  );
  const startIso = new Date(apt.start_time).toISOString().replace(/-|:|\.\d\d\d/g, '');
  const endIso = new Date(apt.end_time).toISOString().replace(/-|:|\.\d\d\d/g, '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}`;
};

// ─── Modal Completar Cita ────────────────────────────────────────────────────

interface CompleteModalProps {
  appointment: Appointment;
  onClose: () => void;
}

const CompleteModal = ({ appointment, onClose }: CompleteModalProps) => {
  const { mutateAsync: complete, isPending, error } = useCompleteAppointment();
  const [form, setForm] = useState({ final_cost: '', treatment_description: '' });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await complete({
      id: appointment.id,
      data: {
        final_cost: parseFloat(form.final_cost),
        treatment_description: form.treatment_description.trim(),
      },
    });
    onClose();
  };

  const patientName = appointment.patient
    ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
    : 'Paciente';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-emerald-600" role="img" aria-label="Cobro">💵</span> Completar y Facturar
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {patientName} · {formatTime(appointment.start_time)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-xl text-xs border border-red-200">
            Error al completar la cita. Intenta nuevamente.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Descripción del tratamiento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Profilaxis profunda, restauración de resina..."
              value={form.treatment_description}
              onChange={(e) => setForm({ ...form, treatment_description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none text-xs text-slate-800 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Costo final (Bs.) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
                Bs.
              </span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.final_cost}
                onChange={(e) => setForm({ ...form, final_cost: e.target.value })}
                className="w-full pl-11 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none text-xs text-slate-900 font-bold transition"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
              <span>ℹ️</span> Se generará una cuenta por cobrar y se notificará por WhatsApp.
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 font-semibold rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !form.treatment_description || !form.final_cost}
              className="px-5 py-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-900/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Confirmar Cobro</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Componente Principal de Agenda ──────────────────────────────────────────

export const DailyAgenda = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [appointmentToComplete, setAppointmentToComplete] = useState<Appointment | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tooltip flotante de detalles
  const [hoveredApt, setHoveredApt] = useState<{
    apt: Appointment;
    x: number;
    y: number;
  } | null>(null);

  // Staff (Doctores de la clínica)
  const { data: staffList } = useStaffUsers();
  const doctors = useMemo(() => {
    return (staffList ?? []).filter((u) => {
      const roles = Array.isArray(u.roles) ? u.roles : [];
      return roles.includes('DOCTOR') || roles.includes('ADMIN');
    });
  }, [staffList]);

  // Consulta citas del mes para la vista mensual
  const startOfMonth = useMemo(() => {
    const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [selectedDate]);

  const endOfMonth = useMemo(() => {
    const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [selectedDate]);

  const filterParams = useMemo(() => ({
    doctor_id: selectedDoctorId !== 'ALL' ? selectedDoctorId : undefined,
    status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
    search: searchTerm.trim() ? searchTerm.trim() : undefined,
  }), [selectedDoctorId, selectedStatus, searchTerm]);

  const { data: monthlyApts, isLoading: isLoadingMonth } = useMonthlyAppointments(
    startOfMonth,
    endOfMonth,
    filterParams
  );

  const { data: dailyApts, isLoading: isLoadingDay } = useDailyAppointments(
    selectedDate,
    filterParams
  );

  const isLoading = isLoadingMonth || isLoadingDay;

  const { data: metricsData } = useTodayMetrics();
  const { mutateAsync: rescheduleApt } = useRescheduleAppointment();
  const { mutateAsync: updateApt } = useUpdateAppointment();
  const { mutateAsync: sendWhatsAppReminder, isPending: isSendingReminder } = useSendReminder();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Drag and Drop nativo para reprogramar citas
  const handleDragStart = (e: DragEvent, aptId: string) => {
    e.dataTransfer.setData('text/plain', aptId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnDay = async (e: DragEvent, targetDate: Date) => {
    e.preventDefault();
    const aptId = e.dataTransfer.getData('text/plain');
    if (!aptId) return;

    const allApts = monthlyApts ?? dailyApts ?? [];
    const sourceApt = allApts.find((a) => a.id === aptId);
    if (!sourceApt) return;

    const oldStart = new Date(sourceApt.start_time);
    const oldEnd = new Date(sourceApt.end_time);
    const durationMs = oldEnd.getTime() - oldStart.getTime();

    const newStart = new Date(targetDate);
    newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);
    const newEnd = new Date(newStart.getTime() + durationMs);

    try {
      await rescheduleApt({
        id: aptId,
        payload: {
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString(),
        },
      });
      showToast(
        `✓ Cita reprogramada para el ${targetDate.toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })} a las ${formatTime(newStart.toISOString())}`
      );
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'No se pudo reagendar por conflicto de horarios.';
      showToast(`⚠️ ${msg}`);
    }
  };

  // Enviar recordatorio WhatsApp Cloud API
  const handleSendReminder = async (apt: Appointment) => {
    try {
      await sendWhatsAppReminder(apt.id);
      const name = apt.patient ? apt.patient.first_name : 'Paciente';
      showToast(`📲 Recordatorio de WhatsApp enviado a ${name}`);
    } catch (err: any) {
      showToast('⚠️ No se pudo enviar el mensaje. Verifica la configuración de WhatsApp.');
    }
  };

  // Exportar a Excel (CSV con formato UTF-8 BOM)
  const exportToExcel = () => {
    const apts = monthlyApts ?? dailyApts ?? [];
    if (apts.length === 0) {
      showToast('No hay citas en este período para exportar.');
      return;
    }

    const headers = ['Fecha', 'Hora Inicio', 'Hora Fin', 'Paciente', 'Telefono', 'Odontologo', 'Motivo', 'Estado'];
    const rows = apts.map((a) => [
      new Date(a.start_time).toLocaleDateString('es-BO'),
      formatTime(a.start_time),
      formatTime(a.end_time),
      a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : 'N/A',
      a.patient?.phone || 'N/A',
      a.doctor?.full_name || 'N/A',
      `"${(a.reason || 'Consulta').replace(/"/g, '""')}"`,
      STATUS_CONFIG[a.status]?.label || a.status,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `agenda_dental_${selectedDate.getFullYear()}_${selectedDate.getMonth() + 1}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📊 Reporte Excel descargado');
  };

  // Exportar a calendario universal .ICS (Outlook, Google, Apple)
  const exportAllToICS = () => {
    const apts = monthlyApts ?? dailyApts ?? [];
    if (apts.length === 0) {
      showToast('No hay citas para exportar.');
      return;
    }

    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//ApoloDigital Dental SaaS//ES\r\nCALSCALE:GREGORIAN\r\n';
    apts.forEach((a) => {
      const patientName = a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : 'Paciente';
      const doctorName = a.doctor?.full_name || 'Odontólogo';
      const s = new Date(a.start_time).toISOString().replace(/-|:|\.\d\d\d/g, '');
      const e = new Date(a.end_time).toISOString().replace(/-|:|\.\d\d\d/g, '');
      ics +=
        `BEGIN:VEVENT\r\nUID:${a.id}@apolodigital.dental\r\n` +
        `DTSTART:${s}\r\nDTEND:${e}\r\n` +
        `SUMMARY:Cita: ${patientName} (${a.reason || 'Tratamiento'})\r\n` +
        `DESCRIPTION:Odontólogo: ${doctorName} | Tel: ${a.patient?.phone || 'N/A'}\r\n` +
        `STATUS:CONFIRMED\r\nEND:VEVENT\r\n`;
    });
    ics += 'END:VCALENDAR\r\n';

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `citas_dental_${selectedDate.getFullYear()}_${selectedDate.getMonth() + 1}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📅 Archivo de calendario .ICS generado');
  };

  // Celdas del mes
  const monthCells = useMemo(() => {
    return buildCalendarDays(selectedDate.getFullYear(), selectedDate.getMonth());
  }, [selectedDate]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Toast Flotante */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-white border border-slate-200 text-slate-900 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fadeIn">
          <span className="text-amber-500 text-base" aria-hidden="true">✦</span>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ─── ENCABEZADO CON CONTRASTE ELEVADO Y ACCIÓN PRINCIPAL ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Agenda Odontológica
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 capitalize">
              {MONTHS_ES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-300 mt-1 capitalize">
            {formatHeaderDate(selectedDate)}
          </p>
        </div>

        {/* Botón Primario de Nueva Cita */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white rounded-xl text-xs font-bold shadow-md shadow-red-900/30 transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <span className="text-base font-black leading-none">+</span>
          <span>Nueva Cita</span>
        </button>
      </div>

      {/* ─── SECCIÓN 1: INDICADORES CLAVE DEL DÍA (MÉTRICAS TIPO CARD) ─── */}
      <section aria-label="Indicadores del día" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Indicador 1: Citas del día */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-xl flex-shrink-0">
            <span role="img" aria-label="Calendario de citas">📅</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Citas Programadas</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {metricsData?.total_today ?? (dailyApts?.length || 0)}
            </p>
          </div>
        </div>

        {/* Indicador 2: Pacientes Atendidos */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center text-xl flex-shrink-0">
            <span role="img" aria-label="Paciente atendido">🦷</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pacientes Atendidos</p>
            <p className="text-2xl font-black text-emerald-600 tracking-tight mt-0.5">
              {metricsData?.attended_today ?? (dailyApts?.filter((a) => a.status === 'COMPLETED').length || 0)}
            </p>
          </div>
        </div>

        {/* Indicador 3: Facturación de Hoy */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center text-xl flex-shrink-0">
            <span role="img" aria-label="Cobros e ingresos">💵</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facturación de Hoy</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xs font-bold text-slate-500">Bs.</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(metricsData?.estimated_income_today)}
              </span>
            </div>
          </div>
        </div>

        {/* Indicador 4: Canal WhatsApp Cloud API */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center text-xl flex-shrink-0">
            <span role="img" aria-label="WhatsApp Cloud API">📲</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp API</p>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Servicio activo" />
            </div>
            <p className="text-xs font-bold text-emerald-700 truncate mt-0.5">Meta Graph v20.0</p>
            <p className="text-[10px] text-slate-400 truncate">Multi-tenant activo</p>
          </div>
        </div>
      </section>

      {/* ─── SECCIÓN 2: BARRA DE FILTROS, NAVEGACIÓN Y ACCIONES TIPO CARD ─── */}
      <section aria-label="Controles de navegación y filtros" className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-4">
        
        {/* Fila Superior: Navegación de Fecha + Conmutador de Vistas + Exportaciones */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Navegación y Título del Mes */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSelectedDate((d) => addDays(d, -30))}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Mes anterior"
              aria-label="Ir al mes anterior"
            >
              ◀
            </button>

            <div>
              <div className="text-base md:text-lg font-bold text-slate-900 capitalize flex items-center gap-2">
                <span>{MONTHS_ES[selectedDate.getMonth()]}</span>
                <span className="text-blue-600">{selectedDate.getFullYear()}</span>
                {isLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin inline-block ml-1" />
                )}
              </div>
              <p className="text-xs text-slate-400 capitalize">
                {formatHeaderDate(selectedDate)}
              </p>
            </div>

            <button
              onClick={() => setSelectedDate((d) => addDays(d, 30))}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Mes siguiente"
              aria-label="Ir al mes siguiente"
            >
              ▶
            </button>

            <button
              onClick={() => setSelectedDate(new Date())}
              className="ml-2 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition"
              title="Volver a la fecha actual"
              aria-label="Ir a la fecha de hoy"
            >
              Hoy
            </button>
          </div>

          {/* Vistas y Exportadores */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Conmutador de Vistas */}
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex" role="tablist" aria-label="Tipo de vista de agenda">
              <button
                onClick={() => setViewMode('month')}
                role="tab"
                aria-selected={viewMode === 'month'}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  viewMode === 'month'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Mes
              </button>
              <button
                onClick={() => setViewMode('week')}
                role="tab"
                aria-selected={viewMode === 'week'}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  viewMode === 'week'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setViewMode('list')}
                role="tab"
                aria-selected={viewMode === 'list'}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Lista Diaria
              </button>
            </div>

            {/* Botón Excel */}
            <button
              onClick={exportToExcel}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-1.5 transition"
              title="Exportar citas a Excel (CSV)"
              aria-label="Exportar citas a Excel"
            >
              <span role="img" aria-hidden="true">📊</span>
              <span className="hidden sm:inline">Excel</span>
            </button>

            {/* Botón Sincronizar ICS */}
            <button
              onClick={exportAllToICS}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-1.5 transition"
              title="Sincronizar con Outlook / Apple / Google Calendar (.ICS)"
              aria-label="Sincronizar citas con calendario universal ICS"
            >
              <span role="img" aria-hidden="true">📅</span>
              <span className="hidden sm:inline">Sincronizar (.ics)</span>
            </button>

            {/* Botón Imprimir PDF */}
            <button
              onClick={() => window.print()}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-1.5 transition"
              title="Imprimir o guardar como PDF"
              aria-label="Imprimir agenda o guardar como PDF"
            >
              <span role="img" aria-hidden="true">🖨️</span>
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>

        {/* Fila Inferior: Filtros de Búsqueda y Selección */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
          {/* Buscador de paciente */}
          <div className="relative flex-1 min-w-[240px]">
            <span
              role="img"
              aria-label="Buscar"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Buscar paciente o motivo de consulta..."
              aria-label="Buscar paciente o motivo de consulta"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
            />
          </div>

          {/* Filtro Odontólogo */}
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            aria-label="Filtrar por odontólogo"
            title="Filtrar por odontólogo"
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:border-blue-400"
          >
            <option value="ALL">👨‍⚕️ Todos los Odontólogos</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.full_name}
              </option>
            ))}
          </select>

          {/* Filtro Estado */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filtrar por estado de cita"
            title="Filtrar por estado de cita"
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:border-blue-400"
          >
            <option value="ALL">🏷️ Todos los Estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="CONFIRMED">Confirmados</option>
            <option value="COMPLETED">Completados</option>
            <option value="CANCELLED">Cancelados</option>
          </select>
        </div>
      </section>

      {/* ─── SECCIÓN 3: ÁREA PRINCIPAL DEL CALENDARIO (CSS GRID REAL EN BLANCO) ─── */}
      <section aria-label="Calendario de citas" className="w-full">
        {/* ─── VISTA 1: CALENDARIO MENSUAL CON CSS GRID ─── */}
        {viewMode === 'month' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            {/* Encabezado de Días de la Semana con CSS Grid Explícito */}
            <div
              className="grid border-b border-slate-200 text-center py-2.5 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                width: '100%',
              }}
            >
              {DAYS_ES.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Matriz de Días del Mes con CSS Grid Explícito */}
            <div
              className="grid divide-x divide-y divide-slate-200/80 bg-slate-100/50"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                width: '100%',
              }}
            >
              {monthCells.map((date, idx) => {
                if (!date) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="bg-slate-50/60 min-h-[125px] p-2"
                      aria-hidden="true"
                    />
                  );
                }

                const isCurrentDay = isToday(date);
                const isSelectedDay = isSameDay(date, selectedDate);

                // Filtrar citas que caen en este día
                const dayAppointments = (monthlyApts ?? []).filter((apt) =>
                  isSameDay(new Date(apt.start_time), date)
                );

                return (
                  <div
                    key={date.toISOString()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropOnDay(e, date)}
                    onClick={() => setSelectedDate(date)}
                    className={`p-2.5 min-h-[125px] relative flex flex-col justify-between transition-colors group cursor-pointer ${
                      isCurrentDay
                        ? 'bg-red-50/40 ring-2 ring-inset ring-red-400/60'
                        : isSelectedDay
                        ? 'bg-blue-50/40 ring-2 ring-inset ring-blue-400/60'
                        : 'bg-white hover:bg-blue-50/20'
                    }`}
                  >
                    {/* Cabecera de celda */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition ${
                          isCurrentDay
                            ? 'bg-red-600 text-white shadow-xs'
                            : isSelectedDay
                            ? 'bg-blue-600 text-white font-black'
                            : 'text-slate-700 group-hover:text-blue-600'
                        }`}
                      >
                        {date.getDate()}
                      </span>

                      {dayAppointments.length > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {dayAppointments.length}
                        </span>
                      )}
                    </div>

                    {/* Lista de citas en la celda */}
                    <div className="space-y-1 mt-1.5 overflow-y-auto max-h-[85px] pr-0.5 flex-1">
                      {dayAppointments.slice(0, 3).map((apt) => {
                        const config = STATUS_CONFIG[apt.status] || STATUS_CONFIG.PENDING;
                        const patientName = apt.patient
                          ? `${apt.patient.first_name} ${apt.patient.last_name[0]}.`
                          : 'Paciente';

                        return (
                          <div
                            key={apt.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, apt.id)}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoveredApt({
                                apt,
                                x: Math.min(rect.right + 12, window.innerWidth - 320),
                                y: Math.max(rect.top - 10, 20),
                              });
                            }}
                            onMouseLeave={() => setHoveredApt(null)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(date);
                              setViewMode('list');
                            }}
                            className={`text-[11px] p-1.5 rounded-lg border-l-4 ${config.border} bg-white hover:bg-slate-50 border border-slate-200/80 cursor-grab active:cursor-grabbing transition shadow-2xs`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-slate-800 truncate">{patientName}</span>
                              <span className="text-[9px] font-mono text-slate-500">
                                {formatTime(apt.start_time)}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {dayAppointments.length > 3 && (
                        <div className="text-[10px] text-center text-blue-600 font-bold py-0.5">
                          +{dayAppointments.length - 3} más...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── VISTA 2: SEMANAL CON BLOQUES HORARIOS Y CSS GRID ─── */}
        {viewMode === 'week' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm overflow-x-auto">
            <div
              className="grid gap-3 min-w-[750px]"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              }}
            >
              {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(selectedDate);
                const dayOfWeek = (d.getDay() + 6) % 7;
                d.setDate(d.getDate() - dayOfWeek + i);
                const isCurrent = isToday(d);

                const weekDayApts = (monthlyApts ?? []).filter((a) =>
                  isSameDay(new Date(a.start_time), d)
                );

                return (
                  <div
                    key={i}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropOnDay(e, d)}
                    className={`flex flex-col rounded-2xl border p-3 min-h-[460px] transition ${
                      isCurrent
                        ? 'border-red-400 bg-red-50/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    {/* Cabecera del Día de la Semana */}
                    <div className="text-center pb-2.5 border-b border-slate-200 mb-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {d.toLocaleDateString('es-BO', { weekday: 'short' })}
                      </div>
                      <div
                        className={`text-lg font-black mt-0.5 ${
                          isCurrent ? 'text-red-600' : 'text-slate-800'
                        }`}
                      >
                        {d.getDate()}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold">
                        {weekDayApts.length} {weekDayApts.length === 1 ? 'cita' : 'citas'}
                      </div>
                    </div>

                    {/* Bloques de Citas del Día */}
                    <div className="space-y-2 flex-1 overflow-y-auto">
                      {weekDayApts.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-[11px] text-slate-400">
                          Sin citas
                        </div>
                      ) : (
                        weekDayApts.map((apt) => {
                          const config = STATUS_CONFIG[apt.status] || STATUS_CONFIG.PENDING;
                          const patientName = apt.patient
                            ? `${apt.patient.first_name} ${apt.patient.last_name}`
                            : 'Paciente';

                          return (
                            <div
                              key={apt.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, apt.id)}
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoveredApt({
                                  apt,
                                  x: Math.min(rect.right + 12, window.innerWidth - 320),
                                  y: Math.max(rect.top - 10, 20),
                                });
                              }}
                              onMouseLeave={() => setHoveredApt(null)}
                              className={`p-2.5 rounded-xl border-l-4 ${config.border} bg-white border border-slate-200 shadow-2xs cursor-grab active:cursor-grabbing hover:shadow-xs transition`}
                            >
                              <div className="text-xs font-bold text-slate-800 truncate">{patientName}</div>
                              <div className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                                {apt.reason || 'Tratamiento Odontológico'}
                              </div>
                              <div className="text-[9px] font-mono text-slate-400 mt-1 flex items-center justify-between">
                                <span>{formatTime(apt.start_time)}</span>
                                <span className={`px-1.5 py-0.2 rounded-full border text-[8px] font-bold ${config.badge}`}>
                                  {config.label}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── VISTA 3: LISTA CRONOLÓGICA DEL DÍA SELECCIONADO ─── */}
        {viewMode === 'list' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span role="img" aria-label="Agenda diaria">📅</span> Agenda del {formatHeaderDate(selectedDate)}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {dailyApts?.length || 0} citas programadas para esta fecha
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                ✚ Nueva cita para este día
              </button>
            </div>

            {!dailyApts || dailyApts.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <div className="text-3xl mb-2">🦷</div>
                <p className="text-xs font-semibold text-slate-600">No hay citas registradas para este día</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-xs text-blue-600 hover:underline font-bold"
                >
                  + Agendar primera cita ahora
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {dailyApts.map((apt) => {
                  const config = STATUS_CONFIG[apt.status] || STATUS_CONFIG.PENDING;
                  const patientName = apt.patient
                    ? `${apt.patient.first_name} ${apt.patient.last_name}`
                    : 'Paciente';
                  const actions = NEXT_ACTIONS[apt.status] || [];

                  return (
                    <div
                      key={apt.id}
                      className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition shadow-2xs"
                    >
                      {/* Horario y Estado */}
                      <div className="flex items-center gap-4">
                        <div className="text-center w-24 flex-shrink-0">
                          <span className="text-sm font-black text-slate-900 block">
                            {formatTime(apt.start_time)}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono block">
                            {formatTime(apt.end_time)}
                          </span>
                        </div>

                        <div className={`w-1.5 h-12 rounded-full flex-shrink-0 ${config.dot}`} />

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{patientName}</h4>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${config.badge}`}>
                              {config.label}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 font-semibold mt-0.5">
                            {apt.reason || 'Tratamiento Odontológico General'}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                            {apt.patient?.phone && (
                              <span className="flex items-center gap-1">
                                <span>📞</span> {apt.patient.phone}
                              </span>
                            )}
                            {apt.doctor && (
                              <span className="flex items-center gap-1">
                                <span>👨‍⚕️</span> Dr. {apt.doctor.full_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Acciones Rápidas */}
                      <div className="flex items-center gap-2 flex-wrap md:justify-end">
                        {/* Recordatorio WhatsApp */}
                        {apt.patient?.phone && apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleSendReminder(apt)}
                            disabled={isSendingReminder}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition flex items-center gap-1.5"
                            title="Enviar recordatorio automático por WhatsApp"
                          >
                            <span>📲</span> WhatsApp
                          </button>
                        )}

                        {/* Añadir a Google Calendar */}
                        <a
                          href={createGoogleCalendarUrl(apt)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition flex items-center gap-1"
                          title="Añadir a Google Calendar"
                        >
                          <span>📅</span> G-Cal
                        </a>

                        {/* Completar y facturar */}
                        {(apt.status === 'CONFIRMED' || apt.status === 'PENDING') && (
                          <button
                            onClick={() => setAppointmentToComplete(apt)}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center gap-1"
                          >
                            <span>✓</span> Completar & Cobrar
                          </button>
                        )}

                        {/* Transiciones de Estado */}
                        {actions.map((act) => (
                          <button
                            key={act.status}
                            onClick={() => updateApt({ id: apt.id, data: { status: act.status } })}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${act.color}`}
                          >
                            {act.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ─── SECCIÓN 4: COMPONENTE DE AYUDA Y ASISTENCIA (TIP OPERATIVO) ─── */}
      <section aria-label="Asistencia operativa" className="bg-white border border-amber-200/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center text-xl flex-shrink-0">
            <span role="img" aria-label="Tip operativo">💡</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Tip Operativo</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                Productividad Odontológica
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mt-1">
              Arrastra cualquier cita entre los días del calendario para reprogramarla al instante. El sistema validará automáticamente la disponibilidad horaria del odontólogo para evitar colisiones.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition flex-shrink-0"
        >
          + Agendar cita rápida
        </button>
      </section>

      {/* ─── HOVER CARD FLOTANTE CON DETALLES DINÁMICOS ─── */}
      {hoveredApt && (
        <div
          style={{ top: hoveredApt.y, left: hoveredApt.x }}
          className="fixed z-50 w-76 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 pointer-events-none transition-all animate-fadeIn text-slate-800"
        >
          <div className="flex items-start justify-between border-b border-slate-100 pb-2.5 mb-2.5">
            <div>
              <p className="font-extrabold text-sm text-slate-900">
                {hoveredApt.apt.patient
                  ? `${hoveredApt.apt.patient.first_name} ${hoveredApt.apt.patient.last_name}`
                  : 'Paciente'}
              </p>
              <p className="text-xs text-blue-600 font-semibold mt-0.5">
                {hoveredApt.apt.reason || 'Tratamiento Odontológico'}
              </p>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                (STATUS_CONFIG[hoveredApt.apt.status] || STATUS_CONFIG.PENDING).badge
              }`}
            >
              {(STATUS_CONFIG[hoveredApt.apt.status] || STATUS_CONFIG.PENDING).label}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600">
            {hoveredApt.apt.doctor && (
              <p className="flex items-center gap-2">
                <span>👨‍⚕️</span> Dr. {hoveredApt.apt.doctor.full_name}
              </p>
            )}
            {hoveredApt.apt.patient?.phone && (
              <p className="flex items-center gap-2">
                <span>📞</span> {hoveredApt.apt.patient.phone}
              </p>
            )}
            <p className="flex items-center gap-2">
              <span>⏰</span> {formatTime(hoveredApt.apt.start_time)} - {formatTime(hoveredApt.apt.end_time)}
            </p>
          </div>
        </div>
      )}

      {/* ─── BOTÓN FLOTANTE (FAB) SIEMPRE VISIBLE "+ NUEVA CITA" ─── */}
      <button
        onClick={() => setShowCreateModal(true)}
        aria-label="Agendar nueva cita"
        title="Crear nueva cita odontológica"
        className="fixed bottom-7 right-7 z-40 px-5 py-3.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold text-sm rounded-full shadow-2xl shadow-red-900/40 flex items-center gap-2.5 transform hover:scale-105 active:scale-95 transition-all"
      >
        <span className="text-lg leading-none" aria-hidden="true">✚</span>
        <span>Nueva Cita</span>
      </button>

      {/* ─── MODAL CREAR NUEVA CITA ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="text-red-600" aria-hidden="true">✚</span> Agendar Nueva Cita
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                aria-label="Cerrar modal"
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>
            <AppointmentForm
              selectedDate={selectedDate}
              onSuccess={() => {
                setShowCreateModal(false);
                showToast('✓ Cita odontológica creada exitosamente');
              }}
              onCancel={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      )}

      {/* ─── MODAL COMPLETAR CITA & GENERAR COBRO ─── */}
      {appointmentToComplete && (
        <CompleteModal
          appointment={appointmentToComplete}
          onClose={() => setAppointmentToComplete(null)}
        />
      )}
    </div>
  );
};
