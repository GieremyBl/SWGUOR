import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { Prisma } from '@prisma/client';

export const OrdenesProduccionService = {

  async listar(params?: {
    producto_id?: string;
    taller_id?: string;
    estado?: string;
    etapa?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { producto_id, taller_id, estado, etapa, search, page = 1, limit = 10 } = params || {};
    const skip = (page - 1) * limit;
    
    // FIX: Tipado estricto con el contrato WhereInput nativo de Prisma en lugar de 'any'
    const where: Prisma.ordenes_produccionWhereInput = {};

    if (producto_id) where.producto_id = BigInt(producto_id);
    if (taller_id) where.taller_id = BigInt(taller_id);
    
    if (estado && estado !== 'todos' && estado !== 'all') {
      where.estado = estado as Prisma.ordenes_produccionWhereInput['estado'];
    }
    
    // Filtrar por etapa del seguimiento más reciente
    if (etapa && etapa !== 'all') {
      where.seguimiento_produccion = {
        some: {
          etapa: etapa as Prisma.seguimiento_produccionWhereInput['etapa'],
          activo: true,
        },
      };
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
        seguimiento_produccion: { orderBy: { created_at: 'desc' } },
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
    pedido_id: string | number;
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
          pedido_id: BigInt(data.pedido_id),
          cantidad_solicitada: data.cantidad_solicitada,
          fecha_entrega: data.fecha_entrega ? new Date(data.fecha_entrega) : null,
          notas: data.notas ?? null,
          creado_por: data.creado_por ? BigInt(data.creado_por) : null,
          estado: 'borrador', // Asignación segura de string directo compatible con el Enum nativo
        },
        include: {
          productos: { select: { id: true, nombre: true, sku: true } },
          talleres: { select: { id: true, nombre: true, email: true } },
          fichas_tecnicas: { select: { id: true, version: true } },
        },
      });

      // Seguimiento inicial
      await tx.seguimiento_produccion.create({
        data: {
          orden_id: orden.id,
          etapa: 'corte',
          observaciones: 'Orden creada — pendiente de inicio',
          activo: true,
        },
      });

      return serializeBigInt(orden);
    });
  },

  async actualizar(id: string, data: {
    fecha_entrega?: string;
    notas?: string;
    taller_id?: string;
  }) {
    const orden = await prisma.ordenes_produccion.update({
      where: { id: BigInt(id) },
      data: {
        ...(data.fecha_entrega !== undefined && { fecha_entrega: data.fecha_entrega ? new Date(data.fecha_entrega) : null }),
        ...(data.notas !== undefined && { notas: data.notas }),
        ...(data.taller_id !== undefined && { taller_id: BigInt(data.taller_id) }),
        updated_at: new Date(),
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
    return prisma.$transaction(async (tx) => {
      // Desactivar etapa anterior
      await tx.seguimiento_produccion.updateMany({
        where: { orden_id: BigInt(data.orden_id), activo: true },
        data: { activo: false, completado_en: new Date() },
      });

      // FIX: Reemplazado 'as any' por la propiedad tipada exacta extraída de los modelos de Prisma
      const seg = await tx.seguimiento_produccion.create({
        data: {
          orden_id: BigInt(data.orden_id),
          etapa: data.etapa as Prisma.seguimiento_produccionCreateInput['etapa'],
          observaciones: data.observaciones ?? null,
          usuario_id: data.usuario_id ? BigInt(data.usuario_id) : null,
          activo: true,
        },
      });

      // Al completar la orden — solo marca estado
      if (data.etapa === 'completada') {
        await tx.ordenes_produccion.update({
          where: { id: BigInt(data.orden_id) },
          data: { 
            estado: 'completada', 
            updated_at: new Date() 
          },
        });
      }

      return serializeBigInt(seg);
    });
  },
};