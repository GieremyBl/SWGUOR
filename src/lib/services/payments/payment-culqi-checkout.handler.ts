import { NextResponse } from 'next/server';
import {
  buildCheckoutConfirmacionUrl,
  CODIGO_CHECKOUT_COMPLETADO,
  MENSAJE_CHECKOUT_COMPLETADO,
} from '@/lib/constants/culqi-checkout';
import { buildNotasPagoCulqi } from '@/lib/constants/cierre-venta';
import {
  jsonCheckoutError,
  mapCheckoutRouteError,
} from '@/lib/helpers/culqi-checkout-route.helper';
import {
  culqiCheckoutRequestSchema,
  type CulqiCheckoutSuccessResponse,
} from '@/lib/schemas/culqi-checkout';
import { ejecutarCierreVentaPostCulqi } from '@/lib/services/cierre-venta-culqi.service';
import {
  obtenerPagoRegistradoPorCulqiChargeId,
  validarIdempotenciaPagoPedido,
} from '@/lib/services/pago-idempotencia.service';
import {
  assertMetodoPagoEsperado,
  ejecutarCargoCheckout,
  ejecutarIntencionCheckout,
} from '@/lib/services/payments/payment-checkout.orchestrator';

export async function procesarCheckoutCulqi(body: unknown): Promise<NextResponse> {
  try {
    const parsed = culqiCheckoutRequestSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return jsonCheckoutError(
        {
          success: false,
          message: firstIssue?.message ?? 'Datos de checkout inválidos',
          code: 'DATOS_INCOMPLETOS',
        },
        400,
      );
    }

    assertMetodoPagoEsperado(parsed.data.metodo_pago, 'culqi');

    const { pedido_id, email, token, source_id, description, monto_a_pagar, pagador } =
      parsed.data;

    await validarIdempotenciaPagoPedido(pedido_id);

    const metadata = {
      pedido_id,
      email,
      description,
      ...pagador,
    };

    const intencion = await ejecutarIntencionCheckout(
      'culqi',
      monto_a_pagar ?? 0,
      'PEN',
      metadata,
    );

    const cargo = await ejecutarCargoCheckout(
      'culqi',
      source_id ?? token ?? '',
      intencion.monto,
      intencion.moneda,
      metadata,
    );

    if (!cargo.success) {
      return jsonCheckoutError(
        {
          success: false,
          message: cargo.message,
          code: cargo.code ?? 'CULQI_CHARGE_FAILED',
        },
        cargo.httpStatus,
      );
    }

    const pagoExistente = await obtenerPagoRegistradoPorCulqiChargeId(cargo.transactionId);
    if (pagoExistente?.pedidos) {
      const comprobanteExistente = pagoExistente.comprobantes[0];
      const montoPagadoExistente = Number(pagoExistente.pedidos.monto_pagado ?? 0);
      const saldoPendienteExistente = Number(pagoExistente.pedidos.saldo_pendiente ?? 0);

      const idempotentPayload: CulqiCheckoutSuccessResponse = {
        success: true,
        message: 'Pago ya registrado correctamente',
        code: CODIGO_CHECKOUT_COMPLETADO,
        data: {
          pedido_id,
          pago_id: pagoExistente.id_uuid,
          comprobante_id: comprobanteExistente?.id_uuid ?? '',
          numero_comprobante: comprobanteExistente?.numero_completo ?? null,
          pedido_estado: pagoExistente.pedidos.estado,
          culqi_charge_id: cargo.transactionId,
          redirect_url: comprobanteExistente
            ? buildCheckoutConfirmacionUrl(pedido_id, comprobanteExistente.id_uuid)
            : buildCheckoutConfirmacionUrl(pedido_id, pagoExistente.id_uuid),
          monto_cobrado: cargo.monto.amountSoles,
          monto_pagado: montoPagadoExistente,
          saldo_pendiente: saldoPendienteExistente,
          pago_completo: saldoPendienteExistente <= 0,
        },
      };

      return NextResponse.json(idempotentPayload, { status: 200 });
    }

    const cierre = await ejecutarCierreVentaPostCulqi({
      pedidoId: pedido_id,
      monto: cargo.monto.amountSoles,
      metodoPago: cargo.metodoPago,
      culqiChargeId: cargo.transactionId,
      notas: buildNotasPagoCulqi(cargo.transactionId, pagador),
    });

    const montoPagado = Number(cierre.pedido.monto_pagado ?? 0);
    const saldoPendiente = Number(cierre.pedido.saldo_pendiente ?? 0);
    const pagoCompleto = saldoPendiente <= 0;

    const successPayload: CulqiCheckoutSuccessResponse = {
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
        culqi_charge_id: cargo.transactionId,
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
    return mapCheckoutRouteError(error);
  }
}
