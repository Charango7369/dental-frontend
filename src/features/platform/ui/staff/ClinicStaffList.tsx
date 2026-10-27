// src/features/platform/ui/staff/ClinicStaffList.tsx
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTenants } from '../../hooks/useTenants';
import { useClinicStaff } from '../../hooks/useClinicStaff';
import type { ClinicRole, ClinicStaffMember } from '../../services/clinicStaff.service';
import { StaffCard } from './StaffCard';
import { StaffFormModal } from './StaffFormModal';
import { PasswordResetModal } from './PasswordResetModal';

interface ClinicStaffListProps {
  clinicIdProp?: string;
  onBackProp?: () => void;
}

export const ClinicStaffList = ({ clinicIdProp, onBackProp }: ClinicStaffListProps = {}) => {
  const { clinicId: routeClinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();

  const clinicId = clinicIdProp || routeClinicId || '';

  // Información de la clínica
  const { data: tenants } = useTenants();
  const currentClinic = useMemo(() => {
    return tenants?.find((t) => t.id === clinicId);
  }, [tenants, clinicId]);

  // Lista de personal
  const { data: staffList, isLoading, isError, refetch } = useClinicStaff(clinicId);

  // Estados de interfaz y filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | ClinicRole>('ALL');

  // Modales
  const [editingMember, setEditingMember] = useState<ClinicStaffMember | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resettingMember, setResettingMember] = useState<ClinicStaffMember | null>(null);

  // Conteo por roles
  const counts = useMemo(() => {
    const list = staffList || [];
    const admins = list.filter((m) => m.roles?.includes('ADMIN')).length;
    const doctors = list.filter((m) => m.roles?.includes('DOCTOR')).length;
    const receptionists = list.filter((m) => m.roles?.includes('RECEPTIONIST')).length;
    return { total: list.length, admins, doctors, receptionists };
  }, [staffList]);

  // Filtrado reactivo
  const filteredStaff = useMemo(() => {
    return (staffList || []).filter((m) => {
      const matchesSearch =
        m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole =
        roleFilter === 'ALL' || (m.roles && m.roles.includes(roleFilter));

      return matchesSearch && matchesRole;
    });
  }, [staffList, searchTerm, roleFilter]);

  const handleBack = () => {
    if (onBackProp) {
      onBackProp();
    } else {
      navigate('/platform/tenants');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Botón superior de retroceso */}
      <div>
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl transition shadow-xs"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Volver a Clínicas</span>
        </button>
      </div>

      {/* Cabecera de la Clínica */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold border border-blue-100 shadow-xs">
              🏥
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                {currentClinic ? currentClinic.name : 'Personal de la Clínica'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Gestión integral de colaboradores, roles clínicos y credenciales de acceso
              </p>
            </div>
          </div>
        </div>

        {/* Botón CTA Nuevo Personal */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Registrar Personal</span>
        </button>
      </div>

      {/* Tarjetas de Métricas Rápidas por Rol */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Equipo</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{counts.total}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Administradores</p>
          <p className="text-2xl font-black text-purple-700 mt-1">{counts.admins}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Odontólogos</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{counts.doctors}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Recepción</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{counts.receptionists}</p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filtros por Rol */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'ADMIN', label: 'Admin' },
            { id: 'DOCTOR', label: 'Doctores' },
            { id: 'RECEPTIONIST', label: 'Recepción' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                roleFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Estados de Carga / Error / Lista */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-2xl text-xs font-semibold text-center">
          No se pudo cargar el personal de la clínica.{' '}
          <button onClick={() => refetch()} className="underline font-bold ml-1">Reintentar</button>
        </div>
      )}

      {!isLoading && !isError && filteredStaff.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 py-16 text-center text-slate-400">
          <p className="text-3xl mb-2">👥</p>
          <p className="text-sm font-bold text-slate-700">No se encontraron miembros del personal</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || roleFilter !== 'ALL'
              ? 'Prueba modificando los filtros o el término de búsqueda.'
              : 'Registra el primer administrador, odontólogo o recepcionista para esta clínica.'}
          </p>
        </div>
      )}

      {!isLoading && !isError && filteredStaff.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((member) => (
            <StaffCard
              key={member.id}
              member={member}
              onEdit={(m) => setEditingMember(m)}
              onResetPassword={(m) => setResettingMember(m)}
            />
          ))}
        </div>
      )}

      {/* Modal: Crear o Editar Personal */}
      {(showCreateModal || editingMember) && (
        <StaffFormModal
          clinicId={clinicId}
          member={editingMember}
          onClose={() => {
            setShowCreateModal(false);
            setEditingMember(null);
          }}
          onSuccess={() => refetch()}
        />
      )}

      {/* Modal: Resetear Contraseña */}
      {resettingMember && (
        <PasswordResetModal
          clinicId={clinicId}
          member={resettingMember}
          onClose={() => setResettingMember(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
};
