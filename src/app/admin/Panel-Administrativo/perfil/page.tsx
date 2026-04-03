"use client";

import { useState, useEffect, useReducer, useCallback, useRef } from "react";
import { User, Lock, Save, AlertCircle, CheckCircle2, Shield, Calendar, Camera, Eye, EyeOff, Mail, Phone, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { updateUsuario, getUsuarioData } from "@/lib/helpers/usuarios-helpers";

// ============================================================================
// TYPES
// ============================================================================

interface UsuarioData {
  id: number;
  nombre_completo: string;
  email: string;
  rol: string;
  estado: string;
  telefono?: string | null;
  avatar_url?: string | null;
  created_at: string;
  ultimo_acceso?: string | null;
}

interface ProfileState {
  // Form data
  nombreCompleto: string;
  email: string;
  telefono: string;
  avatarUrl: string;
  
  // Password change
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  showPasswordSection: boolean;
  
  // Password visibility
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  
  // UI state
  isLoading: boolean;
  isSaving: boolean;
  uploadingImage: boolean;
  
  // Feedback
  success: string;
  error: string;
}

type ProfileAction =
  | { type: 'SET_FIELD'; field: keyof ProfileState; value: any }
  | { type: 'SET_PROFILE_DATA'; data: Partial<UsuarioData> }
  | { type: 'RESET_PASSWORD_FIELDS' }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'SET_UPLOADING'; uploading: boolean }
  | { type: 'SET_SUCCESS'; message: string }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'CLEAR_FEEDBACK' };

// ============================================================================
// CONSTANTS & VALIDATION
// ============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s-()]{9,}$/;
const MIN_PASSWORD_LENGTH = 6;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

const INITIAL_STATE: ProfileState = {
  nombreCompleto: '',
  email: '',
  telefono: '',
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

// ============================================================================
// REDUCER
// ============================================================================

function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
      
    case 'SET_PROFILE_DATA':
      return {
        ...state,
        nombreCompleto: action.data.nombre_completo || '',
        email: action.data.email || '',
        telefono: action.data.telefono || '',
        avatarUrl: action.data.avatar_url || '',
        isLoading: false,
      };
      
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

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email.trim()) return { valid: false, error: 'El email es requerido' };
  if (!EMAIL_REGEX.test(email)) return { valid: false, error: 'Email inválido' };
  return { valid: true };
};

const validatePhone = (phone: string): { valid: boolean; error?: string } => {
  if (!phone.trim()) return { valid: true }; // Optional field
  if (!PHONE_REGEX.test(phone)) return { valid: false, error: 'Formato de teléfono inválido' };
  return { valid: true };
};

const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, error: `Mínimo ${MIN_PASSWORD_LENGTH} caracteres` };
  }
  return { valid: true };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PerfilPage() {
  const { personal, isLoading: loadingPermisos } = usePermissions();
  const [state, dispatch] = useReducer(profileReducer, INITIAL_STATE);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<any>(null);
  const hasLoadedData = useRef(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Load user data only once when user ID is available
  useEffect(() => {
    if (personal?.id && !hasLoadedData.current) {
      hasLoadedData.current = true;
      loadUserData();
    }
  }, [personal?.id]);

  // Auto-clear feedback messages
  useEffect(() => {
    if (state.success || state.error) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
      dispatch({ type: 'CLEAR_FEEDBACK' });
      }, 5000);
      
      return () => clearTimeout(timeoutRef.current);
    }
 }, [state.success, state.error]);


  // ============================================================================
  // HANDLERS
  // ============================================================================

  const loadUserData = useCallback(async () => {
    if (!personal?.id) return;
    
    try {
      dispatch({ type: 'SET_LOADING', loading: true });
      const { data, error } = await getUsuarioData(String(personal.id));

      if (error) throw new Error('Error al cargar datos');
      if (data) {
        dispatch({ type: 'SET_PROFILE_DATA', data: data as UsuarioData });
      }
    } catch (err) {
      console.error('[PerfilPage] Load error:', err);
      dispatch({ type: 'SET_ERROR', message: 'Error al cargar el perfil' });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, [personal]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !personal?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      dispatch({ type: 'SET_ERROR', message: 'Solo se permiten imágenes' });
      return;
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      dispatch({ type: 'SET_ERROR', message: 'La imagen no debe superar 2MB' });
      return;
    }

    try {
      dispatch({ type: 'SET_UPLOADING', uploading: true });
      dispatch({ type: 'CLEAR_FEEDBACK' });
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${personal.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update database
      const { error: updateError } = await updateUsuario(String(personal.id), {
        avatar_url: publicUrl,
      });

      if (updateError) throw updateError;

      dispatch({ type: 'SET_FIELD', field: 'avatarUrl', value: publicUrl });
      dispatch({ type: 'SET_SUCCESS', message: 'Foto actualizada' });
    } catch (err) {
      console.error('[PerfilPage] Upload error:', err);
      dispatch({ type: 'SET_ERROR', message: 'Error al subir la imagen' });
    } finally {
      dispatch({ type: 'SET_UPLOADING', uploading: false });
    }
  }, [personal]);

  const handleUpdateProfile = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personal?.id) return;
    
    try {
      dispatch({ type: 'SET_SAVING', saving: true });
      dispatch({ type: 'CLEAR_FEEDBACK' });

      // Validate nombre
      if (!state.nombreCompleto.trim()) {
        dispatch({ type: 'SET_ERROR', message: 'El nombre es requerido' });
        return;
      }

      // Validate telefono if provided
      const phoneValidation = validatePhone(state.telefono);
      if (!phoneValidation.valid) {
        dispatch({ type: 'SET_ERROR', message: phoneValidation.error! });
        return;
      }

      const isAdmin = personal.rol?.toLowerCase() === 'administrador';
      const emailChanged = state.email.trim().toLowerCase() !== personal.email?.toLowerCase();

      // Handle email change for admin
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
      }

      // Update profile
      const updateData: Record<string, any> = {
        nombre_completo: state.nombreCompleto.trim(),
        telefono: state.telefono.trim() || null,
      };

      if (isAdmin && emailChanged) {
        updateData.email = state.email.trim().toLowerCase();
      }

      const { error: updateError } = await updateUsuario(String(personal.id), updateData);
      if (updateError) throw updateError;

      dispatch({
        type: 'SET_SUCCESS',
        message: isAdmin && emailChanged
          ? 'Perfil actualizado. Confirma el cambio en tu email.'
          : 'Perfil actualizado correctamente',
      });
    } catch (err) {
      console.error('[PerfilPage] Update error:', err);
      dispatch({ type: 'SET_ERROR', message: 'Error al actualizar el perfil' });
    } finally {
      dispatch({ type: 'SET_SAVING', saving: false });
    }
  }, [state.nombreCompleto, state.email, state.telefono, personal]);

  const handleChangePassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      dispatch({ type: 'SET_SAVING', saving: true });
      dispatch({ type: 'CLEAR_FEEDBACK' });

      // Validate all fields present
      if (!state.currentPassword || !state.newPassword || !state.confirmPassword) {
        dispatch({ type: 'SET_ERROR', message: 'Completa todos los campos' });
        return;
      }

      // Validate new password
      const passwordValidation = validatePassword(state.newPassword);
      if (!passwordValidation.valid) {
        dispatch({ type: 'SET_ERROR', message: passwordValidation.error! });
        return;
      }

      // Validate passwords match
      if (state.newPassword !== state.confirmPassword) {
        dispatch({ type: 'SET_ERROR', message: 'Las contraseñas no coinciden' });
        return;
      }

      // Verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: state.email,
        password: state.currentPassword,
      });

      if (signInError) {
        dispatch({ type: 'SET_ERROR', message: 'Contraseña actual incorrecta' });
        return;
      }

      // Update password
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
  }, [state.currentPassword, state.newPassword, state.confirmPassword, state.email]);

  // ============================================================================
  // RENDER: LOADING STATE
  // ============================================================================

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

  // ============================================================================
  // RENDER: ERROR STATE
  // ============================================================================

  if (!personal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-10 rounded-xl shadow-lg border border-gray-200 max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">personal no encontrado</h2>
          <p className="text-sm text-gray-600">Por favor, inicia sesión nuevamente.</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: MAIN CONTENT
  // ============================================================================

  const isAdmin = personal.rol?.toLowerCase() === 'administrador';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
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
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="h-24 bg-gradient-to-br from-gray-100 to-gray-200" />
              
              <div className="relative px-6 pb-6">
                {/* Avatar */}
                <div className="flex flex-col items-center -mt-12 mb-6">
                  <div className="relative group">
                    {state.avatarUrl ? (
                      <img
                        src={state.avatarUrl}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                        <User className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={state.uploadingImage}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {state.uploadingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  <h3 className="font-medium text-lg text-gray-900 mt-4 mb-1">
                    {state.nombreCompleto}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    {state.email}
                  </p>
                  {state.telefono && (
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                      <Phone className="w-4 h-4" />
                      {state.telefono}
                    </p>
                  )}
                </div>

                {/* User Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Rol</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {personal.rol?.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Estado</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                        {personal.estado}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Miembro desde</p>
                      <p className="text-sm font-medium text-gray-900">
                        {(personal as any).created_at
                          ? new Date((personal as any).created_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          : 'Sin fecha'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Forms */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Profile Form */}
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

              <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={state.nombreCompleto}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'nombreCompleto', value: e.target.value })}
                    required
                    disabled={state.isSaving}
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
                    disabled={!isAdmin || state.isSaving}
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
                    value={state.telefono}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'telefono', value: e.target.value })}
                    disabled={state.isSaving}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors disabled:bg-gray-50"
                    placeholder="+51 987 654 321"
                  />
                </div>

                <button
                  type="submit"
                  disabled={state.isSaving}
                  className="w-full px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {state.isSaving ? (
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

            {/* Password Form */}
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
                  <form onSubmit={handleChangePassword} className="space-y-5">
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
                          disabled={state.isSaving}
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
                          disabled={state.isSaving}
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
                      <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
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
                          disabled={state.isSaving}
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
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'RESET_PASSWORD_FIELDS' })}
                        disabled={state.isSaving}
                        className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={state.isSaving}
                        className="flex-1 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                      >
                        {state.isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Actualizando...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            Actualizar
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}