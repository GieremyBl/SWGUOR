/** Etiquetas legibles para métodos de pago en el portal */
export const METODO_PAGO_PORTAL_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia_bcp: 'Transferencia BCP',
  yape: 'Yape',
  plin: 'Plin',
  visa: 'Tarjeta Visa',
  mastercard: 'Tarjeta Mastercard',
};

export const TIPO_COMPROBANTE_PORTAL_LABELS: Record<string, string> = {
  factura: 'Factura Electrónica',
  boleta: 'Boleta de Venta Electrónica',
  nota_credito: 'Nota de Crédito',
  nota_debito: 'Nota de Débito',
};

export function getMetodoPagoLabel(metodo?: string | null): string {
  if (!metodo) return 'No especificado';
  return METODO_PAGO_PORTAL_LABELS[metodo] ?? metodo.replace(/_/g, ' ');
}

export function getTipoComprobanteLabel(tipo?: string | null): string {
  if (!tipo) return 'Comprobante';
  return TIPO_COMPROBANTE_PORTAL_LABELS[tipo] ?? tipo;
}

export const TIPO_PAGO_PORTAL_LABELS: Record<string, string> = {
  adelanto: 'Adelanto',
  cuota: 'Cuota / abono',
  saldo_final: 'Saldo final',
  pago_completo: 'Pago completo',
};

export function getTipoPagoLabel(tipo?: string | null): string {
  if (!tipo) return 'Pago';
  return TIPO_PAGO_PORTAL_LABELS[tipo] ?? tipo.replace(/_/g, ' ');
}
