// src/features/reports/ui/IncomeReport.tsx
import { useState } from 'react';
import { useIncomeReport } from '../hooks/useReports';
import type { Granularity, IncomePeriodPoint } from '../services/reports.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const formatPeriodLabel = (iso: string, granularity: Granularity) => {
  const date = new Date(iso);
  if (granularity === 'day') {
    return date.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });
  }
  if (granularity === 'week') {
    return `Sem. ${date.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })}`;
  }
  return date.toLocaleDateString('es-BO', { month: 'short', year: 'numeric' });
};

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  QR: 'QR',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
};

const METHOD_COLORS: Record<string, string> = {
  CASH: '#10b981',
  QR: '#3b82f6',
  CARD: '#a855f7',
  TRANSFER: '#f59e0b',
};

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'day',   label: 'Diario' },
  { value: 'week',  label: 'Semanal' },
  { value: 'month', label: 'Mensual' },
];

// ─── Gráfico de barras (píxeles explícitos, sin depender de % en flex) ────────

const CHART_HEIGHT_PX = 200;

const BarChart = ({ series, granularity }: { series: IncomePeriodPoint[]; granularity: Granularity }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (series.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        No hay datos en este período
      </div>
    );
  }

  const maxValue = Math.max(...series.map((p) => p.total), 1);

  // Con rangos amplios puede haber decenas o cientos de barras — mostramos
  // solo algunas etiquetas espaciadas para que no se amontonen.
  const labelStep = Math.max(1, Math.ceil(series.length / 12));
  const denseChart = series.length > 40;

  return (
    <div>
      {/* Tooltip del punto activo */}
      <div className="h-6 mb-2">
        {hoverIdx !== null && (
          <div className="inline-block bg-slate-900 text-white text-xs font-semibold px-3 py-1 rounded-lg shadow-lg">
            {formatPeriodLabel(series[hoverIdx].period, granularity)}: Bs. {formatCurrency(series[hoverIdx].total)}
            {' · '}{series[hoverIdx].count} pago{series[hoverIdx].count !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Área de barras — altura fija en px, cada barra calculada en px también */}
      <div
        className={`flex items-end border-b border-slate-100 ${denseChart ? 'gap-px' : 'gap-1 md:gap-2'}`}
        style={{ height: `${CHART_HEIGHT_PX}px` }}
      >
        {series.map((point, i) => {
          const barHeightPx = Math.max((point.total / maxValue) * CHART_HEIGHT_PX, 3);
          return (
            <div
              key={point.period}
              className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer group"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <div
                className={`w-full transition-all ${denseChart ? '' : 'rounded-t-md'} ${
                  hoverIdx === i ? 'bg-blue-600' : 'bg-blue-400 group-hover:bg-blue-500'
                }`}
                style={{ height: `${barHeightPx}px` }}
              />
            </div>
          );
        })}
      </div>

      {/* Etiquetas de fecha debajo del eje (espaciadas si hay muchas barras) */}
      <div className={`flex mt-2 ${denseChart ? 'gap-px' : 'gap-1 md:gap-2'}`}>
        {series.map((point, i) => (
          <div key={point.period} className="flex-1 text-center overflow-hidden">
            {i % labelStep === 0 && (
              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                {formatPeriodLabel(point.period, granularity)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Desglose por método de pago ──────────────────────────────────────────────

const MethodBreakdownList = ({ breakdown, total }: { breakdown: { method: string; total: number; count: number }[]; total: number }) => {
  if (breakdown.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-6">Sin pagos registrados en este período</p>;
  }

  return (
    <div className="space-y-3">
      {breakdown.map((m) => {
        const pct = total > 0 ? (m.total / total) * 100 : 0;
        const color = METHOD_COLORS[m.method] ?? '#94a3b8';
        return (
          <div key={m.method}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm font-medium text-slate-700">
                  {METHOD_LABELS[m.method] ?? m.method}
                </span>
                <span className="text-xs text-slate-400">({m.count})</span>
              </div>
              <span className="text-sm font-bold text-slate-800">Bs. {formatCurrency(m.total)}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Componente principal ────────────────────────────────────────────────────

export const IncomeReport = () => {
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Convertimos fechas locales (yyyy-mm-dd de los inputs) a ISO UTC para el backend
  const startDateISO = customStart ? new Date(`${customStart}T00:00:00`).toISOString() : undefined;
  const endDateISO = customEnd ? new Date(`${customEnd}T23:59:59.999`).toISOString() : undefined;
  const hasCustomRange = Boolean(customStart && customEnd);

  const { data, isLoading, isError, refetch } = useIncomeReport(granularity, startDateISO, endDateISO);

  const clearRange = () => {
    setCustomStart('');
    setCustomEnd('');
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reportes de Ingresos</h1>
            <p className="text-slate-500 mt-1">Análisis de pagos recibidos por período</p>
          </div>

          {/* Selector de granularidad */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {GRANULARITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGranularity(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  granularity === opt.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selector de rango de fechas personalizado */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input
              type="date"
              value={customStart}
              max={customEnd || undefined}
              onChange={(e) => setCustomStart(e.target.value)}
              className="text-sm text-slate-700 outline-none bg-transparent"
            />
          </div>

          <span className="text-slate-400 text-sm">—</span>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input
              type="date"
              value={customEnd}
              min={customStart || undefined}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="text-sm text-slate-700 outline-none bg-transparent"
            />
          </div>

          {hasCustomRange && (
            <button
              onClick={clearRange}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar filtro
            </button>
          )}

          {hasCustomRange && (
            <span className="text-xs text-slate-400 ml-1">
              Mostrando rango personalizado — la granularidad sigue agrupando los datos
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm text-center">
          No se pudo cargar el reporte.{' '}
          <button onClick={() => refetch()} className="underline font-medium">Reintentar</button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          {/* Tarjetas resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ingresos totales</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">Bs. {formatCurrency(data.total_income)}</p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(data.start_date).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })} —{' '}
                {new Date(data.end_date).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pagos registrados</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{data.total_payments}</p>
              <p className="text-xs text-slate-400 mt-1">Transacciones en el período</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Promedio por período</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">Bs. {formatCurrency(data.average_per_period)}</p>
              <p className="text-xs text-slate-400 mt-1">
                Por {granularity === 'day' ? 'día' : granularity === 'week' ? 'semana' : 'mes'}
              </p>
            </div>
          </div>

          {/* Gráfico de barras */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6">
            <h3 className="font-bold text-slate-800 mb-2">Evolución de ingresos</h3>
            <BarChart series={data.series} granularity={granularity} />
          </div>

          {/* Desglose por método de pago */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6">
            <h3 className="font-bold text-slate-800 mb-4">Desglose por método de pago</h3>
            <MethodBreakdownList breakdown={data.by_method} total={data.total_income} />
          </div>
        </>
      )}
    </div>
  );
};