import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  DireccionClienteCreateInput,
  DireccionClienteUpdateInput,
} from '@/lib/schemas/direcciones-cliente';
import { serializeBigInt } from '@/lib/utils/serialize';

export class DireccionClienteError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'CLIENTE_NOT_FOUND' | 'VALIDATION' = 'VALIDATION',
  ) {
    super(message);
    this.name = 'DireccionClienteError';
  }
}

function toBigIntId(value: string | number | bigint, label = 'id'): bigint {
  try {
    return BigInt(value);
  } catch {
    throw new DireccionClienteError(`${label} inválido`, 'VALIDATION');
  }
}

async function assertClienteExiste(
  tx: Prisma.TransactionClient,
  clienteId: bigint,
): Promise<void> {
  const cliente = await tx.clientes.findUnique({
    where: { id: clienteId },
    select: { id: true },
  });

  if (!cliente) {
    throw new DireccionClienteError('Cliente no encontrado', 'CLIENTE_NOT_FOUND');
  }
}

/**
 * Garantiza una única dirección principal por cliente.
 * Debe ejecutarse dentro de una transacción antes de create/update con es_principal: true.
 */
async function desmarcarTodasPrincipales(
  tx: Prisma.TransactionClient,
  clienteId: bigint,
): Promise<void> {
  await tx.direcciones_cliente.updateMany({
    where: { cliente_id: clienteId },
    data: { es_principal: false },
  });
}

function mapDireccionCreatePayload(
  input: DireccionClienteCreateInput,
): Omit<Prisma.direcciones_clienteUncheckedCreateInput, 'cliente_id'> {
  return {
    alias: input.alias,
    direccion: input.direccion,
    ciudad: input.ciudad ?? null,
    departamento: input.departamento ?? null,
    provincia: input.provincia ?? null,
    pais: input.pais ?? null,
    es_principal: input.es_principal ?? false,
  };
}

function mapUpdatePayload(
  input: DireccionClienteUpdateInput,
): Prisma.direcciones_clienteUncheckedUpdateInput {
  const data: Prisma.direcciones_clienteUncheckedUpdateInput = {};

  if (input.alias !== undefined) data.alias = input.alias;
  if (input.direccion !== undefined) data.direccion = input.direccion;
  if (input.ciudad !== undefined) data.ciudad = input.ciudad ?? null;
  if (input.departamento !== undefined) data.departamento = input.departamento ?? null;
  if (input.provincia !== undefined) data.provincia = input.provincia ?? null;
  if (input.pais !== undefined) data.pais = input.pais ?? null;
  if (input.es_principal !== undefined) data.es_principal = input.es_principal;

  return data;
}

export const DireccionesClienteService = {
  /** Lista direcciones de un cliente (principal primero). */
  async listarPorCliente(clienteId: string | number | bigint) {
    const id = toBigIntId(clienteId, 'cliente_id');

    await assertClienteExiste(prisma, id);

    const direcciones = await prisma.direcciones_cliente.findMany({
      where: { cliente_id: id },
      orderBy: [{ es_principal: 'desc' }, { created_at: 'asc' }],
    });

    return serializeBigInt(direcciones);
  },

  /** Crea una dirección; si es_principal, desmarca las demás en la misma transacción. */
  async crear(clienteId: string | number | bigint, input: DireccionClienteCreateInput) {
    const idCliente = toBigIntId(clienteId, 'cliente_id');
    const esPrincipal = input.es_principal === true;

    const direccion = await prisma.$transaction(async (tx) => {
      await assertClienteExiste(tx, idCliente);

      if (esPrincipal) {
        await desmarcarTodasPrincipales(tx, idCliente);
      }

      return tx.direcciones_cliente.create({
        data: {
          cliente_id: idCliente,
          ...mapDireccionCreatePayload({
            ...input,
            es_principal: esPrincipal,
          }),
        },
      });
    });

    return serializeBigInt(direccion);
  },

  /** Actualiza una dirección; aplica regla de unicidad de es_principal. */
  async actualizar(
    direccionId: string | number | bigint,
    input: DireccionClienteUpdateInput,
  ) {
    const id = toBigIntId(direccionId);
    const marcarPrincipal = input.es_principal === true;

    const direccion = await prisma.$transaction(async (tx) => {
      const existente = await tx.direcciones_cliente.findUnique({
        where: { id },
        select: { id: true, cliente_id: true },
      });

      if (!existente) {
        throw new DireccionClienteError('Dirección no encontrada', 'NOT_FOUND');
      }

      if (marcarPrincipal) {
        await desmarcarTodasPrincipales(tx, existente.cliente_id);
      }

      return tx.direcciones_cliente.update({
        where: { id },
        data: mapUpdatePayload(input),
      });
    });

    return serializeBigInt(direccion);
  },

  /** Elimina físicamente una dirección (el modelo no tiene soft delete). */
  async eliminar(direccionId: string | number | bigint) {
    const id = toBigIntId(direccionId);

    const existente = await prisma.direcciones_cliente.findUnique({
      where: { id },
      select: { id: true, es_principal: true },
    });

    if (!existente) {
      throw new DireccionClienteError('Dirección no encontrada', 'NOT_FOUND');
    }

    if (existente.es_principal) {
      throw new DireccionClienteError(
        'No se puede eliminar la dirección principal. Marque otra sede como principal primero.',
        'VALIDATION',
      );
    }

    await prisma.direcciones_cliente.delete({ where: { id } });

    return { success: true as const, id: id.toString() };
  },
};
