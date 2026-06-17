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

// ─── TIPOS DE ENTRADA CONFIGURADOS SEGÚN EL DDL ──────────────────────────────

export type OrigenMovimiento =
  | { tipo: 'ORDEN_COMPRA'; id: bigint | string | number }
  | { tipo: 'ORDEN_PRODUCCION'; id: bigint | string | number }
  | { tipo: 'PEDIDO_CLIENTE'; id: bigint | string | number }
  | { tipo: 'AJUSTE_MANUAL'; id: bigint | string | number }
  | { tipo: 'INVENTARIO_INICIAL'; id: bigint | string | number };

export interface RegistrarParams {
  insumo_id?: string | number | bigint;
  material_id?: string | number | bigint;
  producto_id?: string | number | bigint;
  cantidad: number; // Siempre positivo (la BD valida chk_cantidad_positiva)
  tipo_movimiento?: TipoMovimiento;
  referencia_tipo?: ReferenciaMovimiento;
  origen?: OrigenMovimiento;
  motivo: string;
  usuario_id?: string | number | bigint;
  almacen_id?: string | number | bigint;
  verificarStock?: boolean;
}

const LIMITE_DEFECTO = 50;
const LIMITE_CON_FILTROS = 100;

const TODOS_LOS_TIPOS: TipoMovimiento[] = [
  'entrada', 'salida', 'ajuste', 'consumo_orden_produccion',
  'consumo_orden_produccion_item', 'produccion_entrada', 'devolucion_consumo',
  'devolucion_a_proveedor', 'recepcion_devolucion_proveedor', 'incidencia_taller',
  'devolucion_a_cliente', 'recepcion_devolucion_cliente',
];

// ─── HELPERS DE RESOLUCIÓN SEMÁNTICA ─────────────────────────────────────────

const resolverDireccionYTipo = (origen: { tipo: string }, tipoSuministrado?: TipoMovimiento): {
  direccion: 'entrada' | 'salida';
  tipo: TipoMovimiento;
} => {
  if (tipoSuministrado) {
    const esSalida = ['salida', 'consumo_orden_produccion', 'incidencia_taller', 'devolucion_a_proveedor'].includes(tipoSuministrado);
    return { direccion: esSalida ? 'salida' : 'entrada', tipo: tipoSuministrado };
  }

  const mapa: Record<string, { entrada: TipoMovimiento; salida: TipoMovimiento }> = {
    ORDEN_COMPRA: { entrada: 'entrada', salida: 'devolucion_a_proveedor' },
    ORDEN_PRODUCCION: { entrada: 'produccion_entrada', salida: 'consumo_orden_produccion' },
    PEDIDO_CLIENTE: { entrada: 'recepcion_devolucion_cliente', salida: 'salida' },
    AJUSTE_MANUAL: { entrada: 'ajuste', salida: 'ajuste' },
    INVENTARIO_INICIAL: { entrada: 'entrada', salida: 'ajuste' },
  };

  const configuracion = mapa[origen.tipo] || { entrada: 'entrada', salida: 'salida' };
  return { direccion: 'entrada', tipo: configuracion.entrada };
};

// ─── SERVICE UNIFICADO MÁSTER ─────────────────────────────────────────────────

export const MovimientosInventarioService = {

  async registrar(params: RegistrarParams) {
    const {
      insumo_id, material_id, producto_id, cantidad,
      motivo, usuario_id, almacen_id, verificarStock = true,
    } = params;

    // 1. Validaciones estructurales fieles a las Constraints de la BD
    const recursos = [insumo_id, material_id, producto_id].filter(Boolean).length;
    if (recursos !== 1) {
      throw new Error('chk_un_solo_recurso: Debe proporcionar exactamente un recurso (insumo, material o producto)');
    }
    if (cantidad <= 0) {
      throw new Error('chk_cantidad_positiva: La cantidad a registrar debe ser estrictamente mayor a 0');
    }

    const usuarioId = usuario_id ? BigInt(usuario_id) : null;
    const almacenId = almacen_id ? BigInt(almacen_id) : null;

    // 2. Extracción de Referencias nativas
    let referenciaTipo: ReferenciaMovimiento = params.referencia_tipo ?? 'AJUSTE_MANUAL';
    let documentoId: number | null = null;

    if (params.origen) {
      referenciaTipo = params.origen.tipo as ReferenciaMovimiento;
      documentoId = Number(params.origen.id);
    }

    const { direccion, tipo: tipoMovimiento } = resolverDireccionYTipo(
      params.origen ? { tipo: params.origen.tipo } : { tipo: referenciaTipo },
      params.tipo_movimiento
    );

    // Inyectamos de forma segura el ID del documento en el motivo para no perder la trazabilidad
    const motivoFinal = documentoId
      ? `${motivo} (${referenciaTipo} #${documentoId})`
      : motivo;

    return prisma.$transaction(async (tx) => {

      // 3. Control preventivo de stock para salidas consultando la tabla intermedia
      if (direccion === 'salida' && verificarStock && almacenId) {
        const itemStock = await tx.almacen_stock.findFirst({
          where: {
            almacen_id: almacenId,
            producto_id: producto_id ? BigInt(producto_id) : null,
            insumo_id: insumo_id ? BigInt(insumo_id) : null,
            material_id: material_id ? BigInt(material_id) : null,
          }
        });
        const disponible = Number(itemStock?.cantidad ?? 0);
        if (disponible < cantidad) {
          throw new Error(`Stock insuficiente en almacén: disponible ${disponible}, solicitado ${cantidad}`);
        }
      }

      // 4. Inserción en la Base de Datos (Los triggers se encargan del resto de tablas)
      if (producto_id) {
        // Sincronización histórica manual para stocks globales de productos terminados
        await aplicarMovimientoStockProducto(tx, BigInt(producto_id), cantidad, tipoMovimiento);

        const mov = await tx.movimientos_inventario.create({
          data: {
            producto_id: BigInt(producto_id),
            cantidad, // Siempre positivo (la función en BD o triggers restarán internamente si es salida)
            motivo: motivoFinal,
            tipo_movimiento: tipoMovimiento,
            referencia_tipo: referenciaTipo,
            usuario_id: usuarioId,
            almacen_id: almacenId,
          },
        });
        return serializeBigInt(mov);
      } else {
        // Insumos y Materiales delegan en tu Trigger BEFORE INSERT 'tr_procesar_movimiento_insumo'
        await insertarMovimiento({
          tipoMovimiento,
          referenciaType: referenciaTipo,
          referenciaId: documentoId ?? undefined, // El RPC consume este parámetro para cruces lógicos
          cantidad,
          motivo: motivoFinal,
          insumoId: insumo_id ? Number(insumo_id) : undefined,
          materialId: material_id ? Number(material_id) : undefined,
          usuarioId: usuarioId ? Number(usuarioId) : undefined,
          almacenId: almacenId ? Number(almacenId) : undefined,
        });

        return { success: true };
      }
    });
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
    if (params?.almacen_id) where.almacen_id = BigInt(params.almacen_id);

    if (params?.producto_id === 'any') where.producto_id = { not: null };
    else if (params?.producto_id) where.producto_id = BigInt(params.producto_id);

    if (params?.material_id === 'any') where.material_id = { not: null };
    else if (params?.material_id) where.material_id = BigInt(params.material_id);

    if (params?.insumo_id === 'any') where.insumo_id = { not: null };
    else if (params?.insumo_id) where.insumo_id = BigInt(params.insumo_id);

    if (params?.usuario_id) where.usuario_id = BigInt(params.usuario_id);

    const q = params?.busqueda?.trim();
    if (q) {
      where.OR = [
        { productos: { nombre: { contains: q, mode: 'insensitive' } } },
        { insumo: { nombre: { contains: q, mode: 'insensitive' } } },
        { materiales: { nombre: { contains: q, mode: 'insensitive' } } },
        { motivo: { contains: q, mode: 'insensitive' } },
      ];
    }

    const sinFiltros = !params?.busqueda && !params?.tipo_movimiento && !params?.referencia_tipo && !params?.almacen_id && !params?.producto_id && !params?.insumo_id && !params?.material_id && !params?.desde && !params?.hasta;
    const take = params?.limite ?? (sinFiltros ? LIMITE_DEFECTO : LIMITE_CON_FILTROS);

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

  async listarDesdeFiltros(filtros: FiltrosMovimientosInput = {}) {
    const params = mapFiltrosMovimientosToListar(filtros);
    if (filtrosMovimientosVacios(filtros) && !params.limite) {
      params.limite = LIMITE_DEFECTO;
    }
    return this.listar(params);
  },

  async obtenerStockPorAlmacen(almacenId: string | number, item: { producto_id?: string; insumo_id?: string; material_id?: string }) {
    const stock = await prisma.almacen_stock.findFirst({
      where: {
        almacen_id: BigInt(almacenId),
        producto_id: item.producto_id ? BigInt(item.producto_id) : null,
        insumo_id: item.insumo_id ? BigInt(item.insumo_id) : null,
        material_id: item.material_id ? BigInt(item.material_id) : null,
      }
    });
    return stock ? serializeBigInt(stock) : { cantidad: 0 };
  },

  async obtenerResumen(params?: { tipo_movimiento?: TipoMovimiento; desde?: Date; hasta?: Date }) {
    const whereBase: Record<string, unknown> = {};
    if (params?.tipo_movimiento) whereBase.tipo_movimiento = params.tipo_movimiento;
    if (params?.desde || params?.hasta) {
      whereBase.created_at = {
        ...(params?.desde && { gte: params.desde }),
        ...(params?.hasta && { lte: params.hasta }),
      };
    }

    const [totalMovimientos, agrupacionPorTipo] = await Promise.all([
      prisma.movimientos_inventario.count({ where: whereBase }),
      prisma.movimientos_inventario.groupBy({
        by: ['tipo_movimiento'],
        where: whereBase,
        _count: { tipo_movimiento: true }
      })
    ]);

    const porTipo = TODOS_LOS_TIPOS.reduce((acc, tipo) => {
      acc[tipo] = 0;
      return acc;
    }, {} as Record<TipoMovimiento, number>);

    agrupacionPorTipo.forEach((grupo) => {
      if (grupo.tipo_movimiento in porTipo) {
        porTipo[grupo.tipo_movimiento] = grupo._count.tipo_movimiento;
      }
    });

    return {
      totalMovimientos,
      totalEntradas: porTipo.entrada,
      totalSalidas: porTipo.salida,
      totalAjustes: porTipo.ajuste,
      porTipo,
    };
  },
};