/**
 * Archivo de índice para exportar todas las funciones helpers y hooks
 * Facilita las importaciones en todo el proyecto
 */

// ==================== CONSTANTES ====================
export * from './constants/estados';
export * from './constants/roles';

// ==================== HELPERS ====================
export * from './helpers/format-helpers';
export * from './helpers/productos-helpers';
export * from './helpers/ordenes-helpers';
export * from './helpers/usuarios-helpers';

// ==================== HOOKS ====================
export * from './hooks/useAuth';
export * from './hooks/useInventory';
export * from './hooks/useOrders';
export * from './hooks/usePermissions';
export * from './hooks/useProducts';

// ==================== TIPOS ====================
export type * from './helpers/format-helpers';
export type * from './helpers/productos-helpers';
export type * from './helpers/ordenes-helpers';
export type * from './helpers/usuarios-helpers';

// ==================== UTILIDADES ====================
export * from './supabase/client';
export * from './cache';
