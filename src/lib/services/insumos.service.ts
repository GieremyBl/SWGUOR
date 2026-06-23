import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import type { TipoInsumo } from '@prisma/client';
import { Prisma } from '@prisma/client';

export interface ListarInsumosComprasParams {
  categoria_id?: number;
  tipo?: TipoInsumo;
  busqueda?: string;
  bajo_stock?: boolean;
  proveedor_id?: string;
  sort?: 'asc' | 'desc';
  limite?: number;
}

function buildWhere(params?: ListarInsumosComprasParams): Prisma.insumoWhereInput {
  return {
    ...(params?.categoria_id && { categoria_id: params.categoria_id }),
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
        categoria_insumo: { select: { id: true, nombre: true } },
        proveedores: { select: { id: true, razon_social: true } },
      },
      orderBy: params?.sort
        ? { precio_unitario: params.sort }
        : { nombre: 'asc' },
      ...(params?.limite && { take: params.limite }),
    });

    // Nota: bajo_stock filtra en memoria después del take. Si en algún
    // momento se usan limite + bajo_stock juntos, el resultado final puede
    // tener menos de `limite` items (no es un bug nuevo, ya pasaba antes
    // de agregar `limite`, solo queda documentado aquí).
    const resultado = params?.bajo_stock
      ? insumos.filter(i => Number(i.stock_actual) <= Number(i.stock_minimo))
      : insumos;

    return serializeBigInt(resultado);
  },

  async obtenerDetalle(id: string) {
    const insumo = await prisma.insumo.findUnique({
      where: { id: BigInt(id) },
      include: {
        categoria_insumo: { select: { id: true, nombre: true } },
        proveedores: { select: { id: true, razon_social: true, ruc: true } },
        fichas_tecnicas_detalle: {  // ✅ Esta es la relación correcta
          select: {
            id: true,
            ficha_id: true,
            cantidad_consumo: true,
            porcentaje_desperdicio: true,
          },
        },
      },
    });

    if (!insumo) return null;
    return serializeBigInt(insumo);
  },
};