import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { TipoInsumo } from '@prisma/client';
import { Prisma } from '@prisma/client';

export interface ListarInsumosComprasParams {
  categoria_id?: number;
  tipo?: TipoInsumo;
  busqueda?: string;
  bajo_stock?: boolean;
  proveedor_id?: string;
  sort?: 'asc' | 'desc';
}

function buildWhere(params?: ListarInsumosComprasParams): Prisma.insumoWhereInput {
  return {
    ...(params?.categoria_id && { categoria_id: params.categoria_id }),  // ✅ FK int
    ...(params?.tipo && { tipo: params.tipo }),
    ...(params?.proveedor_id && { proveedor_id: BigInt(params.proveedor_id) }),
    ...(params?.busqueda && { nombre: { contains: params.busqueda, mode: 'insensitive' } }),
  };
}

export const InsumosService = {
  async listar(params?: ListarInsumosComprasParams) {
    const insumos = await prisma.insumo.findMany({
      where: buildWhere(params),
      include: {
        proveedores: { select: { id: true, razon_social: true } },
        _count: { select: { ordenes_compra_items: true } },
      },
      orderBy: params?.sort
        ? { precio_unitario: params.sort }
        : { nombre: 'asc' },
    });

    const resultado = params?.bajo_stock
      ? insumos.filter(i => Number(i.stock_actual) <= Number(i.stock_minimo))
      : insumos;

    return serializeBigInt(resultado);
  },

  async obtenerDetalle(id: string) {
    const insumo = await prisma.insumo.findUnique({
      where: { id: BigInt(id) },
      include: {
        proveedores: { select: { id: true, razon_social: true, ruc: true } },
        categoria_insumo: { select: { id: true, nombre: true } },
        ordenes_compra_items: {
          include: {
            ordenes_compra: {
              select: {
                id: true,
                estado: true,
                estado_pago: true,
                total_orden: true,
                fecha_prometida: true,
                created_at: true,
                proveedores: { select: { id: true, razon_social: true } },
              },
            },
          },
          orderBy: { id: 'desc' },
        },
        _count: { select: { ordenes_compra_items: true, movimientos_inventario: true } },
      },
    });

    if (!insumo) return null;
    return serializeBigInt(insumo);
  },
};
