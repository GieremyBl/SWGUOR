'use client';

import { Lock, Eye, EyeOff, Loader2, Check, AlertCircle } from "lucide-react";
import { useMemo } from "react";
import type { ProfileState, ProfileAction } from './types';

interface PasswordFormProps {
  state: ProfileState;
  dispatch: React.Dispatch<ProfileAction>;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

// ─── Password checks ──────────────────────────────────────────────────────────

interface PasswordChecks {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  symbol: boolean;
}

function getPasswordChecks(password: string): PasswordChecks {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
}

// ─── Strength levels ──────────────────────────────────────────────────────────

interface StrengthInfo {
  score: number;
  label: string;
  segmentColor: string;
  textColor: string;
  filledSegments: number;
}

function getStrengthInfo(password: string, checks: PasswordChecks): StrengthInfo {
  if (!password) {
    return { score: 0, label: '', segmentColor: 'bg-gray-200', textColor: 'text-gray-400', filledSegments: 0 };
  }
  const score = Object.values(checks).filter(Boolean).length;
  switch (score) {
    case 1: return { score, label: 'Muy débil',   segmentColor: 'bg-red-600',    textColor: 'text-red-600',    filledSegments: 1 };
    case 2: return { score, label: 'Débil',        segmentColor: 'bg-orange-500', textColor: 'text-orange-500', filledSegments: 2 };
    case 3: return { score, label: 'Intermedio',   segmentColor: 'bg-amber-400',  textColor: 'text-amber-500',  filledSegments: 3 };
    case 4: return { score, label: 'Fuerte',       segmentColor: 'bg-lime-500',   textColor: 'text-lime-600',   filledSegments: 4 };
    case 5: return { score, label: 'Muy fuerte',   segmentColor: 'bg-green-500',  textColor: 'text-green-600',  filledSegments: 5 };
    default: return { score, label: 'Muy débil',   segmentColor: 'bg-red-600',    textColor: 'text-red-600',    filledSegments: 1 };
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const checks = getPasswordChecks(password);
  const errors: string[] = [];
  if (!checks.length)    errors.push('Mínimo 8 caracteres');
  if (!checks.uppercase) errors.push('Al menos una mayúscula');
  if (!checks.lowercase) errors.push('Al menos una minúscula');
  if (!checks.number)    errors.push('Al menos un número');
  if (!checks.symbol)    errors.push('Al menos un símbolo especial (!@#$%^&* etc)');
  return { valid: errors.length === 0, errors };
};

// ─── Requirement row ──────────────────────────────────────────────────────────

function RequirementRow({ met, label }: { met: boolean; label: string }) {
  return (
    <span className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors duration-200 ${met ? 'text-green-600' : 'text-gray-400'}`}>
      {met
        ? <Check className="w-3 h-3 text-green-500 shrink-0" />
        : <AlertCircle className="w-3 h-3 text-gray-300 shrink-0" />
      }
      {label}
    </span>
  );
}

// ─── Strength block ───────────────────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  const checks   = useMemo(() => getPasswordChecks(password), [password]);
  const strength = useMemo(() => getStrengthInfo(password, checks), [password, checks]);

  return (
    <div className="mt-3 space-y-2.5 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((seg) => (
          <div
            key={seg}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              seg <= strength.filledSegments ? strength.segmentColor : 'bg-gray-200'
            }`}
          />
        ))}
        <span className={`text-[11px] font-semibold ml-1 w-20 shrink-0 ${strength.textColor}`}>
          {strength.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-0.5">
        <RequirementRow met={checks.length}    label="Mínimo 8 caracteres" />
        <RequirementRow met={checks.uppercase} label="Una mayúscula (A-Z)" />
        <RequirementRow met={checks.lowercase} label="Una minúscula (a-z)" />
        <RequirementRow met={checks.number}    label="Un número (0-9)" />
        <RequirementRow met={checks.symbol}    label="Un símbolo (@, #, !…)" />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PasswordForm({ state, dispatch, isSaving, onSubmit }: PasswordFormProps) {
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
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'currentPassword', value: e.target.value })}
                  required
                  disabled={isSaving}
                  className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_FIELD', field: 'showCurrentPassword', value: !state.showCurrentPassword })}
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
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'newPassword', value: e.target.value })}
                  required
                  disabled={isSaving}
                  className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_FIELD', field: 'showNewPassword', value: !state.showNewPassword })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {state.showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {state.newPassword && <PasswordStrength password={state.newPassword} />}
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
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'confirmPassword', value: e.target.value })}
                  required
                  disabled={isSaving}
                  className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_FIELD', field: 'showConfirmPassword', value: !state.showConfirmPassword })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {state.showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {state.confirmPassword && state.newPassword !== state.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
              )}
            </div>

            {/* Actions */}
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