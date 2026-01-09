// lib/auth/constants.ts

/**
 * Estados de usuario (deben coincidir con el ENUM de la BD)
 */
export const ESTADOS_USUARIO = {
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO'
} as const;

export type EstadoUsuario = typeof ESTADOS_USUARIO[keyof typeof ESTADOS_USUARIO];

/**
 * Roles de usuario (deben coincidir con el ENUM de la BD)
 */
export const ROLES_USUARIO = {
  ADMINISTRADOR: 'administrador',
  RECEPCIONISTA: 'recepcionista',
  DISEÑADOR: 'diseñador',
  CORTADOR: 'cortador',
  AYUDANTE: 'ayudante',
  REPRESENTANTE_TALLER: 'representante_taller'
} as const;

export type RolUsuario = typeof ROLES_USUARIO[keyof typeof ROLES_USUARIO];

/**
 * Mensajes de error de autenticación
 */
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Credenciales inválidas. Por favor, intenta de nuevo.",
  USER_NOT_FOUND: "Usuario no encontrado en el sistema.",
  INACTIVE_USER: "Tu cuenta no está activa. Contacta a soporte.",
  UNEXPECTED_ERROR: "Error inesperado. Por favor, intenta de nuevo.",
  NETWORK_ERROR: "Error de conexión. Verifica tu internet.",
  INVALID_EMAIL: "Email inválido.",
  SHORT_PASSWORD: "La contraseña debe tener al menos 6 caracteres."
} as const;

/**
 * Rutas de autenticación y navegación
 */
export const ROUTES = {
  LOGIN: '/admin/login',
  DASHBOARD: '/admin/Panel-Administrativo/dashboard',
  ACCESS_DENIED: '/admin/acceso-denegado'
} as const;

/**
 * Configuración de caché
 */
export const CACHE_CONFIG = {
  USER_TTL: 5 * 60 * 1000, // 5 minutos
  MAX_SIZE: 1000
} as const;