'use client';

import { User, Save, Loader2 } from "lucide-react";
import type { ProfileState, ProfileAction } from './types';

interface ProfileFormProps {
  state: ProfileState;
  dispatch: React.Dispatch<ProfileAction>;
  isAdmin: boolean;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function ProfileForm({
  state,
  dispatch,
  isAdmin,
  isSaving,
  onSubmit,
}: ProfileFormProps) {
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Solo permitir números, espacios y caracteres de formato
    value = value.replace(/[^\d\s+\-()]/g, '');
    // Limitar a máximo 9 dígitos
    const digitCount = (value.match(/\d/g) || []).length;
    if (digitCount <= 9) {
      dispatch({ type: 'SET_FIELD', field: 'telefono', value });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Datos personales</h2>
            <p className="text-sm text-gray-500">Actualiza tu información</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={state.nombreCompleto}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'nombreCompleto', value: e.target.value })}
            required
            disabled={isSaving}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors disabled:bg-gray-50"
            placeholder="Juan Pérez"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email corporativo
          </label>
          <input
            type="email"
            value={state.email}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })}
            disabled={!isAdmin || isSaving}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">
            {isAdmin
              ? 'Como administrador, puedes cambiar tu email.'
              : 'Contacta al administrador para cambiar el email.'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono
          </label>
          <input
            type="tel"
            value={String(state.telefono || '')}
            onChange={handlePhoneChange}
            disabled={isSaving}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors disabled:bg-gray-50"
            placeholder="+51 987 654 321"
          />
          <p className="text-xs text-gray-500 mt-1">Máximo 9 dígitos (números, espacios y caracteres de formato)</p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar cambios
            </>
          )}
        </button>
      </form>
    </div>
  );
}
