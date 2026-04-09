'use client';

import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import type { ProfileState, ProfileAction } from './types';

interface PasswordFormProps {
  state: ProfileState;
  dispatch: React.Dispatch<ProfileAction>;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

/**
 * Valida que la contraseña cumpla con los requisitos:
 * - Mínimo 8 caracteres
 * - Al menos una mayúscula
 * - Al menos una minúscula
 * - Al menos un número
 * - Al menos un símbolo especial
 */
const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Al menos una mayúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Al menos una minúscula');
  }
  if (!/\d/.test(password)) {
    errors.push('Al menos un número');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Al menos un símbolo especial (!@#$%^&* etc)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

function PasswordRequirements({ password }: { password: string }) {
  const validation = validatePassword(password);
  const requirements = [
    { text: 'Mínimo 8 caracteres', met: password.length >= 8 },
    { text: 'Una mayúscula (A-Z)', met: /[A-Z]/.test(password) },
    { text: 'Una minúscula (a-z)', met: /[a-z]/.test(password) },
    { text: 'Un número (0-9)', met: /\d/.test(password) },
    { text: 'Un símbolo (!@#$%^&* etc)', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];

  return (
    <div className="mt-3 space-y-2 p-3 bg-gray-50 rounded-lg">
      {requirements.map((req, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
            req.met 
              ? 'bg-green-100 border-green-300 text-green-600' 
              : 'bg-gray-100 border-gray-300'
          }`}>
            {req.met && '✓'}
          </div>
          <span className={`text-xs ${req.met ? 'text-gray-700' : 'text-gray-500'}`}>
            {req.text}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PasswordForm({
  state,
  dispatch,
  isSaving,
  onSubmit,
}: PasswordFormProps) {
  const passwordValidation = state.newPassword ? validatePassword(state.newPassword) : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Lock className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Seguridad</h2>
            <p className="text-sm text-gray-500">Cambia tu contraseña</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {!state.showPasswordSection ? (
          <button
            onClick={() => dispatch({ type: 'SET_FIELD', field: 'showPasswordSection', value: true })}
            className="w-full px-4 py-2.5 border-2 border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Cambiar contraseña
          </button>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña actual <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={state.showCurrentPassword ? 'text' : 'password'}
                  value={state.currentPassword}
                  onChange={(e) =>
                    dispatch({ type: 'SET_FIELD', field: 'currentPassword', value: e.target.value })
                  }
                  required
                  disabled={isSaving}
                  className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: 'SET_FIELD',
                      field: 'showCurrentPassword',
                      value: !state.showCurrentPassword,
                    })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {state.showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={state.showNewPassword ? 'text' : 'password'}
                  value={state.newPassword}
                  onChange={(e) =>
                    dispatch({ type: 'SET_FIELD', field: 'newPassword', value: e.target.value })
                  }
                  required
                  disabled={isSaving}
                  className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: 'SET_FIELD',
                      field: 'showNewPassword',
                      value: !state.showNewPassword,
                    })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {state.showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {state.newPassword && <PasswordRequirements password={state.newPassword} />}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={state.showConfirmPassword ? 'text' : 'password'}
                  value={state.confirmPassword}
                  onChange={(e) =>
                    dispatch({ type: 'SET_FIELD', field: 'confirmPassword', value: e.target.value })
                  }
                  required
                  disabled={isSaving}
                  className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: 'SET_FIELD',
                      field: 'showConfirmPassword',
                      value: !state.showConfirmPassword,
                    })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {state.showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {state.confirmPassword && state.newPassword !== state.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => dispatch({ type: 'RESET_PASSWORD_FIELDS' })}
                disabled={isSaving}
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving || !passwordValidation?.valid}
                className="flex-1 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  'Actualizar contraseña'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
