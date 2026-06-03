import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import {
  type ReferenciaMovimiento,
  type TipoMovimiento,
  type TipoInsumo,
  type CategoriaInsumo,
  type UnidadMedida,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import {
  insertarMovimiento,
  obtenerStockDisponible,
  validarStockSuficiente,
} from '@/lib/helpers/rpc-helpers';

// ─── Interfaces públicas ───────────────────────────────────────────────────

export interface ListarInsumosParams {
  categoria_insumo?: CategoriaInsumo;
  tipo?: TipoInsumo;
  busqueda?: string;
  bajo_stock?: boolean;
  sort?: 'asc' | 'desc';
}

export interface CrearInsumoData {
  nombre: string;
  tipo: TipoInsumo;
  categoria_insumo?: CategoriaInsumo;
  unidad_medida?: UnidadMedida;
  stock_actual?: number;
  stock_minimo?: number;
  stock_maximo?: number;
  precio_unitario?: number;
  proveedor_id?: string;
  ubicacion_almacen?: string;
  alerta_bajo_stock?: boolean;
}

export interface ActualizarInsumoData {
  nombre?: string;
  tipo?: TipoInsumo;
  categoria_insumo?: CategoriaInsumo;
  unidad_medida?: UnidadMedida;
  stock_minimo?: number;
  stock_maximo?: number;
  precio_unitario?: number;
  proveedor_id?: string;
  ubicacion_almacen?: string;
  alerta_bajo_stock?: boolean;
}

export interface AjustarStockInput {
  /** Relativo: +5 / -3. Excluye stock_actual. */
  stock_delta?: number;
  /** Absoluto: valor exacto. Excluye stock_delta. */
  stock_actual?: number;
  motivo?: string;
  usuario_id?: string;
  costo_unitario?: number;
  referencia_tipo?: ReferenciaMovimiento;
  precio_unitario?: number;
  almacen_id?: string;
}

export interface RegistrarMovimientoRPCData {
  tipo_movimiento: TipoMovimiento;
  cantidad: number;
  referencia_tipo: ReferenciaMovimiento;
  referencia_id?: number;
  descripcion?: string;
  usuario_id: number;
  insumo_id?: number;
  producto_id?: number;
  material_id?: number;
  almacen_id?: number;
}

export interface ListarMovimientosParams {
  insumo_id?: string;
  producto_id?: string;
  material_id?: string;
  desde?: string;
  hasta?: string;
  limite?: number;
  tipo?: TipoMovimiento;
  referencia?: ReferenciaMovimiento;
  tipoItem?: 'insumo' | 'producto' | 'material';
}

// ─── Service ──────────────────────────────────────────────────────────────

export const InventarioService = {

  async listar(params?: ListarInsumosParams) {
    const where: Prisma.insumoWhereInput = {
      ...(params?.categoria_insumo && { categoria_insumo: params.categoria_insumo }),
      ...(params?.tipo && { tipo: params.tipo }),
      ...(params?.busqueda && { nombre: { contains: params.busqueda, mode: 'insensitive' } }),
    };

    const insumos = await prisma.insumo.findMany({
      where,
      include: { proveedores: { select: { id: true, razon_social: true } } },
      orderBy: params?.sort ? { precio_unitario: params.sort } : { nombre: 'asc' },
    });

    const resultado = params?.bajo_stock
      ? insumos.filter(i => Number(i.stock_actual) <= Number(i.stock_minimo))
      : insumos;

    return serializeBigInt(resultado);
  },

  async obtenerPorId(id: string) {
    const insumo = await prisma.insumo.findUnique({
      where: { id: BigInt(id) },
      include: { proveedores: { select: { id: true, razon_social: true } } },
    });
    return insumo ? serializeBigInt(insumo) : null;
  },

  async crear(data: CrearInsumoData) {
    const insumo = await prisma.insumo.create({
      data: {
        nombre: data.nombre,
        tipo: data.tipo,
        categoria_insumo: data.categoria_insumo ?? 'otro',
        unidad_medida: data.unidad_medida ?? 'unidades',
        stock_actual: (data.stock_actual ?? 0).toString(),
        stock_minimo: (data.stock_minimo ?? 10).toString(),
        stock_maximo: data.stock_maximo != null ? data.stock_maximo.toString() : null,
        precio_unitario: data.precio_unitario != null ? data.precio_unitario.toString() : null,
        proveedor_id: data.proveedor_id ? BigInt(data.proveedor_id) : null,
        ubicacion_almacen: data.ubicacion_almacen ?? null,
        alerta_bajo_stock: data.alerta_bajo_stock ?? true,
      },
    });
    return serializeBigInt(insumo);
  },

  async actualizar(id: string, data: ActualizarInsumoData) {
    const insumo = await prisma.insumo.update({
      where: { id: BigInt(id) },
      data: {
        ...(data.nombre && { nombre: data.nombre }),
        ...(data.tipo && { tipo: data.tipo }),
        ...(data.categoria_insumo && { categoria_insumo: data.categoria_insumo }),
        ...(data.unidad_medida && { unidad_medida: data.unidad_medida }),
        ...(data.alerta_bajo_stock !== undefined && { alerta_bajo_stock: data.alerta_bajo_stock }),
        ...(data.ubicacion_almacen !== undefined && { ubicacion_almacen: data.ubicacion_almacen }),
        ...(data.stock_minimo != null && { stock_minimo: data.stock_minimo.toString() }),
        ...(data.stock_maximo != null && { stock_maximo: data.stock_maximo.toString() }),
        ...(data.precio_unitario != null && { precio_unitario: data.precio_unitario.toString() }),
        ...(data.proveedor_id != null && { proveedor_id: BigInt(data.proveedor_id) }),
        updated_at: new Date(),
      },
    });
    return serializeBigInt(insumo);
  },

  /**
   * Ajusta el stock de un insumo y registra el movimiento en una transacción.
   */
  async ajustarStock(id: string, input: AjustarStockInput) {
    return prisma.$transaction(async (tx) => {
      const insumo = await tx.insumo.findUniqueOrThrow({ where: { id: BigInt(id) } });

      const stockAnterior = Number(insumo.stock_actual);
      const nuevoStock = input.stock_delta !== undefined
        ? stockAnterior + input.stock_delta
        : Number(input.stock_actual);

      if (nuevoStock < 0)
        throw new Error(`Stock insuficiente. Actual: ${stockAnterior}`);

      const cantidadMovimiento = Math.abs(nuevoStock - stockAnterior);

      if (cantidadMovimiento === 0)
        throw new Error('El stock no cambió. No se registrará ningún movimiento.');

      const tipoMovimiento: TipoMovimiento =
        nuevoStock > stockAnterior ? 'entrada' :
          nuevoStock < stockAnterior ? 'salida' : 'ajuste';

      const referencia_tipo: ReferenciaMovimiento =
        input.referencia_tipo ?? 'AJUSTE_MANUAL';

      const [actualizado] = await Promise.all([
        tx.insumo.update({
          where: { id: BigInt(id) },
          data: {
            stock_actual: nuevoStock.toString(),
            updated_at: new Date(),
            ...(input.precio_unitario !== undefined && {
              precio_unitario: input.precio_unitario.toString(),
            }),
          },
        }),
        tx.movimientos_inventario.create({
          data: {
            insumo_id: BigInt(id),
            cantidad: cantidadMovimiento,
            motivo: input.motivo ?? 'Ajuste de stock manual',
            tipo_movimiento: tipoMovimiento,
            referencia_tipo: referencia_tipo,
            usuario_id: input.usuario_id ? BigInt(input.usuario_id) : null,
            almacen_id: input.almacen_id ? BigInt(input.almacen_id) : null,
          },
        }),
      ]);

      return serializeBigInt(actualizado);
    });
  },

  async eliminar(id: string) {
    await prisma.insumo.delete({ where: { id: BigInt(id) } });
    return { success: true };
  },

  async listarMovimientos(params?: ListarMovimientosParams) {
    const where: Prisma.movimientos_inventarioWhereInput = {
      ...(params?.insumo_id && { insumo_id: BigInt(params.insumo_id) }),
      ...(params?.producto_id && { producto_id: BigInt(params.producto_id) }),
      ...(params?.material_id && { material_id: BigInt(params.material_id) }),
      ...(params?.tipo && { tipo_movimiento: params.tipo }),
      ...(params?.referencia && { referencia_tipo: params.referencia }),
      ...((params?.desde || params?.hasta) && {
        created_at: {
          ...(params.desde && { gte: new Date(params.desde) }),
          ...(params.hasta && { lte: new Date(params.hasta) }),
        },
      }),
      ...(params?.tipoItem === 'insumo' && { insumo_id: { not: null } }),
      ...(params?.tipoItem === 'producto' && { producto_id: { not: null } }),
      ...(params?.tipoItem === 'material' && { material_id: { not: null } }),
    };

    const movimientos = await prisma.movimientos_inventario.findMany({
      where,
      include: {
        insumo: { select: { id: true, nombre: true, unidad_medida: true } },
        productos: { select: { id: true, nombre: true } },
        materiales: { select: { id: true, nombre: true } },
        usuarios: {
          select: {
            id: true,
            email: true,
            personal_interno: { select: { nombre_completo: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: params?.limite ?? 50,
    });
    return serializeBigInt(movimientos);
  },

  // ── FUNCIONES CON RPC ──────────────────────────────────────────────────────

  // FIX: Removido el parámetro '_almacenId' que no se utilizaba para limpiar la advertencia de ESLint
  async obtenerStockBajo() {
    try {
      const insumos = await prisma.insumo.findMany({
        where: { alerta_bajo_stock: true },
        orderBy: { stock_actual: 'asc' },
      });
      return serializeBigInt(
        insumos.filter(i => Number(i.stock_actual) <= Number(i.stock_minimo))
      );
    } catch (error) {
      console.error('Error obteniendo stock bajo:', error);
      return [];
    }
  },

  async obtenerStockDisponibleProducto(productoId: number, almacenId: number) {
    try {
      return await obtenerStockDisponible(productoId, almacenId);
    } catch (error) {
      console.error('Error obteniendo stock disponible:', error);
      return null;
    }
  },

  async validarStock(productoId: number, cantidad: number): Promise<boolean> {
    try {
      return await validarStockSuficiente(productoId, cantidad);
    } catch (error) {
      console.error('Error validando stock:', error);
      return false;
    }
  },

  /**
   * Registra un movimiento explícitamente vía RPC.
   */
  async registrarMovimientoRPC(data: RegistrarMovimientoRPCData) {
    const recursos = [data.insumo_id, data.producto_id, data.material_id].filter(
      (v): v is number => v != null
    ).length;
    if (recursos === 0) throw new Error('Debe indicar insumo_id, producto_id o material_id');
    if (recursos > 1) throw new Error('Solo puede indicar un recurso a la vez');
    if (data.cantidad <= 0) throw new Error('La cantidad debe ser mayor a 0');

    try {
      const movimiento = await prisma.movimientos_inventario.create({
        data: {
          cantidad: data.cantidad,
          motivo: data.descripcion ?? 'Movimiento registrado',
          tipo_movimiento: data.tipo_movimiento,
          referencia_tipo: data.referencia_tipo,
          usuario_id: BigInt(data.usuario_id),
          ...(data.insumo_id != null && { insumo_id: BigInt(data.insumo_id) }),
          ...(data.producto_id != null && { producto_id: BigInt(data.producto_id) }),
          ...(data.material_id != null && { material_id: BigInt(data.material_id) }),
          ...(data.almacen_id != null && { almacen_id: BigInt(data.almacen_id) }),
        },
      });

      await insertarMovimiento({
        tipoMovimiento: data.tipo_movimiento,
        referenciaType: data.referencia_tipo,
        referenciaId: data.referencia_id,
        cantidad: data.cantidad,
        motivo: data.descripcion ?? '',
        usuarioId: data.usuario_id,
        insumoId: data.insumo_id,
        productoId: data.producto_id,
        materialId: data.material_id,
        almacenId: data.almacen_id,
      });

      return serializeBigInt(movimiento);
    } catch (error) {
      console.error('Error registrando movimiento:', error);
      throw error;
    }
  },

  async obtenerEstadisticasMovimientos(params?: { desde?: string; hasta?: string }) {
    const movimientos = await prisma.movimientos_inventario.findMany({
      where: {
        ...((params?.desde || params?.hasta) && {
          created_at: {
            ...(params.desde && { gte: new Date(params.desde) }),
            ...(params.hasta && { lte: new Date(params.hasta) }),
          },
        }),
      },
    });

    return movimientos.reduce(
      (acc, mov) => {
        acc.totalMovimientos++;
        if (mov.tipo_movimiento === 'entrada') acc.totalEntradas++;
        if (mov.tipo_movimiento === 'salida') acc.totalSalidas++;
        if (mov.tipo_movimiento === 'ajuste') acc.totalAjustes++;
        return acc;
      },
      {
        totalEntradas: 0,
        totalSalidas: 0,
        totalAjustes: 0,
        totalMovimientos: 0,
        montoTotalEntradas: 0,
        montoTotalSalidas: 0,
      }
    );
  },
};