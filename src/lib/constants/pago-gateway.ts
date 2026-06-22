export type PagoGatewayId = 'culqi' | 'stripe' | 'mercadopago';

/** Pasarela usada en el checkout del portal */
export const PAGO_GATEWAY_ACTIVO: PagoGatewayId = 'stripe';

/**
 * Pasarelas visibles en el selector del checkout.
 * Agregar 'culqi' o 'mercadopago' para rehabilitar sin cambiar el backend.
 */
export const PAGO_GATEWAYS_VISIBLES: readonly PagoGatewayId[] = ['stripe'];

export const PAGO_GATEWAYS: Array<{
  id: PagoGatewayId;
  label: string;
  description: string;
}> = [
  {
    id: 'culqi',
    label: 'Tarjeta Crédito/Débito',
    description: 'Pasarela Culqi — Perú',
  },
  {
    id: 'stripe',
    label: 'Stripe',
    description: 'Tarjeta internacional',
  },
  {
    id: 'mercadopago',
    label: 'Mercado Pago',
    description: 'Checkout API — tarjeta',
  },
];

export function getPagoGatewaysVisibles() {
  return PAGO_GATEWAYS.filter((item) =>
    PAGO_GATEWAYS_VISIBLES.includes(item.id),
  );
}
