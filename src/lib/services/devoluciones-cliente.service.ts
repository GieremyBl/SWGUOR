import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import { ESTADOS_DEVOLUCION_PENDIENTES } from '@/lib/constants/devoluciones-cliente';
import type { CrearDevolucionClienteInput, ResolverDevolucionClienteInput } from '@/lib/schemas/devoluciones-cliente';
import type { CrearDevolucionClientePortalInput } from '@/lib/schemas/soporte-portal';
import { EstadoDevolucion, Prisma } from '@prisma/client';

export class DevolucionClienteError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = 'DevolucionClienteError';
    this.code = code;
    this.status = status;
  }
}

export interface ListarDevolucionesClienteParams {
  estado?: EstadoDevolucion;
  pedido_id?: number;
  cliente_id?: number;
  busqueda?: string;
}

const includeListado = {
  clientes: {
    select: { id: true, razon_social: true, nombre_comercial: true, ruc: true },
  },
  pedidos: { select: { id: true, estado: true } },
  productos: { select: { id: true, nombre: true, sku: true } },
  variantes_producto: { select: { id: true, color: true, talla: true, sku: true } },
} satisfies Prisma.devoluciones_clienteInclude;

export const DevolucionesClienteService = {
  async listar(params?: ListarDevolucionesClienteParams) {
    const where: Prisma.devoluciones_clienteWhereInput = {
      ...(params?.estado && { estado_solicitud: params.estado }),
      ...(params?.pedido_id && { pedido_id: BigInt(params.pedido_id) }),
      ...(params?.cliente_id && { cliente_id: BigInt(params.cliente_id) }),
    };

    const rows = await prisma.devoluciones_cliente.findMany({
      where,
      include: includeListado,
      orderBy: { created_at: 'desc' },
    });

    let resultado = serializeBigInt(rows) as Record<string, unknown>[];

    if (params?.busqueda?.trim()) {
      const q = params.busqueda.trim().toLowerCase();
      resultado = resultado.filter((row) => {
        const cliente = row.clientes as Record<string, unknown> | undefined;
        const producto = row.productos as Record<string, unknown> | undefined;
        const texto = [
          row.id,
          row.pedido_id,
          cliente?.razon_social,
          cliente?.nombre_comercial,
          producto?.nombre,
          producto?.sku,
          row.motivo,
        ]
          .join(' ')
          .toLowerCase();
        return texto.includes(q);
      });
    }

    return resultado;
  },

  async obtenerPorId(id: string | number) {
    const row = await prisma.devoluciones_cliente.findUnique({
      where: { id: BigInt(id) },
      include: {
        ...includeListado,
        usuarios: { select: { id: true, email: true } },
      },
    });
    return row ? serializeBigInt(row) : null;
  },

  async crear(input: CrearDevolucionClienteInput) {
    const pedido = await prisma.pedidos.findUnique({
      where: { id: BigInt(input.pedido_id) },
      include: {
        clientes: { select: { id: true } },
        pedido_items: {
          where: { id: BigInt(input.pedido_item_id) },
          include: {
            productos: { select: { id: true, nombre: true } },
            variantes_producto: { select: { id: true } },
          },
        },
      },
    });

    if (!pedido) {
      throw new DevolucionClienteError('Pedido no encontrado', 'PEDIDO_NO_ENCONTRADO', 404);
    }

    if (!pedido.cliente_id) {
      throw new DevolucionClienteError(
        'El pedido no tiene cliente asociado',
        'PEDIDO_SIN_CLIENTE',
        422,
      );
    }

    const item = pedido.pedido_items[0];
    if (!item) {
      throw new DevolucionClienteError(
        'Ítem de pedido no encontrado',
        'PEDIDO_ITEM_INVALIDO',
        404,
      );
    }

    if (input.cantidad > item.cantidad) {
      throw new DevolucionClienteError(
        `La cantidad no puede superar ${item.cantidad} unidades del pedido`,
        'CANTIDAD_EXCEDIDA',
        422,
      );
    }

    const created = await prisma.devoluciones_cliente.create({
      data: {
        cliente_id: pedido.cliente_id,
        pedido_id: pedido.id,
        producto_id: item.producto_id,
        variante_id: item.variante_id,
        motivo: input.motivo,
        cantidad: input.cantidad,
        estado_solicitud: EstadoDevolucion.pendiente,
        notas_cliente: input.notas_cliente ?? null,
        notas_internas: input.notas_internas ?? null,
        condicion_recibido: input.condicion_recibido ?? null,
        fotos_url: [],
      },
      include: includeListado,
    });

    return serializeBigInt(created);
  },

  async crearParaCliente(clienteId: bigint, input: CrearDevolucionClientePortalInput) {
    const pedido = await prisma.pedidos.findFirst({
      where: {
        id: BigInt(input.pedido_id),
        cliente_id: clienteId,
        estado: 'entregado',
      },
      include: {
        pedido_items: {
          where: { id: BigInt(input.pedido_item_id) },
          include: {
            productos: { select: { id: true, nombre: true } },
            variantes_producto: { select: { id: true } },
          },
        },
      },
    });

    if (!pedido) {
      throw new DevolucionClienteError(
        'El pedido no existe, no le pertenece o aún no está entregado',
        'PEDIDO_NO_ENTREGADO',
        403,
      );
    }

    const item = pedido.pedido_items[0];
    if (!item) {
      throw new DevolucionClienteError(
        'Ítem de pedido no encontrado',
        'PEDIDO_ITEM_INVALIDO',
        404,
      );
    }

    if (input.cantidad > item.cantidad) {
      throw new DevolucionClienteError(
        `La cantidad no puede superar ${item.cantidad} unidades del pedido`,
        'CANTIDAD_EXCEDIDA',
        422,
      );
    }

    const created = await prisma.devoluciones_cliente.create({
      data: {
        cliente_id: clienteId,
        pedido_id: pedido.id,
        producto_id: item.producto_id,
        variante_id: item.variante_id,
        motivo: input.motivo,
        cantidad: input.cantidad,
        estado_solicitud: EstadoDevolucion.pendiente,
        notas_cliente: input.notas_cliente ?? null,
        fotos_url: input.fotos_url ?? [],
      },
      include: includeListado,
    });

    return serializeBigInt(created);
  },

  async aprobar(id: string | number, usuarioId: number, input: ResolverDevolucionClienteInput) {
    return this.resolverEstado(id, usuarioId, EstadoDevolucion.aprobada, input);
  },

  async rechazar(id: string | number, usuarioId: number, input: ResolverDevolucionClienteInput) {
    return this.resolverEstado(id, usuarioId, EstadoDevolucion.rechazada, input);
  },

  async resolverEstado(
    id: string | number,
    usuarioId: number,
    nuevoEstado: typeof EstadoDevolucion.aprobada | typeof EstadoDevolucion.rechazada,
    input: ResolverDevolucionClienteInput,
  ) {
    const actual = await prisma.devoluciones_cliente.findUnique({
      where: { id: BigInt(id) },
      select: { id: true, estado_solicitud: true },
    });

    if (!actual) {
      throw new DevolucionClienteError('Devolución no encontrada', 'NO_ENCONTRADA', 404);
    }

    if (!ESTADOS_DEVOLUCION_PENDIENTES.includes(actual.estado_solicitud)) {
      throw new DevolucionClienteError(
        'Solo se pueden resolver solicitudes pendientes o en revisión',
        'ESTADO_NO_RESOLUBLE',
        422,
      );
    }

    const updated = await prisma.devoluciones_cliente.update({
      where: { id: BigInt(id) },
      data: {
        estado_solicitud: nuevoEstado,
        procesado_por: BigInt(usuarioId),
        fecha_finalizacion: new Date(),
        ...(input.notas_internas !== undefined && { notas_internas: input.notas_internas }),
        ...(input.condicion_recibido !== undefined && {
          condicion_recibido: input.condicion_recibido,
        }),
        ...(nuevoEstado === EstadoDevolucion.aprobada &&
          input.monto_reembolsado !== undefined && {
            monto_reembolsado: input.monto_reembolsado,
          }),
        updated_at: new Date(),
      },
      include: includeListado,
    });

    return serializeBigInt(updated);
  },
};

export function isDevolucionClienteError(error: unknown): error is DevolucionClienteError {
  return error instanceof DevolucionClienteError;
}
