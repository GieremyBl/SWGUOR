import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { SeguimientoConfeccionService } from '@/lib/services/seguimiento-confeccion.service';
import { EstadoConfeccion, Prisma } from '@prisma/client';

export const ConfeccionesService = {

  async listar(params?: {
    estado?: string;
    taller_id?: string;
    orden_produccion_id?: string;
    prioridad?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { estado, taller_id, orden_produccion_id, prioridad, search, page = 1, limit = 10 } = params || {};
    const skip = (page - 1) * limit;

    const where: Prisma.confeccionesWhereInput = {};

    if (estado && estado !== 'todos') {
      where.estado = estado as EstadoConfeccion;
    }
    if (taller_id && taller_id !== 'todos') {
      where.taller_id = BigInt(taller_id);
    }
    if (orden_produccion_id) {
      where.orden_produccion_id = BigInt(orden_produccion_id);
    }
    if (prioridad && prioridad !== 'todas') {
      where.prioridad = prioridad;
    }
    if (search) {
      where.OR = [
        { prenda: { contains: search, mode: 'insensitive' } },
        { talleres: { nombre: { contains: search, mode: 'insensitive' } } },
      ];
      if (!isNaN(Number(search))) {
        where.OR.push({ id: BigInt(search) });
      }
    }

    const [total, confecciones, prioridadRaw] = await Promise.all([
      prisma.confecciones.count({ where }),
      prisma.confecciones.findMany({
        where,
        take: limit,
        skip,
        include: {
          talleres: { select: { id: true, nombre: true } },
          ordenes_produccion: {
            select: {
              id: true,
              estado: true,
              pedidos: { select: { id: true, estado: true } },
            },
          },
        },
        orderBy: [
          { prioridad: 'desc' },
          { created_at: 'desc' },
        ],
      }),
      prisma.confecciones.groupBy({
        by: ['prioridad'],
        _count: { _all: true },
      }),
    ]);

    const prioridadCounts = { baja: 0, media: 0, alta: 0, urgente: 0 };
    for (const { prioridad: p, _count } of prioridadRaw) {
      if (p in prioridadCounts) {
        prioridadCounts[p as keyof typeof prioridadCounts] = _count._all;
      }
    }

    return {
      data: serializeBigInt(confecciones),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      prioridadCounts,
    };
  },

  async obtenerPorId(id: string) {
    const confeccion = await prisma.confecciones.findUnique({
      where: { id: BigInt(id) },
      include: {
        talleres: {
          select: {
            id: true, nombre: true, contacto: true,
            email: true, telefono: true, especialidad: true,
          },
        },
        ordenes_produccion: {
          select: {
            id: true, estado: true, cantidad_solicitada: true,
            pedidos: {
              select: {
                id: true, estado: true,
                clientes: { select: { id: true, razon_social: true, nombre_comercial: true } },
              },
            },
          },
        },
        usuarios: { select: { id: true, email: true } },
        seguimiento_confeccion: { orderBy: { created_at: 'desc' } },
      },
    });
    return confeccion ? serializeBigInt(confeccion) : null;
  },

  async crear(data: {
    taller_id: string;
    prenda: string;
    cantidad: number;
    prioridad: string;
    estado?: EstadoConfeccion;
    orden_produccion_id?: string | number | null;
    costo_unitario?: number | null;
    fecha_entrega?: string | null;
    notas?: string | null;
    responsable_id?: string;
  }) {
    const confeccion = await prisma.confecciones.create({
      data: {
        taller_id: BigInt(data.taller_id),
        prenda: data.prenda,
        cantidad: data.cantidad,
        prioridad: data.prioridad,
        estado: data.estado ?? 'pendiente',
        fecha_inicio: new Date(),
        orden_produccion_id: data.orden_produccion_id
          ? BigInt(data.orden_produccion_id)
          : null,
        costo_unitario: data.costo_unitario ?? null,
        fecha_entrega: data.fecha_entrega ? new Date(data.fecha_entrega) : null,
        notas: data.notas ?? null,
        responsable_id: data.responsable_id ? BigInt(data.responsable_id) : null,
      },
      include: {
        talleres: { select: { id: true, nombre: true } },
        ordenes_produccion: {
          select: {
            id: true,
            estado: true,
            pedidos: { select: { id: true, estado: true } },
          },
        },
      },
    });
    return serializeBigInt(confeccion);
  },

  async actualizar(id: string, data: Partial<{
    taller_id: string;
    responsable_id: string;
    observaciones: string;
    notas: string;
    costo_unitario: number;
    fecha_entrega: string;
  }>) {
    const { taller_id, responsable_id, fecha_entrega, costo_unitario, ...rest } = data;
    const confeccion = await prisma.confecciones.update({
      where: { id: BigInt(id) },
      data: {
        ...rest,
        ...(taller_id !== undefined && { taller_id: BigInt(taller_id) }),
        ...(responsable_id !== undefined && { responsable_id: BigInt(responsable_id) }),
        ...(fecha_entrega !== undefined && { fecha_entrega: new Date(fecha_entrega) }),
        ...(costo_unitario !== undefined && { costo_unitario }),
        updated_at: new Date(),
      },
    });
    return serializeBigInt(confeccion);
  },

  async actualizarDatos(
    id: string,
    data: {
      taller_id?: string;
      prenda?: string;
      cantidad?: number;
      costo_unitario?: number | null;
      fecha_entrega?: string | null;
      prioridad?: string;
      estado?: string;
      notas?: string | null;
      orden_produccion_id?: string | number | null;
    },
    responsable_id?: string,
  ) {
    const actual = await prisma.confecciones.findUnique({ where: { id: BigInt(id) } });
    if (!actual) throw new Error('Confección no encontrada');
    if (['cancelada', 'rechazada', 'completada'].includes(actual.estado)) {
      throw new Error('No se puede editar una confección cerrada');
    }

    if (data.estado && data.estado !== actual.estado) {
      await SeguimientoConfeccionService.registrarCambioEstado({
        confeccion_id: id,
        estado_nuevo: data.estado,
        notas: data.notas ?? null,
        responsable_id,
      });
    }

    const confeccion = await prisma.confecciones.update({
      where: { id: BigInt(id) },
      data: {
        ...(data.taller_id !== undefined && { taller_id: BigInt(data.taller_id) }),
        ...(data.prenda !== undefined && { prenda: data.prenda }),
        ...(data.cantidad !== undefined && { cantidad: data.cantidad }),
        ...(data.costo_unitario !== undefined && { costo_unitario: data.costo_unitario }),
        ...(data.fecha_entrega !== undefined && {
          fecha_entrega: data.fecha_entrega ? new Date(data.fecha_entrega) : null,
        }),
        ...(data.prioridad !== undefined && { prioridad: data.prioridad }),
        ...(data.notas !== undefined && { notas: data.notas }),
        ...(data.orden_produccion_id !== undefined && {
          orden_produccion_id: data.orden_produccion_id
            ? BigInt(data.orden_produccion_id)
            : null,
        }),
        ...(data.estado === 'completada' && !actual.fecha_fin && { fecha_fin: new Date() }),
        updated_at: new Date(),
      },
      include: {
        talleres: { select: { id: true, nombre: true } },
        ordenes_produccion: {
          select: {
            id: true,
            estado: true,
            pedidos: { select: { id: true, estado: true } },
          },
        },
      },
    });
    return serializeBigInt(confeccion);
  },

  async cancelar(id: string, data: { estado: 'cancelada' | 'rechazada'; notas?: string | null }, responsable_id?: string) {
    const actual = await prisma.confecciones.findUnique({ where: { id: BigInt(id) } });
    if (!actual) throw new Error('Confección no encontrada');
    if (['cancelada', 'rechazada', 'completada'].includes(actual.estado)) {
      throw new Error('La confección ya está cerrada');
    }

    await this.actualizarEstado(id, {
      estado: data.estado,
      notas: data.notas ?? undefined,
      responsable_id,
    });

    const confeccion = await prisma.confecciones.findUnique({
      where: { id: BigInt(id) },
      include: {
        talleres: { select: { id: true, nombre: true } },
      },
    });
    if (!confeccion) throw new Error('Confección no encontrada');
    return serializeBigInt(confeccion);
  },

  async actualizarEstado(id: string, data: {
    estado: string;
    notas?: string;
    responsable_id?: string;
  }) {
    await SeguimientoConfeccionService.registrarCambioEstado({
      confeccion_id: id,
      estado_nuevo: data.estado,
      notas: data.notas ?? null,
      responsable_id: data.responsable_id,
    });

    const confeccion = await prisma.confecciones.findUnique({
      where: { id: BigInt(id) },
    });
    if (!confeccion) throw new Error('Confección no encontrada');
    return serializeBigInt(confeccion);
  },
};