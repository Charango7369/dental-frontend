// src/features/platform/ui/staff/PasswordResetModal.tsx
import { useState, type FormEvent } from 'react';
import { useResetStaffPassword } from '../../hooks/useClinicStaff';
import type { ClinicStaffMember, PasswordResetResponse } from '../../services/clinicStaff.service';

interface PasswordResetModalProps {
  clinicId: string;
  member: ClinicStaffMember;
  onClose: () => void;
  onSuccess: () => void;
}

export const PasswordResetModal = ({
  clinicId,
  member,
  onClose,
  onSuccess,
}: PasswordResetModalProps) => {
  const { mutateAsync: resetPassword, isPending } = useResetStaffPassword(clinicId);

  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [manualPassword, setManualPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<PasswordResetResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'manual' && (!manualPassword || manualPassword.length < 8)) {
      setErrorMessage('La contraseña manual debe contener al menos 8 caracteres.');
      return;
    }

    try {
      const res = await resetPassword({
        userId: member.id,
        data: mode === 'manual' ? { new_password: manualPassword.trim() } : {},
      });

      setResult(res);
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Error al resetear la contraseña.';
      setErrorMessage(msg);
    }
  };

  const handleCopyPassword = () => {
    if (result?.temporary_password) {
      navigator.clipboard.writeText(result.temporary_password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg border border-amber-200/80">
              🔑
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Resetear Credenciales</h2>
              <p className="text-xs text-slate-500">{member.full_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold border border-red-200">
            {errorMessage}
          </div>
        )}

        {/* VISTA DE ÉXITO TRAS EL RESETEO */}
        {result ? (
          <div className="mt-5 space-y-4">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold shadow-xs">
                ✓
              </div>
              <h3 className="font-bold text-emerald-900 text-sm">{result.message}</h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                La contraseña fue encriptada y reemplazada en la base de datos de la clínica.
              </p>
            </div>

            {/* Contraseña temporal en texto legible */}
            {result.temporary_password && (
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md">
                <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                  Contraseña temporal generada
                </p>
                <div className="flex items-center justify-between gap-3 bg-black/40 px-3 py-2.5 rounded-xl border border-white/10">
                  <span className="font-mono text-base font-bold text-emerald-300 select-all tracking-wider">
                    {result.temporary_password}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <span>{copied ? '✓ Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  ⚠️ Comparte esta contraseña con el usuario. Se recomienda cambiarla al iniciar sesión.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm mt-3"
            >
              Listo, cerrar ventana
            </button>
          </div>
        ) : (
          /* FORMULARIO DE ACCIÓN */
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Selector de modo */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setMode('auto')}
                className={`py-2 text-xs font-bold rounded-xl transition ${
                  mode === 'auto'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ⚡ Automática (Segura)
              </button>
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`py-2 text-xs font-bold rounded-xl transition ${
                  mode === 'manual'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ✏️ Manual (Personalizada)
              </button>
            </div>

            {mode === 'auto' ? (
              <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs text-blue-900 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <span>ℹ️</span> Generación Criptográfica Instantánea
                </p>
                <p className="text-blue-800/80 leading-relaxed">
                  El servidor generará una contraseña temporal de alta entropía (ej. <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono font-bold">Apolo-x8Km2P</code>) y calculará su hash Bcrypt con sal segura. Podrás copiarla de inmediato en el siguiente paso.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Nueva Contraseña <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  value={manualPassword}
                  onChange={(e) => setManualPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Actualizando...</span>
                  </>
                ) : (
                  'Resetear Contraseña'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
