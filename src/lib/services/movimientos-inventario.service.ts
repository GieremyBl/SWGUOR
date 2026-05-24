import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import type { ReferenciaMovimiento, TipoMovimiento } from '@prisma/client';
import { insertarMovimiento } from '@/lib/helpers/rpc-helpers';

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

export interface ListarParams {
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
}

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

    // Delegamos la persistencia en el RPC que activa los triggers nativos
    await insertarMovimiento({
      tipoMovimiento: tipo_movimiento,    
      referenciaType: referencia_tipo,
      referenciaId: referencia_id,      
      cantidad,
      motivo,
      productoId: producto_id ? Number(producto_id) : undefined,
      insumoId: insumo_id ? Number(insumo_id) : undefined,
      materialId: material_id ? Number(material_id) : undefined,
      usuarioId: usuario_id ? Number(usuario_id) : undefined,
      almacenId: almacen_id ? Number(almacen_id) : undefined,
    });

    return { success: true };
  },

  async listar(params?: ListarParams) {
    const where: Record<string, unknown> = {};

    if (params?.desde || params?.hasta) {
      where.created_at = {
        ...(params?.desde && { gte: params.desde }),
        ...(params?.hasta && { lte: params.hasta }),
      };
    }

    if (params?.tipo_movimiento) where.tipo_movimiento = params.tipo_movimiento;
    if (params?.referencia_tipo) where.referencia_tipo = params.referencia_tipo;
    if (params?.producto_id) where.producto_id = BigInt(params.producto_id);
    if (params?.material_id) where.material_id = BigInt(params.material_id);
    if (params?.insumo_id) where.insumo_id = BigInt(params.insumo_id);
    if (params?.usuario_id) where.usuario_id = BigInt(params.usuario_id);
    if (params?.almacen_id) where.almacen_id = BigInt(params.almacen_id);

    const movimientos = await prisma.movimientos_inventario.findMany({
      where,
      include: {
        insumo: { select: { id: true, nombre: true, unidad_medida: true } },
        materiales: { select: { id: true, nombre: true } },
        productos: { select: { id: true, nombre: true } },
        usuarios: { select: { id: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
      take: params?.limite ?? 100,
    });

    let resultado = serializeBigInt(movimientos);

    if (params?.busqueda) {
      const q = params.busqueda.toLowerCase();
      resultado = resultado.filter((mov: Record<string, unknown>) => {
        const item = (mov.insumo ?? mov.materiales ?? mov.productos) as Record<string, unknown> | null;
        const nombre = typeof item?.nombre === 'string' ? item.nombre : '';
        return (
          nombre.toLowerCase().includes(q) ||
          String(mov.motivo ?? '').toLowerCase().includes(q)
        );
      });
    }

    return resultado;
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