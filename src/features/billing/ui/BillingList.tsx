// src/features/billing/ui/BillingList.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccounts } from '../hooks/useBilling';
import type { Account, AccountStatus } from '../services/billing.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_CONFIG: Record<AccountStatus, { label: string; badge: string; dot: string }> = {
  PENDING: { label: 'Pendiente', badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  PARTIAL: { label: 'Abono parcial', badge: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  PAID:    { label: 'Pagado', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
};

const FILTERS: { value: AccountStatus | undefined; label: string }[] = [
  { value: undefined,   label: 'Todas' },
  { value: 'PENDING',   label: 'Pendientes' },
  { value: 'PARTIAL',   label: 'Parciales' },
  { value: 'PAID',      label: 'Pagadas' },
];

// ─── Tarjeta de cuenta ─────────────────────────────────────────────────────────

const AccountCard = ({ account, onClick }: { account: Account; onClick: () => void }) => {
  const cfg = STATUS_CONFIG[account.status];
  const patientName = account.patient
    ? `${account.patient.first_name} ${account.patient.last_name}`
    : 'Paciente desconocido';

  const progress = account.total_amount > 0
    ? ((account.total_amount - account.balance_due) / account.total_amount) * 100
    : 0;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-slate-200 cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 truncate">{patientName}</p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{account.description}</p>
        </div>
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border flex-shrink-0 ${cfg.badge}`}>
          {cfg.label}
        </span>
      </div>

      {/* Barra de progreso de pago */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all ${cfg.dot}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">Saldo pendiente</p>
          <p className="text-lg font-bold text-slate-900">Bs. {formatCurrency(account.balance_due)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Total</p>
          <p className="text-sm font-semibold text-slate-600">Bs. {formatCurrency(account.total_amount)}</p>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
        Generada el {formatDate(account.created_at)}
      </p>
    </div>
  );
};

// ─── Componente principal ────────────────────────────────────────────────────

export const BillingList = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<AccountStatus | undefined>(undefined);

  const { data: accounts, isLoading, isError, refetch } = useAccounts(filter);

  // Resumen general
  const totalPending = (accounts ?? [])
    .filter((a) => a.status !== 'PAID')
    .reduce((sum, a) => sum + a.balance_due, 0);

  const totalAccounts = accounts?.length ?? 0;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cobros</h1>
          <p className="text-slate-500 mt-1">
            {totalAccounts} cuenta{totalAccounts !== 1 ? 's' : ''} ·{' '}
            <span className="font-semibold text-slate-700">Bs. {formatCurrency(totalPending)}</span> por cobrar
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              filter === f.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Estado de carga */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm text-center">
          No se pudieron cargar las cuentas.{' '}
          <button onClick={() => refetch()} className="underline font-medium">Reintentar</button>
        </div>
      )}

      {/* Lista vacía */}
      {!isLoading && !isError && accounts && accounts.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm font-medium">No hay cuentas en esta categoría</p>
        </div>
      )}

      {/* Grid de cuentas */}
      {!isLoading && !isError && accounts && accounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onClick={() => navigate(`/billing/${account.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};