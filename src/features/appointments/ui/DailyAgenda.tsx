// src/features/appointments/ui/DailyAgenda.tsx
import { useState, type FormEvent } from 'react';
import {
  useDailyAppointments,
  useMonthlyAppointments,
  useUpdateAppointment,
  useCompleteAppointment,
} from '../hooks/useAppointments';
import { AppointmentForm } from './AppointmentForm';
import type { Appointment, AppointmentStatus } from '../services/appointments.service';

// ─── Configuración visual de estados ────────────────────────────────────────

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; badge: string; dot: string }
> = {
  PENDING:   { label: 'Pendiente',  badge: 'bg-amber-100 text-amber-800 border-amber-200',   dot: 'bg-amber-400' },
  CONFIRMED: { label: 'Confirmado', badge: 'bg-blue-100 text-blue-800 border-blue-200',       dot: 'bg-blue-500' },
  COMPLETED: { label: 'Completado', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  CANCELLED: { label: 'Cancelado',  badge: 'bg-red-100 text-red-800 border-red-200',          dot: 'bg-red-400' },
  NO_SHOW:   { label: 'No asistió', badge: 'bg-slate-100 text-slate-600 border-slate-200',    dot: 'bg-slate-400' },
};

// Transiciones de estado permitidas desde cada estado
const NEXT_ACTIONS: Record<AppointmentStatus, { status: AppointmentStatus; label: string; color: string }[]> = {
  PENDING:   [
    { status: 'CONFIRMED', label: 'Confirmar',  color: 'text-blue-600 hover:bg-blue-50' },
    { status: 'CANCELLED', label: 'Cancelar',   color: 'text-red-500 hover:bg-red-50' },
    { status: 'NO_SHOW',   label: 'No asistió', color: 'text-slate-500 hover:bg-slate-50' },
  ],
  CONFIRMED: [
    { status: 'CANCELLED', label: 'Cancelar',   color: 'text-red-500 hover:bg-red-50' },
    { status: 'NO_SHOW',   label: 'No asistió', color: 'text-slate-500 hover:bg-slate-50' },
  ],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW:   [],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

const formatHeaderDate = (date: Date) =>
  date.toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

// Devuelve las celdas del mes (nulls para celdas vacías antes del día 1)
const buildCalendarDays = (year: number, month: number): (Date | null)[] => {
  const firstDay = new Date(year, month, 1);
  // lunes=0 … domingo=6
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
};

// ─── Mini Calendario ─────────────────────────────────────────────────────────

interface MiniCalendarProps {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}

const MiniCalendar = ({ selectedDate, onSelectDate }: MiniCalendarProps) => {
  const [viewMonth, setViewMonth] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const year  = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const cells = buildCalendarDays(year, month);
  const today = new Date();

  // Consulta citas de todo el mes visible
  const startOfMonth = new Date(year, month, 1);
  startOfMonth.setHours(0, 0, 0, 0);
  const endOfMonth = new Date(year, month + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  const { data: monthlyApts } = useMonthlyAppointments(startOfMonth, endOfMonth);

  // Set de días con citas activas (excluye canceladas y no-show)
  const busyDays = new Set<string>();
  (monthlyApts ?? []).forEach((apt) => {
    if (apt.status !== 'CANCELLED' && apt.status !== 'NO_SHOW') {
      const d = new Date(apt.start_time);
      busyDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
  });

  const isBusy = (d: Date) =>
    busyDays.has(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);

  const prevMonth = () =>
    setViewMonth(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setViewMonth(new Date(year, month + 1, 1));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      {/* Header mes */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <p className="text-sm font-bold text-slate-800">
          {MONTHS_ES[month]} {year}
        </p>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Nombres de días */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_ES.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Celdas */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;

          const isSelected  = isSameDay(date, selectedDate);
          const isTodayCell = isSameDay(date, today);
          const busy        = isBusy(date);

          return (
            <button
              key={date.toISOString()}
              onClick={() => onSelectDate(date)}
              className={`
                relative flex flex-col items-center justify-center h-9 w-full rounded-lg text-xs font-medium transition-all
                ${isSelected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isTodayCell
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-700 hover:bg-slate-100'
                }
              `}
            >
              {date.getDate()}
              {/* Punto indicador de citas */}
              {busy && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
              )}
              {busy && isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/70" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Completar cita</h2>
            <p className="text-sm text-slate-500 mt-0.5">{patientName} · {formatTime(appointment.start_time)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
            Error al completar la cita. Intenta nuevamente.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descripción del tratamiento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Limpieza dental, extracción molar..."
              value={form.treatment_description}
              onChange={(e) => setForm({ ...form, treatment_description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Costo final (Bs.) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">Bs.</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.final_cost}
                onChange={(e) => setForm({ ...form, final_cost: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Se generará una cuenta por cobrar automáticamente.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !form.treatment_description || !form.final_cost}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Completar y facturar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Fila de cita ────────────────────────────────────────────────────────────

interface AppointmentRowProps {
  appointment: Appointment;
  onComplete: (apt: Appointment) => void;
}

const AppointmentRow = ({ appointment, onComplete }: AppointmentRowProps) => {
  const { mutate: update, isPending } = useUpdateAppointment();
  const [menuOpen, setMenuOpen] = useState(false);

  const config = STATUS_CONFIG[appointment.status];
  const actions = NEXT_ACTIONS[appointment.status];
  const patientName = appointment.patient
    ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
    : 'Paciente desconocido';

  const handleAction = (status: AppointmentStatus) => {
    setMenuOpen(false);
    if (status === 'COMPLETED') {
      onComplete(appointment);
      return;
    }
    update({ id: appointment.id, data: { status } });
  };

  const isDone = appointment.status === 'COMPLETED' ||
    appointment.status === 'CANCELLED' ||
    appointment.status === 'NO_SHOW';

  return (
    <div className={`p-4 md:p-5 flex flex-col sm:flex-row gap-4 sm:items-center transition-colors ${isDone ? 'opacity-60' : 'hover:bg-slate-50'}`}>

      {/* Hora */}
      <div className="flex-shrink-0 w-28 text-center hidden sm:block">
        <p className="text-base font-bold text-slate-900 whitespace-nowrap">{formatTime(appointment.start_time)}</p>
        <p className="text-xs text-slate-400 whitespace-nowrap">{formatTime(appointment.end_time)}</p>
      </div>

      {/* Línea de color por estado */}
      <div className={`w-1 self-stretch rounded-full flex-shrink-0 hidden sm:block ${config.dot}`} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 sm:hidden mb-1">
          <span className="text-sm font-bold text-slate-700">{formatTime(appointment.start_time)}</span>
          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-400">{formatTime(appointment.end_time)}</span>
        </div>
        <p className="font-semibold text-slate-800 truncate">{patientName}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
          {appointment.patient?.phone && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {appointment.patient.phone}
            </span>
          )}
          {appointment.reason && (
            <span className="text-xs text-slate-400 truncate max-w-[180px]">
              {appointment.reason}
            </span>
          )}
        </div>
      </div>

      {/* Estado + acciones */}
      <div className="flex items-center gap-2 sm:justify-end">
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${config.badge}`}>
          {config.label}
        </span>

        {/* Menú de acciones */}
        {!isDone && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              disabled={isPending}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40"
            >
              {isPending ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              )}
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20">
                  {/* Completar siempre disponible si está CONFIRMED o PENDING */}
                  {(appointment.status === 'CONFIRMED' || appointment.status === 'PENDING') && (
                    <button
                      onClick={() => handleAction('COMPLETED')}
                      className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 font-medium flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Completar cita
                    </button>
                  )}
                  {actions.map((action) => (
                    <button
                      key={action.status}
                      onClick={() => handleAction(action.status)}
                      className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${action.color}`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Componente principal ────────────────────────────────────────────────────

export const DailyAgenda = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [appointmentToComplete, setAppointmentToComplete] = useState<Appointment | null>(null);

  const { data: appointments, isLoading, error } = useDailyAppointments(selectedDate);

  const today = isToday(selectedDate);

  // Contadores por estado para el resumen
  const counts = (appointments ?? []).reduce(
    (acc, apt) => {
      acc[apt.status] = (acc[apt.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
        <p className="text-sm">Cargando agenda...</p>
      </div>
    );

  if (error)
    return (
      <div className="m-6 bg-red-50 border border-red-200 text-red-700 p-5 rounded-xl text-center">
        <p className="font-semibold">Error al cargar la agenda</p>
        <button onClick={() => window.location.reload()} className="mt-3 text-sm underline">
          Reintentar
        </button>
      </div>
    );

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-5 items-start">

        {/* ── Columna izquierda: calendario ── */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <MiniCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        {/* ── Columna derecha: agenda del día ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Header día seleccionado */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDate((d) => addDays(d, -1))}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <p className="text-base font-bold text-slate-900 capitalize">
                    {today ? '📅 Hoy' : formatHeaderDate(selectedDate).split(',')[0]}
                  </p>
                  <p className="text-xs text-slate-400 capitalize">
                    {selectedDate.toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDate((d) => addDays(d, 1))}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {!today && (
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    Hoy
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-2 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Nueva cita</span>
              </button>
            </div>

            {/* Resumen de estados */}
            {appointments && appointments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                {Object.entries(counts).map(([status, count]) => {
                  const cfg = STATUS_CONFIG[status as AppointmentStatus];
                  return (
                    <span key={status} className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${cfg.badge}`}>
                      {count} {cfg.label}{count !== 1 ? 's' : ''}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lista de citas */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            {!appointments || appointments.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <svg className="w-14 h-14 mx-auto mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="font-medium text-slate-500">No hay citas para este día</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 text-sm text-blue-600 hover:underline font-medium"
                >
                  + Agendar primera cita del día
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 [&>*:first-child]:rounded-t-2xl [&>*:last-child]:rounded-b-2xl">
                {appointments.map((apt) => (
                  <AppointmentRow
                    key={apt.id}
                    appointment={apt}
                    onComplete={setAppointmentToComplete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal nueva cita ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Agendar nueva cita</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <AppointmentForm
              selectedDate={selectedDate}
              onSuccess={() => setShowCreateModal(false)}
              onCancel={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      )}

      {/* ── Modal completar cita ── */}
      {appointmentToComplete && (
        <CompleteModal
          appointment={appointmentToComplete}
          onClose={() => setAppointmentToComplete(null)}
        />
      )}
    </div>
  );
};