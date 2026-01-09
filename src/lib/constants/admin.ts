/**
 * Rutas del Panel Administrativo
**/
export const ADMIN_ROUTES = {
  // Dashboard principal
  DASHBOARD: '/admin/Panel-Administrativo/dashboard',
  
  // Gestión de productos y catálogo
  CATEGORIAS: '/admin/Panel-Administrativo/categorias',
  PRODUCTOS: '/admin/Panel-Administrativo/productos',
  TALLERES: '/admin/Panel-Administrativo/talleres',

  // Gestión de ventas y pedidos
  VENTAS: '/admin/Panel-Administrativo/ventas',
  PEDIDOS: '/admin/Panel-Administrativo/pedidos',
  COTIZACIONES: '/admin/Panel-Administrativo/cotizaciones',
  
  // Gestión de inventario y logística
  INVENTARIO: '/admin/Panel-Administrativo/inventario',
  CONFECCIONES: '/admin/Panel-Administrativo/confecciones',
  DESPACHOS: '/admin/Panel-Administrativo/despachos',
  
  // Gestión de clientes y usuarios
  CLIENTES: '/admin/Panel-Administrativo/clientes',
  USUARIOS: '/admin/Panel-Administrativo/usuarios',
  
  // Finanzas
  PAGOS: '/admin/Panel-Administrativo/pagos',
  
  // Sistema
  NOTIFICACIONES: '/admin/Panel-Administrativo/notificaciones',
} as const;

/**
 * Estados de Pedidos
 */
export const ORDER_STATUS = {
  PENDIENTE: 'PENDIENTE',
  CONFIRMADO: 'CONFIRMADO',
  EN_PRODUCCION: 'EN_PRODUCCION',
  EN_CONFECCION: 'EN_CONFECCION',
  LISTO_PARA_DESPACHO: 'LISTO_PARA_DESPACHO',
  EN_DESPACHO: 'EN_DESPACHO',
  ENTREGADO: 'ENTREGADO',
  CANCELADO: 'CANCELADO',
  DEVUELTO: 'DEVUELTO',
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS;

/**
 * Estados de Productos
 */
export const PRODUCT_STATUS = {
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
  AGOTADO: 'agotado',
  DESCONTINUADO: 'descontinuado',
} as const;

export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

/**
 * Estados de Cotizaciones
 */
export const QUOTE_STATUS = {
  PENDIENTE: 'PENDIENTE',
  ENVIADA: 'ENVIADA',
  ACEPTADA: 'ACEPTADA',
  RECHAZADA: 'RECHAZADA',
  VENCIDA: 'VENCIDA',
} as const;

export type QuoteStatus = keyof typeof QUOTE_STATUS;

/**
 * Estados de Pagos
 */
export const PAYMENT_STATUS = {
  PENDIENTE: 'PENDIENTE',
  PAGADO: 'PAGADO',
  PARCIAL: 'PARCIAL',
  ATRASADO: 'ATRASADO',
  CANCELADO: 'CANCELADO',
} as const;

export type PaymentStatus = keyof typeof PAYMENT_STATUS;

/**
 * Métodos de Pago
 */
export const PAYMENT_METHODS = {
  EFECTIVO: 'efectivo',
  TRANSFERENCIA: 'transferencia',
  TARJETA: 'tarjeta',
  YAPE: 'yape',
  PLIN: 'plin',
  CREDITO: 'credito',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

/**
 * Estados de Confección
 */
export const CONFECTION_STATUS = {
  PENDIENTE: 'PENDIENTE',
  EN_PROCESO: 'EN_PROCESO',
  COMPLETADA: 'COMPLETADA',
  CON_OBSERVACIONES: 'CON_OBSERVACIONES',
  RECHAZADA: 'RECHAZADA',
} as const;

export type ConfectionStatus = keyof typeof CONFECTION_STATUS;

/**
 * Estados de Despacho
 */
export const DISPATCH_STATUS = {
  PENDIENTE: 'PENDIENTE',
  EMPAQUETADO: 'EMPAQUETADO',
  EN_TRANSITO: 'EN_TRANSITO',
  ENTREGADO: 'ENTREGADO',
  DEVUELTO: 'DEVUELTO',
} as const;

export type DispatchStatus = keyof typeof DISPATCH_STATUS;

/**
 * Categorías de Productos
 */
export const PRODUCT_CATEGORIES = {
  PANTALONES: 'pantalones',
  BLUSAS: 'blusas',
  VESTIDOS: 'vestidos',
  FALDAS: 'faldas',
  CHAQUETAS: 'chaquetas',
  CONJUNTOS: 'conjuntos',
  ACCESORIOS: 'accesorios',
  ZAPATOS: 'zapatos',
  UNIFORMES: 'uniformes',
  CORPORATIVO: 'corporativo',
} as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[keyof typeof PRODUCT_CATEGORIES];

/**
 * Tallas Disponibles
 */
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const;
export type Size = (typeof SIZES)[number];

/**
 * Colores Disponibles
 */
export const COLORS = {
  NEGRO: 'negro',
  BLANCO: 'blanco',
  AZUL: 'azul',
  ROJO: 'rojo',
  VERDE: 'verde',
  AMARILLO: 'amarillo',
  ROSA: 'rosa',
  MORADO: 'morado',
  GRIS: 'gris',
  BEIGE: 'beige',
  CAFE: 'cafe',
  MULTICOLOR: 'multicolor',
} as const;

export type Color = (typeof COLORS)[keyof typeof COLORS];

/**
 * Prioridades de Notificaciones
 */
export const NOTIFICATION_PRIORITY = {
  BAJA: 'baja',
  MEDIA: 'media',
  ALTA: 'alta',
  URGENTE: 'urgente',
} as const;

export type NotificationPriority = (typeof NOTIFICATION_PRIORITY)[keyof typeof NOTIFICATION_PRIORITY];

/**
 * Tipos de Notificaciones
 */
export const NOTIFICATION_TYPES = {
  PEDIDO_NUEVO: 'pedido_nuevo',
  PEDIDO_ACTUALIZADO: 'pedido_actualizado',
  PAGO_RECIBIDO: 'pago_recibido',
  STOCK_BAJO: 'stock_bajo',
  COTIZACION_NUEVA: 'cotizacion_nueva',
  PRODUCCION_COMPLETADA: 'produccion_completada',
  DESPACHO_PENDIENTE: 'despacho_pendiente',
  CLIENTE_NUEVO: 'cliente_nuevo',
  SISTEMA: 'sistema',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/**
 * Configuración de Paginación
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Configuración de Alertas de Stock
 */
export const STOCK_ALERTS = {
  CRITICO: 5,    // Stock crítico (alerta roja)
  BAJO: 10,      // Stock bajo (alerta amarilla)
  MEDIO: 20,     // Stock medio (alerta naranja)
} as const;

/**
 * Límites de Sistema
 */
export const SYSTEM_LIMITS = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGES_PER_PRODUCT: 10,
  MAX_ITEMS_PER_ORDER: 100,
  MAX_QUOTE_VALIDITY_DAYS: 30,
} as const;