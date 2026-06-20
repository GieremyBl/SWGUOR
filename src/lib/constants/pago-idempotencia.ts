import { EstadoPago } from '@prisma/client';

/** Código de error cuando el pedido ya tiene un pago confirmado */
export const CODIGO_PEDIDO_YA_PAGADO = 'PEDIDO_YA_PAGADO';

export const MENSAJE_PEDIDO_YA_PAGADO =
  'El pedido ya fue pagado. No se procesará un nuevo cargo.';

/**
 * Estados en `pagos.estado` que bloquean un nuevo cobro.
 * En el esquema actual, un pago Culqi exitoso se registra como `pagado`.
 */
export const PAGO_ESTADOS_IDEMPOTENCIA_BLOQUEADOS: EstadoPago[] = [EstadoPago.pagado];
