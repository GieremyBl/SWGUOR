import type { EstadoPago, MetodoPago } from '@prisma/client';

export type PaymentGatewayId = 'culqi' | 'stripe' | 'mercadopago';

export type MonedaPago = 'PEN' | 'USD' | string;

/** Metadatos estándar para orquestar cargos multi-gateway */
export interface PagoMetadata {
  pedido_id?: number;
  email?: string;
  description?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface MontoCobroValidado {
  amountSoles: number;
  amountCents: number;
  currencyCode: MonedaPago;
}

export interface IntencionPagoResult {
  gateway: PaymentGatewayId;
  /** Identificador de intención en la pasarela (si aplica) */
  intentId?: string;
  monto: number;
  moneda: MonedaPago;
  amountCents: number;
  metadata: PagoMetadata;
  /** Datos opcionales para el cliente (p. ej. llave pública) */
  clientData?: Record<string, unknown>;
}

export type CargoProcesadoResult =
  | {
      success: true;
      gateway: PaymentGatewayId;
      transactionId: string;
      monto: MontoCobroValidado;
      metodoPago: MetodoPago;
      estadoPago: EstadoPago;
      gatewayStatus?: string;
      rawData?: unknown;
      message: string;
      code?: string;
    }
  | {
      success: false;
      gateway: PaymentGatewayId;
      httpStatus: number;
      message: string;
      code?: string;
      estadoPago?: EstadoPago;
      gatewayStatus?: string;
      transactionId?: string;
    };
