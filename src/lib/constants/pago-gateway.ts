export type PagoGatewayId = 'culqi' | 'stripe' | 'mercadopago';

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
