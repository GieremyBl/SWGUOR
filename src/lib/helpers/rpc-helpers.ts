/**
 * RPC Helpers - Abstracción para llamar RPCs de PostgreSQL
 * Centraliza toda la lógica de integración con funciones almacenadas
 */

import { prisma } from "@/lib/prisma";
import type { TipoMovimiento, ReferenciaMovimiento, ReferenciaNotificacion, TipoNotificacion } from "@prisma/client";


// ============================================================================
// TIPOS DE PARÁMETROS Y RESPUESTAS PARA RPC
// ============================================================================

export interface CalcularCostoFichaParams {
  fichaId: number;
}

export interface CrearReservaStockParams {
  productoId: string;
  almacenId: string;
  cantidadAReservar: number;
  motivo: string;
  pedidoId?: string;
}

export interface CrearReservaStockResult {
  status: string;
  message?: string;
  cantidad_reservada?: number;
  nuevo_disponible?: number;
  disponible_real?: number;
}

export interface ActualizarPrecioParams {
  productoId: string;
  precioNuevo: number;
  razonCambio: string;
  tipoProducto: string;
  moneda: string;
  usuarioId: string;
}

export interface ActualizarPrecioResult {
  status: string;
  porcentaje?: number;
  message?: string;
}

// FIX 1: tipoMovimiento usa el enum completo TipoMovimiento de Prisma.
//         Antes era "entrada" | "salida" | "ajuste" (subset incompleto).
// FIX 2: referenciaId es opcional — no todos los movimientos tienen documento origen.
// FIX 3: se agrega almacenId, necesario para fn_actualizar_almacen_stock.
export interface InsertarMovimientoParams {
  tipoMovimiento: TipoMovimiento;
  referenciaType: ReferenciaMovimiento;
  referenciaId?: number;      // opcional: ajustes manuales no tienen referencia
  cantidad: number;
  motivo: string;
  productoId?: number;
  insumoId?: number;
  materialId?: number;
  almacenId?: number;
  costoUnitario?: number;
  usuarioId?: number;
}

// ============================================================================
// LLAMADAS A RPC
// ============================================================================

export async function calcularCostoFicha(params: CalcularCostoFichaParams): Promise<number> {
  try {
    const result = await prisma.$queryRaw<{ calcular_costo_ficha: number }[]>`
      SELECT calcular_costo_ficha(${params.fichaId}::bigint) as calcular_costo_ficha
    `;
    return result[0]?.calcular_costo_ficha || 0;
  } catch (error) {
    console.error("Error en calcularCostoFicha:", error);
    throw new Error("No se pudo calcular el costo de la ficha técnica");
  }
}

export async function crearReservaStock(
  params: CrearReservaStockParams
): Promise<CrearReservaStockResult> {
  try {
    const result = await prisma.$queryRaw<{ fn_crear_reserva_stock: any }[]>`
      SELECT public.fn_crear_reserva_stock(
        ${params.productoId}::bigint,
        ${params.almacenId}::bigint,
        ${params.cantidadAReservar}::integer,
        ${params.motivo}::text,
        ${params.pedidoId}::bigint
      ) as fn_crear_reserva_stock
    `;
    return result[0]?.fn_crear_reserva_stock || { status: "error" };
  } catch (error) {
    console.error("Error en crearReservaStock:", error);
    throw new Error("No se pudo crear la reserva de stock");
  }
}

export async function actualizarPrecioConHistorico(
  params: ActualizarPrecioParams
): Promise<ActualizarPrecioResult> {
  try {
    const result = await prisma.$queryRaw<{ fn_actualizar_precio_con_historico: any }[]>`
      SELECT public.fn_actualizar_precio_con_historico(
        ${params.productoId}::bigint,
        ${params.precioNuevo}::numeric,
        ${params.razonCambio}::text,
        ${params.tipoProducto}::text,
        ${params.moneda}::"Moneda",
        ${params.usuarioId}::bigint
      ) as fn_actualizar_precio_con_historico
    `;
    return result[0]?.fn_actualizar_precio_con_historico || { status: "error" };
  } catch (error) {
    console.error("Error en actualizarPrecioConHistorico:", error);
    throw new Error("No se pudo actualizar el precio");
  }
}

/**
 * Inserta un movimiento de inventario vía RPC.
 * El trigger tr_procesar_movimiento_insumo ya maneja la lógica de stock en insumo.
 * El trigger trg_actualizar_almacen_stock actualiza almacen_stock por almacenId.
 * referenciaId es opcional: NULL si no hay documento de referencia (ej. ajuste manual).
 */
export async function insertarMovimiento(
  params: InsertarMovimientoParams
): Promise<void> {
  try {
    await prisma.$executeRaw`
      SELECT public.fn_insertar_movimiento(
        ${params.tipoMovimiento}::"TipoMovimiento",
        ${params.referenciaType}::"ReferenciaMovimiento",
        ${params.referenciaId ?? null}::bigint,
        ${params.cantidad}::double precision,
        ${params.motivo}::text,
        ${params.productoId ?? null}::bigint,
        ${params.insumoId ?? null}::bigint,
        ${params.materialId ?? null}::bigint,
        ${params.costoUnitario ?? null}::numeric,
        ${params.usuarioId ?? null}::bigint
      )
    `;
  } catch (error) {
    console.error("Error en insertarMovimiento RPC:", error);
    throw new Error("No se pudo registrar el movimiento de inventario vía RPC");
  }
}

export async function recalcularDescuentoCotizacion(cotizacionId: number): Promise<void> {
  try {
    await prisma.$executeRaw`
      SELECT public.fn_recalcular_descuento_cotizacion(${cotizacionId}::bigint)
    `;
  } catch (error) {
    console.error("Error en recalcularDescuentoCotizacion RPC:", error);
    throw new Error("No se pudo recalcular el descuento de la cotización");
  }
}

export async function obtenerStockDisponible(
  productoId: number,
  almacenId: number
): Promise<{ stock_actual: number; reservas_activas: number; disponible: number }> {
  try {
    const resultado = await prisma.$queryRaw<{
      stock_actual: number;
      reservas_activas: number;
      disponible: number;
    }[]>`
      SELECT
        COALESCE((
          SELECT cantidad FROM public.almacen_stock
          WHERE producto_id = ${productoId}::bigint
            AND almacen_id  = ${almacenId}::bigint
        ), 0)::integer AS stock_actual,
        0::integer AS reservas_activas,
        0::integer AS disponible
    `;
    return resultado[0] ?? { stock_actual: 0, reservas_activas: 0, disponible: 0 };
  } catch (error) {
    console.error("Error en obtenerStockDisponible:", error);
    throw new Error("No se pudo obtener el stock disponible");
  }
}

export async function registrarCambioEstadoConfeccion(
  confeccionId: number,
  estadoAnterior: string,
  estadoNuevo: string,
  notasCambio?: string
): Promise<void> {
  try {
    await prisma.seguimiento_confeccion.create({
      data: {
        confeccion_id: confeccionId,
        estado_anterior: estadoAnterior as any,
        estado_nuevo: estadoNuevo as any,
        notas: notasCambio,
      },
    });
  } catch (error) {
    console.error("Error en registrarCambioEstadoConfeccion:", error);
    throw new Error("No se pudo registrar el cambio de estado");
  }
}

export async function obtenerAuditoriaRegistro(tabla: string, registroId: number): Promise<any[]> {
  try {
    return await prisma.auditoria.findMany({
      where: { tabla, registro_id: registroId },
      orderBy: { created_at: "desc" },
    });
  } catch (error) {
    console.error("Error en obtenerAuditoriaRegistro:", error);
    throw new Error("No se pudo obtener el histórico de auditoría");
  }
}

export async function crearNotificacion(data: {
  usuarioId: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  referenciaType: ReferenciaNotificacion; 
  referenciaId?: number;
  urlDestino?: string;
}): Promise<any> {
  try {
    return await prisma.notificaciones.create({
      data: {
        usuario_id: data.usuarioId,
        tipo: data.tipo as TipoNotificacion,
        titulo: data.titulo,
        mensaje: data.mensaje,
        referencia_tipo: (data.referenciaType ?? 'SISTEMA') as ReferenciaNotificacion,
        url_destino: data.urlDestino,
      },
    });
  } catch (error) {
    console.error("Error en crearNotificacion:", error);
    throw new Error("No se pudo crear la notificación");
  }
}

export async function obtenerNotificacionesNoLeidas(usuarioId: number): Promise<any[]> {
  try {
    return await prisma.notificaciones.findMany({
      where: { usuario_id: usuarioId, leido: false },
      orderBy: { created_at: "desc" },
    });
  } catch (error) {
    console.error("Error en obtenerNotificacionesNoLeidas:", error);
    throw new Error("No se pudo obtener las notificaciones");
  }
}

export async function marcarNotificacionesComoLeidas(
  usuarioId: number,
  notificacionesIds?: number[]
): Promise<void> {
  try {
    const whereClause = notificacionesIds?.length
      ? { usuario_id: usuarioId, id: { in: notificacionesIds } }
      : { usuario_id: usuarioId };
    await prisma.notificaciones.updateMany({
      where: whereClause,
      data: { leido: true, leido_at: new Date() },
    });
  } catch (error) {
    console.error("Error en marcarNotificacionesComoLeidas:", error);
    throw new Error("No se pudo actualizar las notificaciones");
  }
}

export async function obtenerHistoricoPrecio(productoId: number): Promise<any[]> {
  try {
    return await prisma.$queryRaw`
      SELECT * FROM public.precio_historico
      WHERE producto_id = ${productoId}::bigint
      ORDER BY created_at DESC
    `;
  } catch (error) {
    console.error("Error en obtenerHistoricoPrecio:", error);
    throw new Error("No se pudo obtener el histórico de precios");
  }
}

export async function validarStockSuficiente(
  productoId: number,
  cantidad: number
): Promise<boolean> {
  try {
    const resultado = await prisma.productos.findUnique({
      where: { id: productoId },
      select: { stock: true },
    });
    return (resultado?.stock || 0) >= cantidad;
  } catch (error) {
    console.error("Error en validarStockSuficiente:", error);
    throw new Error("No se pudo validar el stock");
  }
}

export async function obtenerAuditoriaReciente(limit = 50): Promise<any[]> {
  try {
    return await prisma.auditoria.findMany({
      take: limit,
      orderBy: { created_at: "desc" },
      include: { usuarios: { select: { id: true, email: true } } },
    });
  } catch (error) {
    console.error("Error en obtenerAuditoriaReciente:", error);
    throw new Error("No se pudo obtener el histórico de auditoría");
  }
}

export default {
  calcularCostoFicha,
  crearReservaStock,
  actualizarPrecioConHistorico,
  insertarMovimiento,
  obtenerStockDisponible,
  registrarCambioEstadoConfeccion,
  obtenerAuditoriaRegistro,
  crearNotificacion,
  obtenerNotificacionesNoLeidas,
  marcarNotificacionesComoLeidas,
  obtenerHistoricoPrecio,
  validarStockSuficiente,
  obtenerAuditoriaReciente,
  recalcularDescuentoCotizacion,
};