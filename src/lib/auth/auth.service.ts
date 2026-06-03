import { getSupabaseBrowserClient } from "@/lib/supabase";
import { invalidateUserCache } from "@/lib/cache";
import type { usuarios } from '@prisma/client';

// ============================================
// TIPOS Y CONSTANTES
// ============================================

// Usar tipo generado desde la base de datos
export const ROLES_SISTEMA = {
  administrador: 'administrador',
  recepcionista: 'recepcionista',
  diseñador: 'disenador',
  cortador: 'cortador',
  gerente: 'gerente',
  ayudante: 'ayudante',
  representante_taller: 'representante_taller',
  cliente: 'cliente'
} as const;

export type RolValido = typeof ROLES_SISTEMA[keyof typeof ROLES_SISTEMA];

export interface LoginResult {
  success: boolean;
  error?: string;
  usuario?: usuarios;
}

const ESTADO_ACTIVO = 'ACTIVO'; 

const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Credenciales inválidas. Por favor, intenta de nuevo.",
  USER_NOT_FOUND: "Error obteniendo datos del usuario.",
  INACTIVE_USER: "Tu cuenta no está activa. Contacta a soporte.",
  UNEXPECTED_ERROR: "Ocurrió un error. Por favor, intenta de nuevo.",
  NETWORK_ERROR: "Error de conexión. Verifica tu internet."
} as const;

// ============================================
// VALIDACIONES
// ============================================

/**
 * Valida formato de email
 */
function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida el estado del usuario
 */
function isUserActive(estado: string | undefined): boolean {
  return estado?.toString().toUpperCase().trim() === ESTADO_ACTIVO;
}

// ============================================
// OPERACIONES DE BASE DE DATOS
// ============================================

/**
 * Obtiene los datos del usuario desde la base de datos
 */
async function fetchUserByAuthId(authId: string): Promise<usuarios | null> {
  try {
    const { data, error } = await getSupabaseBrowserClient()
      .from('usuarios')
      .select('id, auth_id, rol, estado, nombre_completo, email, ultimo_acceso')
      .eq('auth_id', authId)
      .maybeSingle();

    if (error) {
      console.error('[Auth] DB query error:', error);
      return null;
    }

    return (data || null) as usuarios | null;
  } catch (err) {
    console.error('[Auth] Unexpected error fetching user:', err);
    return null;
  }
}

/**
 * Actualiza la fecha del último acceso del usuario
 */
async function updateLastAccess(userId: number): Promise<void> {
  try {
    await (getSupabaseBrowserClient())
      .from('usuarios')
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq('id', userId);
  } catch (err) {
    // Error no crítico - no bloquea el flujo
    console.warn('[Auth] Failed to update last access:', err);
  }
}

// ============================================
// SERVICIOS DE AUTENTICACIÓN
// ============================================

/**
 * Autentica un usuario con email y contraseña
 * Compatible con SSR middleware
 */
export async function loginUser(
  email: string, 
  password: string
): Promise<LoginResult> {
  // Validación de entrada
  const cleanEmail = email.trim().toLowerCase();
  
  if (!validateEmail(cleanEmail)) {
    return { 
      success: false, 
      error: "Email inválido" 
    };
  }

  if (!password || password.length < 6) {
    return { 
      success: false, 
      error: "Contraseña debe tener al menos 6 caracteres" 
    };
  }

  try {
    // 1. Autenticación con Supabase Auth
    const { data: authData, error: authError } = await getSupabaseBrowserClient().auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (authError || !authData.user) {
      console.error('[Auth] Authentication failed:', authError?.message);
      return { 
        success: false, 
        error: ERROR_MESSAGES.INVALID_CREDENTIALS 
      };
    }

    // 2. Obtener datos del usuario
    const usuario = await fetchUserByAuthId(authData.user.id);

    if (!usuario) {
      await getSupabaseBrowserClient().auth.signOut();
      return { success: false, error: ERROR_MESSAGES.USER_NOT_FOUND };
    }

    console.log('[Auth] Usuario autenticado con rol:', usuario.rol);
    
    // 3. Validar estado activo
    if (!isUserActive(usuario.estado ?? undefined)) {
      await getSupabaseBrowserClient().auth.signOut();
      invalidateUserCache(authData.user.id);
      return { 
        success: false, 
        error: ERROR_MESSAGES.INACTIVE_USER 
      };
    }

    // 4. Actualizar último acceso (async, no bloqueante)
    updateLastAccess(Number(usuario.id));

    // 5. Login exitoso
    return { 
      success: true, 
      usuario 
    };

  } catch (err) {
    console.error('[Auth] Unexpected login error:', err);

    // // Detectar errores de red
    if (err instanceof Error && (err.message.includes('fetch') || err.message.includes('network'))) { 
      return {
        success: false,
        error: ERROR_MESSAGES.NETWORK_ERROR
      };
    }

    // Opcional: Manejo para cualquier otro error genérico que no sea de red
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido'
    };
  }
}

/**
 * Cierra la sesión del usuario actual
 * Limpia caché y cookies
 */
export async function logoutUser(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await getSupabaseBrowserClient().auth.getUser();
    
    if (user) {
      invalidateUserCache(user.id);
    }

    const { error } = await getSupabaseBrowserClient().auth.signOut();
    
    if (error) {
      console.error('[Auth] Logout error:', error);
      return { success: false, error: 'Error al cerrar sesión' };
    }

    return { success: true };
  } catch (err) {
    console.error('[Auth] Unexpected logout error:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Obtiene la sesión actual del usuario
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await getSupabaseBrowserClient().auth.getSession();
    
    if (error) {
      console.error('[Auth] Session error:', error);
      return null;
    }

    return session;
  } catch (err) {
    console.error('[Auth] Unexpected session error:', err);
    return null;
  }
}

/**
 * Obtiene el usuario actual completo (auth + BD)
 */
export async function getCurrentUser(): Promise<usuarios | null> {
  try {
    const { data: { user } } = await getSupabaseBrowserClient().auth.getUser();
    
    if (!user) {
      return null;
    }

    return await fetchUserByAuthId(user.id);
  } catch (err) {
    console.error('[Auth] Get current user error:', err);
    return null;
  }
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export async function hasRole(allowedRoles: RolValido[]): Promise<boolean> {
  const usuario = await getCurrentUser();
  
  if (!usuario || !usuario.rol) {
    return false;
  }

  // Aseguramos que la comparación sea case-insensitive
  const rolUsuario = usuario.rol.toLowerCase().trim();
  return allowedRoles.some(r => r.toLowerCase() === rolUsuario);
}