import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import type { ApiError } from '../../../types';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [copiedSupportEmail, setCopiedSupportEmail] = useState(false);

  // Asegurar que los campos inicien limpios y vacíos al montar la vista
  useEffect(() => {
    setEmail('');
    setPassword('');
  }, []);

  const mutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email.trim(), password),
    onSuccess: (user) => {
      // Redirigir a panel global si es SUPER_ADMIN o al dashboard clínico
      if (user.roles.includes('SUPER_ADMIN')) {
        navigate('/platform/tenants', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    },
    onError: (err: ApiError) => {
      setError(err.message || 'Correo electrónico o contraseña incorrectos.');
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }
    mutation.mutate({ email, password });
  };

  const handleCopySupport = () => {
    navigator.clipboard.writeText('contacto@apolodigital.lat');
    setCopiedSupportEmail(true);
    setTimeout(() => setCopiedSupportEmail(false), 2500);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden select-none"
      style={{ backgroundColor: '#F4F8FB' }}
    >
      {/* Elementos ambientales suaves de fondo clínico */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none -z-0">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-sky-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-teal-100/30 rounded-full blur-3xl" />
      </div>

      {/* Card principal del formulario de login */}
      <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-[0_10px_35px_-4px_rgba(15,23,42,0.06),0_2px_8px_-2px_rgba(15,23,42,0.04)] border border-slate-200/80 p-8 sm:p-10 relative z-10 transition-all">
        {/* Cabecera con Logo Corporativo y Título */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0f3d3a] to-[#082422] flex items-center justify-center p-3 shadow-lg shadow-teal-950/15 ring-4 ring-teal-500/10 mb-4 transition-transform hover:scale-105 duration-300">
            <img
              src="/logo-isotipo.png"
              alt="Aldent Cloud"
              className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(0,212,255,0.45)]"
            />
          </div>

          <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900">
            Aldent Cloud
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 font-normal leading-relaxed max-w-[280px]">
            Gestión inteligente para clínicas odontológicas
          </p>
        </div>

        {/* Formulario con protección anti-autofill */}
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {/* Señuelos ocultos para desviar el autocompletado forzado del navegador */}
          <input
            type="text"
            name="prevent_autofill_email"
            tabIndex={-1}
            aria-hidden="true"
            autoComplete="off"
            className="sr-only opacity-0 pointer-events-none absolute -top-9999px"
          />
          <input
            type="password"
            name="prevent_autofill_password"
            tabIndex={-1}
            aria-hidden="true"
            autoComplete="new-password"
            className="sr-only opacity-0 pointer-events-none absolute -top-9999px"
          />

          {/* Campo: Correo Electrónico */}
          <div>
            <label
              htmlFor="aldent_user_email"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Correo electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
              <input
                id="aldent_user_email"
                name="aldent_user_email"
                type="email"
                required
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-white hover:bg-slate-50/50 focus:bg-white border border-slate-200/90 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
                placeholder="admin@aldent.cloud"
              />
            </div>
          </div>

          {/* Campo: Contraseña con link "¿Olvidaste tu contraseña?" */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="aldent_user_password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors focus:outline-none cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input
                id="aldent_user_password"
                name="aldent_user_password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="other"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white hover:bg-slate-50/50 focus:bg-white border border-slate-200/90 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all font-sans"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Notificación de Error amigable */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 animate-fadeIn">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="flex-1 font-medium">{error}</span>
            </div>
          )}

          {/* Botón Primario Corporativo */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-3 px-4 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {mutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <span>Iniciar sesión</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Sello de seguridad clínica y confianza */}
      <div className="mt-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 text-xs text-slate-500 font-medium bg-white/70 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-slate-200/50 shadow-sm">
          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span>Plataforma Odontológica Segura • Encriptación 256-bit</span>
        </div>
      </div>

      {/* Modal de Ayuda: "¿Olvidaste tu contraseña?" */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-7 relative animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-800">Recuperación de Contraseña</h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                Por razones de estricta <strong>seguridad médica y privacidad de historias clínicas</strong>, las credenciales son gestionadas de forma centralizada:
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-700 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>
                    Si eres <strong>Doctor o Recepcionista</strong>, contacta al <strong>Administrador de tu Clínica</strong> para que regenere tu contraseña temporal desde el módulo de Personal.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>
                    Si eres <strong>Administrador</strong> o requieres asistencia técnica directa, contacta a nuestro equipo de soporte:
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs">
                <span className="font-mono font-medium text-blue-900">soporte@aldent.cloud</span>
                <button
                  type="button"
                  onClick={handleCopySupport}
                  className="px-2.5 py-1 text-xs font-semibold bg-white text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg shadow-sm border border-blue-200 transition-colors"
                >
                  {copiedSupportEmail ? '¡Copiado!' : 'Copiar correo'}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
