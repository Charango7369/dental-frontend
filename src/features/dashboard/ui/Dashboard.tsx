// src/features/dashboard/ui/Dashboard.tsx
import { useNavigate } from 'react-router-dom';
import { useDashboardSummary } from '../hooks/useDashboard';
import { useAuthStore } from '../../../store/authStore';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric', month: 'short' });

// ─── Tarjeta de métrica ───────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  onClick?: () => void;
}

const MetricCard = ({ label, value, sub, icon, accent, onClick }: MetricCardProps) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-200 transition-all' : ''}`}
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-0.5 leading-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Skeleton de carga ────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4 animate-pulse">
    <div className="w-11 h-11 rounded-xl bg-slate-200 flex-shrink-0" />
    <div className="flex-1">
      <div className="h-3 bg-slate-200 rounded w-24 mb-2" />
      <div className="h-7 bg-slate-200 rounded w-16" />
    </div>
  </div>
);

// ─── Badge de estado de cita ──────────────────────────────────────────────────

const statusBadge: Record<string, string> = {
  PENDING:   'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
};

// ─── Dashboard principal ──────────────────────────────────────────────────────

export const Dashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, error, refetch } = useDashboardSummary();

  // 🔍 DEBUG TEMPORAL — quitar después de diagnosticar
  console.log('🔍 [Dashboard] isLoading:', isLoading);
  console.log('🔍 [Dashboard] isError:', isError);
  console.log('🔍 [Dashboard] error:', error);
  console.log('🔍 [Dashboard] data:', data);

  const roles: string[] = Array.isArray(user?.roles)
    ? user!.roles
    : JSON.parse(user?.roles || '[]');

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">

      {/* ── Bienvenida ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{greeting()} 👋</p>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">{user?.full_name}</h2>
          <div className="flex gap-2 mt-2">
            {roles.map((r) => (
              <span key={r} className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                {r}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Actualizar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* ── Error ── */}
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm text-center">
          No se pudieron cargar las métricas.{' '}
          {error && <span className="block mt-1 text-xs opacity-75">{String((error as any)?.message ?? error)}</span>}
          <button onClick={() => refetch()} className="underline font-medium block mt-2 mx-auto">Reintentar</button>
        </div>
      )}

      {/* ── Grid de métricas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <MetricCard
              label="Pacientes activos"
              value={data?.total_patients ?? 0}
              sub={`+${data?.new_patients_month ?? 0} este mes`}
              accent="bg-blue-50 text-blue-600"
              onClick={() => navigate('/patients')}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            <MetricCard
              label="Citas hoy"
              value={data?.appointments_today ?? 0}
              sub={`${data?.pending_today ?? 0} pendientes`}
              accent="bg-emerald-50 text-emerald-600"
              onClick={() => navigate('/agenda')}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <MetricCard
              label="Cuentas pendientes"
              value={data?.pending_accounts ?? 0}
              sub={`Bs. ${formatCurrency(data?.total_balance_due ?? 0)} por cobrar`}
              accent="bg-amber-50 text-amber-600"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <MetricCard
              label="Ingresos del mes"
              value={`Bs. ${formatCurrency(data?.monthly_income ?? 0)}`}
              sub="Pagos registrados"
              accent="bg-violet-50 text-violet-600"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </>
        )}
      </div>

      {/* ── Próximas citas ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Próximas citas</h3>
          <button
            onClick={() => navigate('/agenda')}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Ver agenda completa →
          </button>
        </div>

        {isLoading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-slate-200 flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-3 bg-slate-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : !data?.upcoming_appointments?.length ? (
          <div className="py-12 text-center text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium">No hay citas próximas</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.upcoming_appointments.map((apt) => (
              <div
                key={apt.id}
                onClick={() => navigate('/agenda')}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                {/* Bloque hora */}
                <div className="w-14 flex-shrink-0 text-center bg-slate-50 rounded-xl py-2">
                  <p className="text-xs font-bold text-slate-700">{formatTime(apt.start_time)}</p>
                  <p className="text-xs text-slate-400">{formatDate(apt.start_time)}</p>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {apt.reason || 'Consulta general'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">ID: {apt.patient_id.slice(0, 8)}…</p>
                </div>

                {/* Estado */}
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${statusBadge[apt.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {apt.status === 'PENDING' ? 'Pendiente' : 'Confirmado'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Accesos rápidos ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pacientes',     desc: 'Gestión de pacientes activos', href: '/patients', color: '#1e3a8a' },
          { label: 'Agenda',        desc: 'Citas programadas para hoy',   href: '/agenda',   color: '#1e3a8a' },
          { label: 'Configuración', desc: 'Ajustes del sistema',          href: '/settings', color: '#1e3a8a' },
        ].map((card) => (
          <a
            key={card.href}
            href={card.href}
            className="rounded-2xl p-5 hover:shadow-lg transition-all group"
            style={{ backgroundColor: card.color }}
          >
            <p className="text-sm font-bold text-white">{card.label}</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{card.desc}</p>
          </a>
        ))}
      </div>

      {/* Timestamp de actualización */}
      {data?.generated_at && (
        <p className="text-xs text-slate-400 text-right">
          Actualizado: {new Date(data.generated_at).toLocaleTimeString('es-BO')}
        </p>
      )}
    </div>
  );
};