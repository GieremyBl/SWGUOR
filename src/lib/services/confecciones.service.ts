import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
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
    
    // FIX: Reemplazado 'where: any' por el tipo exacto de Prisma
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

    const [total, confecciones] = await Promise.all([
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
          // Urgentes primero, luego por fecha de creación
          { prioridad: 'desc' },
          { created_at: 'desc' },
        ],
      }),
    ]);

    return {
      data: serializeBigInt(confecciones),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
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

  // Solo el representante: reasignar taller, editar observaciones/notas/responsable
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

  // Actualiza el estado y registra el seguimiento en una sola transacción
  async actualizarEstado(id: string, data: {
    estado: string;
    notas?: string;
    responsable_id?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const actual = await tx.confecciones.findUnique({
        where: { id: BigInt(id) },
        select: { estado: true },
      });

      if (!actual) throw new Error('Confección no encontrada');

      // FIX: Reemplazado 'extra: any' asignando los campos de forma segura y estricta en el data input
      const fechaInicio = data.estado === 'en_proceso' ? new Date() : undefined;
      const fechaFin = data.estado === 'completada' ? new Date() : undefined;

      const confeccion = await tx.confecciones.update({
        where: { id: BigInt(id) },
        data: { 
          estado: data.estado as EstadoConfeccion, 
          ...(fechaInicio && { fecha_inicio: fechaInicio }),
          ...(fechaFin && { fecha_fin: fechaFin }),
          updated_at: new Date() 
        },
      });

      await tx.seguimiento_confeccion.create({
        data: {
          confeccion_id: BigInt(id),
          estado_anterior: actual.estado,
          estado_nuevo: data.estado as EstadoConfeccion,
          notas: data.notas ?? null,
          responsable_id: data.responsable_id ? BigInt(data.responsable_id) : null,
        },
      });

      return serializeBigInt(confeccion);
    });
  },
};