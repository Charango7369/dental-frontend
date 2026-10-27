// src/features/patients/ui/PatientDetail.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { patientsService } from '../services/patients.service';
import { patientKeys, useArchivePatient } from '../hooks/usePatients';
import { PatientForm } from './PatientForm';
import { usePatientAppointments } from '../../appointments/hooks/useAppointments';
import {
  usePatientOdontograms,
  useCreateOdontogram,
  useUpdateOdontogramNotes,
} from '../../odontogram/hooks/useOdontogram';
import {
  ToothChart,
  ToothEditor,
  getConditionConfig,
  type ToothState,
} from '../../odontogram/ui/ToothChart';
import type { Appointment, AppointmentStatus } from '../../appointments/services/appointments.service';
import { usePatientAccounts } from '../../billing/hooks/useBilling';
import type { Account, AccountStatus } from '../../billing/services/billing.service';

// ─── Helpers de Formato y Limpieza de Datos ──────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatCurrency = (n: number | undefined | null) => {
  const val = typeof n === 'number' && !isNaN(n) ? n : 0;
  return new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
};

// Elimina duplicaciones y prefijos largos auto-generados en descripciones clínicas
const cleanTreatmentDescription = (desc: string | null | undefined): string => {
  if (!desc || !desc.trim()) return 'Tratamiento odontológico';
  const match = desc.match(/:\s*(.+)$/);
  if (match && match[1]) {
    const trimmed = match[1].trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
  return desc.replace(/^Tratamiento completado\s*-\s*/i, '').trim();
};

// ─── Configuraciones de Estados y Badges ─────────────────────────────────────

const appointmentStatusConfig: Record<AppointmentStatus, { label: string; badge: string; dot: string }> = {
  PENDING:   { label: 'Pendiente',   badge: 'bg-amber-50 text-amber-700 border-amber-200',     dot: 'bg-amber-400' },
  CONFIRMED: { label: 'Confirmado',  badge: 'bg-blue-50 text-blue-700 border-blue-200',         dot: 'bg-blue-500' },
  COMPLETED: { label: 'Completado',  badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  CANCELLED: { label: 'Cancelado',   badge: 'bg-red-50 text-red-700 border-red-200',           dot: 'bg-red-500' },
  NO_SHOW:   { label: 'No asistió',  badge: 'bg-slate-100 text-slate-600 border-slate-200',     dot: 'bg-slate-400' },
};

const accountStatusConfig: Record<AccountStatus, { label: string; badge: string; dot: string }> = {
  PENDING: { label: 'Pendiente',     badge: 'bg-amber-50 text-amber-700 border-amber-200',     dot: 'bg-amber-400' },
  PARTIAL: { label: 'Abono parcial', badge: 'bg-blue-50 text-blue-700 border-blue-200',         dot: 'bg-blue-500' },
  PAID:    { label: 'Pagado',        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
};

// ─── Iconografía Ligera (SVG) ────────────────────────────────────────────────

const PhoneIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const ArchiveIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ToothIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C9.5 2 7 3.5 6 5.5 5 7 5 8.5 5 10c0 2 .5 3.5 1 5 .5 1.5 1 3 1 4.5 0 .8.3 1.5 1 1.5s1-.7 1-1.5c0-1 .3-2 1-2s1 1 1 2c0 .8.3 1.5 1 1.5s1-.7 1-1.5c0-1.5.5-3 1-4.5.5-1.5 1-3 1-5 0-1.5 0-3-1-4.5C16.5 3.5 14.5 2 12 2z" />
  </svg>
);

// ─── Sub-Componente: Historial de Citas ───────────────────────────────────────

const AppointmentsHistoryTab = ({ patientId }: { patientId: string }) => {
  const { data: appointments, isLoading, isError } = usePatientAppointments(patientId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs text-center font-medium">
        No se pudo cargar el historial de citas.
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 space-y-2">
        <div className="w-10 h-10 mx-auto rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
          <CalendarIcon />
        </div>
        <p className="text-xs font-semibold text-slate-500">Sin citas registradas</p>
        <p className="text-[11px] text-slate-400">Este paciente aún no tiene consultas en su historial.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {appointments.map((apt: Appointment) => {
        const cfg = appointmentStatusConfig[apt.status] || appointmentStatusConfig.PENDING;
        return (
          <div key={apt.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center flex-shrink-0 text-slate-700 font-bold text-xs leading-none">
                <span>{new Date(apt.start_time).getDate()}</span>
                <span className="text-[9px] uppercase font-semibold text-slate-400 mt-0.5">
                  {new Date(apt.start_time).toLocaleDateString('es-BO', { month: 'short' })}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {apt.reason || 'Consulta Odontológica'}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span>{formatDateTime(apt.start_time)}</span>
                  {apt.doctor && (
                    <>
                      <span>·</span>
                      <span className="truncate">Dr. {apt.doctor.full_name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full border flex-shrink-0 ${cfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Sub-Componente: Odontograma Clínico ─────────────────────────────────────

const OdontogramClinicalTab = ({ patientId }: { patientId: string }) => {
  const { data: history, isLoading } = usePatientOdontograms(patientId);
  const { mutateAsync: createOdontogram, isPending: isSaving } = useCreateOdontogram();
  const { mutateAsync: updateNotes, isPending: isSavingNotes } = useUpdateOdontogramNotes(patientId);

  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const [editMode, setEditMode] = useState(false);
  const [draftTeeth, setDraftTeeth] = useState<Record<string, ToothState>>({});
  const [editingTooth, setEditingTooth] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const latest = history?.[0];
  const displayTeeth = editMode ? draftTeeth : (latest?.teeth_data ?? {});

  const startEdit = () => {
    setDraftTeeth(latest?.teeth_data ?? {});
    setDescription('');
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditingTooth(null);
  };

  const handleToothClick = (toothNumber: string) => {
    setEditingTooth(toothNumber);
  };

  const handleToothSave = (state: ToothState) => {
    if (!editingTooth) return;
    setDraftTeeth((prev) => ({ ...prev, [editingTooth]: state }));
  };

  const handleSubmit = async () => {
    await createOdontogram({
      patient_id: patientId,
      description: description.trim() || undefined,
      teeth_data: draftTeeth,
    });
    setEditMode(false);
  };

  const startEditingNotes = (recordId: string, currentNotes: string | null) => {
    setEditingNotesId(recordId);
    setNotesDraft(currentNotes ?? '');
  };

  const cancelEditingNotes = () => {
    setEditingNotesId(null);
    setNotesDraft('');
  };

  const saveEditingNotes = async (recordId: string) => {
    await updateNotes({ id: recordId, data: { description: notesDraft.trim() } });
    setEditingNotesId(null);
    setNotesDraft('');
  };

  const findings = Object.entries(displayTeeth).filter(([, s]) => s.condition !== 'SANO');

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de estado y acciones del odontograma */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {editMode ? 'Nueva Evolución Odontológica' : 'Esquema Dental Actual'}
          </h4>
          {!editMode && latest && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              Última actualización: {formatDateTime(latest.created_at)}
            </p>
          )}
        </div>

        {!editMode ? (
          <button
            onClick={startEdit}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Nueva evolución</span>
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={cancelEdit}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 font-semibold rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )}
      </div>

      {/* Editor de notas en modo edición */}
      {editMode && (
        <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3">
          <label className="block text-xs font-bold text-blue-900 mb-1">
            Notas clínicas de esta evolución
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. Resina fotocurada en pieza 16, limpieza profunda y control de sensibilidad..."
            rows={2}
            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
        </div>
      )}

      {/* Odontograma interactivo */}
      <div className="overflow-x-auto bg-slate-50/60 rounded-xl p-2 border border-slate-100">
        <ToothChart
          teethData={displayTeeth}
          editable={editMode}
          onToothClick={handleToothClick}
        />
      </div>

      {/* Resumen de hallazgos */}
      {findings.length > 0 && (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Hallazgos Registrados ({findings.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {findings.map(([tooth, state]) => {
              const cfg = getConditionConfig(state.condition);
              return (
                <span
                  key={tooth}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                  style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                  Pieza {tooth} · {cfg.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Historial de evoluciones previas */}
      {!editMode && history && history.length > 1 && (
        <div className="bg-slate-50/70 border border-slate-100 rounded-xl overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Evoluciones Anteriores ({history.length - 1})
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {history.slice(1).map((record) => {
              const isEditingThis = editingNotesId === record.id;
              return (
                <div key={record.id} className="p-3 text-xs">
                  {isEditingThis ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        className="flex-1 px-2.5 py-1 border border-blue-300 rounded-lg text-xs outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditingNotes(record.id);
                          if (e.key === 'Escape') cancelEditingNotes();
                        }}
                      />
                      <button
                        onClick={() => saveEditingNotes(record.id)}
                        disabled={isSavingNotes}
                        className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelEditingNotes}
                        className="p-1 rounded text-slate-400 hover:bg-slate-100"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-700 font-medium truncate">{record.description || 'Sin notas'}</p>
                        <p className="text-[10px] text-slate-400">{formatDateTime(record.created_at)}</p>
                      </div>
                      <button
                        onClick={() => startEditingNotes(record.id, record.description)}
                        className="text-[11px] text-blue-600 hover:underline font-semibold flex-shrink-0"
                      >
                        Editar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal para editar diente individual */}
      {editingTooth && (
        <ToothEditor
          toothNumber={editingTooth}
          currentState={draftTeeth[editingTooth]}
          onSave={handleToothSave}
          onClose={() => setEditingTooth(null)}
        />
      )}
    </div>
  );
};

// ─── Sub-Componente: Cuentas y Estado Financiero ─────────────────────────────

const FinancialPanel = ({ patientId }: { patientId: string }) => {
  const navigate = useNavigate();
  const { data: accounts, isLoading, isError } = usePatientAccounts(patientId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs text-center font-medium">
        No se pudo cargar la información financiera.
      </div>
    );
  }

  const safeAccounts = accounts || [];

  // Totales financieros agregados
  const totalBilled = safeAccounts.reduce((sum, a) => sum + (a.total_amount || 0), 0);
  const totalPaid = safeAccounts.reduce((sum, a) => sum + ((a.total_amount || 0) - (a.balance_due || 0)), 0);
  const totalDue = safeAccounts.reduce((sum, a) => sum + (a.balance_due || 0), 0);

  // Historial de pagos consolidado
  const allPayments = safeAccounts
    .flatMap((a) => (a.payments || []).map((p) => ({ ...p, accountDescription: a.description })))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-4">
      {/* ─── Card 1: Métricas Financieras (KPIs) ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>💵</span> Estado Financiero
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">En Bolivianos (Bs.)</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Total Facturado */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center sm:text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Facturado</p>
            <p className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-1">
              Bs. {formatCurrency(totalBilled)}
            </p>
          </div>

          {/* Total Pagado */}
          <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100 text-center sm:text-left">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider truncate">Total Pagado</p>
            <p className="text-base sm:text-lg font-black text-emerald-600 tracking-tight mt-1">
              Bs. {formatCurrency(totalPaid)}
            </p>
          </div>

          {/* Saldo Pendiente */}
          <div className="bg-red-50/60 rounded-xl p-3 border border-red-100 text-center sm:text-left">
            <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider truncate">Saldo Pendiente</p>
            <p className="text-base sm:text-lg font-black text-red-600 tracking-tight mt-1">
              Bs. {formatCurrency(totalDue)}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Card 2: Cuentas y Tratamientos por Cobrar ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Cuentas por Cobrar ({safeAccounts.length})
          </h3>
          <span className="text-[11px] text-slate-400">Clic para ver detalles</span>
        </div>

        {safeAccounts.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No hay cuentas ni deudas registradas para este paciente.
          </div>
        ) : (
          <div className="space-y-2.5">
            {safeAccounts.map((account: Account) => {
              const cfg = accountStatusConfig[account.status] || accountStatusConfig.PENDING;
              const progress = account.total_amount > 0
                ? Math.min(100, Math.max(0, ((account.total_amount - account.balance_due) / account.total_amount) * 100))
                : 0;

              return (
                <div
                  key={account.id}
                  onClick={() => navigate(`/billing/${account.id}`)}
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-blue-300 hover:shadow-xs bg-slate-50/40 hover:bg-white cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                        {cleanTreatmentDescription(account.description)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatDate(account.created_at)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border flex-shrink-0 ${cfg.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Barra de progreso de pago */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${cfg.dot}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Desglose sin montos repetidos ni confusos */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100/70">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Saldo: <strong className={account.balance_due > 0 ? 'text-red-600' : 'text-slate-700'}>Bs. {formatCurrency(account.balance_due)}</strong>
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Total: <strong className="text-slate-900">Bs. {formatCurrency(account.total_amount)}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Card 3: Historial de Pagos Realizados ─── */}
      {allPayments.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Historial de Pagos ({allPayments.length})
            </h3>
            <span className="text-[11px] text-emerald-600 font-semibold">Comprobantes</span>
          </div>

          <div className="divide-y divide-slate-100">
            {allPayments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-emerald-700 tracking-tight">
                    + Bs. {formatCurrency(payment.amount_paid)}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {cleanTreatmentDescription(payment.accountDescription)}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">
                  {formatDateTime(payment.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Componente Principal: PatientDetail ─────────────────────────────────────

export const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [clinicalTab, setClinicalTab] = useState<'appointments' | 'odontogram'>('appointments');
  const [showEditForm, setShowEditForm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const { mutateAsync: archivePatient, isPending: isArchiving } = useArchivePatient();

  const { data: patient, isLoading, error } = useQuery({
    queryKey: patientKeys.detail(id!),
    queryFn: () => patientsService.getById(id!),
    enabled: !!id,
  });

  const handleArchive = async () => {
    try {
      await archivePatient(id!);
      navigate('/patients', { replace: true });
    } catch (err) {
      console.error('Error al archivar paciente:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-2xl shadow-sm text-sm font-medium">
          Paciente no encontrado o no pertenece a esta clínica.
        </div>
        <button
          onClick={() => navigate('/patients', { replace: true })}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          ← Volver a la lista de pacientes
        </button>
      </div>
    );
  }

  const initials = `${patient.first_name.charAt(0)}${patient.last_name.charAt(0)}`.toUpperCase();

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Botón superior de retroceso */}
      <div>
        <button
          onClick={() => navigate('/patients')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <span>←</span>
          <span>Volver a pacientes</span>
        </button>
      </div>

      {/* ─── TARJETA PRINCIPAL DEL PACIENTE (HERO CARD) ─── */}
      <section aria-label="Tarjeta de identidad del paciente" className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          
          {/* Avatar, Nombre, Estado y Contacto Rápido */}
          <div className="flex items-center gap-4 min-w-0">
            {/* Avatar médico circular con iniciales */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-500/30">
              {initials}
            </div>

            {/* Datos primarios */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight truncate capitalize">
                  {patient.first_name} {patient.last_name}
                </h1>
                
                {/* Badge de estado con punto indicador integrado (sin desfases) */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    patient.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${patient.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  {patient.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Información de contacto con iconografía ligera */}
              <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mt-1.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <PhoneIcon />
                  <span>{patient.phone || 'Sin teléfono'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MailIcon />
                  <span className="truncate">{patient.email || 'Sin correo electrónico'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 hidden sm:flex">
                  <CalendarIcon />
                  <span>Ficha #{patient.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones principales del paciente */}
          <div className="flex items-center gap-2.5 flex-shrink-0 self-start md:self-center">
            <button
              onClick={() => setShowEditForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <EditIcon />
              <span>Editar</span>
            </button>
            <button
              onClick={() => setShowArchiveConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition"
            >
              <ArchiveIcon />
              <span>Dar de baja</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── ESTRUCTURA PRINCIPAL EN 2 COLUMNAS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ─── COLUMNA IZQUIERDA: INFORMACIÓN Y CUIDADO CLÍNICO (7 cols) ─── */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Bloque 1: Card de Información Personal y Fechas */}
          <section aria-label="Datos personales del paciente" className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>📋</span> Información General
              </h2>
              <span className="text-[11px] font-semibold text-slate-400">Datos de Ficha</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MailIcon /> Correo Electrónico
                </p>
                <p className="text-xs font-bold text-slate-800 truncate">
                  {patient.email || 'No registrado'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <PhoneIcon /> Teléfono Móvil
                </p>
                <p className="text-xs font-bold text-slate-800 truncate">
                  {patient.phone || 'No registrado'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <CalendarIcon /> Fecha de Registro
                </p>
                <p className="text-xs font-bold text-slate-800">
                  {formatDate(patient.created_at)}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <ClockIcon /> Última Modificación
                </p>
                <p className="text-xs font-bold text-slate-800">
                  {formatDateTime(patient.updated_at)}
                </p>
              </div>
            </div>
          </section>

          {/* Bloque 2: Card de Atención Clínica (Citas y Odontograma) */}
          <section aria-label="Historial clínico y odontograma" className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4">
            {/* Pestañas Clínicas Internas */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
                <button
                  onClick={() => setClinicalTab('appointments')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    clinicalTab === 'appointments'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Historial de Citas
                </button>
                <button
                  onClick={() => setClinicalTab('odontogram')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    clinicalTab === 'odontogram'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ToothIcon />
                  <span>Odontograma</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {clinicalTab === 'appointments' ? 'Registro de visitas' : 'Carta dental interactiva'}
              </span>
            </div>

            {/* Contenido Clínico */}
            {clinicalTab === 'appointments' ? (
              <AppointmentsHistoryTab patientId={patient.id} />
            ) : (
              <OdontogramClinicalTab patientId={patient.id} />
            )}
          </section>
        </div>

        {/* ─── COLUMNA DERECHA: ESTADO FINANCIERO Y CUENTAS (5 cols) ─── */}
        <div className="lg:col-span-5 space-y-4">
          <FinancialPanel patientId={patient.id} />
        </div>
      </div>

      {/* ─── MODAL EDITAR PACIENTE ─── */}
      {showEditForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 text-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <EditIcon /> Editar Información del Paciente
              </h2>
              <button
                onClick={() => setShowEditForm(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>
            <PatientForm
              initialData={patient}
              onSuccess={() => setShowEditForm(false)}
              onCancel={() => setShowEditForm(false)}
            />
          </div>
        </div>
      )}

      {/* ─── MODAL CONFIRMAR BAJA DE PACIENTE ─── */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 text-slate-900">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center flex-shrink-0">
                <ArchiveIcon />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">¿Dar de baja al paciente?</h3>
                <p className="text-xs text-slate-500">Esta acción archiva la ficha clínica.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
              Estás a punto de archivar el registro de{' '}
              <strong className="text-slate-900">{patient.first_name} {patient.last_name}</strong>.
              El paciente ya no aparecerá en las búsquedas principales, pero su historial clínico y contable permanecerá seguro en el sistema.
            </p>

            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setShowArchiveConfirm(false)}
                disabled={isArchiving}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleArchive}
                disabled={isArchiving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 flex items-center gap-2 shadow-xs"
              >
                {isArchiving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Archivando...</span>
                  </>
                ) : (
                  'Confirmar baja'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
