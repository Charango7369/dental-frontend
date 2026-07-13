// src/features/odontogram/ui/ToothChart.tsx
import { useState } from 'react';

// ─── Sistema FDI: numeración de cuadrantes ──────────────────────────────────
// Superior derecho: 18-11 | Superior izquierdo: 21-28
// Inferior izquierdo: 38-31 | Inferior derecho: 41-48

const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];

export const CONDITIONS = [
  { value: 'SANO',                label: 'Sano',                color: '#e2e8f0', textColor: '#334155' },
  { value: 'CARIES',               label: 'Caries',               color: '#ef4444', textColor: '#fff' },
  { value: 'OBTURADO',             label: 'Obturado',              color: '#3b82f6', textColor: '#fff' },
  { value: 'CORONA',                label: 'Corona',                color: '#a855f7', textColor: '#fff' },
  { value: 'TRATAMIENTO_CONDUCTO',  label: 'Trat. de conducto',     color: '#f59e0b', textColor: '#fff' },
  { value: 'EXTRACCION_INDICADA',   label: 'Extracción indicada',   color: '#f97316', textColor: '#fff' },
  { value: 'AUSENTE',               label: 'Ausente',               color: '#64748b', textColor: '#fff' },
  { value: 'IMPLANTE',              label: 'Implante',              color: '#10b981', textColor: '#fff' },
];

export const getConditionConfig = (value: string) =>
  CONDITIONS.find((c) => c.value === value) ?? CONDITIONS[0];

export interface ToothState {
  condition: string;
  faces: string[];
}

interface ToothChartProps {
  /** Estado actual (editable) de cada diente, llave = número FDI */
  teethData: Record<string, ToothState>;
  /** Si es true, permite click para editar; si es false, solo lectura */
  editable?: boolean;
  onToothClick?: (toothNumber: string) => void;
}

// ─── Un solo diente ───────────────────────────────────────────────────────────

const Tooth = ({
  number,
  state,
  editable,
  onClick,
}: {
  number: number;
  state?: ToothState;
  editable?: boolean;
  onClick?: () => void;
}) => {
  const cfg = state ? getConditionConfig(state.condition) : CONDITIONS[0];
  const hasCondition = state && state.condition !== 'SANO';

  return (
    <button
      type="button"
      onClick={editable ? onClick : undefined}
      disabled={!editable}
      className={`flex flex-col items-center gap-1 group ${editable ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div
        className={`w-8 h-8 md:w-9 md:h-9 rounded-lg border-2 flex items-center justify-center text-[10px] font-bold transition-all
          ${editable ? 'group-hover:scale-110 group-hover:shadow-md' : ''}
        `}
        style={{
          backgroundColor: hasCondition ? cfg.color : '#fff',
          borderColor: hasCondition ? cfg.color : '#cbd5e1',
          color: hasCondition ? cfg.textColor : '#94a3b8',
        }}
        title={cfg.label}
      >
        {number}
      </div>
    </button>
  );
};

// ─── Cuadrante (fila de dientes) ──────────────────────────────────────────────

const Quadrant = ({
  teeth,
  teethData,
  editable,
  onToothClick,
  reverse = false,
}: {
  teeth: number[];
  teethData: Record<string, ToothState>;
  editable?: boolean;
  onToothClick?: (n: string) => void;
  reverse?: boolean;
}) => (
  <div className={`flex gap-1 ${reverse ? 'flex-row-reverse' : ''}`}>
    {teeth.map((n) => (
      <Tooth
        key={n}
        number={n}
        state={teethData[String(n)]}
        editable={editable}
        onClick={() => onToothClick?.(String(n))}
      />
    ))}
  </div>
);

// ─── Odontograma completo ─────────────────────────────────────────────────────

export const ToothChart = ({ teethData, editable = false, onToothClick }: ToothChartProps) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-6">
      {/* Arcada superior */}
      <div className="flex justify-center gap-3 mb-2">
        <Quadrant teeth={UPPER_RIGHT} teethData={teethData} editable={editable} onToothClick={onToothClick} reverse />
        <div className="w-px bg-slate-200" />
        <Quadrant teeth={UPPER_LEFT} teethData={teethData} editable={editable} onToothClick={onToothClick} />
      </div>

      {/* Línea media */}
      <div className="h-px bg-slate-200 my-3" />

      {/* Arcada inferior */}
      <div className="flex justify-center gap-3">
        <Quadrant teeth={LOWER_RIGHT} teethData={teethData} editable={editable} onToothClick={onToothClick} reverse />
        <div className="w-px bg-slate-200" />
        <Quadrant teeth={LOWER_LEFT} teethData={teethData} editable={editable} onToothClick={onToothClick} />
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-100">
        {CONDITIONS.map((c) => (
          <div key={c.value} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: c.color }} />
            <span className="text-xs text-slate-500">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Selector de condición (modal pequeño) ────────────────────────────────────

interface ToothEditorProps {
  toothNumber: string;
  currentState?: ToothState;
  onSave: (state: ToothState) => void;
  onClose: () => void;
}

export const ToothEditor = ({ toothNumber, currentState, onSave, onClose }: ToothEditorProps) => {
  const [condition, setCondition] = useState(currentState?.condition ?? 'SANO');

  const handleSave = () => {
    onSave({ condition, faces: [] });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xs w-full p-5 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Pieza {toothNumber}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-1.5 mb-5">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              onClick={() => setCondition(c.value)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border-2
                ${condition === c.value ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-slate-50'}
              `}
            >
              <span className="w-3.5 h-3.5 rounded-sm flex-shrink-0" style={{ backgroundColor: c.color }} />
              {c.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
};