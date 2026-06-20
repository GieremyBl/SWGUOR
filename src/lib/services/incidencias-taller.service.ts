import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { TipoIncidencia, SeveridadIncidencia, Prisma } from '@prisma/client';

export const IncidenciasTallerService = {

  // ── Listar ──────────────────────────────────────────────────
  async listar(params?: {
    severidad?: string;
    resuelto?: boolean;
    confeccion_id?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { severidad, resuelto, confeccion_id, search, page = 1, limit = 10 } = params || {};
    const skip = (page - 1) * limit;

    // FIX: Tipado estricto con el contrato WhereInput nativo de Prisma
    const where: Prisma.incidencias_tallerWhereInput = {};

    if (severidad && severidad !== 'todas') {
      where.severidad = severidad as SeveridadIncidencia;
    }
    if (resuelto !== undefined) {
      where.resuelto = resuelto;
    }
    if (confeccion_id) {
      where.confeccion_id = BigInt(confeccion_id);
    }

    if (search) {
      where.OR = [
        { descripcion: { contains: search, mode: 'insensitive' } },
        { solucion: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, incidencias] = await Promise.all([
      prisma.incidencias_taller.count({ where }),
      prisma.incidencias_taller.findMany({
        where,
        take: limit,
        skip,
        include: {
          pedidos: { select: { id: true } },
          confecciones: {
            select: {
              id: true,
              prenda: true,
              talleres: { select: { id: true, nombre: true } },
            },
          },
          usuario_reportador: { select: { id: true, email: true } },
          usuario_asignado: { select: { id: true, email: true } },
        },
        orderBy: { fecha_reporte: 'desc' },
      }),
    ]);

    return {
      data: serializeBigInt(incidencias),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  // ── Obtener por ID ──────────────────────────────────────────
  async obtenerPorId(id: string) {
    const incidencia = await prisma.incidencias_taller.findUnique({
      where: { id: BigInt(id) },
      include: {
        pedidos: { select: { id: true } },
        confecciones: {
          include: { talleres: { select: { id: true, nombre: true } } },
        },
        usuario_reportador: { select: { id: true, email: true } },
        usuario_asignado: { select: { id: true, email: true } },
      },
    });
    return incidencia ? serializeBigInt(incidencia) : null;
  },

  // ── Crear ───────────────────────────────────────────────────
  async crear(data: {
    confeccion_id: string;
    tipo: TipoIncidencia;
    severidad: SeveridadIncidencia;
    descripcion: string;
    reportado_por?: string;
    asignado_a?: string;
    impacto_horas?: number;
    foto_url?: string;
  }) {
    // Obtener pedido_id desde la confección → orden_produccion → pedido
    const confeccion = await prisma.confecciones.findUnique({
      where: { id: BigInt(data.confeccion_id) },
      select: {
        ordenes_produccion: {
          select: { pedido_id: true },
        },
      },
    });

    const pedido_id = confeccion?.ordenes_produccion?.pedido_id;
    if (!pedido_id) throw new Error('No se encontró el pedido asociado a esta confección');

    const incidencia = await prisma.incidencias_taller.create({
      data: {
        confeccion_id: BigInt(data.confeccion_id),
        pedido_id,
        tipo: data.tipo,
        severidad: data.severidad,
        descripcion: data.descripcion,
        reportado_por: data.reportado_por ? BigInt(data.reportado_por) : null,
        asignado_a: data.asignado_a ? BigInt(data.asignado_a) : null,
        impacto_horas: data.impacto_horas ?? null,
        foto_url: data.foto_url ?? null,
        fecha_reporte: new Date(),
        resuelto: false,
      },
    });
    return serializeBigInt(incidencia);
  },

  // ── Resolver ────────────────────────────────────────────────
  async resolver(id: string, data: {
    solucion: string;
    impacto_horas?: number;
    resuelto_por?: string;
  }) {
    const incidencia = await prisma.incidencias_taller.update({
      where: { id: BigInt(id) },
      data: {
        resuelto: true,
        solucion: data.solucion,
        fecha_resolucion: new Date(),
        ...(data.impacto_horas !== undefined && { impacto_horas: data.impacto_horas }),
        ...(data.resuelto_por !== undefined && { asignado_a: BigInt(data.resuelto_por) }),
        updated_at: new Date(),
      },
    });
    return serializeBigInt(incidencia);
  },

  // ── Asignar ─────────────────────────────────────────────────
  async asignar(id: string, asignado_a: string) {
    const actual = await prisma.incidencias_taller.findUnique({ where: { id: BigInt(id) } });
    if (!actual) throw new Error('Incidencia no encontrada');
    if (actual.resuelto) throw new Error('No se puede reasignar una incidencia resuelta');

    const incidencia = await prisma.incidencias_taller.update({
      where: { id: BigInt(id) },
      data: { asignado_a: BigInt(asignado_a), updated_at: new Date() },
    });
    return serializeBigInt(incidencia);
  },

  // ── Editar (solo pendientes) ────────────────────────────────
  async actualizar(id: string, data: {
    tipo?: TipoIncidencia;
    severidad?: SeveridadIncidencia;
    descripcion?: string;
    impacto_horas?: number | null;
    foto_url?: string | null;
  }) {
    const actual = await prisma.incidencias_taller.findUnique({ where: { id: BigInt(id) } });
    if (!actual) throw new Error('Incidencia no encontrada');
    if (actual.resuelto) throw new Error('No se puede editar una incidencia resuelta');

    const incidencia = await prisma.incidencias_taller.update({
      where: { id: BigInt(id) },
      data: {
        ...(data.tipo !== undefined && { tipo: data.tipo }),
        ...(data.severidad !== undefined && { severidad: data.severidad }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
        ...(data.impacto_horas !== undefined && { impacto_horas: data.impacto_horas }),
        ...(data.foto_url !== undefined && { foto_url: data.foto_url }),
        updated_at: new Date(),
      },
    });
    return serializeBigInt(incidencia);
  },
};