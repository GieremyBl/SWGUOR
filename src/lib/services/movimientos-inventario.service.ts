import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import type { Prisma, ReferenciaMovimiento, TipoMovimiento } from '@prisma/client';
import {
  filtrosMovimientosVacios,
  mapFiltrosMovimientosToListar,
  type FiltrosMovimientosInput,
  type ListarMovimientosParams,
} from '@/lib/helpers/movimientos-filtros.helper';
import { insertarMovimiento } from '@/lib/helpers/rpc-helpers';
import { aplicarMovimientoStockProducto } from '@/lib/helpers/producto-stock-transaction.helper';

export interface RegistrarParams {
  insumo_id?: string | number;
  material_id?: string | number;
  producto_id?: string | number;
  cantidad: number;
  tipo_movimiento: TipoMovimiento;
  referencia_tipo: ReferenciaMovimiento;
  referencia_id?: number;
  motivo: string;
  usuario_id?: string | number;
  almacen_id?: string | number;
}

/** @deprecated Usar `ListarMovimientosParams` desde movimientos-filtros.helper */
export type ListarParams = ListarMovimientosParams;

const LIMITE_DEFECTO = 50;
const LIMITE_CON_FILTROS = 100;

// Lista oficial indexada de tu enum en Supabase
const TODOS_LOS_TIPOS: TipoMovimiento[] = [
  'entrada',
  'salida',
  'ajuste',
  'consumo_orden_produccion',
  'consumo_orden_produccion_item',
  'produccion_entrada',
  'devolucion_consumo',
  'devolucion_a_proveedor',
  'recepcion_devolucion_proveedor',
  'incidencia_taller',
  'devolucion_a_cliente',
  'recepcion_devolucion_cliente',
];

export const MovimientosInventarioService = {

  async registrar(params: RegistrarParams) {
    const {
      insumo_id, material_id, producto_id,
      cantidad, tipo_movimiento, referencia_tipo,
      referencia_id, motivo, usuario_id, almacen_id,
    } = params;

    // Refleja el CHECK constraint chk_un_solo_recurso (= 1) de la DB
    const recursos = [insumo_id, material_id, producto_id].filter(Boolean).length;
    if (recursos === 0)
      throw new Error('Debe proporcionar exactamente un ID de insumo, material o producto');
    if (recursos > 1)
      throw new Error('Solo puede proporcionar un recurso a la vez: insumo, material o producto');

    // Refleja el CHECK constraint chk_cantidad_positiva (cantidad > 0) de la DB
    if (cantidad <= 0)
      throw new Error('La cantidad debe ser mayor a 0');

    const usuarioId = usuario_id ? BigInt(usuario_id) : null;
    const almacenId = almacen_id ? BigInt(almacen_id) : null;

    // Productos: transacción Prisma explícita (productos.stock + movimiento)
    if (producto_id) {
      await prisma.$transaction(async (tx) => {
        const productoId = BigInt(producto_id);

        await aplicarMovimientoStockProducto(
          tx,
          productoId,
          cantidad,
          tipo_movimiento,
        );

        await tx.movimientos_inventario.create({
          data: {
            producto_id: productoId,
            cantidad,
            motivo,
            tipo_movimiento,
            referencia_tipo,
            usuario_id: usuarioId,
            almacen_id: almacenId,
          },
        });
      });
      return { success: true };
    }

    // Insumos / materiales: RPC + triggers de BD (stock_actual en sus tablas)
    await insertarMovimiento({
      tipoMovimiento: tipo_movimiento,
      referenciaType: referencia_tipo,
      referenciaId: referencia_id,
      cantidad,
      motivo,
      insumoId: insumo_id ? Number(insumo_id) : undefined,
      materialId: material_id ? Number(material_id) : undefined,
      usuarioId: usuario_id ? Number(usuario_id) : undefined,
      almacenId: almacen_id ? Number(almacen_id) : undefined,
    });

    return { success: true };
  },

  async listar(params?: ListarMovimientosParams) {
    const where: Prisma.movimientos_inventarioWhereInput = {};

    if (params?.desde || params?.hasta) {
      where.created_at = {
        ...(params?.desde && { gte: params.desde }),
        ...(params?.hasta && { lte: params.hasta }),
      };
    }

    if (params?.tipo_movimiento) where.tipo_movimiento = params.tipo_movimiento;
    if (params?.referencia_tipo) where.referencia_tipo = params.referencia_tipo;

    if (params?.producto_id === 'any') where.producto_id = { not: null };
    else if (params?.producto_id) where.producto_id = BigInt(params.producto_id);

    if (params?.material_id === 'any') where.material_id = { not: null };
    else if (params?.material_id) where.material_id = BigInt(params.material_id);

    if (params?.insumo_id === 'any') where.insumo_id = { not: null };
    else if (params?.insumo_id) where.insumo_id = BigInt(params.insumo_id);

    if (params?.usuario_id) where.usuario_id = BigInt(params.usuario_id);
    if (params?.almacen_id) where.almacen_id = BigInt(params.almacen_id);

    const q = params?.busqueda?.trim();
    if (q) {
      where.OR = [
        { productos: { nombre: { contains: q, mode: 'insensitive' } } },
        { insumo: { nombre: { contains: q, mode: 'insensitive' } } },
        { materiales: { nombre: { contains: q, mode: 'insensitive' } } },
        { motivo: { contains: q, mode: 'insensitive' } },
      ];
    }

    const sinFiltros =
      !params?.busqueda &&
      !params?.tipo_movimiento &&
      !params?.referencia_tipo &&
      !params?.producto_id &&
      !params?.insumo_id &&
      !params?.material_id &&
      !params?.desde &&
      !params?.hasta;

    const take =
      params?.limite ?? (sinFiltros ? LIMITE_DEFECTO : LIMITE_CON_FILTROS);

    const movimientos = await prisma.movimientos_inventario.findMany({
      where,
      include: {
        insumo: { select: { id: true, nombre: true, unidad_medida: true } },
        materiales: { select: { id: true, nombre: true } },
        productos: { select: { id: true, nombre: true, sku: true } },
        usuarios: { select: { id: true, email: true } },
        almacenes: { select: { id: true, nombre: true } },
      },
      orderBy: { created_at: 'desc' },
      take,
    });

    return serializeBigInt(movimientos);
  },

  /** Atajo desde filtros del UI / Server Action */
  async listarDesdeFiltros(filtros: FiltrosMovimientosInput = {}) {
    const params = mapFiltrosMovimientosToListar(filtros);
    if (filtrosMovimientosVacios(filtros) && !params.limite) {
      params.limite = LIMITE_DEFECTO;
    }
    return this.listar(params);
  },

  /**
   * Optimización Avanzada: Reduce 12 consultas independientes a 1 sola agregación agrupada
   */
  async obtenerResumen(params?: {
    tipo_movimiento?: TipoMovimiento;
    desde?: Date;
    hasta?: Date;
  }) {
    const whereBase: Record<string, unknown> = {};

    if (params?.tipo_movimiento) whereBase.tipo_movimiento = params.tipo_movimiento;
    if (params?.desde || params?.hasta) {
      whereBase.created_at = {
        ...(params?.desde && { gte: params.desde }),
        ...(params?.hasta && { lte: params.hasta }),
      };
    }

    // 1. Ejecutamos el conteo global y la agregación por lotes en paralelo (solo 2 promesas)
    const [totalMovimientos, agrupacionPorTipo] = await Promise.all([
      prisma.movimientos_inventario.count({ where: whereBase }),
      prisma.movimientos_inventario.groupBy({
        by: ['tipo_movimiento'],
        where: whereBase,
        _count: { tipo_movimiento: true }
      })
    ]);

    // 2. Inicializamos el mapa con todos los tipos en cero para garantizar consistencia estructural
    const porTipo = TODOS_LOS_TIPOS.reduce((acc, tipo) => {
      acc[tipo] = 0;
      return acc;
    }, {} as Record<TipoMovimiento, number>);

    // 3. Volcamos los resultados agrupados de la base de datos en nuestro mapa base
    agrupacionPorTipo.forEach((grupo) => {
      if (grupo.tipo_movimiento in porTipo) {
        porTipo[grupo.tipo_movimiento] = grupo._count.tipo_movimiento;
      }
    });

    return {
      totalMovimientos,
      // Fallbacks de compatibilidad hacia atrás
      totalEntradas: porTipo.entrada,
      totalSalidas: porTipo.salida,
      totalAjustes: porTipo.ajuste,
      // Desglose limpio de los 12 tipos reales de Supabase
      porTipo,
    };
  },
};