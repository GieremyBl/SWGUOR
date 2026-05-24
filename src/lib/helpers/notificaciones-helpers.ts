'use server';

import { MovimientosInventarioService } from '@/lib/services/movimientos-inventario.service';
import { crearMovimientoSchema } from '@/lib/schemas/movimientos-inventario';
import type { TipoMovimiento, ReferenciaMovimiento } from '@prisma/client';

/**
 * Helper interno para validar con Zod y tipar con Prisma de forma unificada
 */
async function validarYRegistrar(payload: any) {
  // 1. Validar contra el esquema de Zod. Si falla, lanza un ZodError automáticamente.
  const dataValidada = crearMovimientoSchema.parse(payload);

  // 2. Filtrar valores null/undefined para compatibilidad con RegistrarParams
  const dataLimpia = Object.fromEntries(
    Object.entries(dataValidada).filter(([_, value]) => value !== null && value !== undefined)
  );

  // 3. Ejecutar la persistencia en el Service con datos 100% limpios y tipados
  return await MovimientosInventarioService.registrar({
    ...dataLimpia,
    // Forzamos el casteo a los tipos esperados por el cliente de Prisma generado
    tipo_movimiento: dataValidada.tipo_movimiento as TipoMovimiento,
    referencia_tipo: dataValidada.referencia_tipo as ReferenciaMovimiento,
  } as any);
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
    tipo_movimiento: 'consumo_orden_produccion', // Usando tu Enum real de Supabase
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
    tipo_movimiento: 'devolucion_a_cliente', // Usando tu Enum real de Supabase
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
    tipo_movimiento: 'devolucion_a_proveedor', // Usando tu Enum real de Supabase
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
    tipo_movimiento: 'incidencia_taller', // Usando tu Enum real de Supabase
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
  // Determinamos dinámicamente si es un ajuste de ingreso o de salida pura
  const tipoCalculado = data.cantidad > 0 ? 'ajuste' : 'salida';

  return validarYRegistrar({
    material_id: data.material_id,
    insumo_id: data.insumo_id,
    producto_id: data.producto_id,
    cantidad: Math.abs(data.cantidad), // Zod exige números estrictamente positivos (.positive())
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
  } catch (error: any) {
    return { success: false, error: error.message };
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
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}