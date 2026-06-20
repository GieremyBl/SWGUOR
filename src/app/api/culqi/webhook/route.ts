import { NextRequest, NextResponse } from 'next/server';
import {
  CODIGO_WEBHOOK_EVENTO_IGNORADO,
  getCulqiWebhookSecret,
} from '@/lib/constants/culqi-webhook';
import {
  esEventoCargoExitoso,
  isCulqiWebhookParseError,
  isCulqiWebhookSignatureError,
  parseCulqiWebhookBody,
  verificarFirmaWebhookCulqi,
  CulqiWebhookSignatureError,
} from '@/lib/helpers/culqi-webhook.helper';
import {
  mapWebhookProcesamientoError,
  procesarWebhookChargeSucceeded,
} from '@/lib/services/culqi-webhook.service';

export const runtime = 'nodejs';

function getSignatureHeader(request: NextRequest): string | null {
  const headerName =
    process.env.CULQI_WEBHOOK_SIGNATURE_HEADER?.trim() || 'x-culqi-signature';

  return (
    request.headers.get(headerName) ??
    request.headers.get('X-Culqi-Signature') ??
    request.headers.get('x-culqi-signature')
  );
}

/**
 * POST /api/culqi/webhook
 * Respaldo async para charge.succeeded cuando el checkout del cliente no completó el cierre en BD.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  try {
    const webhookSecret = getCulqiWebhookSecret();
    if (webhookSecret) {
      const signature = getSignatureHeader(request);
      if (!verificarFirmaWebhookCulqi(rawBody, signature, webhookSecret)) {
        throw new CulqiWebhookSignatureError();
      }
    }

    const event = parseCulqiWebhookBody(rawBody);

    if (event.object !== 'event') {
      return NextResponse.json(
        {
          success: false,
          code: 'WEBHOOK_OBJETO_INVALIDO',
          message: 'Payload no es un evento Culqi',
        },
        { status: 400 },
      );
    }

    if (!esEventoCargoExitoso(event.type)) {
      return NextResponse.json({
        success: true,
        code: CODIGO_WEBHOOK_EVENTO_IGNORADO,
        message: `Evento ${event.type ?? 'desconocido'} ignorado`,
      });
    }

    const result = await procesarWebhookChargeSucceeded(event);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (isCulqiWebhookParseError(error) || isCulqiWebhookSignatureError(error)) {
      return NextResponse.json(
        { success: false, code: error.code, message: error.message },
        { status: error instanceof CulqiWebhookSignatureError ? 401 : 400 },
      );
    }

    const mapped = mapWebhookProcesamientoError(error);
    console.error('[POST /api/culqi/webhook]', mapped.code, mapped.message);

    return NextResponse.json(
      { success: false, code: mapped.code, message: mapped.message },
      { status: mapped.status },
    );
  }
}
