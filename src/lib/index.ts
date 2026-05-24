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
export * from './helpers/ordenes-produccion-helpers';
export * from './helpers/fichas-tecnicas-helpers';
export * from './helpers/notificaciones-helpers';
export * from './helpers/usuarios-helpers';
export * from './helpers/ai-extraction';
// Namespace the inventario helpers to avoid duplicate export name conflicts
export * as inventarioHelpers from './helpers/inventario-helpers';
export * from './helpers/asientos-contables-helpers';
export * from './helpers/clientes-helpers';

// ==================== HOOKS ====================
export * from './hooks/useAuth';
export * from './hooks/useInventario';
export * from './hooks/useOrdenProduccion';
export * from './hooks/usePermissions';
export * from './hooks/useProductos';
export * from './hooks/useFichasTecnicas';
export * from './hooks/useNotificaciones';
export * from './hooks/useUsuarios';

// ==================== TIPOS ====================
export type * from './helpers/format-helpers';
export type * from './helpers/productos-helpers';
export type * from './helpers/ordenes-produccion-helpers';
export type * from './helpers/fichas-tecnicas-helpers';
export type * from './helpers/notificaciones-helpers';
export type * from './helpers/usuarios-helpers';
export type * from './hooks/useAuth';
export type * from './hooks/useInventario';
export type * from './hooks/useOrdenProduccion';
export type * from './hooks/usePermissions';
export type * from './hooks/useProductos';
export type * from './hooks/useFichasTecnicas';
export type * from './hooks/useNotificaciones';
export type * from './hooks/useUsuarios';

// ==================== UTILIDADES ====================
export * from './supabase';
export * from './cache';
