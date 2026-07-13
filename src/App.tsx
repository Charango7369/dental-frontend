import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Login } from './features/auth/ui/Login';
import { Sidebar } from './features/auth/ui/Sidebar';
import { TopBar } from './features/auth/ui/TopBar';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PatientsList } from './features/patients/ui/PatientsList';
import { PatientDetail } from './features/patients/ui/PatientDetail';
import { DailyAgenda } from './features/appointments/ui/DailyAgenda';
import { Dashboard } from './features/dashboard/ui/Dashboard';
import { BillingList } from './features/billing/ui/BillingList';
import { AccountDetail } from './features/billing/ui/AccountDetail';
import { IncomeReport } from './features/reports/ui/IncomeReport';
import { UsersList } from './features/users/ui/UsersList';
import { TenantsList } from './features/platform/ui/TenantsList';
import { useAuthStore } from './store/authStore';

// ─── Página de Configuración (solo ADMIN) ─────────────────────────────────────

const AdminSettings = () => (
  <div className="p-4 md:p-6">
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-slate-800 mb-2">Configuración del Sistema</h2>
      <p className="text-sm text-slate-500">
        Zona restringida. Visible únicamente para usuarios con rol{' '}
        <span className="font-semibold text-red-600">ADMIN</span>.
      </p>
    </div>
  </div>
);

// ─── Redirección inteligente según rol ─────────────────────────────────────────
// El SUPER_ADMIN no pertenece a una clínica real, así que su "home" es el
// panel de plataforma (Clínicas), no el Dashboard clínico.

const parseRoles = (roles: string | string[] | undefined): string[] => {
  if (!roles) return [];
  if (Array.isArray(roles)) return roles;
  try { return JSON.parse(roles); } catch { return []; }
};

const HomeRedirect = () => {
  const user = useAuthStore((s) => s.user);
  const roles = parseRoles(user?.roles);
  const isSuperAdmin = roles.includes('SUPER_ADMIN');
  return <Navigate to={isSuperAdmin ? '/platform/tenants' : '/dashboard'} replace />;
};

// ─── Query Client ─────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ─── Layout principal con sidebar ────────────────────────────────────────────

const ProtectedLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#334155' }}>
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar onMenuOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        {/* Pública */}
        <Route path="/login" element={<Login />} />

        {/* Privada */}
        <Route element={<ProtectedRoute />}>
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/patients"     element={<PatientsList />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
            <Route path="/agenda"       element={<DailyAgenda />} />
            <Route path="/billing"      element={<BillingList />} />
            <Route path="/billing/:id"  element={<AccountDetail />} />

            {/* Solo ADMIN de la clínica */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/settings" element={<AdminSettings />} />
              <Route path="/reports"  element={<IncomeReport />} />
              <Route path="/users"    element={<UsersList />} />
            </Route>

            {/* Solo SUPER_ADMIN (dueño de la plataforma) */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
              <Route path="/platform/tenants" element={<TenantsList />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);