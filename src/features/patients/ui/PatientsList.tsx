import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '../hooks/usePatients';
import { PatientCard } from './PatientCard';
import { PatientForm } from './PatientForm';
import { useDebounce } from '../../../hooks/useDebounce';

const ITEMS_PER_PAGE = 9; // Grid equilibrado de 3x3 para resoluciones estándar

export const PatientsList = () => {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);

  // ─── Estado de Búsqueda y Paginación ─────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [currentPage, setCurrentPage] = useState(1);

  // ─── Parámetros Seguros para la API ──────────────────────────────────────
  const params = {
    limit: ITEMS_PER_PAGE,
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    search: debouncedSearch.trim() || undefined,
    active_only: true,
  };

  // ─── Consulta de Pacientes ────────────────────────────────────────────────
  const {
    data: patients,
    isLoading,
    isError,
    error,
    isPlaceholderData,
  } = usePatients(params);

  const totalRecords = patients?.total || 0;
  const currentItems = patients?.items || [];
  const totalPages = totalRecords > 0 ? Math.ceil(totalRecords / ITEMS_PER_PAGE) : 1;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  // ─── Renderizado de Estados de Carga y Error ──────────────────────────────
  if (isLoading && !isPlaceholderData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-300 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400" />
        <p className="font-semibold text-sm">Cargando directorio de pacientes...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center shadow-sm space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xl font-bold">
            ⚠️
          </div>
          <h3 className="font-bold text-base text-red-900">Error de conexión</h3>
          <p className="text-xs text-red-700 font-medium">
            {error?.message || 'No se pudo conectar con el servidor de la clínica.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* ─── ENCABEZADO CON ALTO CONTRASTE Y ACCIÓN PRINCIPAL ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Pacientes
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              {totalRecords} {totalRecords === 1 ? 'registrado' : 'registrados'}
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            Directorio y fichas clínicas odontológicas del paciente.
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/30 transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <span className="text-base font-black leading-none">+</span>
          <span>Registrar Nuevo</span>
        </button>
      </div>

      {/* ─── BARRA DE BÚSQUEDA TIPO CARD ─── */}
      <div className="bg-white p-3.5 md:p-4 rounded-2xl shadow-sm border border-slate-200/80 relative">
        <div className="relative flex items-center">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Buscar paciente por nombre, apellido o teléfono..."
            aria-label="Buscar paciente por nombre, apellido o teléfono"
            className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:text-slate-400 text-xs text-slate-800"
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              aria-label="Limpiar búsqueda"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Indicador sutil de carga durante debounced search */}
        {isLoading && isPlaceholderData && (
          <div className="absolute right-7 top-1/2 -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-2 border-blue-600/30 border-t-blue-600" />
        )}
      </div>

      {/* ─── GRID DE PACIENTES (CARDS INDIVIDUALES) ─── */}
      {currentItems.length > 0 ? (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 transition-opacity duration-150 ${
            isPlaceholderData ? 'opacity-60' : 'opacity-100'
          }`}
        >
          {currentItems.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onClick={() => navigate(`/patients/${patient.id}`)}
            />
          ))}
        </div>
      ) : (
        /* ─── ESTADO VACÍO ─── */
        <div className="bg-white rounded-2xl border border-slate-200/80 py-16 px-4 text-center shadow-sm space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-2xl">
            🦷
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {searchTerm ? 'No se encontraron coincidencias' : 'No hay pacientes registrados'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? `No se hallaron resultados para "${searchTerm}". Intenta verificar el nombre o número de contacto.`
              : 'Comienza registrando la primera ficha clínica de paciente para esta clínica.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              + Registrar Primer Paciente
            </button>
          )}
        </div>
      )}

      {/* ─── CONTROLES DE PAGINACIÓN ─── */}
      {totalPages > 1 && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-between text-xs">
          <p className="text-slate-600 font-medium">
            Página <span className="font-bold text-slate-900">{currentPage}</span> de{' '}
            <span className="font-bold text-slate-900">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || isPlaceholderData}
              className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Anterior</span>
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || isPlaceholderData}
              className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <span>Siguiente</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL DE CREACIÓN DE PACIENTE ─── */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 text-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Registrar Nuevo Paciente</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>
            <PatientForm
              onSuccess={() => setShowCreateForm(false)}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
