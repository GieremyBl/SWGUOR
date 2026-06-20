import { prisma } from '@/lib/prisma';
import { EstadoPago } from '@prisma/client';
import {
  CODIGO_PEDIDO_YA_PAGADO,
  MENSAJE_PEDIDO_YA_PAGADO,
  PAGO_ESTADOS_IDEMPOTENCIA_BLOQUEADOS,
} from '@/lib/constants/pago-idempotencia';
import { buildNotasPagoCulqi } from '@/lib/constants/cierre-venta';

export class PagoIdempotenciaError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'PagoIdempotenciaError';
    this.code = code;
    this.status = status;
  }
}

export class PedidoNoEncontradoPagoError extends PagoIdempotenciaError {
  constructor() {
    super('Pedido no encontrado', 'PEDIDO_NO_ENCONTRADO', 404);
  }
}

export class PedidoYaPagadoError extends PagoIdempotenciaError {
  constructor() {
    super(MENSAJE_PEDIDO_YA_PAGADO, CODIGO_PEDIDO_YA_PAGADO, 400);
  }
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

function buildPagoDuplicadoWhere(pedidoId: bigint) {
  return {
    pedido_id: pedidoId,
    OR: [
      { estado: { in: PAGO_ESTADOS_IDEMPOTENCIA_BLOQUEADOS } },
      /** Pago verificado manualmente por tesorería */
      { verificado_at: { not: null } },
    ],
  };
}

async function existePagoConfirmado(
  db: Tx | typeof prisma,
  pedidoId: bigint,
): Promise<boolean> {
  const pago = await db.pagos.findFirst({
    where: buildPagoDuplicadoWhere(pedidoId),
    select: { id_uuid: true, estado: true, verificado_at: true },
  });
  return Boolean(pago);
}

function buildCulqiChargeIdNeedle(culqiChargeId: string): string {
  return buildNotasPagoCulqi(culqiChargeId);
}

/** Idempotencia por charge_id de Culqi (reintentos de webhook o doble vía checkout). */
export async function existePagoPorCulqiChargeId(
  db: Tx | typeof prisma,
  culqiChargeId: string,
): Promise<boolean> {
  const pago = await db.pagos.findFirst({
    where: { notas: { contains: buildCulqiChargeIdNeedle(culqiChargeId) } },
    select: { id_uuid: true },
  });
  return Boolean(pago);
}

/** Recupera pago + pedido + comprobante ya persistidos para un charge Culqi. */
export async function obtenerPagoRegistradoPorCulqiChargeId(culqiChargeId: string) {
  return prisma.pagos.findFirst({
    where: { notas: { contains: buildCulqiChargeIdNeedle(culqiChargeId) } },
    include: {
      pedidos: {
        select: {
          id: true,
          estado: true,
          monto_pagado: true,
          saldo_pendiente: true,
        },
      },
      comprobantes: {
        take: 1,
        orderBy: { created_at: 'desc' },
        select: {
          id_uuid: true,
          numero_completo: true,
        },
      },
    },
  });
}

/**
 * Valida idempotencia antes de tokenizar/cobrar en Culqi.
 * Bloquea si existe un pago `pagado` o con `verificado_at` (pago verificado).
 */
function resolverSaldoPendientePedido(pedido: {
  total: unknown;
  monto_pagado: unknown;
  saldo_pendiente: unknown;
}): number {
  const total = Number(pedido.total ?? 0);
  const pagado = Number(pedido.monto_pagado ?? 0);
  const saldoRegistrado = Number(pedido.saldo_pendiente ?? 0);
  return saldoRegistrado > 0 ? saldoRegistrado : Math.max(total - pagado, 0);
}

export async function validarIdempotenciaPagoPedido(
  pedidoId: number | bigint,
): Promise<void> {
  const id = BigInt(pedidoId);

  if (id <= BigInt(0)) {
    throw new PagoIdempotenciaError('ID de pedido inválido', 'PEDIDO_INVALIDO', 400);
  }

  const pedido = await prisma.pedidos.findUnique({
    where: { id },
    select: { id: true, total: true, monto_pagado: true, saldo_pendiente: true },
  });

  if (!pedido) {
    throw new PedidoNoEncontradoPagoError();
  }

  if (resolverSaldoPendientePedido(pedido) <= 0) {
    throw new PedidoYaPagadoError();
  }
}

/**
 * Revalidación dentro de transacción antes de persistir el pago (anti-duplicado concurrente).
 */
export async function assertIdempotenciaPagoPedidoEnTx(
  tx: Tx,
  pedidoId: number | bigint,
): Promise<void> {
  const id = BigInt(pedidoId);

  const pedido = await tx.pedidos.findUnique({
    where: { id },
    select: { total: true, monto_pagado: true, saldo_pendiente: true },
  });

  if (!pedido) {
    throw new PedidoNoEncontradoPagoError();
  }

  if (resolverSaldoPendientePedido(pedido) <= 0) {
    throw new PedidoYaPagadoError();
  }
}

export function isPagoIdempotenciaError(error: unknown): error is PagoIdempotenciaError {
  return error instanceof PagoIdempotenciaError;
}

/** Helper para consultas/reportes */
export async function pedidoTienePagoConfirmado(
  pedidoId: number | bigint,
): Promise<boolean> {
  return existePagoConfirmado(prisma, BigInt(pedidoId));
}

export { EstadoPago };
