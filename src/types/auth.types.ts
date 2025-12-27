/**
 * Roles del Sistema (de tu tabla usuarios)
 */
export enum Role {
  ADMINISTRADOR = 'administrador',
  CORTADOR = 'cortador',
  DISENADOR = 'diseñador',
  RECEPCIONISTA = 'recepcionista',
  AYUDANTE = 'ayudante',
  REPRESENTANTE_TALLER = 'representante_taller',
}

/**
 * Estados de Usuario (de tu tabla usuarios)
 */
export enum EstadoUsuario {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  SUSPENDIDO = 'suspendido',
}

/**
 * Permisos Detallados del Sistema
 */
export enum Permission {
  // Gestión de Usuarios
  VIEW_USERS = 'view_users',
  MANAGE_USERS = 'manage_users',
  
  // Gestión de Clientes
  VIEW_CLIENTS = 'view_clients',
  MANAGE_CLIENTS = 'manage_clients',
  
  // Gestión de Productos
  VIEW_PRODUCTS = 'view_products',
  CREATE_PRODUCTS = 'create_products',
  EDIT_PRODUCTS = 'edit_products',
  DELETE_PRODUCTS = 'delete_products',
  
  // Gestión de Variantes
  VIEW_VARIANTS = 'view_variants',
  MANAGE_VARIANTS = 'manage_variants',
  
  // Gestión de Categorías
  VIEW_CATEGORIES = 'view_categories',
  MANAGE_CATEGORIES = 'manage_categories',
  
  // Gestión de Pedidos
  VIEW_ORDERS = 'view_orders',
  CREATE_ORDERS = 'create_orders',
  EDIT_ORDERS = 'edit_orders',
  CANCEL_ORDERS = 'cancel_orders',
  
  // Gestión de Cotizaciones
  VIEW_QUOTES = 'view_quotes',
  CREATE_QUOTES = 'create_quotes',
  EDIT_QUOTES = 'edit_quotes',
  APPROVE_QUOTES = 'approve_quotes',
  
  // Gestión de Ventas
  VIEW_SALES = 'view_sales',
  MANAGE_SALES = 'manage_sales',
  
  // Gestión de Inventario
  VIEW_INVENTORY = 'view_inventory',
  MANAGE_INVENTORY = 'manage_inventory',
  ADJUST_STOCK = 'adjust_stock',
  
  // Gestión de Lista de Materiales
  VIEW_MATERIALS = 'view_materials',
  MANAGE_MATERIALS = 'manage_materials',
  
  // Gestión de Confecciones
  VIEW_CONFECTIONS = 'view_confections',
  MANAGE_CONFECTIONS = 'manage_confections',
  
  // Gestión de Talleres
  VIEW_WORKSHOPS = 'view_workshops',
  MANAGE_WORKSHOPS = 'manage_workshops',
  
  // Gestión de Despachos
  VIEW_DISPATCHES = 'view_dispatches',
  MANAGE_DISPATCHES = 'manage_dispatches',
  
  // Gestión de Pagos
  VIEW_PAYMENTS = 'view_payments',
  MANAGE_PAYMENTS = 'manage_payments',
  
  // Dashboard y Reportes
  VIEW_DASHBOARD = 'view_dashboard',
  VIEW_REPORTS = 'view_reports',
  EXPORT_DATA = 'export_data',
}

/**
 * Mapeo de Roles a Permisos
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMINISTRADOR]: [
    // Acceso total a todo
    Permission.VIEW_USERS,
    Permission.MANAGE_USERS,
    Permission.VIEW_CLIENTS,
    Permission.MANAGE_CLIENTS,
    Permission.VIEW_PRODUCTS,
    Permission.CREATE_PRODUCTS,
    Permission.EDIT_PRODUCTS,
    Permission.DELETE_PRODUCTS,
    Permission.VIEW_VARIANTS,
    Permission.MANAGE_VARIANTS,
    Permission.VIEW_CATEGORIES,
    Permission.MANAGE_CATEGORIES,
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDERS,
    Permission.EDIT_ORDERS,
    Permission.CANCEL_ORDERS,
    Permission.VIEW_QUOTES,
    Permission.CREATE_QUOTES,
    Permission.EDIT_QUOTES,
    Permission.APPROVE_QUOTES,
    Permission.VIEW_SALES,
    Permission.MANAGE_SALES,
    Permission.VIEW_INVENTORY,
    Permission.MANAGE_INVENTORY,
    Permission.ADJUST_STOCK,
    Permission.VIEW_MATERIALS,
    Permission.MANAGE_MATERIALS,
    Permission.VIEW_CONFECTIONS,
    Permission.MANAGE_CONFECTIONS,
    Permission.VIEW_WORKSHOPS,
    Permission.MANAGE_WORKSHOPS,
    Permission.VIEW_DISPATCHES,
    Permission.MANAGE_DISPATCHES,
    Permission.VIEW_PAYMENTS,
    Permission.MANAGE_PAYMENTS,
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
  ],

  [Role.CORTADOR]: [
    // Enfocado en producción y corte
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_VARIANTS,
    Permission.VIEW_ORDERS,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_MATERIALS,
    Permission.MANAGE_MATERIALS,
    Permission.VIEW_CONFECTIONS,
    Permission.MANAGE_CONFECTIONS,
    Permission.VIEW_DASHBOARD,
  ],

  [Role.DISENADOR]: [
    // Enfocado en diseño y productos
    Permission.VIEW_PRODUCTS,
    Permission.CREATE_PRODUCTS,
    Permission.EDIT_PRODUCTS,
    Permission.VIEW_VARIANTS,
    Permission.MANAGE_VARIANTS,
    Permission.VIEW_CATEGORIES,
    Permission.MANAGE_CATEGORIES,
    Permission.VIEW_ORDERS,
    Permission.VIEW_CONFECTIONS,
    Permission.MANAGE_CONFECTIONS,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_MATERIALS,
    Permission.VIEW_DASHBOARD,
  ],

  [Role.RECEPCIONISTA]: [
    // Enfocado en atención al cliente
    Permission.VIEW_CLIENTS,
    Permission.MANAGE_CLIENTS,
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_VARIANTS,
    Permission.VIEW_ORDERS,
    Permission.CREATE_ORDERS,
    Permission.EDIT_ORDERS,
    Permission.VIEW_QUOTES,
    Permission.CREATE_QUOTES,
    Permission.EDIT_QUOTES,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_PAYMENTS,
    Permission.VIEW_DASHBOARD,
  ],

  [Role.AYUDANTE]: [
    // Permisos limitados de visualización
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_VARIANTS,
    Permission.VIEW_ORDERS,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_CONFECTIONS,
    Permission.VIEW_DISPATCHES,
  ],

  [Role.REPRESENTANTE_TALLER]: [
    // Enfocado en talleres y confección
    Permission.VIEW_ORDERS,
    Permission.VIEW_CONFECTIONS,
    Permission.MANAGE_CONFECTIONS,
    Permission.VIEW_WORKSHOPS,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_MATERIALS,
    Permission.VIEW_DISPATCHES,
    Permission.VIEW_DASHBOARD,
  ],
};

/**
 * Interface de Usuario (basada en tu tabla usuarios)
 */
export interface Usuario {
  id: number;
  nombre_completo: string;
  email: string;
  telefono: string | null;
  rol: string;
  estado: string;
  auth_id?: string | null;
  ultimo_acceso?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at?: string | null;
}

/**
 * Interface de Sesión
 */
export interface Session {
  user: Usuario
  access_token: string
  refresh_token: string
  expires_at: number
}

/**
 * Helper: Verificar si un usuario tiene un permiso
 */
export function hasPermission(user: Usuario, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[user.rol as Role]
  return rolePermissions.includes(permission)
}

/**
 * Helper: Verificar si un usuario tiene cualquiera de los permisos
 */
export function hasAnyPermission(user: Usuario, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(user, permission))
}

/**
 * Helper: Verificar si un usuario tiene todos los permisos
 */
export function hasAllPermissions(user: Usuario, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(user, permission))
}

/**
 * Helper: Verificar si un usuario tiene un rol específico
 */
export function hasRole(user: Usuario, role: Role): boolean {
  return user.rol === (role as string)
}

/**
 * Helper: Verificar si un usuario es administrador
 */
export function isAdmin(user: Usuario): boolean {
  return user.rol === Role.ADMINISTRADOR
}

/**
 * Helper: Verificar si el usuario está activo
 */
export function isUserActive(user: Usuario): boolean {
  return user.estado === EstadoUsuario.ACTIVO
}

/**
 * Helper: Obtener permisos de un rol
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role]
}

/**
 * Labels amigables para los roles
 */
export const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMINISTRADOR]: 'Administrador',
  [Role.CORTADOR]: 'Cortador',
  [Role.DISENADOR]: 'Diseñador',
  [Role.RECEPCIONISTA]: 'Recepcionista',
  [Role.AYUDANTE]: 'Ayudante',
  [Role.REPRESENTANTE_TALLER]: 'Representante de Taller',
}

/**
 * Colores para badges de roles
 */
export const ROLE_COLORS: Record<Role, string> = {
  [Role.ADMINISTRADOR]: 'bg-red-100 text-red-800',
  [Role.CORTADOR]: 'bg-orange-100 text-orange-800',
  [Role.DISENADOR]: 'bg-purple-100 text-purple-800',
  [Role.RECEPCIONISTA]: 'bg-green-100 text-green-800',
  [Role.AYUDANTE]: 'bg-gray-100 text-gray-800',
  [Role.REPRESENTANTE_TALLER]: 'bg-yellow-100 text-yellow-800',
}

/**
 * Labels para estados de usuario
 */
export const ESTADO_LABELS: Record<EstadoUsuario, string> = {
  [EstadoUsuario.ACTIVO]: 'Activo',
  [EstadoUsuario.INACTIVO]: 'Inactivo',
  [EstadoUsuario.SUSPENDIDO]: 'Suspendido',
}

/**
 * Colores para badges de estados
 */
export const ESTADO_COLORS: Record<EstadoUsuario, string> = {
  [EstadoUsuario.ACTIVO]: 'bg-green-100 text-green-800',
  [EstadoUsuario.INACTIVO]: 'bg-gray-100 text-gray-800',
  [EstadoUsuario.SUSPENDIDO]: 'bg-red-100 text-red-800',
}