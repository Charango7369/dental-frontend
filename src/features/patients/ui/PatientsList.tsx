import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '../hooks/usePatients';
import { PatientCard } from './PatientCard';
import { PatientForm } from './PatientForm';
import { useDebounce } from '../../../hooks/useDebounce'; // 🚨 Importa el hook del Paso 1

const ITEMS_PER_PAGE = 9; // Grid de 3x3 perfecto para escritorio

export const PatientsList = () => {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);

  // --- ESTADO DE BÚSQUEDA Y PAGINACIÓN ---
  const [searchTerm, setSearchTerm] = useState('');
  // Retrasamos la búsqueda real 500ms para proteger la API
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);

  // --- CÁLCULO DE PARÁMETROS PARA LA API (A UUID/INT SAFE ZONE) ---
  const params = {
    limit: ITEMS_PER_PAGE,
    skip: (currentPage - 1) * ITEMS_PER_PAGE, // Convertimos página a offset (0, 9, 18...)
    search: debouncedSearch.trim() || undefined, // Si está vacío, no enviamos el param
    active_only: true
  };

  // --- HOOK DE RED (PAGINADO) ---
  const { 
    data: patients, 
    isLoading, 
    isError, 
    error,
    isPlaceholderData // 🚨 MÁGIA DE UX: Mantiene la página vieja mientras carga la nueva
  } = usePatients(params);

  // --- LÓGICA DE PAGINACIÓN BLINDADA ---
  // Accedemos de forma segura a total y items (evitando crashes si data es undefined)
  const totalRecords = patients?.total || 0;
  const currentItems = patients?.items || [];
  
  // Math.ceil blindado contra total = 0
  const totalPages = totalRecords > 0 ? Math.ceil(totalRecords / ITEMS_PER_PAGE) : 1;

  // Resetear a página 1 si cambia la búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Importante: volver a la página 1 al buscar
  };

  // --- RENDERIZADO DE ESTADOS DE CARGA Y ERROR ---
  if (isLoading && !isPlaceholderData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <p className="font-medium">Cargando base de datos de pacientes...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center shadow-sm">
        <h3 className="font-bold text-lg mb-2">Colapso de Red</h3>
        <p className="text-sm font-medium">{error?.message || 'No pudimos conectar con el servidor de ApoloDigital.'}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* HEADER Y ACCIONES */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Pacientes</h1>
          <p className="text-slate-500 mt-1">Total registrados en clínica: <span className="font-semibold text-slate-700">{totalRecords}</span></p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
          Registrar Nuevo
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA BLINDADA */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Buscar por nombre, apellido o teléfono..."
            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:text-slate-400 text-slate-700"
          />
        </div>
        {/* Spinner de búsqueda pequeño (opcional pero UX TOP) */}
        {isLoading && isPlaceholderData && (
            <div className="absolute right-7 top-1/2 -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        )}
      </div>

      {/* GRID DE PACIENTES (EL MAP REPARADO) */}
      {currentItems.length > 0 ? (
        // Aplicamos opacidad suave si está cargando la siguiente página (Placeholder Data UX)
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-150 ${isPlaceholderData ? 'opacity-60' : 'opacity-100'}`}>
          {currentItems.map((patient) => (
            <PatientCard
              key={patient.id} // UUID Safe
              patient={patient}
              onClick={() => navigate(`/patients/${patient.id}`)}
            />
          ))}
        </div>
      ) : (
        // ESTADO VACÍO (Si la búsqueda no da resultados)
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-16 text-center shadow-inner">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          <h3 className="text-xl font-semibold text-slate-700">No se encontraron pacientes</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">Intenta ajustar los términos de búsqueda o registra un paciente nuevo en la clínica.</p>
        </div>
      )}

      {/* CONTROLES DE PAGINACIÓN (FÓRMULAS MATEMÁTICAS PROTEGIDAS) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-8 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-600 font-medium">
            Página <span className="font-bold text-slate-800">{currentPage}</span> de <span className="font-bold text-slate-800">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || isPlaceholderData}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || isPlaceholderData}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              Siguiente
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE CREACIÓN */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-5">Registrar Nuevo Paciente</h2>
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