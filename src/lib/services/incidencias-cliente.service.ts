import { prisma } from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils/serialize';
import type {
  CrearIncidenciaClienteInput,
  ResponderIncidenciaClienteInput,
} from '@/lib/schemas/incidencias-cliente';
import { Prisma, TipoIncidenciaCliente } from '@prisma/client';

export class IncidenciaClienteError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = 'IncidenciaClienteError';
    this.code = code;
    this.status = status;
  }
}

const includeBase = {
  cliente: {
    select: {
      id: true,
      razon_social: true,
      nombre_comercial: true,
      ruc: true,
      email: true,
    },
  },
  pedido: { select: { id: true, estado: true } },
} satisfies Prisma.incidencias_clienteInclude;

export interface ListarIncidenciasClienteParams {
  cliente_id?: bigint;
  estado?: string;
  busqueda?: string;
}

export const IncidenciasClienteService = {
  async listar(params?: ListarIncidenciasClienteParams) {
    const rows = await prisma.incidencias_cliente.findMany({
      where: {
        ...(params?.cliente_id && { cliente_id: params.cliente_id }),
        ...(params?.estado && { estado: params.estado }),
      },
      include: includeBase,
      orderBy: { created_at: 'desc' },
    });

    let resultado = serializeBigInt(rows) as Record<string, unknown>[];

    if (params?.busqueda?.trim()) {
      const q = params.busqueda.trim().toLowerCase();
      resultado = resultado.filter((row) => {
        const cliente = row.cliente as Record<string, unknown> | undefined;
        const texto = [
          row.id,
          row.pedido_id,
          row.tipo,
          row.descripcion,
          row.estado,
          cliente?.razon_social,
          cliente?.nombre_comercial,
        ]
          .join(' ')
          .toLowerCase();
        return texto.includes(q);
      });
    }

    return resultado;
  },

  async obtenerPorId(id: string | number) {
    const row = await prisma.incidencias_cliente.findUnique({
      where: { id: BigInt(id) },
      include: includeBase,
    });
    return row ? serializeBigInt(row) : null;
  },

  async crearParaCliente(clienteId: bigint, input: CrearIncidenciaClienteInput) {
    const pedido = await prisma.pedidos.findFirst({
      where: {
        id: BigInt(input.pedido_id),
        cliente_id: clienteId,
      },
      select: { id: true, cliente_id: true },
    });

    if (!pedido) {
      throw new IncidenciaClienteError(
        'El pedido no existe o no pertenece a su cuenta',
        'PEDIDO_NO_PERMITIDO',
        403,
      );
    }

    const created = await prisma.incidencias_cliente.create({
      data: {
        cliente_id: clienteId,
        pedido_id: pedido.id,
        tipo: input.tipo as TipoIncidenciaCliente,
        descripcion: input.descripcion,
        evidencia_url: input.evidencia_url ?? [],
        estado: 'abierta',
      },
      include: includeBase,
    });

    return serializeBigInt(created);
  },

  async responder(id: string | number, input: ResponderIncidenciaClienteInput) {
    const actual = await prisma.incidencias_cliente.findUnique({
      where: { id: BigInt(id) },
      select: { id: true, descripcion: true, estado: true },
    });

    if (!actual) {
      throw new IncidenciaClienteError('Incidencia no encontrada', 'NO_ENCONTRADA', 404);
    }

    if (actual.estado === 'cerrada') {
      throw new IncidenciaClienteError('La incidencia ya está cerrada', 'INCIDENCIA_CERRADA', 422);
    }

    const marca = `[Respuesta GUOR ${new Date().toLocaleString('es-PE')}]`;
    const descripcionBase = actual.descripcion?.trim() ?? '';
    const descripcionActualizada = descripcionBase
      ? `${descripcionBase}\n\n${marca}\n${input.respuesta_soporte}`
      : `${marca}\n${input.respuesta_soporte}`;

    const updated = await prisma.incidencias_cliente.update({
      where: { id: BigInt(id) },
      data: {
        estado: input.estado,
        descripcion: descripcionActualizada,
        updated_at: new Date(),
      },
      include: includeBase,
    });

    return serializeBigInt(updated);
  },
};

export function isIncidenciaClienteError(error: unknown): error is IncidenciaClienteError {
  return error instanceof IncidenciaClienteError;
}
