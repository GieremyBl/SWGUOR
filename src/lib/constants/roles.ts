/**
 * Constantes de Roles y Permisos — Fuente Única de Verdad
 * Todos los permisos del sistema se definen aquí.
 */

// ─────────────────────────────────────────────
// TIPOS BASE
// ─────────────────────────────────────────────

export type RolUsuario =
  | 'gerente_general'
  | 'administrador'
  | 'recepcionista'
  | 'disenador'
  | 'cortador'
  | 'ayudante'
  | 'representante_taller'
  | 'cliente';

export type EstadoUsuario = 'activo' | 'inactivo' | 'suspendido';

// ─────────────────────────────────────────────
// PERMISOS PLANOS (usados en guards y middleware)
// ─────────────────────────────────────────────

export type PermissionKey =
  // Dashboard
  | 'ver_dashboard'
  | 'exportar_data'
  // Órdenes
  | 'ver_ordenes'
  | 'crear_ordenes'
  | 'editar_ordenes'
  | 'eliminar_ordenes'
  | 'exportar_ordenes'
  // Pedidos
  | 'ver_pedidos'
  | 'crear_pedidos'
  | 'editar_pedidos'
  | 'cancelar_pedidos'
  | 'cambiar_estado_pedidos'
  |  'exportar_pedidos'
  // Inventario
  | 'ver_inventario'
  | 'crear_inventario'
  | 'editar_inventario'
  | 'eliminar_inventario'
  | 'ajustar_stock'
  | 'exportar_inventario'
  // Productos
  | 'ver_productos'
  | 'crear_productos'
  | 'editar_productos'
  | 'eliminar_productos'
  | 'exportar_productos'
  | 'subir_ficha_tecnica'
  // Variantes
  | 'ver_variantes'
  | 'crear_variantes'
  | 'editar_variantes'
  | 'eliminar_variantes'
  | 'exportar_variantes'
  // Categorías
  | 'ver_categorias'
  | 'crear_categorias'
  | 'editar_categorias'
  | 'eliminar_categorias'
  | 'exportar_categorias'
  // Clientes
  | 'ver_clientes'
  | 'editar_clientes'
  | 'eliminar_clientes'
  | 'exportar_clientes'
  // Usuarios
  | 'ver_usuarios'
  | 'crear_usuarios'
  | 'editar_usuarios'
  | 'eliminar_usuarios'
  | 'exportar_usuarios'
  // Reportes
  | 'ver_reportes'
  | 'filtrar_reportes'
  | 'exportar_reportes'
  // Despachos
  | 'ver_despachos'
  | 'crear_despachos'
  | 'editar_despachos'
  | 'actualizar_estado_despachos'
  | 'exportar_despachos'
  // Confecciones
  | 'ver_confecciones'
  | 'crear_confecciones'
  | 'editar_confecciones'
  | 'actualizar_estado_confecciones'
  | 'exportar_confecciones'
  // Talleres
  | 'ver_talleres'
  | 'crear_talleres'
  | 'editar_talleres'
  | 'eliminar_talleres'
  | 'exportar_talleres'
  // Pagos
  | 'ver_pagos'
  | 'registrar_pagos'
  | 'exportar_pagos'
  // Cotizaciones
  | 'ver_cotizaciones'
  | 'editar_cotizaciones'
  | 'aprobar_cotizaciones'
  | 'exportar_cotizaciones'
  // Materiales
  | 'ver_materiales'
  | 'crear_materiales'
  | 'editar_materiales'
  | 'eliminar_materiales'
  | 'exportar_materiales'
  // Ventas
  | 'ver_ventas'
  | 'editar_ventas'
  | 'exportar_ventas'
  // Configuración
  | 'ver_configuracion'
  | 'editar_configuracion';

// ─────────────────────────────────────────────
// PERMISOS POR RECURSO (usados en el hook usePermissions)
// ─────────────────────────────────────────────

export type AccionRecurso = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'cancel' | 'approve' | 'adjust' | 'update_status';

export type PermisosRecurso = {
  [recurso: string]: AccionRecurso[];
};

// ─────────────────────────────────────────────
// MATRIZ DE PERMISOS PLANOS POR ROL
// ─────────────────────────────────────────────

export const PERMISOS_POR_ROL: Record<RolUsuario, PermissionKey[]> = {

  gerente_general: [
    'ver_dashboard', 'exportar_data',
    'ver_ordenes', 'exportar_ordenes',
    'ver_pedidos', 'exportar_pedidos',
    'ver_inventario', 'exportar_inventario',
    'ver_productos', 'exportar_productos', 'ver_variantes', 'exportar_variantes', 'ver_categorias', 'exportar_categorias',
    'ver_clientes', 'exportar_clientes',
    'ver_usuarios', 'exportar_usuarios',
    'ver_reportes', 'filtrar_reportes',
    'ver_despachos', 'exportar_despachos',
    'ver_confecciones', 'exportar_confecciones',
    'ver_talleres', 'exportar_talleres',
    'ver_pagos', 'exportar_pagos',
    'ver_cotizaciones', 'exportar_cotizaciones',
    'ver_materiales', 'exportar_materiales',
    'ver_ventas', 'exportar_ventas',
    'ver_configuracion', 'editar_configuracion',
  ],

  administrador: [
    'ver_dashboard', 'exportar_data',
    // Órdenes
    'ver_ordenes', 'crear_ordenes', 'editar_ordenes', 'eliminar_ordenes', 'exportar_ordenes',
    // Pedidos
    'ver_pedidos', 'crear_pedidos', 'editar_pedidos', 'cancelar_pedidos', 'cambiar_estado_pedidos', 'exportar_pedidos',
    // Inventario
    'ver_inventario', 'crear_inventario', 'editar_inventario', 'eliminar_inventario', 'ajustar_stock', 'exportar_inventario',
    // Productos
    'ver_productos', 'crear_productos', 'editar_productos', 'eliminar_productos', 'exportar_productos',
    // Variantes
    'ver_variantes', 'crear_variantes', 'editar_variantes', 'eliminar_variantes', 'exportar_variantes',
    // Categorías
    'ver_categorias', 'crear_categorias', 'editar_categorias', 'eliminar_categorias', 'exportar_categorias',
    // Clientes
    'ver_clientes', 'editar_clientes', 'eliminar_clientes', 'exportar_clientes',
    // Usuarios
    'ver_usuarios', 'crear_usuarios', 'editar_usuarios', 'eliminar_usuarios', 'exportar_usuarios',
    // Reportes
    'ver_reportes', 'filtrar_reportes', 'exportar_reportes',
    // Despachos
    'ver_despachos', 'crear_despachos', 'editar_despachos', 'exportar_despachos',
    // Confecciones
    'ver_confecciones', 'crear_confecciones', 'editar_confecciones', 'exportar_confecciones',
    // Talleres
    'ver_talleres', 'crear_talleres', 'editar_talleres', 'eliminar_talleres', 'exportar_talleres',
    // Pagos
    'ver_pagos', 'registrar_pagos', 'exportar_pagos',
    // Cotizaciones
    'ver_cotizaciones', 'editar_cotizaciones', 'aprobar_cotizaciones',
    // Materiales
    'ver_materiales', 'crear_materiales', 'editar_materiales', 'eliminar_materiales', 'exportar_materiales',
    // Ventas
    'ver_ventas', 'editar_ventas', 'exportar_ventas',
    // Configuración
    'ver_configuracion', 'editar_configuracion',
  ],

  recepcionista: [
    'ver_dashboard',
    'ver_ordenes', 'crear_ordenes', 'editar_ordenes', 'exportar_ordenes',
    'ver_pedidos', 'crear_pedidos', 'editar_pedidos', 'cancelar_pedidos', 'exportar_pedidos',
    'ver_inventario', 'exportar_inventario',
    'ver_productos', 'ver_variantes', 'exportar_productos', 'exportar_variantes',
    'ver_clientes', 'editar_clientes', 'exportar_clientes',
    'ver_pagos', 'registrar_pagos', 'exportar_pagos',
    'ver_cotizaciones', 'editar_cotizaciones', 'aprobar_cotizaciones',
    'ver_despachos', 'crear_despachos', 'exportar_despachos',
  ],

  disenador: [
    'ver_dashboard',
    'ver_pedidos',
    'ver_inventario',
    'ver_materiales',
    'ver_productos', 'crear_productos', 'editar_productos', 'subir_ficha_tecnica',
    'ver_variantes', 'crear_variantes', 'editar_variantes',
    'ver_categorias', 'crear_categorias', 'editar_categorias',
    'ver_confecciones', 'crear_confecciones', 'editar_confecciones',
    'ver_reportes',
  ],

  cortador: [
    'ver_dashboard',
    'ver_pedidos',
    'ver_inventario',
    'ver_materiales', 'editar_materiales',
    'ver_confecciones', 'actualizar_estado_confecciones',
    'ver_productos', 'ver_variantes',
  ],

  ayudante: [
    'ver_dashboard',
    'ver_inventario',
    'ver_productos', 'ver_variantes',
    'ver_confecciones',
    'ver_despachos',
  ],

  representante_taller: [
    'ver_dashboard',
    'ver_pedidos',
    'ver_inventario', 'editar_inventario',
    'ver_materiales',
    'ver_confecciones', 'crear_confecciones', 'editar_confecciones', 'actualizar_estado_confecciones',
    'ver_talleres', 'editar_talleres',
    'ver_despachos',
    'ver_productos',
  ],

  cliente: [
    'ver_productos',
    'ver_variantes',
    'ver_pedidos', 'crear_pedidos',
    'ver_cotizaciones',
  ],
};

// ─────────────────────────────────────────────
// MATRIZ DE PERMISOS POR RECURSO (para usePermissions)
// Derivada automáticamente — no editar manualmente.
// ─────────────────────────────────────────────

const ACCION_MAP: Record<string, AccionRecurso> = {
  ver:      'view',
  crear:    'create',
  editar:   'edit',
  eliminar: 'delete',
  exportar: 'export',
  cancelar: 'cancel',
  aprobar:  'approve',
  ajustar:  'adjust',
  registrar: 'create',
  actualizar_estado: 'update_status',
  cambiar_estado:    'update_status',
  filtrar:  'view',
};

function derivarPermisosRecurso(permisos: PermissionKey[]): PermisosRecurso {
  const resultado: PermisosRecurso = {};

  for (const permiso of permisos) {
    // Ej: "ver_pedidos" → accion="ver", recurso="pedidos"
    // Ej: "actualizar_estado_despacho" → accion="actualizar_estado", recurso="despacho"
    const partes = permiso.split('_');
    let accion: AccionRecurso | undefined;
    let recurso: string | undefined;

    // Buscar el prefijo más largo que coincida
    for (let i = partes.length - 1; i >= 1; i--) {
      const posibleAccion = partes.slice(0, i).join('_');
      if (ACCION_MAP[posibleAccion]) {
        accion = ACCION_MAP[posibleAccion];
        recurso = partes.slice(i).join('_');
        break;
      }
    }

    if (!accion || !recurso) continue;

    if (!resultado[recurso]) resultado[recurso] = [];
    if (!resultado[recurso].includes(accion)) {
      resultado[recurso].push(accion);
    }
  }

  return resultado;
}

export const PERMISOS_RECURSO_POR_ROL: Record<RolUsuario, PermisosRecurso> =
  Object.fromEntries(
    (Object.keys(PERMISOS_POR_ROL) as RolUsuario[]).map(rol => [
      rol,
      derivarPermisosRecurso(PERMISOS_POR_ROL[rol]),
    ])
  ) as Record<RolUsuario, PermisosRecurso>;

// ─────────────────────────────────────────────
// INFORMACIÓN DE ROLES
// ─────────────────────────────────────────────

export const ROLES_INFO: Record<RolUsuario, {
  label: string;
  descripcion: string;
  color: string;
  nivel: number;
}> = {
  gerente_general:      { label: 'Gerente General',         descripcion: 'Visibilidad total del sistema',     color: 'bg-red-100 text-red-800',       nivel: 6 },
  administrador:        { label: 'Administrador',            descripcion: 'Acceso operativo total',            color: 'bg-red-100 text-red-800',       nivel: 5 },
  recepcionista:        { label: 'Recepcionista',            descripcion: 'Maneja órdenes y clientes',         color: 'bg-blue-100 text-blue-800',     nivel: 3 },
  disenador:            { label: 'Diseñador',                descripcion: 'Responsable del diseño de prendas', color: 'bg-purple-100 text-purple-800', nivel: 2 },
  cortador:             { label: 'Cortador',                 descripcion: 'Responsable del corte de prendas',  color: 'bg-orange-100 text-orange-800', nivel: 2 },
  ayudante:             { label: 'Ayudante',                 descripcion: 'Asiste en tareas generales',        color: 'bg-gray-100 text-gray-800',     nivel: 1 },
  representante_taller: { label: 'Representante de Taller', descripcion: 'Responsable de taller externo',     color: 'bg-green-100 text-green-800',   nivel: 2 },
  cliente:              { label: 'Cliente',                  descripcion: 'Acceso al portal de compras',       color: 'bg-blue-50 text-blue-700',      nivel: 0 },
};

export const ROLE_COLORS: Record<RolUsuario, string> = Object.fromEntries(
  (Object.keys(ROLES_INFO) as RolUsuario[]).map(r => [r, ROLES_INFO[r].color])
) as Record<RolUsuario, string>;

export const ROLE_LABELS: Record<RolUsuario, string> = Object.fromEntries(
  (Object.keys(ROLES_INFO) as RolUsuario[]).map(r => [r, ROLES_INFO[r].label])
) as Record<RolUsuario, string>;

export const LISTA_ROLES = Object.keys(ROLES_INFO) as RolUsuario[];

export const ESTADO_LABELS: Record<EstadoUsuario, string> = {
  activo:     'Activo',
  inactivo:   'Inactivo',
  suspendido: 'Suspendido',
};

export const ESTADO_COLORS: Record<EstadoUsuario, string> = {
  activo:     'bg-green-100 text-green-800',
  inactivo:   'bg-gray-100 text-gray-800',
  suspendido: 'bg-red-100 text-red-800',
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

export function tienePermiso(rol: RolUsuario, permiso: PermissionKey): boolean {
  return PERMISOS_POR_ROL[rol]?.includes(permiso) ?? false;
}

export function getNivelAcceso(rol: RolUsuario): number {
  return ROLES_INFO[rol]?.nivel ?? 0;
}

export function puedeGestionarRol(rolUsuario: RolUsuario, rolAGestionar: RolUsuario): boolean {
  return getNivelAcceso(rolUsuario) > getNivelAcceso(rolAGestionar);
}

export function getEtiquetaRol(rol: RolUsuario): string {
  return ROLES_INFO[rol]?.label ?? rol;
}