import { prisma }          from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { EstadoFicha }     from '@prisma/client';
import type { ReferenciaMovimiento } from '@prisma/client';
import {
  calcularCostoFicha,
  insertarMovimiento,
  obtenerAuditoriaRegistro,
} from '@/lib/helpers/rpc-helpers';

export const FichasTecnicasService = {

  async listar(filtros?: { estado?: EstadoFicha; busqueda?: string }) {
    const fichas = await prisma.fichas_tecnicas.findMany({
      where: {
        ...(filtros?.estado && { estado: filtros.estado }),
        ...(filtros?.busqueda && {
          OR: [
            { version:               { contains: filtros.busqueda, mode: 'insensitive' } },
            { descripcion_detallada: { contains: filtros.busqueda, mode: 'insensitive' } },
            // la relación correcta en el schema es "productos" (plural)
            { productos: { nombre: { contains: filtros.busqueda, mode: 'insensitive' } } },
            { productos: { sku:    { contains: filtros.busqueda, mode: 'insensitive' } } },
          ],
        }),
      },
      include: {
        // relación correcta: "productos" (plural)
        productos:    { select: { id: true, nombre: true, sku: true, imagen: true } },
        ficha_medidas: { select: { id: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    return serializeBigInt(fichas);
  },

  async obtenerPorId(id: string) {
    const ficha = await prisma.fichas_tecnicas.findUnique({
      where:   { id: BigInt(id) },
      include: {
        productos:    { select: { id: true, nombre: true, sku: true, imagen: true } },
        ficha_medidas: { orderBy: [{ talla: 'asc' }, { punto_medida: 'asc' }] },
        fichas_tecnicas_detalle: {
          include: {
            materiales: { select: { id: true, nombre: true, tipo: true, composicion: true, color: true, unidad_medida: true, precio_unitario: true } },
            insumo:     { select: { id: true, nombre: true, tipo: true, unidad_medida: true, precio_unitario: true } },
          },
          orderBy: { id: 'asc' },
        },
      },
    });
    return ficha ? serializeBigInt(ficha) : null;
  },

  async obtenerPorProducto(producto_id: string) {
    const ficha = await prisma.fichas_tecnicas.findFirst({
      where:   { id_producto: BigInt(producto_id) },
      include: { ficha_medidas: { orderBy: [{ talla: 'asc' }, { punto_medida: 'asc' }] } },
    });
    return ficha ? serializeBigInt(ficha) : null;
  },

  async crear(data: {
    producto_id:            string | number;
    version?:               string;
    descripcion_detallada?: string;
    sam_total?:             number;
    costo_estimado?:        number;
    ficha_url?:             string;
    imagen_geometral?:      string;
  }) {
    const existe = await prisma.fichas_tecnicas.findFirst({
      where: { id_producto: BigInt(data.producto_id) },
    });
    if (existe) throw new Error('Ya existe una ficha para este producto');

    return prisma.$transaction(async (tx) => {
      const ficha = await tx.fichas_tecnicas.create({
        data: {
          id_producto:           BigInt(data.producto_id),
          version:               data.version               ?? '1.0',
          descripcion_detallada: data.descripcion_detallada ?? null,
          sam_total:             data.sam_total             ?? null,
          costo_estimado:        data.costo_estimado        ?? null,
          ficha_url:             data.ficha_url             ?? null,
          imagen_geometral:      data.imagen_geometral      ?? null,
          estado:                'borrador',
        },
      });

      // En el schema productos → fichas_tecnicas es una relación de lista (fichas_tecnicas[])
      // El FK real es fichas_tecnicas.id_producto → se actualiza en la ficha, no en el producto.
      // Si se necesita vincular bidireccionalmente, sólo actualizar id_producto en la ficha:
      await tx.fichas_tecnicas.update({
        where: { id: ficha.id },
        data:  { id_producto: BigInt(data.producto_id) },
      });

      return serializeBigInt(ficha);
    });
  },

  async actualizar(id: string, data: Partial<{
    version:               string;
    descripcion_detallada: string;
    sam_total:             number;
    costo_estimado:        number;
    ficha_url:             string;
    imagen_geometral:      string;
    estado:                EstadoFicha;
  }>) {
    const ficha = await prisma.fichas_tecnicas.update({
      where: { id: BigInt(id) },
      data,
    });
    return serializeBigInt(ficha);
  },

  async guardarMedidas(ficha_id: string, medidas: {
    punto_medida: string;
    talla:        string;
    valor_cm?:    number;
    tolerancia?:  number;
  }[]) {
    return prisma.$transaction(async (tx) => {
      await tx.ficha_medidas.deleteMany({ where: { id_ficha: BigInt(ficha_id) } });

      if (medidas.length > 0) {
        await tx.ficha_medidas.createMany({
          data: medidas.map(m => ({
            id_ficha:     BigInt(ficha_id),
            punto_medida: m.punto_medida,
            talla:        m.talla,
            valor_cm:     m.valor_cm   ?? null,
            tolerancia:   m.tolerancia ?? null,
          })),
        });
      }

      return serializeBigInt(
        await tx.ficha_medidas.findMany({
          where:   { id_ficha: BigInt(ficha_id) },
          orderBy: [{ talla: 'asc' }, { punto_medida: 'asc' }],
        })
      );
    });
  },

  async eliminarMedida(id: string) {
    await prisma.ficha_medidas.delete({ where: { id: BigInt(id) } });
    return { success: true };
  },

  async obtenerCostoFicha(fichaId: string | number): Promise<number> {
    const id = typeof fichaId === 'string' ? parseInt(fichaId) : fichaId;
    return calcularCostoFicha({ fichaId: id });
  },

  async obtenerPorIdConCosto(id: string) {
    const ficha = await this.obtenerPorId(id);
    if (!ficha) return null;
    try {
      const costo = await this.obtenerCostoFicha(id);
      return { ...ficha, costo_calculado: costo };
    } catch (error) {
      console.warn(`No se pudo calcular costo para ficha ${id}:`, error);
      return ficha;
    }
  },

  async aprobarFicha(fichaId: string, usuarioId: string | number) {
    const id   = BigInt(fichaId);
    const usId = typeof usuarioId === 'string' ? BigInt(usuarioId) : usuarioId;

    return prisma.$transaction(async (tx) => {
      const ficha = await tx.fichas_tecnicas.update({
        where: { id },
        data:  { estado: 'aprobada' as EstadoFicha },
      });

      // tipoMovimiento (camelCase) es la clave correcta en InsertarMovimientoParams
      await insertarMovimiento({
        tipoMovimiento: 'ajuste',
        referenciaType: 'AJUSTE' as ReferenciaMovimiento,
        referenciaId:   Number(id),
        cantidad:        0,
        motivo:          `Ficha técnica aprobada por usuario ${usId}`,
        usuarioId:       Number(usId),
      });

      return serializeBigInt(ficha);
    });
  },

  async marcarFichaObsoleta(fichaId: string) {
    const ficha = await prisma.fichas_tecnicas.update({
      where: { id: BigInt(fichaId) },
      data:  { estado: 'obsoleta' as EstadoFicha },
    });
    return serializeBigInt(ficha);
  },

  async obtenerHistorico(fichaId: string) {
    try {
      return await obtenerAuditoriaRegistro('fichas_tecnicas', parseInt(fichaId));
    } catch (error) {
      console.warn(`No se pudo obtener auditoría para ficha ${fichaId}:`, error);
      return [];
    }
  },
};