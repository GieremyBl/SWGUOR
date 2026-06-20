export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { EstadoPago } from '@prisma/client';
import {
  buildCheckoutConfirmacionUrl,
  CODIGO_CHECKOUT_COMPLETADO,
  MENSAJE_CHECKOUT_COMPLETADO,
} from '@/lib/constants/culqi-checkout';
import { buildNotasPagoMercadoPago } from '@/lib/constants/mercadopago';
import { appendDatosPagadorEnNotas } from '@/lib/helpers/datos-pagador-pago.helper';
import { esMercadoPagoAprobado } from '@/lib/helpers/mercadopago-status.helper';
import { mapMercadoPagoChargeRouteError } from '@/lib/helpers/mercadopago-charge-route.helper';
import {
  mercadoPagoChargeRequestSchema,
  type MercadoPagoChargePendingResponse,
  type MercadoPagoChargeSuccessResponse,
} from '@/lib/schemas/mercadopago-payment';
import { ejecutarCierreVentaPostCulqi } from '@/lib/services/cierre-venta-culqi.service';
import { validarIdempotenciaPagoPedido } from '@/lib/services/pago-idempotencia.service';
import { createPaymentGateway } from '@/lib/services/payments/payment-gateway.factory';

/**
 * POST /api/pagos/mercadopago/charge
 *
 * Procesa un pago con token de tarjeta de Mercado Pago (Payment API).
 * Mapea approved / in_process / rejected → EstadoPago (pagado / pendiente / anulado).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = mercadoPagoChargeRequestSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          message: firstIssue?.message ?? 'Datos de pago inválidos',
          code: 'DATOS_INCOMPLETOS',
        },
        { status: 400 },
      );
    }

    const {
      pedido_id,
      email,
      token,
      payment_method_id,
      installments,
      issuer_id,
      monto_a_pagar,
      description,
      pagador,
    } = parsed.data;

    await validarIdempotenciaPagoPedido(pedido_id);

    const gateway = createPaymentGateway('mercadopago');
    const metadata = {
      pedido_id,
      email,
      description,
      payment_method_id,
      installments,
      issuer_id,
    };

    const intencion = await gateway.crearIntencionPago(
      monto_a_pagar ?? 0,
      'PEN',
      metadata,
    );

    const cargo = await gateway.procesarCargo(
      token,
      intencion.monto,
      intencion.moneda,
      metadata,
    );

    if (!cargo.success) {
      const pendingPayload: MercadoPagoChargePendingResponse = {
        success: false,
        message: cargo.message,
        code: cargo.code ?? 'MP_CHARGE_FAILED',
        estado_pago: cargo.estadoPago ?? EstadoPago.pendiente,
        mercadopago_status: cargo.gatewayStatus ?? 'unknown',
        mercadopago_payment_id: cargo.transactionId
          ? Number(cargo.transactionId)
          : undefined,
      };

      return NextResponse.json(pendingPayload, { status: cargo.httpStatus });
    }

    if (!esMercadoPagoAprobado(cargo.gatewayStatus ?? '')) {
      return NextResponse.json(
        {
          success: false,
          message: cargo.message,
          code: 'MP_NO_APROBADO',
          estado_pago: cargo.estadoPago,
          mercadopago_status: cargo.gatewayStatus,
        },
        { status: 400 },
      );
    }

    const cierre = await ejecutarCierreVentaPostCulqi({
      pedidoId: pedido_id,
      monto: cargo.monto.amountSoles,
      metodoPago: cargo.metodoPago,
      culqiChargeId: cargo.transactionId,
      estadoPago: cargo.estadoPago,
      notas: appendDatosPagadorEnNotas(
        buildNotasPagoMercadoPago(cargo.transactionId),
        pagador,
      ),
    });

    const montoPagado = Number(cierre.pedido.monto_pagado ?? 0);
    const saldoPendiente = Number(cierre.pedido.saldo_pendiente ?? 0);
    const pagoCompleto = saldoPendiente <= 0;

    const successPayload: MercadoPagoChargeSuccessResponse = {
      success: true,
      message: pagoCompleto
        ? MENSAJE_CHECKOUT_COMPLETADO
        : 'Pago parcial registrado correctamente',
      code: CODIGO_CHECKOUT_COMPLETADO,
      data: {
        pedido_id,
        pago_id: cierre.pago.id_uuid,
        comprobante_id: cierre.comprobante.id_uuid,
        numero_comprobante: cierre.comprobante.numero_completo,
        pedido_estado: cierre.pedido.estado,
        mercadopago_payment_id: Number(cargo.transactionId),
        mercadopago_status: cargo.gatewayStatus ?? 'approved',
        estado_pago: cargo.estadoPago,
        redirect_url: buildCheckoutConfirmacionUrl(
          pedido_id,
          cierre.comprobante.id_uuid,
        ),
        monto_cobrado: cargo.monto.amountSoles,
        monto_pagado: montoPagado,
        saldo_pendiente: saldoPendiente,
        pago_completo: pagoCompleto,
      },
    };

    return NextResponse.json(successPayload, { status: 200 });
  } catch (error) {
    return mapMercadoPagoChargeRouteError(error);
  }
}
