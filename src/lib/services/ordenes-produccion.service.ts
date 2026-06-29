import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { Prisma } from '@prisma/client';
import { SeguimientoProduccionService } from '@/lib/services/seguimiento-produccion.service';

export const OrdenesProduccionService = {

  async listar(params?: {
    producto_id?: string;
    taller_id?: string;
    pedido_id?: string;
    estado?: string | string[];
    etapa?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { producto_id, taller_id, pedido_id, estado, etapa, search, page = 1, limit = 10 } = params || {};
    const skip = (page - 1) * limit;

    const where: Prisma.ordenes_produccionWhereInput = {};

    if (producto_id) where.producto_id = BigInt(producto_id);
    if (taller_id) where.taller_id = BigInt(taller_id);

    if (estado && estado !== 'todos' && estado !== 'all') {
      if (Array.isArray(estado)) {
        where.estado = { in: estado } as Prisma.ordenes_produccionWhereInput['estado'];
      } else {
        where.estado = estado as Prisma.ordenes_produccionWhereInput['estado'];
      }
    }

    if (pedido_id) where.pedido_id = BigInt(pedido_id);

    if (etapa && etapa !== 'all') {
      where.etapa = etapa as Prisma.ordenes_produccionWhereInput['etapa'];
    }

    if (search) {
      where.OR = [
        { productos: { nombre: { contains: search, mode: 'insensitive' } } },
        { talleres: { nombre: { contains: search, mode: 'insensitive' } } },
      ];
      if (!isNaN(Number(search))) {
        where.OR.push({ id: BigInt(search) });
      }
    }

    const [total, ordenes] = await Promise.all([
      prisma.ordenes_produccion.count({ where }),
      prisma.ordenes_produccion.findMany({
        where,
        take: limit,
        skip,
        include: {
          productos: { select: { id: true, nombre: true, sku: true } },
          talleres: { select: { id: true, nombre: true, email: true, contacto: true } },
          fichas_tecnicas: { select: { id: true, version: true, estado: true } },
          seguimiento_produccion: {
            where: { activo: true },
            take: 1,
            orderBy: { created_at: 'desc' },
          },
          confecciones: {
            select: { id: true, estado: true, taller_id: true, cantidad: true },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return {
      data: serializeBigInt(ordenes),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  async obtenerPorId(id: string) {
    const orden = await prisma.ordenes_produccion.findUnique({
      where: { id: BigInt(id) },
      include: {
        productos: { select: { id: true, nombre: true, sku: true, imagen: true } },
        talleres: { select: { id: true, nombre: true, email: true, contacto: true, telefono: true } },
        fichas_tecnicas: true,
        pedidos: {
          select: {
            id: true,
            estado: true,
            clientes: { select: { id: true, razon_social: true } },
          },
        },
        seguimiento_produccion: {
          orderBy: { created_at: 'desc' },
          include: {
            usuarios: { select: { id: true, email: true, rol: true } },
          },
        },
        ordenes_produccion_items: {
          include: {
            pedido_items: { select: { id: true, cantidad: true } },
            productos: { select: { id: true, nombre: true, sku: true, imagen: true } }, // ← agrega imagen
            variantes_producto: {
              select: { id: true, talla: true, color: true, imagen_url: true } // ← agrega imagen_url
            },
          },
        },
        confecciones: {
          include: {
            talleres: { select: { id: true, nombre: true } },
          },
          orderBy: { created_at: 'asc' },
        },
      },
    });
    return orden ? serializeBigInt(orden) : null;
  },

  async crear(data: {
    producto_id: string | number;
    taller_id: string | number;
    ficha_id: string | number;
    pedido_id?: string | number | null;
    cantidad_solicitada: number;
    fecha_entrega?: string;
    notas?: string;
    creado_por?: string | number;
  }) {
    return prisma.$transaction(async (tx) => {
      const orden = await tx.ordenes_produccion.create({
        data: {
          producto_id: BigInt(data.producto_id),
          taller_id: BigInt(data.taller_id),
          ficha_id: BigInt(data.ficha_id),
          pedido_id: data.pedido_id ? BigInt(data.pedido_id) : null,
          cantidad_solicitada: data.cantidad_solicitada,
          fecha_entrega: data.fecha_entrega ? new Date(data.fecha_entrega) : null,
          notas: data.notas ?? null,
          creado_por: data.creado_por ? BigInt(data.creado_por) : null,
          estado: 'confirmada',
          etapa: 'diseno',
        },
        include: {
          productos: { select: { id: true, nombre: true, sku: true } },
          talleres: { select: { id: true, nombre: true, email: true } },
          fichas_tecnicas: { select: { id: true, version: true } },
        },
      });

      await SeguimientoProduccionService.crearInicial(orden.id, tx);

      return serializeBigInt(orden);
    });
  },

  async actualizar(id: string, data: {
    producto_id?: string | number;
    taller_id?: string | number;
    ficha_id?: string | number;
    pedido_id?: string | number | null;
    cantidad_solicitada?: number;
    fecha_entrega?: string | null;
    notas?: string | null;
    estado?: string;
  }) {
    const orden = await prisma.ordenes_produccion.update({
      where: { id: BigInt(id) },
      data: {
        ...(data.producto_id !== undefined && { producto_id: BigInt(data.producto_id) }),
        ...(data.taller_id !== undefined && { taller_id: BigInt(data.taller_id) }),
        ...(data.ficha_id !== undefined && { ficha_id: BigInt(data.ficha_id) }),
        ...(data.pedido_id !== undefined && {
          pedido_id: data.pedido_id ? BigInt(data.pedido_id) : null,
        }),
        ...(data.cantidad_solicitada !== undefined && { cantidad_solicitada: data.cantidad_solicitada }),
        ...(data.fecha_entrega !== undefined && {
          fecha_entrega: data.fecha_entrega ? new Date(data.fecha_entrega) : null,
        }),
        ...(data.notas !== undefined && { notas: data.notas }),
        ...(data.estado !== undefined && {
          estado: data.estado as Prisma.ordenes_produccionUpdateInput['estado'],
        }),
        updated_at: new Date(),
      },
      include: {
        productos: { select: { id: true, nombre: true, sku: true } },
        talleres: { select: { id: true, nombre: true, email: true } },
        fichas_tecnicas: { select: { id: true, version: true, estado: true } },
      },
    });
    return serializeBigInt(orden);
  },

  async registrarEtapa(data: {
    orden_id: string;
    etapa: string;
    observaciones?: string;
    usuario_id?: string;
  }) {
    return SeguimientoProduccionService.registrarEtapa(data);
  },
};