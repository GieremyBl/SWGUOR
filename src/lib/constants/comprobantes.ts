import { EMPRESA_GUOR } from '@/lib/constants/empresa';
import { TASA_IGV_PEN } from '@/lib/constants/ordenes-compra';

/** Tasa IGV aplicada al desglose de comprobantes (Perú) */
export const TASA_IGV_COMPROBANTE = TASA_IGV_PEN;

/** Series simuladas SUNAT — configurables por entorno */
export const SERIE_COMPROBANTE_FACTURA =
  process.env.COMPROBANTE_SERIE_FACTURA?.trim() || 'F001';

export const SERIE_COMPROBANTE_BOLETA =
  process.env.COMPROBANTE_SERIE_BOLETA?.trim() || 'B001';

/** Longitud del correlativo numérico (ej. 00000045) */
export const COMPROBANTE_CORRELATIVO_PAD = 8;

/** Estado simulado tras respuesta SUNAT exitosa */
export const ESTADO_SUNAT_SIMULADO_ACEPTADO = 'aceptado' as const;

/** Código/mensaje estándar SUNAT simulado (CDR aceptado) */
export const RESPUESTA_SUNAT_ACEPTADO_FACTURA =
  '0 - La Factura ha sido aceptada (simulación SUNAT)';

export const RESPUESTA_SUNAT_ACEPTADO_BOLETA =
  '0 - La Boleta ha sido aceptada (simulación SUNAT)';

/** Base URL opcional para artefactos simulados (CDR/XML/PDF) */
export function getComprobanteSimuladoBaseUrl(): string {
  const base = process.env.COMPROBANTES_SIMULADO_BASE_URL?.trim();
  if (base) return base.replace(/\/$/, '');
  return '/api/comprobantes/simulado';
}

export function getRucEmisorComprobante(): string {
  const fromEnv = process.env.EMPRESA_RUC?.trim();
  if (fromEnv) return fromEnv;
  return EMPRESA_GUOR.ruc;
}
