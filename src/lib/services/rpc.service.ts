/**
 * ──────────────────────────────────────────────────────────────────────────────
 * Punto único de acceso a las operaciones que llaman a funciones RPC /
 * lógica de base de datos que antes estaba repartida en:
 *
 * - notificaciones-rpc-service.ts
 * - fichas-tecnicas-rpc-service.ts
 * - fichas-tecnicas-services.ts       (partes RPC)
 * - inventario-rpc-service.ts
 * - inventario-services.ts            (partes RPC)
 * - movimientos-inventario-services.ts
 *
 * Todos los imports del proyecto deben apuntar a este archivo.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import {
  calcularCostoFicha,
  insertarMovimiento,
  obtenerAuditoriaRegistro,
  obtenerStockDisponible,
  validarStockSuficiente,
  recalcularDescuentoCotizacion,
  actualizarPrecioConHistorico,
} from '@/lib/helpers/rpc-helpers';
import type {
  EstadoFicha,
  ReferenciaMovimiento,
  TipoMovimiento,
  notificaciones,
  fichas_tecnicas,
  movimientos_inventario,
  ReferenciaNotificacion,
  TipoNotificacion,
} from '@prisma/client';
import { Prisma } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Notificaciones ────────────────────────────────────────────────────────────

export type TipoNotificacionRPC =
  | 'cotizacion_expirada'
  | 'devolucion_solicitada'
  | 'stock_bajo'
  | 'pago_pendiente'
  | 'confeccion_completada'
  | 'pedido_listo'
  | 'orden_compra_recibida'
  | 'ficha_tecnica_aprobada'
  | 'incidencia_reportada';

export interface CrearNotificacionInput {
  usuarioId: number;
  tipo: TipoNotificacionRPC;
  titulo: string;
  mensaje: string;
  referenciaType?: ReferenciaNotificacion;  
  referenciaId?: number;
  urlDestino?: string;
}

export interface NotificacionConDetalles extends notificaciones {
  usuarioEmail?: string;
}

// ── Fichas técnicas ───────────────────────────────────────────────────────────

export interface CrearFichaTecnicaInput {
  productoId: number;
  version?: string;
  descripcionDetallada?: string;
  imagenGeometral?: string;
  samTotal?: number;
  costoEstimado?: number;
  fichaUrl?: string;
  createdBy?: number;
  detalles?: Array<{
    materialId?: number;
    insumoId?: number;
    cantidadConsumo: number;
    porcentajeDesperdicio?: number;
    observaciones?: string;
  }>;
}

export interface ActualizarFichaTecnicaInput {
  version?: string;
  descripcionDetallada?: string;
  estado?: EstadoFicha;
  samTotal?: number;
  costoEstimado?: number;
  fichaUrl?: string;
  imagenGeometral?: string;
  detalles?: Array<{
    materialId?: number;
    insumoId?: number;
    cantidadConsumo: number;
    porcentajeDesperdicio?: number;
    observaciones?: string;
  }>;
}

// ── Inventario ────────────────────────────────────────────────────────────────

export interface StockPorAlmacen {
  almacenId: number;
  almacenNombre: string;
  cantidad: number;
  stockMinimo: number;
  disponible: number;
}

export interface RegistrarMovimientoParams {
  insumo_id?: string | number;
  material_id?: string | number;
  producto_id?: string | number;
  cantidad: number;
  tipo_movimiento: TipoMovimiento;
  referencia_tipo: ReferenciaMovimiento;
  motivo: string;
  usuario_id?: string | number;
  almacen_id?: string | number;
  referencia_id?: string | number;
}

// Interface auxiliar para el tipado seguro del mapeo de búsqueda en movimientos
interface MovimientoConRelaciones extends movimientos_inventario {
  insumo?: { id: bigint; nombre: string; unidad_medida: string } | null;
  materiales?: { id: bigint; nombre: string } | null;
  productos?: { id: bigint; nombre: string } | null;
  usuarios?: { id: bigint; email: string } | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICACIONES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Crea una notificación directamente en la tabla notificaciones.
 */
export async function crearNotificacion(
  input: CrearNotificacionInput,
): Promise<notificaciones> {
  return prisma.notificaciones.create({
    data: {
      usuario_id:      input.usuarioId,
      tipo:            input.tipo as TipoNotificacion,
      titulo:          input.titulo,
      mensaje:         input.mensaje,
      referencia_tipo: (input.referenciaType ?? 'SISTEMA') as ReferenciaNotificacion,
      referencia_id:   input.referenciaId   ?? null,
      url_destino:     input.urlDestino      ?? null,
      leido:           false,
    },
  });
}

/**
 * Devuelve las notificaciones no leídas de un usuario con paginación.
 */
export async function obtenerNotificacionesNoLeidas(
  usuarioId: number,
  limit = 50,
  offset = 0,
): Promise<{ total: number; notificaciones: NotificacionConDetalles[] }> {
  const [total, rows] = await Promise.all([
    prisma.notificaciones.count({ where: { usuario_id: usuarioId, leido: false } }),
    prisma.notificaciones.findMany({
      where:   { usuario_id: usuarioId, leido: false },
      orderBy: { created_at: 'desc' },
      take:    limit,
      skip:    offset,
      include: { usuarios: { select: { email: true } } },
    }),
  ]);

  return {
    total,
    notificaciones: rows.map((n) => ({
      ...n,
      usuarioEmail: (n.usuarios)?.email,
    })) as NotificacionConDetalles[],
  };
}

/**
 * Marca como leídas las notificaciones indicadas por ID.
 */
export async function marcarNotificacionesComoLeidas(
  notificacionIds: number[],
): Promise<void> {
  await prisma.notificaciones.updateMany({
    where: { id: { in: notificacionIds } },
    data:  { leido: true, leido_at: new Date() },
  });
}

/**
 * Marca TODAS las notificaciones de un usuario como leídas.
 */
export async function marcarTodasComoLeidas(usuarioId: number): Promise<void> {
  await prisma.notificaciones.updateMany({
    where: { usuario_id: usuarioId, leido: false },
    data:  { leido: true, leido_at: new Date() },
  });
}

// ── Eventos de negocio que generan notificaciones ────────────────────────────

async function _admins() {
  return prisma.usuarios.findMany({
    where: { rol: 'administrador', estado: 'activo' },
  });
}

export async function notificarCotizacionExpirada(data: {
  cotizacionId: number;
  cotizacionNumero: string;
}): Promise<void> {
  const admins = await _admins();
  await Promise.all(
    admins.map((a) =>
      crearNotificacion({
        usuarioId:     Number(a.id),
        tipo:          'cotizacion_expirada',
        titulo:        `Cotización expirada: ${data.cotizacionNumero}`,
        mensaje:       `La cotización ${data.cotizacionNumero} expiró sin aprobación.`,
        referenciaType: 'COTIZACION',
        referenciaId:   data.cotizacionId,
        urlDestino:    `/admin/Panel-Administrativo/cotizaciones/${data.cotizacionId}`,
      }),
    ),
  );
}

export async function notificarDevolucionSolicitada(data: {
  devolucionId: number;
  clienteId: number;
  productoNombre: string;
}): Promise<void> {
  const admins = await _admins();
  await Promise.all(
    admins.map((a) =>
      crearNotificacion({
        usuarioId:     Number(a.id),
        tipo:          'devolucion_solicitada',
        titulo:        'Nueva devolución solicitada',
        mensaje:       `El cliente solicitó devolución de: ${data.productoNombre}`,
        referenciaType: 'PEDIDO',
        referenciaId:   data.devolucionId,
        urlDestino:    `/admin/Panel-Administrativo/devoluciones/${data.devolucionId}`,
      }),
    ),
  );
}

export async function notificarStockBajo(data: {
  itemId: number;
  itemNombre: string;
  stockActual: number;
  stockMinimo: number;
  tipoItem: 'producto' | 'insumo' | 'material';
}): Promise<void> {
  const usuarios = await prisma.usuarios.findMany({
    where: { rol: { in: ['administrador', 'almacenero'] }, estado: 'activo' },
  });
  await Promise.all(
    usuarios.map((u) =>
      crearNotificacion({
        usuarioId:     Number(u.id),
        tipo:          'stock_bajo',
        titulo:        `Stock bajo: ${data.itemNombre}`,
        mensaje:       `Stock de "${data.itemNombre}" bajó a ${data.stockActual} (mínimo: ${data.stockMinimo})`,
        referenciaType: 'PRODUCTO',
        referenciaId:   data.itemId,
        urlDestino:    '/admin/Panel-Administrativo/inventario',
      }),
    ),
  );
}

export async function notificarPagoPendiente(data: {
  confeccionId: number;
  tallerNombre: string;
  monto: number;
}): Promise<void> {
  const admins = await _admins();
  await Promise.all(
    admins.map((a) =>
      crearNotificacion({
        usuarioId:     Number(a.id),
        tipo:          'pago_pendiente',
        titulo:        `Pago pendiente: ${data.tallerNombre}`,
        mensaje:       `Confección #${data.confeccionId} completada. Pago pendiente: S/ ${data.monto}`,
        referenciaType: 'PAGO',
        referenciaId:   data.confeccionId,
        urlDestino:    '/admin/Panel-Administrativo/pagos-taller',
      }),
    ),
  );
}

export async function notificarConfeccionCompletada(data: {
  confeccionId: number;
  pedidoId: number;
}): Promise<void> {
  const pedido = await prisma.pedidos.findUnique({
    where:  { id: BigInt(data.pedidoId) },
    select: { clientes: { select: { usuario_id: true } } },
  });

  const usuarioId = pedido?.clientes?.usuario_id;
  if (!usuarioId) return;

  await crearNotificacion({
    usuarioId:     Number(usuarioId),
    tipo:          'confeccion_completada',
    titulo:        'Tu confección está lista',
    mensaje:       `La confección del pedido #${data.pedidoId} está lista para despacho.`,
    referenciaType: 'ORDEN_PRODUCCION',
    referenciaId:   data.confeccionId,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// FICHAS TÉCNICAS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Devuelve el costo calculado de una ficha técnica vía RPC helper.
 */
export async function obtenerCostoFicha(fichaId: number): Promise<number> {
  try {
    return await calcularCostoFicha({ fichaId });
  } catch {
    return 0;
  }
}

/**
 * Obtiene una ficha con sus detalles e incluye el costo calculado.
 */
export async function obtenerFichaTecnicaConCosto(fichaId: number) {
  const ficha = await prisma.fichas_tecnicas.findUnique({
    where:   { id: BigInt(fichaId) },
    include: {
      fichas_tecnicas_detalle: {
        include: {
          materiales: { select: { id: true, nombre: true, precio_unitario: true } },
          insumo:     { select: { id: true, nombre: true, precio_unitario: true } },
        },
      },
      productos: { select: { id: true, nombre: true, sku: true } },
    },
  });

  if (!ficha) return null;

  return serializeBigInt({
    ...ficha,
    costo_calculado: await obtenerCostoFicha(fichaId),
  });
}

/**
 * Crea una ficha técnica con sus detalles en una sola transacción.
 */
export async function crearFichaTecnica(input: CrearFichaTecnicaInput) {
  return prisma.$transaction(async (tx) => {
    const ficha = await tx.fichas_tecnicas.create({
      data: {
        id_producto:           input.productoId,
        version:               input.version              ?? '1.0',
        descripcion_detallada: input.descripcionDetallada ?? null,
        imagen_geometral:      input.imagenGeometral      ?? null,
        sam_total:             input.samTotal    != null ? new Prisma.Decimal(input.samTotal)    : null,
        costo_estimado:        input.costoEstimado != null ? new Prisma.Decimal(input.costoEstimado) : null,
        ficha_url:             input.fichaUrl             ?? null,
        estado:                'borrador',
        created_by:            input.createdBy             ?? null,
        fichas_tecnicas_detalle: {
          create: (input.detalles ?? []).map((d) => ({
            material_id:            d.materialId ?? null,
            insumo_id:              d.insumoId   ?? null,
            cantidad_consumo:       new Prisma.Decimal(d.cantidadConsumo),
            porcentaje_desperdicio: new Prisma.Decimal(d.porcentajeDesperdicio ?? 0),
            observaciones:          d.observaciones ?? null,
          })),
        },
      },
      include: { fichas_tecnicas_detalle: true },
    });

    // Vincular la ficha al producto
    await tx.fichas_tecnicas.update({
      where: { id: ficha.id },
      data:  { id_producto: input.productoId },
    });

    return serializeBigInt({
      ...ficha,
      costo_calculado: await obtenerCostoFicha(Number(ficha.id)),
    });
  });
}

/**
 * Actualiza una ficha técnica (reemplaza detalles si se envían).
 */
export async function actualizarFichaTecnica(
  fichaId: number,
  input: ActualizarFichaTecnicaInput,
) {
  return prisma.$transaction(async (tx) => {
    if (input.detalles) {
      await tx.fichas_tecnicas_detalle.deleteMany({ where: { ficha_id: BigInt(fichaId) } });
    }

    const ficha = await tx.fichas_tecnicas.update({
      where: { id: BigInt(fichaId) },
      data: {
        ...(input.version              && { version: input.version }),
        ...(input.descripcionDetallada && { descripcion_detallada: input.descripcionDetallada }),
        ...(input.estado               && { estado: input.estado }),
        ...(input.imagenGeometral      && { imagen_geometral: input.imagenGeometral }),
        ...(input.fichaUrl             && { ficha_url: input.fichaUrl }),
        ...(input.samTotal     != null && { sam_total:      new Prisma.Decimal(input.samTotal) }),
        ...(input.costoEstimado != null && { costo_estimado: new Prisma.Decimal(input.costoEstimado) }),
        ...(input.detalles && {
          fichas_tecnicas_detalle: {
            create: input.detalles.map((d) => ({
              material_id:            d.materialId ?? null,
              insumo_id:              d.insumoId   ?? null,
              cantidad_consumo:       new Prisma.Decimal(d.cantidadConsumo),
              porcentaje_desperdicio: new Prisma.Decimal(d.porcentajeDesperdicio ?? 0),
              observaciones:          d.observaciones ?? null,
            })),
          },
        }),
      },
      include: { fichas_tecnicas_detalle: true },
    });

    return serializeBigInt({
      ...ficha,
      costo_calculado: await obtenerCostoFicha(fichaId),
    });
  });
}

/**
 * Aprueba una ficha técnica y registra en auditoría.
 */
export async function aprobarFichaTecnica(
  fichaId: number,
  usuarioId: number,
): Promise<fichas_tecnicas> {
  const ficha = await prisma.fichas_tecnicas.update({
    where: { id: BigInt(fichaId) },
    data:  { estado: 'aprobada' as EstadoFicha },
  });

  await insertarMovimiento({
    tipoMovimiento: 'ajuste',
    referenciaType: 'AJUSTE_MANUAL',
    referenciaId:   fichaId,
    cantidad:        0,
    motivo:          `Ficha técnica #${fichaId} aprobada por usuario ${usuarioId}`,
    usuarioId:       usuarioId,
  }).catch(() => null);

  return ficha;
}

/**
 * Marca una ficha como obsoleta.
 */
export async function marcarFichaObsoleta(fichaId: number): Promise<fichas_tecnicas> {
  return prisma.fichas_tecnicas.update({
    where: { id: BigInt(fichaId) },
    data:  { estado: 'obsoleta' as EstadoFicha },
  });
}

/**
 * Devuelve todas las fichas de un producto.
 */
export async function obtenerFichasPorProducto(
  productoId: number,
): Promise<fichas_tecnicas[]> {
  return prisma.fichas_tecnicas.findMany({
    where:   { id_producto: productoId },
    orderBy: { version: 'desc' },
  });
}

/**
 * Devuelve el histórico de auditoría de una ficha.
 */
export async function obtenerHistoricoFicha(fichaId: number) {
  try {
    return await obtenerAuditoriaRegistro('fichas_tecnicas', fichaId);
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTARIO — STOCK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Obtiene el stock de un producto en todos los almacenes.
 */
export async function obtenerStockProducto(productoId: number): Promise<StockPorAlmacen[]> {
  const stocks = await prisma.almacen_stock.findMany({
    where:   { producto_id: productoId },
    include: { almacenes: { select: { id: true, nombre: true } } },
  });

  return stocks.map((s) => ({
    almacenId:    Number(s.almacen_id),
    almacenNombre: s.almacenes?.nombre ?? 'Desconocido',
    cantidad:     Number(s.cantidad    ?? 0),
    stockMinimo:  Number(s.stock_minimo ?? 0),
    disponible:   Number((s.cantidad ?? 0)) - Number((s.stock_minimo ?? 0)),
  }));
}

/**
 * Obtiene el stock de un insumo en todos los almacenes.
 */
export async function obtenerStockInsumo(insumoId: number): Promise<StockPorAlmacen[]> {
  const stocks = await prisma.almacen_stock.findMany({
    where:   { insumo_id: insumoId },
    include: { almacenes: { select: { id: true, nombre: true } } },
  });

  return stocks.map((s) => ({
    almacenId:    Number(s.almacen_id),
    almacenNombre: s.almacenes?.nombre ?? 'Desconocido',
    cantidad:     Number(s.cantidad    ?? 0),
    stockMinimo:  Number(s.stock_minimo ?? 0),
    disponible:   Number((s.cantidad ?? 0)) - Number((s.stock_minimo ?? 0)),
  }));
}

/**
 * Obtiene el stock de un material en todos los almacenes.
 */
export async function obtenerStockMaterial(materialId: number): Promise<StockPorAlmacen[]> {
  const stocks = await prisma.almacen_stock.findMany({
    where:   { material_id: materialId },
    include: { almacenes: { select: { id: true, nombre: true } } },
  });

  return stocks.map((s) => ({
    almacenId:    Number(s.almacen_id),
    almacenNombre: s.almacenes?.nombre ?? 'Desconocido',
    cantidad:     Number(s.cantidad    ?? 0),
    stockMinimo:  Number(s.stock_minimo ?? 0),
    disponible:   Number((s.cantidad ?? 0)) - Number((s.stock_minimo ?? 0)),
  }));
}

/**
 * Stock disponible de un producto en un almacén considerando reservas (vía RPC helper).
 */
export async function obtenerStockDisponibleProducto(
  productoId: number,
  almacenId: number,
): Promise<{
  stock_actual: number;
  reservas_activas: number;
  disponible: number;
} | null> {
  try {
    return await obtenerStockDisponible(productoId, almacenId);
  } catch {
    return null;
  }
}

/**
 * Valida si hay stock suficiente para una cantidad dada (vía RPC helper).
 */
export async function validarStock(
  productoId: number,
  cantidad: number,
): Promise<boolean> {
  try {
    return await validarStockSuficiente(productoId, cantidad);
  } catch {
    return false;
  }
}

/**
 * Devuelve insumos cuyo stock actual está por debajo del mínimo.
 */
export async function obtenerInsumosBajoStock() {
  const insumos = await prisma.insumo.findMany({
    where:   { alerta_bajo_stock: true },
    orderBy: { stock_actual: 'asc' },
  });
  return serializeBigInt(
    insumos.filter((i) => Number(i.stock_actual) <= Number(i.stock_minimo)),
  );
}

/**
 * Devuelve items de almacén con stock por debajo del mínimo × 1.2.
 */
export async function obtenerItemsConStockBajo(almacenId?: number) {
  const stocks = await prisma.almacen_stock.findMany({
    where:   almacenId ? { almacen_id: BigInt(almacenId) } : undefined,
    include: {
      productos:  { select: { nombre: true } },
      insumo:     { select: { nombre: true } },
      materiales: { select: { nombre: true } },
    },
  });

  return stocks
    .filter((s) => Number(s.cantidad ?? 0) <= Number(s.stock_minimo ?? 0) * 1.2)
    .map((s) => {
      if (s.producto_id)
        return { tipo: 'producto' as const, id: Number(s.producto_id), nombre: s.productos?.nombre ?? '—', stock: Number(s.cantidad ?? 0), minimo: Number(s.stock_minimo ?? 0) };
      if (s.insumo_id)
        return { tipo: 'insumo'   as const, id: Number(s.insumo_id),   nombre: s.insumo?.nombre     ?? '—', stock: Number(s.cantidad ?? 0), minimo: Number(s.stock_minimo ?? 0) };
      return   { tipo: 'material' as const, id: Number(s.material_id ?? 0), nombre: s.materiales?.nombre ?? '—', stock: Number(s.cantidad ?? 0), minimo: Number(s.stock_minimo ?? 0) };
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTARIO — MOVIMIENTOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Registra un movimiento de inventario y actualiza el stock del ítem
 * correspondiente, todo en una sola transacción.
 */
export async function registrarMovimiento(params: RegistrarMovimientoParams) : Promise<{ success: boolean }> {
  const {
    insumo_id, material_id, producto_id,
    cantidad, tipo_movimiento, referencia_tipo,
    motivo, usuario_id, referencia_id,
  } = params;

  if (!insumo_id && !material_id && !producto_id)
    throw new Error('Debe indicar ID de insumo, material o producto');
  if (cantidad <= 0)
    throw new Error('La cantidad debe ser mayor a 0');

  await insertarMovimiento({
    tipoMovimiento: tipo_movimiento,
    referenciaType: referencia_tipo,
    referenciaId:   referencia_id ? Number(referencia_id) : 0,
    cantidad,
    motivo,
    productoId:     producto_id ? Number(producto_id) : undefined,
    insumoId:       insumo_id ? Number(insumo_id) : undefined,
    materialId:     material_id ? Number(material_id) : undefined,
    usuarioId:      usuario_id ? Number(usuario_id) : undefined,
  });

  return { success: true };
}

/**
 * Recalcula el descuento de una cotización (vía RPC).
 */
export async function recalcularDescuento(cotizacionId: number) {
  return recalcularDescuentoCotizacion(cotizacionId);
}

/**
 * Actualiza el precio de un producto registrando el histórico (vía RPC).
 */
export async function actualizarPrecioProducto(params: {
  productoId: string;
  precioNuevo: number;
  razonCambio: string;
  tipoProducto: string;
  moneda: string;
  usuarioId: string;
}) {
  return actualizarPrecioConHistorico(params);
}


/**
 * Lista movimientos con filtros opcionales.
 */
export async function listarMovimientos(params?: {
  desde?: Date;
  hasta?: Date;
  tipo_movimiento?: TipoMovimiento;
  referencia_tipo?: ReferenciaMovimiento;
  producto_id?: string;
  insumo_id?: string;
  material_id?: string;
  usuario_id?: string;
  almacen_id?: string;
  busqueda?: string;
  limite?: number;
}) : Promise<movimientos_inventario[]> {
  const where: Prisma.movimientos_inventarioWhereInput = {};

  if (params?.desde || params?.hasta)
    where.created_at = {
      ...(params.desde && { gte: params.desde }),
      ...(params.hasta && { lte: params.hasta }),
    };

  if (params?.tipo_movimiento) where.tipo_movimiento = params.tipo_movimiento;
  if (params?.referencia_tipo) where.referencia_tipo = params.referencia_tipo;
  if (params?.producto_id)     where.producto_id     = BigInt(params.producto_id);
  if (params?.material_id)     where.material_id     = BigInt(params.material_id);
  if (params?.insumo_id)       where.insumo_id       = BigInt(params.insumo_id);
  if (params?.usuario_id)      where.usuario_id      = BigInt(params.usuario_id);
  if (params?.almacen_id)      where.almacen_id      = BigInt(params.almacen_id);

  const movimientos = await prisma.movimientos_inventario.findMany({
    where,
    include: {
      insumo:     { select: { id: true, nombre: true, unidad_medida: true } },
      materiales: { select: { id: true, nombre: true } },
      productos:  { select: { id: true, nombre: true } },
      usuarios:   { select: { id: true, email: true } },
    },
    orderBy: { created_at: 'desc' },
    take:    params?.limite ?? 100,
  });

  let resultado = serializeBigInt(movimientos) as MovimientoConRelaciones[];

  if (params?.busqueda) {
    const q = params.busqueda.toLowerCase();
    resultado = resultado.filter((m) => {
      const nombre = m.insumo?.nombre ?? m.materiales?.nombre ?? m.productos?.nombre ?? '';
      return nombre.toLowerCase().includes(q) || (m.motivo ?? '').toLowerCase().includes(q);
    });
    return resultado as movimientos_inventario[];
  }

  return resultado as movimientos_inventario[];
}

/**
 * Resumen de movimientos (totales por tipo).
 * Nota: 'costo_unitario' no existe en el modelo; el resumen es por cantidad.
 */
export async function obtenerResumenMovimientos(params?: {
  tipo_movimiento?: TipoMovimiento;
  desde?: Date;
  hasta?: Date;
}) {
  // FIX: Tipado seguro para filtros de conteo
  const where: Prisma.movimientos_inventarioWhereInput = {};
  if (params?.tipo_movimiento) where.tipo_movimiento = params.tipo_movimiento;
  if (params?.desde || params?.hasta)
    where.created_at = {
      ...(params.desde && { gte: params.desde }),
      ...(params.hasta && { lte: params.hasta }),
    };

  const [totalEntradas, totalSalidas, totalAjustes, totalMovimientos] = await Promise.all([
    prisma.movimientos_inventario.count({ where: { ...where, tipo_movimiento: 'entrada' } }),
    prisma.movimientos_inventario.count({ where: { ...where, tipo_movimiento: 'salida'  } }),
    prisma.movimientos_inventario.count({ where: { ...where, tipo_movimiento: 'ajuste'  } }),
    prisma.movimientos_inventario.count({ where }),
  ]);

  return { totalEntradas, totalSalidas, totalAjustes, totalMovimientos };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT AGRUPADO (compatibilidad con imports existentes)
// ═══════════════════════════════════════════════════════════════════════════════

export const NotificacionesRPC = {
  crearNotificacion,
  obtenerNotificacionesNoLeidas,
  marcarNotificacionesComoLeidas,
  marcarTodasComoLeidas,
  notificarCotizacionExpirada,
  notificarDevolucionSolicitada,
  notificarStockBajo,
  notificarPagoPendiente,
  notificarConfeccionCompletada,
};

export const FichasTecnicasRPC = {
  obtenerCostoFicha,
  obtenerFichaTecnicaConCosto,
  crearFichaTecnica,
  actualizarFichaTecnica,
  aprobarFichaTecnica,
  marcarFichaObsoleta,
  obtenerFichasPorProducto,
  obtenerHistoricoFicha,
};

export const InventarioRPC = {
  obtenerStockProducto,
  obtenerStockInsumo,
  obtenerStockMaterial,
  obtenerStockDisponibleProducto,
  validarStock,
  obtenerInsumosBajoStock,
  obtenerItemsConStockBajo,
  registrarMovimiento,
  listarMovimientos,
  obtenerResumenMovimientos,
};