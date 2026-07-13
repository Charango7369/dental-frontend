import { useState, type FormEvent } from 'react';
import { useCreatePatient, useUpdatePatient } from '../hooks/usePatients';
import type { PatientCreate, PatientUpdate } from '../services/patients.service';
import type { Patient } from '../../../types';

interface PatientFormProps {
  initialData?: Patient; // 🚨 La nueva llave maestra: si existe, estamos editando
  onSuccess: () => void;
  onCancel: () => void;
}

export const PatientForm = ({ initialData, onSuccess, onCancel }: PatientFormProps) => {
  // Bandera booleana para bifurcar la UI y la lógica
  const isEditing = !!initialData;

  // Inicializamos ambas mutaciones (TanStack Query las mantendrá inactivas hasta que las llamemos)
  const { mutateAsync: createMutate, isPending: isCreating, error: createError } = useCreatePatient();
  const { mutateAsync: updateMutate, isPending: isUpdating, error: updateError } = useUpdatePatient();

  const isPending = isCreating || isUpdating;
  const activeError = isEditing ? updateError : createError;

  // 1. Inicialización Blindada contra Nulos (Prevención de Uncontrolled Components)
  const [formData, setFormData] = useState({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing && initialData) {
        // 🚨 MODO EDICIÓN: Solo enviamos los campos que se pueden modificar
        const payload: PatientUpdate = {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
        };
        
        await updateMutate({ id: initialData.id, data: payload });
      } else {
        // 🟢 MODO CREACIÓN
        const payload: PatientCreate = {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
        };
        
        await createMutate(payload);
      }
      
      onSuccess();
    } catch (err) {
      console.error(`Fallo al ${isEditing ? 'actualizar' : 'crear'} paciente:`, err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Alerta de Error Dinámica */}
      {activeError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-200 shadow-sm">
          {activeError.message || 'Ocurrió un error inesperado al guardar.'}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nombre(s) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="first_name"
            required
            maxLength={255}
            value={formData.first_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
            disabled={isPending}
            placeholder="Ej. Ana"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Apellido(s) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="last_name"
            required
            maxLength={255}
            value={formData.last_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
            disabled={isPending}
            placeholder="Ej. Condori"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Correo Electrónico
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
          disabled={isPending}
          placeholder="paciente@correo.com (Opcional)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Teléfono / Celular
        </label>
        <input
          type="tel"
          name="phone"
          maxLength={50}
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
          disabled={isPending}
          placeholder="+591 ... (Opcional)"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
        >
          {isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              {isEditing ? 'Actualizando...' : 'Guardando...'}
            </>
          ) : (
            isEditing ? 'Guardar Cambios' : 'Registrar Paciente'
          )}
        </button>
      </div>
    </form>
  );
};