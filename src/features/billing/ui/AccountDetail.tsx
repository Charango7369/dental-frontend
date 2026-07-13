// src/features/billing/ui/AccountDetail.tsx
import { useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount, useCreatePayment } from '../hooks/useBilling';
import type { PaymentMethod } from '../services/billing.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  QR: 'QR',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
};

const STATUS_CONFIG = {
  PENDING: { label: 'Pendiente', badge: 'bg-amber-100 text-amber-700' },
  PARTIAL: { label: 'Abono parcial', badge: 'bg-blue-100 text-blue-700' },
  PAID:    { label: 'Pagado', badge: 'bg-emerald-100 text-emerald-700' },
} as const;

// ─── Modal registrar pago ─────────────────────────────────────────────────────

interface PaymentFormProps {
  accountId: string;
  balanceDue: number;
  onClose: () => void;
}

const PaymentForm = ({ accountId, balanceDue, onClose }: PaymentFormProps) => {
  const { mutateAsync: createPayment, isPending, error } = useCreatePayment();
  const [form, setForm] = useState({
    amount_paid: '',
    payment_method: 'CASH' as PaymentMethod,
    reference_number: '',
    notes: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createPayment({
      accountId,
      data: {
        amount_paid: parseFloat(form.amount_paid),
        payment_method: form.payment_method,
        reference_number: form.reference_number.trim() || undefined,
        notes: form.notes.trim() || undefined,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Registrar pago</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
            {(error as any)?.message || 'Error al registrar el pago.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Monto a abonar <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">Bs.</span>
              <input
                type="number"
                required
                min="0.01"
                max={balanceDue}
                step="0.01"
                value={form.amount_paid}
                onChange={(e) => setForm({ ...form, amount_paid: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Saldo pendiente: Bs. {formatCurrency(balanceDue)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Método de pago</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setForm({ ...form, payment_method: method })}
                  className={`py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                    form.payment_method === method
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {METHOD_LABELS[method]}
                </button>
              ))}
            </div>
          </div>

          {(form.payment_method === 'QR' || form.payment_method === 'CARD' || form.payment_method === 'TRANSFER') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">N° de referencia (opcional)</label>
              <input
                type="text"
                value={form.reference_number}
                onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                placeholder="Ej. Código de transacción..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas (opcional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Observaciones..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm"
            />
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
              disabled={isPending || !form.amount_paid}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                'Registrar pago'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Componente principal ────────────────────────────────────────────────────

export const AccountDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const { data: account, isLoading, isError } = useAccount(id!);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError || !account) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Cuenta no encontrada.
        </div>
        <button
          onClick={() => navigate('/billing')}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          Volver a cobros
        </button>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[account.status];
  const patientName = account.patient
    ? `${account.patient.first_name} ${account.patient.last_name}`
    : 'Paciente desconocido';
  const progress = account.total_amount > 0
    ? ((account.total_amount - account.balance_due) / account.total_amount) * 100
    : 0;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">

      <button
        onClick={() => navigate('/billing')}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        ← Volver a cobros
      </button>

      {/* Card resumen */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Paciente</p>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">{patientName}</h2>
            {account.patient?.phone && (
              <p className="text-sm text-slate-400 mt-0.5">{account.patient.phone}</p>
            )}
          </div>
          <span className={`px-3 py-1.5 text-sm font-semibold rounded-full ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>

        <p className="text-slate-600 text-sm bg-slate-50 rounded-lg p-3 border border-slate-100">
          {account.description}
        </p>

        {/* Montos */}
        <div className="grid grid-cols-3 gap-4 mt-5">
          <div>
            <p className="text-xs text-slate-400">Total</p>
            <p className="text-lg font-bold text-slate-700">Bs. {formatCurrency(account.total_amount)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Pagado</p>
            <p className="text-lg font-bold text-emerald-600">
              Bs. {formatCurrency(account.total_amount - account.balance_due)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Saldo</p>
            <p className="text-lg font-bold text-red-600">Bs. {formatCurrency(account.balance_due)}</p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-4">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {account.status !== 'PAID' && (
          <button
            onClick={() => setShowPaymentForm(true)}
            className="w-full mt-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
          >
            + Registrar pago
          </button>
        )}
      </div>

      {/* Historial de pagos */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Historial de pagos</h3>
        </div>

        {account.payments.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <svg className="w-10 h-10 mx-auto mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium">Aún no se ha registrado ningún pago</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {account.payments.map((payment) => (
              <div key={payment.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">Bs. {formatCurrency(payment.amount_paid)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {METHOD_LABELS[payment.payment_method]}
                    {payment.reference_number && ` · Ref: ${payment.reference_number}`}
                  </p>
                  {payment.notes && (
                    <p className="text-xs text-slate-400 mt-0.5 italic">{payment.notes}</p>
                  )}
                </div>
                <p className="text-xs text-slate-400 flex-shrink-0">{formatDateTime(payment.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPaymentForm && (
        <PaymentForm
          accountId={account.id}
          balanceDue={account.balance_due}
          onClose={() => setShowPaymentForm(false)}
        />
      )}
    </div>
  );
};