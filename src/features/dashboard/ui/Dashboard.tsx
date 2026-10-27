// src/features/dashboard/ui/Dashboard.tsx
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardSummary } from '../hooks/useDashboard';
import { useAuthStore } from '../../../store/authStore';
import { DashboardQuickActions, type QuickActionItem } from './DashboardQuickActions';

// ─── Helpers de Formato ──────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric', month: 'short' });

// ─── Tarjeta de Métrica (KPI) ────────────────────────────────────────────────

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
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex items-start gap-4 transition-all duration-150 ${
      onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5' : ''
    }`}
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${accent}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-slate-900 mt-0.5 leading-tight tracking-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5 font-medium">{sub}</p>}
    </div>
  </div>
);

// ─── Skeleton de Carga ────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex items-start gap-4 animate-pulse">
    <div className="w-11 h-11 rounded-xl bg-slate-100 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-slate-100 rounded w-24" />
      <div className="h-6 bg-slate-100 rounded w-16" />
    </div>
  </div>
);

// ─── Badge de Estado de Cita ─────────────────────────────────────────────────

const statusBadge: Record<string, string> = {
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

// ─── Componente Principal Dashboard ──────────────────────────────────────────

export const Dashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, error, refetch } = useDashboardSummary();

  const roles: string[] = Array.isArray(user?.roles)
    ? user!.roles
    : JSON.parse(user?.roles || '[]');

  const isClinicAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // ─── Configuración de Accesos Rápidos Principales ─────────────────────────
  const quickActionItems: QuickActionItem[] = useMemo(() => {
    const items: QuickActionItem[] = [
      {
        id: 'patients',
        title: 'Pacientes',
        description: 'Directorio clínico, historial de consultas y nuevos registros.',
        href: '/patients',
        metricBadge: `${data?.total_patients ?? 0} registrados`,
        metricDetail: data?.new_patients_month
          ? `+${data.new_patients_month} nuevos pacientes este mes`
          : 'Directorio de pacientes actualizado',
        accent: 'blue',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        actionText: 'Explorar pacientes',
        quickAddPath: '/patients',
        quickAddLabel: '+ Registrar',
      },
      {
        id: 'agenda',
        title: 'Agenda Médica',
        description: 'Planificación de citas odontológicas y sincronización en vivo.',
        href: '/agenda',
        metricBadge: `${data?.appointments_today ?? 0} citas hoy`,
        metricDetail: (data?.pending_today ?? 0) > 0
          ? `${data?.pending_today} citas pendientes de atención hoy`
          : 'Sin retrasos en citas de hoy',
        accent: 'rose',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        actionText: 'Abrir calendario',
        quickAddPath: '/agenda',
        quickAddLabel: '+ Nueva Cita',
      },
      isClinicAdmin
        ? {
            id: 'settings',
            title: 'Configuración',
            description: 'Parámetros de la clínica, administración y usuarios.',
            href: '/settings',
            metricBadge: 'ADMIN',
            metricDetail: 'Gestión global de la plataforma',
            accent: 'slate',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ),
            actionText: 'Ajustes del sistema',
          }
        : {
            id: 'billing',
            title: 'Cobros y Cuentas',
            description: 'Gestión de cobros, recibos y saldo pendiente de pacientes.',
            href: '/billing',
            metricBadge: `${data?.pending_accounts ?? 0} pendientes`,
            metricDetail: `Bs. ${formatCurrency(data?.total_balance_due ?? 0)} saldo por cobrar`,
            accent: 'emerald',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            actionText: 'Gestionar cobros',
          },
    ];
    return items;
  }, [data, isClinicAdmin]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">

      {/* ─── TARJETA DE BIENVENIDA Y PERFIL DE TURNO ─── */}
      <section aria-label="Bienvenida al usuario" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{greeting()} 👋</p>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-0.5">{user?.full_name}</h2>
          <div className="flex gap-2 mt-2">
            {roles.map((r) => (
              <span key={r} className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider rounded-full border border-blue-100">
                {r}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors self-start sm:self-auto"
          title="Actualizar datos"
          aria-label="Actualizar métricas del dashboard"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </section>

      {/* ─── MENSAJE DE ERROR DE CONEXIÓN ─── */}
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs text-center font-medium shadow-xs">
          No se pudieron cargar las métricas.{' '}
          {error && <span className="block mt-1 text-[11px] opacity-75">{String((error as any)?.message ?? error)}</span>}
          <button onClick={() => refetch()} className="underline font-bold block mt-2 mx-auto">Reintentar</button>
        </div>
      )}

      {/* ─── GRID DE MÉTRICAS CLAVE (KPIS) ─── */}
      <section aria-label="Métricas clave de la clínica" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <MetricCard
              label="Pacientes activos"
              value={data?.total_patients ?? 0}
              sub={`+${data?.new_patients_month ?? 0} este mes`}
              accent="bg-blue-50 text-blue-600 border border-blue-100"
              onClick={() => navigate('/patients')}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            <MetricCard
              label="Citas hoy"
              value={data?.appointments_today ?? 0}
              sub={`${data?.pending_today ?? 0} pendientes`}
              accent="bg-emerald-50 text-emerald-600 border border-emerald-100"
              onClick={() => navigate('/agenda')}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <MetricCard
              label="Cuentas pendientes"
              value={data?.pending_accounts ?? 0}
              sub={`Bs. ${formatCurrency(data?.total_balance_due ?? 0)} por cobrar`}
              accent="bg-amber-50 text-amber-600 border border-amber-100"
              onClick={() => navigate('/billing')}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <MetricCard
              label="Ingresos del mes"
              value={`Bs. ${formatCurrency(data?.monthly_income ?? 0)}`}
              sub="Pagos registrados"
              accent="bg-violet-50 text-violet-600 border border-violet-100"
              onClick={() => navigate('/billing')}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </>
        )}
      </section>

      {/* ─── PRÓXIMAS CITAS PROGRAMADAS ─── */}
      <section aria-label="Próximas citas" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>📅</span> Próximas Citas
          </h3>
          <button
            onClick={() => navigate('/agenda')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
          >
            <span>Ver agenda completa</span>
            <span>→</span>
          </button>
        </div>

        {isLoading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-100 rounded w-32" />
                  <div className="h-2.5 bg-slate-100 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : !data?.upcoming_appointments?.length ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <svg className="w-10 h-10 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs font-semibold text-slate-600">No hay citas próximas programadas</p>
            <button
              onClick={() => navigate('/agenda')}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              + Agendar una cita ahora
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.upcoming_appointments.map((apt) => (
              <div
                key={apt.id}
                onClick={() => navigate('/agenda')}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                {/* Bloque de hora */}
                <div className="w-14 flex-shrink-0 text-center bg-slate-50 rounded-xl py-2 border border-slate-100">
                  <p className="text-xs font-bold text-slate-700">{formatTime(apt.start_time)}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{formatDate(apt.start_time)}</p>
                </div>

                {/* Información */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {apt.reason || 'Consulta Odontológica General'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ficha #{apt.patient_id.slice(0, 8)}</p>
                </div>

                {/* Estado */}
                <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border flex-shrink-0 ${statusBadge[apt.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {apt.status === 'PENDING' ? 'Pendiente' : 'Confirmado'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── BOTONES / TARJETAS DE ACCIÓN PRINCIPALES (LAUNCHPAD) ─── */}
      <DashboardQuickActions items={quickActionItems} />

      {/* Timestamp de actualización */}
      {data?.generated_at && (
        <p className="text-[11px] text-slate-400 text-right font-medium">
          Actualizado: {new Date(data.generated_at).toLocaleTimeString('es-BO')}
        </p>
      )}
    </div>
  );
};
