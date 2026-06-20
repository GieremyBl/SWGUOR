import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import {
  type ReferenciaMovimiento,
  type TipoMovimiento,
  type TipoInsumo,
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
  categoria_id?: number;
  tipo?: TipoInsumo;
  busqueda?: string;
  bajo_stock?: boolean;
  sort?: 'asc' | 'desc';
}

export interface CrearInsumoData {
  nombre: string;
  tipo: TipoInsumo;
  categoria_id: number;
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
  categoria_id?: number;
  unidad_medida?: UnidadMedida;
  stock_minimo?: number;
  stock_maximo?: number;
  precio_unitario?: number;
  proveedor_id?: string;
  ubicacion_almacen?: string;
  alerta_bajo_stock?: boolean;
}

export interface AjustarStockInput {
  stock_delta?: number;
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
      ...(params?.categoria_id && { categoria_id: params.categoria_id }),
      ...(params?.tipo && { tipo: params.tipo }),
      ...(params?.busqueda && { nombre: { contains: params.busqueda, mode: 'insensitive' } }),
    };

    const insumos = await prisma.insumo.findMany({
      where,
      include: {
        categoria_insumo: { select: { id: true, nombre: true } },
        proveedores: { select: { id: true, razon_social: true } },
      },
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
      include: {
        categoria_insumo: { select: { id: true, nombre: true } },          // ✅ relación
        proveedores: { select: { id: true, razon_social: true } },
      },
    });
    return insumo ? serializeBigInt(insumo) : null;
  },

  async crear(data: CrearInsumoData) {
    const insumo = await prisma.insumo.create({
      data: {
        nombre: data.nombre,
        tipo: data.tipo,
        categoria_id: data.categoria_id,
        unidad_medida: data.unidad_medida ?? 'unidades',
        stock_actual: (data.stock_actual ?? 0).toString(),
        stock_minimo: (data.stock_minimo ?? 10).toString(),
        stock_maximo: data.stock_maximo != null ? data.stock_maximo.toString() : null,
        precio_unitario: data.precio_unitario != null ? data.precio_unitario.toString() : null,
        proveedor_id: data.proveedor_id ? BigInt(data.proveedor_id) : null,
        alerta_bajo_stock: data.alerta_bajo_stock ?? true,
      },
    });
    return serializeBigInt(insumo);
  },

  async actualizar(id: string, data: ActualizarInsumoData) {
    const insumo = await prisma.insumo.update({
      where: { id: BigInt(id) },
      data: {
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.tipo !== undefined && { tipo: data.tipo }),
        ...(data.categoria_id !== undefined && { categoria_id: data.categoria_id }),
        ...(data.unidad_medida !== undefined && { unidad_medida: data.unidad_medida }),
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

  async eliminar(id: string) {
    await prisma.insumo.delete({ where: { id: BigInt(id) } });
    return { success: true };
  },

  async obtenerStockBajo() {
    try {
      const insumos = await prisma.insumo.findMany({
        where: { alerta_bajo_stock: true },
        include: { categoria_insumo: { select: { id: true, nombre: true } } },
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

  async ajustarStock(id: string, data: AjustarStockInput) {
    const insumo = await prisma.insumo.findUnique({
      where: { id: BigInt(id) },
    });

    if (!insumo) {
      throw new Error('Insumo no encontrado');
    }

    const stockActual = data.stock_actual ?? Number(insumo.stock_actual) + (data.stock_delta ?? 0);

    if (stockActual < 0) {
      throw new Error('Stock insuficiente');
    }

    // Register movement if needed
    if (data.usuario_id && data.referencia_tipo) {
      await insertarMovimiento({
        tipoMovimiento: data.stock_delta && data.stock_delta > 0 ? 'entrada' : 'salida',  // ✅ Changed to camelCase
        referenciaType: data.referencia_tipo,
        cantidad: Math.abs(data.stock_delta ?? 0),
        motivo: data.motivo || 'Ajuste de stock',
        usuarioId: data.usuario_id ? Number(data.usuario_id) : undefined,
        insumoId: Number(id),
      });
    }

    const updated = await prisma.insumo.update({
      where: { id: BigInt(id) },
      data: {
        stock_actual: stockActual.toString(),
        ...(data.costo_unitario && { precio_unitario: data.costo_unitario.toString() }),
        updated_at: new Date(),
      },
      include: {
        categoria_insumo: { select: { id: true, nombre: true } },
        proveedores: { select: { id: true, razon_social: true } },
      },
    });

    return serializeBigInt(updated);
  },

  async validarStock(productoId: number, cantidad: number): Promise<boolean> {
    try {
      return await validarStockSuficiente(productoId, cantidad);
    } catch (error) {
      console.error('Error validando stock:', error);
      return false;
    }
  },
};