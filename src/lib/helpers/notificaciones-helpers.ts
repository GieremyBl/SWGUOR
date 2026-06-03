'use server';

import { MovimientosInventarioService } from '@/lib/services/movimientos-inventario.service';
import { crearMovimientoSchema } from '@/lib/schemas/movimientos-inventario';
import type { TipoMovimiento, ReferenciaMovimiento } from '@prisma/client';

// Definimos la interfaz del payload basada en la inferencia de Zod si es posible,
// o una estructuración manual estricta para el helper.
interface ValidarRegistrarPayload {
  material_id?: string | number;
  insumo_id?: string | number;
  producto_id?: string | number;
  cantidad: number;
  tipo_movimiento: string;
  referencia_tipo: string;
  motivo: string;
  usuario_id?: string | number;
  almacen_id?: string | number;
}

/**
 * Helper interno para validar con Zod y tipar con Prisma de forma unificada
 */
async function validarYRegistrar(payload: ValidarRegistrarPayload) {
  // 1. Validar contra el esquema de Zod. Si falla, lanza un ZodError automáticamente.
  const dataValidada = crearMovimientoSchema.parse(payload);

  // 2. Extraemos explícitamente los campos obligatorios para que TS los reconozca.
  // El resto de campos (opcionales) los agrupamos en 'restoCampos' para limpiarlos.
  const { cantidad, motivo, tipo_movimiento, referencia_tipo, ...restoCampos } = dataValidada;

  // 3. Filtrar valores null/undefined únicamente de los campos opcionales restantes
  const camposOpcionalesLimpios = Object.fromEntries(
    Object.entries(restoCampos).filter(([, value]) => value !== null && value !== undefined)
  );

  // 4. Ejecutar la persistencia garantizando las propiedades obligatorias a nivel de tipo
  return await MovimientosInventarioService.registrar({
    ...camposOpcionalesLimpios, // Esparcimos los opcionales limpios (material_id, insumo_id, etc.)
    cantidad,                   // TS sabe que es el número validado por Zod
    motivo,                     // TS sabe que es el string validado por Zod
    tipo_movimiento: tipo_movimiento as TipoMovimiento,
    referencia_tipo: referencia_tipo as ReferenciaMovimiento,
  });
}

export async function registrarEntradaCompra(data: {
  material_id?: string | number;
  insumo_id?: string | number;
  cantidad: number;
  costo_unitario: number; // Campo informativo para procesos internos
  numero_oc: string;
  usuario_id?: string | number;
  almacen_id?: string | number;
}) {
  return validarYRegistrar({
    material_id: data.material_id,
    insumo_id: data.insumo_id,
    cantidad: data.cantidad,
    tipo_movimiento: 'entrada',
    referencia_tipo: 'ORDEN_COMPRA',
    motivo: `Compra OC-${data.numero_oc}`,
    usuario_id: data.usuario_id,
    almacen_id: data.almacen_id,
  });
}

export async function registrarSalidaVenta(data: {
  producto_id: string | number;
  cantidad: number;
  numero_ov: string;
  usuario_id?: string | number;
  almacen_id?: string | number;
}) {
  return validarYRegistrar({
    producto_id: data.producto_id,
    cantidad: data.cantidad,
    tipo_movimiento: 'salida',
    referencia_tipo: 'PEDIDO_CLIENTE',
    motivo: `Venta OV-${data.numero_ov}`,
    usuario_id: data.usuario_id,
    almacen_id: data.almacen_id,
  });
}

export async function registrarSalidaProduccion(data: {
  material_id: string | number;
  cantidad: number;
  confeccion_id: string | number;
  usuario_id?: string | number;
  almacen_id?: string | number;
}) {
  return validarYRegistrar({
    material_id: data.material_id,
    cantidad: data.cantidad,
    tipo_movimiento: 'consumo_orden_produccion',
    referencia_tipo: 'ORDEN_PRODUCCION',
    motivo: `Producción CF-${data.confeccion_id}`,
    usuario_id: data.usuario_id,
    almacen_id: data.almacen_id,
  });
}

export async function registrarEntradaDevolucionCliente(data: {
  producto_id: string | number;
  cantidad: number;
  numero_devolucion: string;
  usuario_id?: string | number;
  almacen_id?: string | number;
}) {
  return validarYRegistrar({
    producto_id: data.producto_id,
    cantidad: data.cantidad,
    tipo_movimiento: 'devolucion_a_cliente',
    referencia_tipo: 'DEVOLUCION',
    motivo: `Devolución cliente DEV-${data.numero_devolucion}`,
    usuario_id: data.usuario_id,
    almacen_id: data.almacen_id,
  });
}

export async function registrarSalidaDevolucionProveedor(data: {
  material_id?: string | number;
  insumo_id?: string | number;
  cantidad: number;
  numero_devolucion: string;
  usuario_id?: string | number;
  almacen_id?: string | number;
}) {
  return validarYRegistrar({
    material_id: data.material_id,
    insumo_id: data.insumo_id,
    cantidad: data.cantidad,
    tipo_movimiento: 'devolucion_a_proveedor',
    referencia_tipo: 'DEVOLUCION',
    motivo: `Devolución proveedor DEV-${data.numero_devolucion}`,
    usuario_id: data.usuario_id,
    almacen_id: data.almacen_id,
  });
}

export async function registrarSalidaIncidencia(data: {
  material_id?: string | number;
  insumo_id?: string | number;
  producto_id?: string | number;
  cantidad: number;
  tipo_incidencia: string;
  numero_incidencia: string;
  usuario_id?: string | number;
  almacen_id?: string | number;
}) {
  return validarYRegistrar({
    material_id: data.material_id,
    insumo_id: data.insumo_id,
    producto_id: data.producto_id,
    cantidad: data.cantidad,
    tipo_movimiento: 'incidencia_taller',
    referencia_tipo: 'MERMA_INCIDENCIA',
    motivo: `Incidencia (${data.tipo_incidencia}) INC-${data.numero_incidencia}`,
    usuario_id: data.usuario_id,
    almacen_id: data.almacen_id,
  });
}

export async function registrarAjusteManual(data: {
  material_id?: string | number;
  insumo_id?: string | number;
  producto_id?: string | number;
  cantidad: number;
  razon: string;
  usuario_id?: string | number;
  almacen_id?: string | number;
}) {
  const tipoCalculado = data.cantidad > 0 ? 'ajuste' : 'salida';

  return validarYRegistrar({
    material_id: data.material_id,
    insumo_id: data.insumo_id,
    producto_id: data.producto_id,
    cantidad: Math.abs(data.cantidad),
    tipo_movimiento: tipoCalculado,
    referencia_tipo: 'AJUSTE_MANUAL',
    motivo: `Ajuste: ${data.razon}`,
    usuario_id: data.usuario_id,
    almacen_id: data.almacen_id,
  });
}

export async function fetchMovimientos(filtros?: {
  tipo_movimiento?: TipoMovimiento;
  referencia_tipo?: ReferenciaMovimiento;
  producto_id?: string;
  material_id?: string;
  insumo_id?: string;
  busqueda?: string;
  desde?: Date;
  hasta?: Date;
  limite?: number;
}) {
  try {
    const data = await MovimientosInventarioService.listar(filtros);
    return { success: true, data };
  } catch (error) {
    // SOLUCIÓN AL WARNING DEL COLUMN 195: Reemplazamos 'any' por 'unknown' y validamos de forma segura.
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, error: mensaje };
  }
}

export async function fetchResumenMovimientos(filtros?: {
  tipo_movimiento?: TipoMovimiento;
  desde?: Date;
  hasta?: Date;
}) {
  try {
    const data = await MovimientosInventarioService.obtenerResumen(filtros);
    return { success: true, data };
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, error: mensaje };
  }
}