import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { EstadoPagoTaller, MetodoPago, Prisma } from '@prisma/client';

const includeRelaciones = {
  talleres: { select: { id: true, nombre: true, ruc: true } },
  confecciones: { select: { id: true, prenda: true } },
  ordenes_produccion: { select: { id: true, estado: true } },
  usuarios: { select: { id: true, email: true } },
} satisfies Prisma.pagos_tallerInclude;

export const PagosTallerService = {
  async listar(params?: {
    taller_id?: string;
    confeccion_id?: string;
    orden_produccion_id?: string;
    estado?: string;
    metodo_pago?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      taller_id,
      confeccion_id,
      orden_produccion_id,
      estado,
      metodo_pago,
      search,
      page = 1,
      limit = 20,
    } = params ?? {};
    const skip = (page - 1) * limit;

    const where: Prisma.pagos_tallerWhereInput = {};

    if (taller_id && taller_id !== 'todos') {
      where.taller_id = BigInt(taller_id);
    }
    if (confeccion_id) {
      where.confeccion_id = BigInt(confeccion_id);
    }
    if (orden_produccion_id) {
      where.orden_produccion_id = BigInt(orden_produccion_id);
    }
    if (estado && estado !== 'todos') {
      where.estado = estado as EstadoPagoTaller;
    }
    if (metodo_pago && metodo_pago !== 'todos') {
      where.metodo_pago = metodo_pago as MetodoPago;
    }
    if (search) {
      where.OR = [
        { numero_operacion: { contains: search, mode: 'insensitive' } },
        { notas: { contains: search, mode: 'insensitive' } },
        { talleres: { nombre: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, pagos] = await Promise.all([
      prisma.pagos_taller.count({ where }),
      prisma.pagos_taller.findMany({
        where,
        take: limit,
        skip,
        include: includeRelaciones,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return {
      data: serializeBigInt(pagos),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  async obtenerPorId(id: string) {
    const pago = await prisma.pagos_taller.findUnique({
      where: { id: BigInt(id) },
      include: includeRelaciones,
    });
    return pago ? serializeBigInt(pago) : null;
  },

  async crear(
    data: {
      taller_id: string;
      monto: number;
      metodo_pago: MetodoPago;
      fecha_pago: Date;
      confeccion_id?: string;
      orden_produccion_id?: string;
      moneda?: string;
      numero_operacion?: string;
      comprobante_url?: string;
      notas?: string;
    },
    registrado_por?: string,
  ) {
    const pago = await prisma.pagos_taller.create({
      data: {
        taller_id: BigInt(data.taller_id),
        monto: data.monto,
        metodo_pago: data.metodo_pago,
        fecha_pago: data.fecha_pago,
        estado: 'pendiente',
        moneda: data.moneda ?? 'PEN',
        confeccion_id: data.confeccion_id ? BigInt(data.confeccion_id) : null,
        orden_produccion_id: data.orden_produccion_id ? BigInt(data.orden_produccion_id) : null,
        numero_operacion: data.numero_operacion ?? null,
        comprobante_url: data.comprobante_url ?? null,
        notas: data.notas ?? null,
        registrado_por: registrado_por ? BigInt(registrado_por) : null,
      },
      include: includeRelaciones,
    });
    return serializeBigInt(pago);
  },

  async actualizar(
    id: string,
    data: {
      monto?: number;
      metodo_pago?: MetodoPago;
      fecha_pago?: Date;
      numero_operacion?: string | null;
      comprobante_url?: string | null;
      notas?: string | null;
      moneda?: string;
    },
  ) {
    const actual = await prisma.pagos_taller.findUnique({ where: { id: BigInt(id) } });
    if (!actual) throw new Error('Pago no encontrado');
    if (actual.estado === 'anulado') throw new Error('No se puede editar un pago anulado');
    if (actual.estado === 'pagado') throw new Error('No se puede editar un pago ya registrado como pagado');

    const pago = await prisma.pagos_taller.update({
      where: { id: BigInt(id) },
      data: {
        ...(data.monto !== undefined && { monto: data.monto }),
        ...(data.metodo_pago !== undefined && { metodo_pago: data.metodo_pago }),
        ...(data.fecha_pago !== undefined && { fecha_pago: data.fecha_pago }),
        ...(data.numero_operacion !== undefined && { numero_operacion: data.numero_operacion }),
        ...(data.comprobante_url !== undefined && { comprobante_url: data.comprobante_url }),
        ...(data.notas !== undefined && { notas: data.notas }),
        ...(data.moneda !== undefined && { moneda: data.moneda }),
        updated_at: new Date(),
      },
      include: includeRelaciones,
    });
    return serializeBigInt(pago);
  },

  async registrarPago(
    id: string,
    data: {
      monto?: number;
      metodo_pago?: MetodoPago;
      fecha_pago?: Date;
      numero_operacion?: string;
      comprobante_url?: string;
      notas?: string;
    },
  ) {
    const actual = await prisma.pagos_taller.findUnique({ where: { id: BigInt(id) } });
    if (!actual) throw new Error('Pago no encontrado');
    if (actual.estado === 'anulado') throw new Error('No se puede registrar un pago anulado');
    if (actual.estado === 'pagado') throw new Error('El pago ya fue registrado');

    const pago = await prisma.pagos_taller.update({
      where: { id: BigInt(id) },
      data: {
        estado: 'pagado',
        monto: data.monto ?? actual.monto,
        metodo_pago: data.metodo_pago ?? actual.metodo_pago,
        fecha_pago: data.fecha_pago ?? actual.fecha_pago,
        numero_operacion: data.numero_operacion ?? actual.numero_operacion,
        comprobante_url: data.comprobante_url ?? actual.comprobante_url,
        notas: data.notas ?? actual.notas,
        updated_at: new Date(),
      },
      include: includeRelaciones,
    });
    return serializeBigInt(pago);
  },

  async anular(id: string, notas?: string) {
    const actual = await prisma.pagos_taller.findUnique({ where: { id: BigInt(id) } });
    if (!actual) throw new Error('Pago no encontrado');
    if (actual.estado === 'anulado') throw new Error('El pago ya está anulado');

    const pago = await prisma.pagos_taller.update({
      where: { id: BigInt(id) },
      data: {
        estado: 'anulado',
        ...(notas !== undefined && { notas }),
        updated_at: new Date(),
      },
      include: includeRelaciones,
    });
    return serializeBigInt(pago);
  },

  async obtenerPendientes(tallerId: string) {
    const pagos = await prisma.pagos_taller.findMany({
      where: { taller_id: BigInt(tallerId), estado: 'pendiente' },
      include: includeRelaciones,
      orderBy: { fecha_pago: 'asc' },
    });
    return serializeBigInt(pagos);
  },

  async obtenerMontoTotalPendiente(tallerId: string): Promise<number> {
    const pagos = await prisma.pagos_taller.findMany({
      where: { taller_id: BigInt(tallerId), estado: 'pendiente' },
      select: { monto: true },
    });
    return pagos.reduce((sum, p) => sum + Number(p.monto), 0);
  }
};

/** @deprecated Usar PagosTallerService */
export const pagosTalleresService = PagosTallerService;
