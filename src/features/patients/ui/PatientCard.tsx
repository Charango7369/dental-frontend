import type { Patient } from '../../../types';

interface PatientCardProps {
  patient: Patient;
  onClick: () => void;
}

export const PatientCard = ({ patient, onClick }: PatientCardProps) => {
  // Formateador de fecha seguro y nativo (sin depender de librerías pesadas como moment.js)
  const formatDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat('es-BO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(dateString));
    } catch {
      return 'Fecha inválida';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group relative"
    >
      {/* Indicador de Estado (Activo/Inactivo) */}
      <div className="absolute top-4 right-4">
        <span className={`inline-flex h-2.5 w-2.5 rounded-full ${patient.is_active ? 'bg-green-500' : 'bg-red-400'}`}></span>
      </div>

      {/* Información Principal */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
          {patient.first_name} {patient.last_name}
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Registrado el {formatDate(patient.created_at)}
        </p>
      </div>

      {/* Datos de Contacto */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center text-slate-600">
          <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
          </svg>
          <span className="truncate">{patient.email || 'Sin correo registrado'}</span>
        </div>
        
        <div className="flex items-center text-slate-600">
          <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
          </svg>
          <span className="truncate">{patient.phone || 'Sin teléfono'}</span>
        </div>
      </div>
    </div>
  );
};