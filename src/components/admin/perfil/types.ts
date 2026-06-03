import { type Cargo } from '@prisma/client';

// ── Tipos de Soporte para Relaciones ───────────────────────────
export interface PersonalInternoBase {
  id: number | string | bigint;
  nombre_completo: string | null;
  cargo: Cargo | string | null;
  dni: number | string | bigint | null;
  telefono: number | string | bigint | null;
  fecha_ingreso: string | null;
  usuario_id: number | string | bigint | null;
}

export interface ClienteBase {
  id: number | string | bigint;
  nombre_completo: string | null;
  telefono: string | null;
  dni_ruc: string | null;
  direccion: string | null;
}

// ── Definición de Datos de Usuario ─────────────────────────────
export type UsuarioData = {
  id: number | string | bigint;
  email: string;
  rol: 'administrador' | 'cortador' | 'disenador' | 'recepcionista' | 'ayudante' | 'representante_taller' | 'cliente' | 'gerente' | null;
  estado: 'activo' | 'inactivo' | 'suspendido' | null;
  created_at: string | null;
  updated_at: string | null;
  ultimo_acceso: string | null;
  auth_id: string | null;
  created_by: string | null;
  
  // Soporta tanto la propiedad mapeada directa como la estructura relacional nativa (objeto u objeto en array)
  personal_interno_id?: number | string | bigint | null;
  personal_interno?: PersonalInternoBase | PersonalInternoBase[] | null;
  
  // Campos aplanados/inyectados por helpers de servicio
  nombre_completo?: string | null;
  telefono?: number | string | bigint | null;
  dni?: number | string | bigint | null;
  
  // Relación con clientes por si el usuario posee un perfil comercial de cliente
  clientes?: ClienteBase | ClienteBase[] | null;
};

// ── Estado del Formulario de Perfil (UI) ────────────────────────
export interface ProfileState {
  nombreCompleto: string;
  email: string;
  telefono: string; 
  dni: string;     
  avatarUrl: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  showPasswordSection: boolean;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  isLoading: boolean;
  isSaving: boolean;
  uploadingImage: boolean;
  success: string;
  error: string;
}

// ── Reducer Actions con Tipado Seguro Discriminado ─────────────

// Tipo auxiliar: genera una unión de { type, field, value } por cada campo de ProfileState
type SetFieldAction = {
  [K in keyof ProfileState]: {
    type: 'SET_FIELD';
    field: K;
    value: ProfileState[K];
  };
}[keyof ProfileState];

export type ProfileAction =
  | SetFieldAction
  | { type: 'SET_PROFILE_DATA'; data: Partial<ProfileState> | UsuarioData }
  | { type: 'RESET_PASSWORD_FIELDS' }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'SET_UPLOADING'; uploading: boolean }
  | { type: 'SET_SUCCESS'; message: string }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'CLEAR_FEEDBACK' };