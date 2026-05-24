'use server';

import { MovimientosInventarioService } from '@/lib/services/movimientos-inventario.service';
import type { TipoMovimiento, ReferenciaMovimiento } from '@prisma/client';

export async function registrarEntradaCompra(data: {
  material_id?: string | number;
  insumo_id?: string | number;
  cantidad: number;
  costo_unitario: number;
  numero_oc: string;
  usuario_id?: string | number;
  almacen_id?: string | number;
}) {
  return MovimientosInventarioService.registrar({
    material_id: data.material_id,
    insumo_id: data.insumo_id,
    cantidad: data.cantidad,
    tipo_movimiento: 'entrada',
    motivo: `Compra OC-${data.numero_oc}`,

    usuario_id: data.usuario_id,
    almacen_id: data.almacen_id,
    referencia_tipo: 'ORDEN_COMPRA',
  });
}


export async function registrarSalidaVenta(data: {
  producto_id: string | number;
  cantidad: number;
  numero_ov: string;
  usuario_id?: string | number;
  almacen_id?: string | number;
}) {
  return MovimientosInventarioService.registrar({
    producto_id: data.producto_id,
    cantidad: data.cantidad,
    tipo_movimiento: 'salida',
    motivo: `Venta OV-${data.numero_ov}`,
    usuario_id: data.usuario_id,
    almacen_id: data.almacen_id,
    referencia_tipo: 'PEDIDO_CLIENTE',
  });
}

export async function registrarSalidaProduccion(data: {
  material_id: string | number;
  cantidad: number;
  confeccion_id: string | number;
  usuario_id?: string | number;
  almacen_id?: string | number;
}) {
  return MovimientosInventarioService.registrar({
    material_id: data.material_id,
    cantidad: data.cantidad,
    tipo_movimiento: 'salida',
    motivo: `Producción CF-${data.confeccion_id}`,
    usuario_id: data.usuario_id,
    almacen_id: data.almacen_id,
    referencia_tipo: 'ORDEN_PRODUCCION',
  });
}

export async function registrarEntradaDevolucionCliente(data: {
  producto_id: string | number;
  cantidad: number;
  numero_devolucion: string;
  usuario_id?: string | number;
  almacen_id?: string | number;
}) {
  return MovimientosInventarioService.registrar({
    producto_id: data.producto_id,
    cantidad: data.cantidad,
    tipo_movimiento: 'entrada',
    motivo: `Devolución cliente DEV-${data.numero_devolucion}`,
    usuario_id: data.usuario_id,
    almacen_id: data.almacen_id,
    referencia_tipo: 'PEDIDO_CLIENTE',
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
  return MovimientosInventarioService.registrar({
    material_id: data.material_id,
    insumo_id: data.insumo_id,
    cantidad: data.cantidad,
    tipo_movimiento: 'salida',
    motivo: `Devolución proveedor DEV-${data.numero_devolucion}`,
    usuario_id: data.usuario_id,
    almacen_id: data.almacen_id,
    referencia_tipo: 'ORDEN_COMPRA',
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
  return MovimientosInventarioService.registrar({
    material_id: data.material_id,
    insumo_id: data.insumo_id,
    producto_id: data.producto_id,
    cantidad: data.cantidad,
    tipo_movimiento: 'salida',
    motivo: `Incidencia (${data.tipo_incidencia}) INC-${data.numero_incidencia}`,
    usuario_id: data.usuario_id,
    almacen_id: data.almacen_id,
    referencia_tipo: 'MERMA_INCIDENCIA',
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
  const tipo = (data.cantidad > 0 ? 'entrada' : 'salida') as TipoMovimiento;

  return MovimientosInventarioService.registrar({
    material_id: data.material_id,
    insumo_id: data.insumo_id,
    producto_id: data.producto_id,
    cantidad: Math.abs(data.cantidad),
    tipo_movimiento: tipo,
    motivo: `Ajuste: ${data.razon}`,
    usuario_id: data.usuario_id,
    almacen_id: data.almacen_id,
    referencia_tipo: 'AJUSTE_MANUAL',
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