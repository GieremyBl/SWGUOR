import type { LucideIcon } from 'lucide-react';
import { CreditCard, FileSpreadsheet, FileText, Receipt, Truck } from 'lucide-react';

export function pedidoDocumentosApi(pedidoId: string | number): string {
  return `/api/portal/pedidos/${pedidoId}/documentos`;
}

export function iconoDocumentoPedido(tipoDocumento: string): LucideIcon {
  const tipo = tipoDocumento.toLowerCase();

  if (tipo.includes('guía') || tipo.includes('guia')) return Truck;
  if (tipo.includes('voucher') || tipo.includes('pago')) return CreditCard;
  if (tipo.includes('cotización') || tipo.includes('cotizacion')) return FileSpreadsheet;
  if (tipo.includes('factura') || tipo.includes('boleta') || tipo.includes('nota')) return Receipt;

  return FileText;
}
