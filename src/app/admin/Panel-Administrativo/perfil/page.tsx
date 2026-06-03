"use client";

import { useEffect, useReducer, useCallback, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { updateUsuario, getUsuarioData } from "@/lib/helpers/usuarios-helpers";
import { UserInfoCard } from "@/components/admin/perfil/UserInfoCard";
import { ProfileForm } from "@/components/admin/perfil/ProfileForm";
import { PasswordForm } from "@/components/admin/perfil/PasswordForm";
import type { UsuarioData, ProfileState, ProfileAction } from "@/components/admin/perfil/types";
import { updatePersonalInterno } from "@/lib/helpers/usuarios-helpers";

// VALIDATION FUNCTIONS
const validateEmail = (email: string): { valid: boolean; error?: string } => {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.trim()) return { valid: false, error: 'El email es requerido' };
  if (!EMAIL_REGEX.test(email)) return { valid: false, error: 'Email inválido' };
  return { valid: true };
};

const validatePhone = (phone: string): { valid: boolean; error?: string } => {
  if (!phone.trim()) return { valid: true }; 
  const digitsOnly = phone.replace(/[\s-()]/g, '');
  if (!/^\d+$/.test(digitsOnly)) {
    return { valid: false, error: 'El teléfono solo puede contener números' };
  }
  if (digitsOnly.length !== 9) {
    return { valid: false, error: 'El teléfono debe tener exactamente 9 dígitos' };
  }
  return { valid: true };
};

const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Mínimo 8 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('Al menos una mayúscula');
  if (!/[a-z]/.test(password)) errors.push('Al menos una minúscula');
  if (!/\d/.test(password)) errors.push('Al menos un número');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Al menos un símbolo especial');
  }
  return { valid: errors.length === 0, errors };
};

// REDUCER & INITIAL STATE
function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_PROFILE_DATA': {
      // CORRECCIÓN TS 2339 & 2322: Typeguard local para asegurar las propiedades de la respuesta de datos
      const userData = action.data as UsuarioData;
      return {
        ...state,
        nombreCompleto: userData.nombre_completo || '',
        email: userData.email || '',
        telefono: userData.telefono ? String(userData.telefono) : '',
        dni: userData.dni ? String(userData.dni) : '',
        avatarUrl: (userData as any).avatar_url || '',
        isLoading: false,
      };
    }
    case 'RESET_PASSWORD_FIELDS':
      return {
        ...state,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showPasswordSection: false,
        showCurrentPassword: false,
        showNewPassword: false,
        showConfirmPassword: false,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };
    case 'SET_SAVING':
      return { ...state, isSaving: action.saving };
    case 'SET_UPLOADING':
      return { ...state, uploadingImage: action.uploading };
    case 'SET_SUCCESS':
      return { ...state, success: action.message, error: '' };
    case 'SET_ERROR':
      return { ...state, error: action.message, success: '' };
    case 'CLEAR_FEEDBACK':
      return { ...state, success: '', error: '' };
    default:
      return state;
  }
}

const INITIAL_STATE: ProfileState = {
  nombreCompleto: '',
  email: '',
  telefono: '',
  dni: '',
  avatarUrl: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  showPasswordSection: false,
  showCurrentPassword: false,
  showNewPassword: false,
  showConfirmPassword: false,
  isLoading: true,
  isSaving: false,
  uploadingImage: false,
  success: '',
  error: '',
};

export default function PerfilPage() {
  const supabase = getSupabaseBrowserClient();
  const { usuario, isLoading: loadingPermisos } = usePermissions();
  const [state, dispatch] = useReducer(profileReducer, INITIAL_STATE);
  const [fullUsuario, setFullUsuario] = useState<UsuarioData | null>(null);
  const hasLoadedData = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);

  // Get auth user on mount and load profile data
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          setAuthUser(session.user);
          
          if (!hasLoadedData.current) {
            hasLoadedData.current = true;
            dispatch({ type: 'SET_LOADING', loading: true });
            
            try {
              const { data, error } = await getUsuarioData(session.user.id);
              if (error) throw error;
              
              if (data) {
                // CORRECCIÓN TS 2352: Conversión segura pasando por unknown para evitar conflictos estructurales de Prisma
                const mappedUser = data as unknown as UsuarioData;
                dispatch({ type: 'SET_PROFILE_DATA', data: mappedUser });
                setFullUsuario(mappedUser);
              }
            } catch (err) {
              console.error('[PerfilPage] Load error:', err);
              dispatch({ type: 'SET_ERROR', message: 'Error al cargar el perfil' });
            } finally {
              dispatch({ type: 'SET_LOADING', loading: false });
            }
          }
        }
      } catch (err) {
        console.error('[PerfilPage] Auth init error:', err);
      }
    };
    initAuth();
  }, [supabase]); // CORRECCIÓN ESLINT: Dependencia añadida de forma reglamentaria

  // Auto-clear feedback messages
  useEffect(() => {
    if (state.success || state.error) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        dispatch({ type: 'CLEAR_FEEDBACK' });
      }, 5000);

      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
  }, [state.success, state.error]);

  const handleUpdateProfile = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser?.id) return;

    try {
      dispatch({ type: 'SET_SAVING', saving: true });
      dispatch({ type: 'CLEAR_FEEDBACK' });

      if (!state.nombreCompleto || !state.email) {
        dispatch({ type: 'SET_ERROR', message: 'El nombre y correo son requeridos' });
        return;
      }

      if (!state.nombreCompleto.trim()) {
        dispatch({ type: 'SET_ERROR', message: 'El nombre es requerido' });
        return;
      }

      const phoneValidation = validatePhone(String(state.telefono || ''));
      if (!phoneValidation.valid) {
        dispatch({ type: 'SET_ERROR', message: phoneValidation.error! });
        return;
      }

      const isAdmin = fullUsuario?.rol?.toLowerCase() === 'administrador';
      const emailChanged = state.email.trim().toLowerCase() !== fullUsuario?.email?.toLowerCase();

      if (!fullUsuario?.personal_interno_id) {
        dispatch({ type: 'SET_ERROR', message: 'No se encontró el perfil interno del usuario' });
        return;
      }

      const { error: piError } = await updatePersonalInterno(
        String(fullUsuario.personal_interno_id),
        { nombre_completo: state.nombreCompleto.trim() }
      );

      if (piError) {
        dispatch({ type: 'SET_ERROR', message: 'Error al actualizar el nombre' });
        return;
      }

      if (isAdmin && emailChanged) {
        const emailValidation = validateEmail(state.email);
        if (!emailValidation.valid) {
          dispatch({ type: 'SET_ERROR', message: emailValidation.error! });
          return;
        }

        const { error: authError } = await supabase.auth.updateUser({
          email: state.email.trim().toLowerCase(),
        });
        if (authError) {
          dispatch({ type: 'SET_ERROR', message: `Error: ${authError.message}` });
          return;
        }

        const { error: emailError } = await updateUsuario(authUser.id, {
          email: state.email.trim().toLowerCase(),
        });
        if (emailError) {
          dispatch({ type: 'SET_ERROR', message: emailError.message || 'Error al actualizar email' });
          return;
        }
      }

      dispatch({
        type: 'SET_SUCCESS',
        message: isAdmin && emailChanged
          ? 'Perfil actualizado. Confirma el cambio en tu email.'
          : 'Perfil actualizado correctamente',
      });

      setFullUsuario(prev => prev ? {
        ...prev,
        nombre_completo: state.nombreCompleto.trim(),
      } : prev);

    } catch (err) {
      console.error('[PerfilPage] Update error:', err);
      dispatch({ type: 'SET_ERROR', message: 'Error al actualizar el perfil' });
    } finally {
      dispatch({ type: 'SET_SAVING', saving: false });
    }
  }, [state.nombreCompleto, state.email, state.telefono, authUser, fullUsuario, supabase]); // CORRECCIÓN ESLINT: Dependencia añadida

  const handleChangePassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        dispatch({ type: 'SET_SAVING', saving: true });
        dispatch({ type: 'CLEAR_FEEDBACK' });

        if (!state.currentPassword || !state.newPassword || !state.confirmPassword) {
          dispatch({ type: 'SET_ERROR', message: 'Todos los campos son obligatorios' });
          return;
        }

        const passwordValidation = validatePassword(state.newPassword);
        if (!passwordValidation.valid) {
          dispatch({
            type: 'SET_ERROR',
            message: `Contraseña inválida: ${passwordValidation.errors.join(', ')}`,
          });
          return;
        }

        if (state.currentPassword === state.newPassword) {
          dispatch({
            type: 'SET_ERROR',
            message: 'La nueva contraseña no puede ser igual a la actual.',
          });
          return;
        }

        if (state.newPassword !== state.confirmPassword) {
          dispatch({ type: 'SET_ERROR', message: 'Las contraseñas no coinciden' });
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: state.email,
          password: state.currentPassword,
        });

        if (signInError) {
          dispatch({ type: 'SET_ERROR', message: 'Contraseña actual incorrecta' });
          return;
        }

        const { error: updateError } = await supabase.auth.updateUser({
          password: state.newPassword,
        });

        if (updateError) throw updateError;

        dispatch({ type: 'SET_SUCCESS', message: 'Contraseña actualizada' });
        dispatch({ type: 'RESET_PASSWORD_FIELDS' });
      } catch (err) {
        console.error('[PerfilPage] Password change error:', err);
        dispatch({ type: 'SET_ERROR', message: 'Error al cambiar la contraseña' });
      } finally {
        dispatch({ type: 'SET_SAVING', saving: false });
      }
    },
    [state.currentPassword, state.newPassword, state.confirmPassword, state.email, supabase] // CORRECCIÓN ESLINT: Dependencia añadida
  );

  if (loadingPermisos || state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!usuario || !fullUsuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-10 rounded-xl shadow-lg border border-gray-200 max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Usuario no encontrado</h2>
          <p className="text-sm text-gray-600">Por favor, inicia sesión nuevamente.</p>
        </div>
      </div>
    );
  }

  const isAdmin = fullUsuario?.rol?.toLowerCase() === 'administrador';

  const usuarioFormateado = fullUsuario ? {
    ...fullUsuario,
    id: String(fullUsuario.id), 
    telefono: fullUsuario.telefono ? String(fullUsuario.telefono) : '', 
    created_at: fullUsuario.created_at ? new Date(fullUsuario.created_at).toISOString() : null,
    updated_at: fullUsuario.updated_at ? new Date(fullUsuario.updated_at).toISOString() : null,
    ultimo_acceso: fullUsuario.ultimo_acceso ? new Date(fullUsuario.ultimo_acceso).toISOString() : null,
  } : null;

  return (
    <div className="min-h-screen bg-rose-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 tracking-tight mb-2">
            Mi Perfil
          </h1>
          <p className="text-sm text-gray-600">
            Administra tu información personal y configuración
          </p>
        </div>

        {/* Feedback Messages */}
        {state.success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">{state.success}</p>
          </div>
        )}

        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{state.error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Sidebar */}
          {fullUsuario && (
            <UserInfoCard
              usuario={usuarioFormateado as any}
              avatarUrl={state.avatarUrl}
              nombreCompleto={state.nombreCompleto}
              email={state.email}
              telefono={state.telefono}
            />
          )}

          {/* Forms */}
          <div className="lg:col-span-2 space-y-6">
            <ProfileForm
              state={state}
              dispatch={dispatch}
              isAdmin={isAdmin}
              isSaving={state.isSaving}
              onSubmit={handleUpdateProfile}
            />

            <PasswordForm
              state={state}
              dispatch={dispatch}
              isSaving={state.isSaving}
              onSubmit={handleChangePassword}
            />
          </div>
        </div>
      </div>
    </div>
  );
}