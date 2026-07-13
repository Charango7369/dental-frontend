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

// ─── Tabs config ──────────────────────────────────────────────────────────────

type TabKey = 'info' | 'history' | 'odontogram' | 'financial';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'info',       label: 'Información' },
  { key: 'history',    label: 'Historial de citas' },
  { key: 'odontogram', label: 'Odontograma' },
  { key: 'financial',  label: 'Historial financiero' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const statusConfig: Record<AppointmentStatus, { label: string; badge: string }> = {
  PENDING:   { label: 'Pendiente',  badge: 'bg-amber-100 text-amber-700' },
  CONFIRMED: { label: 'Confirmado', badge: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Completado', badge: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: 'Cancelado',  badge: 'bg-red-100 text-red-700' },
  NO_SHOW:   { label: 'No asistió', badge: 'bg-slate-100 text-slate-600' },
};

// ─── Tab: Historial de citas ───────────────────────────────────────────────────

const HistoryTab = ({ patientId }: { patientId: string }) => {
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
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm text-center">
        No se pudo cargar el historial de citas.
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center text-slate-400">
        <svg className="w-12 h-12 mx-auto mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm font-medium">Este paciente aún no tiene citas registradas</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="divide-y divide-slate-100">
        {appointments.map((apt: Appointment) => {
          const cfg = statusConfig[apt.status];
          return (
            <div key={apt.id} className="p-4 md:p-5 flex items-center gap-4">
              <div className="w-16 flex-shrink-0 text-center bg-slate-50 rounded-xl py-2">
                <p className="text-xs font-bold text-slate-700">{formatDate(apt.start_time).split(' ')[0]}</p>
                <p className="text-xs text-slate-400 uppercase">{formatDate(apt.start_time).split(' ')[1]}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {apt.reason || 'Consulta general'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(apt.start_time)}</p>
              </div>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Tab: Odontograma ───────────────────────────────────────────────────────────

const OdontogramTab = ({ patientId }: { patientId: string }) => {
  const { data: history, isLoading } = usePatientOdontograms(patientId);
  const { mutateAsync: createOdontogram, isPending: isSaving } = useCreateOdontogram();
  const { mutateAsync: updateNotes, isPending: isSavingNotes } = useUpdateOdontogramNotes(patientId);

  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const [editMode, setEditMode] = useState(false);
  const [draftTeeth, setDraftTeeth] = useState<Record<string, ToothState>>({});
  const [editingTooth, setEditingTooth] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  // El registro más reciente es el estado "actual"
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

  // ── Edición inline de notas de un registro ya guardado ──────────────────
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

  // Resumen de hallazgos activos (excluye SANO)
  const findings = Object.entries(displayTeeth).filter(([, s]) => s.condition !== 'SANO');

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header de acciones */}
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-800">
            {editMode ? 'Nueva evolución' : 'Estado actual'}
          </h3>
          {!editMode && latest && (
            <>
              <p className="text-xs text-slate-400 mt-0.5">
                Última actualización: {formatDateTime(latest.created_at)}
              </p>
              {editingNotesId === latest.id ? (
                <div className="flex items-center gap-2 mt-1.5 max-w-md">
                  <input
                    type="text"
                    autoFocus
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="Escribe las notas de esta evolución..."
                    className="flex-1 px-2.5 py-1 border border-blue-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEditingNotes(latest.id);
                      if (e.key === 'Escape') cancelEditingNotes();
                    }}
                  />
                  <button
                    onClick={() => saveEditingNotes(latest.id)}
                    disabled={isSavingNotes}
                    className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={cancelEditingNotes}
                    disabled={isSavingNotes}
                    className="p-1 rounded text-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-1 group">
                  <p className={`text-xs ${latest.description ? 'text-slate-500' : 'text-slate-400 italic'}`}>
                    {latest.description || 'Sin notas'}
                  </p>
                  <button
                    onClick={() => startEditingNotes(latest.id, latest.description)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    title="Editar notas"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
          {!editMode && !latest && (
            <p className="text-xs text-slate-400 mt-0.5">Sin registros aún</p>
          )}
        </div>

        {!editMode ? (
          <button
            onClick={startEdit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            + Nueva evolución
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={cancelEdit}
              disabled={isSaving}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 font-medium rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar evolución'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Descripción / notas (solo en modo edición) — ahora en tarjeta propia con etiqueta */}
      {editMode && (
        <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-4">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Notas de esta evolución
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. Se realizó limpieza profunda en pieza 16, paciente reporta sensibilidad..."
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm resize-none"
          />
          <p className="text-xs text-slate-400 mt-1.5">
            Opcional, pero recomendado para el seguimiento clínico del paciente.
          </p>
        </div>
      )}

      {/* Odontograma visual */}
      <ToothChart
        teethData={displayTeeth}
        editable={editMode}
        onToothClick={handleToothClick}
      />

      {/* Resumen de hallazgos */}
      {findings.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
            Hallazgos registrados
          </p>
          <div className="flex flex-wrap gap-2">
            {findings.map(([tooth, state]) => {
              const cfg = getConditionConfig(state.condition);
              return (
                <span
                  key={tooth}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                  Pieza {tooth} · {cfg.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Historial de versiones anteriores */}
      {!editMode && history && history.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Historial de evoluciones ({history.length})
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {history.slice(1).map((record) => {
              const isEditingThis = editingNotesId === record.id;
              return (
                <div key={record.id} className="px-4 py-3">
                  {isEditingThis ? (
                    // ── Modo edición ──────────────────────────────────────
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        placeholder="Escribe las notas de esta evolución..."
                        className="flex-1 px-3 py-1.5 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditingNotes(record.id);
                          if (e.key === 'Escape') cancelEditingNotes();
                        }}
                      />
                      <button
                        onClick={() => saveEditingNotes(record.id)}
                        disabled={isSavingNotes}
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                        title="Guardar"
                      >
                        {isSavingNotes ? (
                          <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={cancelEditingNotes}
                        disabled={isSavingNotes}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                        title="Cancelar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    // ── Modo lectura ──────────────────────────────────────
                    <div className="flex items-center justify-between gap-3 group">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm truncate ${record.description ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                            {record.description || 'Sin notas'}
                          </p>
                          <button
                            onClick={() => startEditingNotes(record.id, record.description)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex-shrink-0"
                            title="Editar notas"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(record.created_at)}</p>
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {Object.keys(record.teeth_data).length} pieza{Object.keys(record.teeth_data).length !== 1 ? 's' : ''} registrada{Object.keys(record.teeth_data).length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Editor de diente individual */}
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

// ─── Tab: Historial financiero ─────────────────────────────────────────────────

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const accountStatusConfig: Record<AccountStatus, { label: string; badge: string; dot: string }> = {
  PENDING: { label: 'Pendiente',     badge: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  PARTIAL: { label: 'Abono parcial', badge: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-500' },
  PAID:    { label: 'Pagado',        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
};

const FinancialTab = ({ patientId }: { patientId: string }) => {
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
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm text-center">
        No se pudo cargar el historial financiero.
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center text-slate-400">
        <svg className="w-12 h-12 mx-auto mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm font-medium">Este paciente aún no tiene cuentas registradas</p>
      </div>
    );
  }

  // ── Totales agregados ────────────────────────────────────────────────────
  const totalBilled = accounts.reduce((sum, a) => sum + a.total_amount, 0);
  const totalPaid = accounts.reduce((sum, a) => sum + (a.total_amount - a.balance_due), 0);
  const totalDue = accounts.reduce((sum, a) => sum + a.balance_due, 0);

  // Todos los pagos de todas las cuentas, aplanados y ordenados por fecha
  const allPayments = accounts
    .flatMap((a) => a.payments.map((p) => ({ ...p, accountDescription: a.description })))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-5">
      {/* Resumen financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total facturado</p>
          <p className="text-xl font-bold text-slate-900 mt-1">Bs. {formatCurrency(totalBilled)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total pagado</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">Bs. {formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Saldo pendiente</p>
          <p className="text-xl font-bold text-red-600 mt-1">Bs. {formatCurrency(totalDue)}</p>
        </div>
      </div>

      {/* Cuentas del paciente */}
      <div>
        <h3 className="font-bold text-slate-800 mb-3">Cuentas ({accounts.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accounts.map((account: Account) => {
            const cfg = accountStatusConfig[account.status];
            const progress = account.total_amount > 0
              ? ((account.total_amount - account.balance_due) / account.total_amount) * 100
              : 0;
            return (
              <div
                key={account.id}
                onClick={() => navigate(`/billing/${account.id}`)}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:border-slate-200 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm text-slate-600 truncate flex-1">{account.description}</p>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border flex-shrink-0 ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full ${cfg.dot}`} style={{ width: `${progress}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{formatDate(account.created_at)}</span>
                  <span className="font-bold text-slate-800">
                    Bs. {formatCurrency(account.balance_due)} / {formatCurrency(account.total_amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historial de pagos consolidado */}
      {allPayments.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">Historial de pagos</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {allPayments.map((payment) => (
              <div key={payment.id} className="px-4 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">Bs. {formatCurrency(payment.amount_paid)}</p>
                  <p className="text-xs text-slate-400 truncate">{payment.accountDescription}</p>
                </div>
                <p className="text-xs text-slate-400 flex-shrink-0">{formatDateTime(payment.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


// ─── Componente principal ────────────────────────────────────────────────────

export const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>('info');
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
      console.error('Error crítico al archivar paciente:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
          Paciente no encontrado en esta clínica.
        </div>
        <button
          onClick={() => navigate('/patients', { replace: true })}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Volver a la lista
        </button>
      </div>
    );
  }

  const initials = `${patient.first_name.charAt(0)}${patient.last_name.charAt(0)}`.toUpperCase();

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/patients')}
          className="text-sm text-blue-600 hover:text-blue-700 mb-4 font-medium"
        >
          ← Volver a pacientes
        </button>
      </div>

      {/* Card de identidad del paciente (siempre visible) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6 relative mb-5">
        <div className="absolute top-6 right-6">
          <span className={`inline-flex h-3 w-3 rounded-full ${patient.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
        </div>

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border-2 border-blue-100">
            <span className="font-bold text-xl">{initials}</span>
          </div>
          <div className="flex-1 pt-1">
            <h2 className="text-xl font-bold text-slate-900">
              {patient.first_name} {patient.last_name}
            </h2>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                  patient.is_active
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {patient.is_active ? 'Activo' : 'Inactivo'}
              </span>
              {patient.phone && <span className="text-xs text-slate-400">{patient.phone}</span>}
              {patient.email && <span className="text-xs text-slate-400">{patient.email}</span>}
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setShowEditForm(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => setShowArchiveConfirm(true)}
              className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors"
            >
              Dar de baja
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit max-w-full overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de la pestaña activa */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Correo electrónico</p>
              <p className="text-slate-800 font-medium">{patient.email || 'No registrado'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Teléfono</p>
              <p className="text-slate-800 font-medium">{patient.phone || 'No registrado'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha de registro</p>
              <p className="text-slate-800">
                {new Date(patient.created_at).toLocaleDateString('es-BO', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Última actualización</p>
              <p className="text-slate-800">
                {new Date(patient.updated_at).toLocaleDateString('es-BO', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && <HistoryTab patientId={id!} />}
      {activeTab === 'odontogram' && <OdontogramTab patientId={id!} />}
      {activeTab === 'financial' && <FinancialTab patientId={id!} />}

      {/* Modal de Edición */}
      {showEditForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Editar Paciente</h2>
            <PatientForm
              initialData={patient}
              onSuccess={() => setShowEditForm(false)}
              onCancel={() => setShowEditForm(false)}
            />
          </div>
        </div>
      )}

      {/* Modal de confirmación de baja */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">¿Dar de baja al paciente?</h3>
            </div>

            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              Estás a punto de archivar el registro de{' '}
              <span className="font-bold text-slate-800">{patient.first_name} {patient.last_name}</span>.
              El paciente ya no aparecerá en las búsquedas principales, pero su historial clínico se mantendrá intacto.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowArchiveConfirm(false)}
                disabled={isArchiving}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleArchive}
                disabled={isArchiving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isArchiving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando...
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