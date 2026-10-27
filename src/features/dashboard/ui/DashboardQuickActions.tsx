// src/features/dashboard/ui/DashboardQuickActions.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export type ActionAccent = 'blue' | 'rose' | 'emerald' | 'slate';

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  href: string;
  metricBadge: string;
  metricDetail?: string;
  accent: ActionAccent;
  icon: React.ReactNode;
  actionText: string;
  quickAddPath?: string;
  quickAddLabel?: string;
}

interface DashboardQuickActionsProps {
  items: QuickActionItem[];
}

const accentStyles: Record<
  ActionAccent,
  {
    iconBg: string;
    iconText: string;
    borderHover: string;
    badge: string;
    btnHover: string;
    indicator: string;
  }
> = {
  blue: {
    iconBg: 'bg-blue-50 border-blue-100',
    iconText: 'text-blue-600',
    borderHover: 'hover:border-blue-300',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    btnHover: 'group-hover:text-blue-600',
    indicator: 'bg-blue-500',
  },
  rose: {
    iconBg: 'bg-rose-50 border-rose-100',
    iconText: 'text-rose-600',
    borderHover: 'hover:border-rose-300',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    btnHover: 'group-hover:text-rose-600',
    indicator: 'bg-rose-500',
  },
  emerald: {
    iconBg: 'bg-emerald-50 border-emerald-100',
    iconText: 'text-emerald-600',
    borderHover: 'hover:border-emerald-300',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    btnHover: 'group-hover:text-emerald-600',
    indicator: 'bg-emerald-500',
  },
  slate: {
    iconBg: 'bg-slate-100 border-slate-200',
    iconText: 'text-slate-700',
    borderHover: 'hover:border-slate-400',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    btnHover: 'group-hover:text-slate-900',
    indicator: 'bg-slate-600',
  },
};

export const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({ items }) => {
  const navigate = useNavigate();

  return (
    <section aria-label="Accesos rápidos del dashboard" className="space-y-3">
      {/* Encabezado semántico de sección */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span>Accesos Rápidos y Operaciones Frecuentes</span>
        </h3>
        <span className="text-[11px] text-slate-400">Atajos optimizados para clínica</span>
      </div>

      {/* Grid de Tarjetas de Acción Rápida */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((item) => {
          const style = accentStyles[item.accent];

          return (
            <div
              key={item.id}
              onClick={() => navigate(item.href)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(item.href);
                }
              }}
              className={`bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md ${style.borderHover} hover:-translate-y-0.5 transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-4 group relative overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500 outline-none`}
            >
              {/* Barra superior de acento sutil */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${style.indicator}`} />

              <div className="space-y-3">
                {/* Cabecera con Icono y Badge de Métrica */}
                <div className="flex items-center justify-between gap-3">
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center text-lg shadow-2xs group-hover:scale-105 transition-transform ${style.iconBg} ${style.iconText}`}>
                    {item.icon}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${style.badge}`}>
                    {item.metricBadge}
                  </span>
                </div>

                {/* Título y Descripción con Jerarquía */}
                <div>
                  <h4 className={`text-base font-bold text-slate-900 ${style.btnHover} transition-colors tracking-tight`}>
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Detalle contextual sincronizado con la métrica */}
                {item.metricDetail && (
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 font-medium">
                    {item.metricDetail}
                  </div>
                )}
              </div>

              {/* Pie de Acción Primaria */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className={`font-bold ${style.btnHover} transition-colors inline-flex items-center gap-1.5`}>
                  <span>{item.actionText}</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>

                {item.quickAddPath && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(item.quickAddPath!);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                  >
                    {item.quickAddLabel || '+ Nuevo'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
