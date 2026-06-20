import { TIPOS_VIA_DIRECCION } from '@/lib/constants/direccion-entrega';
import type { DatosEntregaPago } from '@/lib/schemas/datos-entrega-pago';
import {
  datosPagadorPagoSchema,
  type DatosPagadorCheckout,
  type DatosPagadorPago,
} from '@/lib/schemas/datos-pagador-pago';

export interface SugerenciasDatosPagador {
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  usuarioId?: number;
  direccion?: string;
  ubicacion?: string;
  countryCode?: string;
}

export function validarDatosPagadorPago(
  datos: DatosPagadorPago,
): { valido: boolean; mensaje?: string } {
  const parsed = datosPagadorPagoSchema.safeParse(datos);
  if (parsed.success) return { valido: true };
  return {
    valido: false,
    mensaje: parsed.error.issues[0]?.message ?? 'Completa los datos del pagador',
  };
}

export function buildDatosPagadorIniciales(
  sugerencias?: SugerenciasDatosPagador,
): DatosPagadorPago {
  return {
    nombres: sugerencias?.nombres?.trim() ?? '',
    apellidos: sugerencias?.apellidos?.trim() ?? '',
    telefono: sugerencias?.telefono?.trim() ?? '',
    usuarioId: sugerencias?.usuarioId,
    direccion: sugerencias?.direccion?.trim() ?? '',
    ubicacion: sugerencias?.ubicacion?.trim() ?? '',
    countryCode: sugerencias?.countryCode ?? 'PE',
  };
}

/** Separa razón social en nombres / apellidos (heurística simple). */
export function splitRazonSocialParaPagador(razonSocial?: string | null): {
  nombres: string;
  apellidos: string;
} {
  const partes = (razonSocial ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) {
    return { nombres: '', apellidos: '' };
  }

  if (partes.length === 1) {
    return { nombres: partes[0], apellidos: partes[0] };
  }

  return {
    nombres: partes[0],
    apellidos: partes.slice(1).join(' '),
  };
}

function labelTipoVia(tipoVia: string): string {
  const found = TIPOS_VIA_DIRECCION.find((t) => t.value === tipoVia);
  return found?.label ?? tipoVia;
}

export function formatDireccionEntregaTexto(datos: DatosEntregaPago): string {
  const via = labelTipoVia(datos.tipoVia);
  const base = [via, datos.nombreVia.trim(), datos.numero?.trim()]
    .filter(Boolean)
    .join(' ');

  if (datos.tipoReferencia !== 'sin_referencia' && datos.referenciaDetalle?.trim()) {
    return `${base} (${datos.referenciaDetalle.trim()})`;
  }

  return base;
}

export function toDatosPagadorCheckoutPayload(
  datos: DatosPagadorPago,
): DatosPagadorCheckout {
  return {
    pagador_nombres: datos.nombres.trim(),
    pagador_apellidos: datos.apellidos.trim(),
    pagador_telefono: datos.telefono.trim(),
    pagador_usuario_id: datos.usuarioId,
    pagador_direccion: datos.direccion.trim(),
    pagador_ubicacion: datos.ubicacion.trim(),
    pagador_country_code: datos.countryCode,
  };
}

export interface CulqiAntifraudDetails {
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  address_city: string;
  country_code: string;
}

export function toCulqiAntifraudDetails(
  datos: DatosPagadorCheckout,
): CulqiAntifraudDetails {
  return {
    first_name: datos.pagador_nombres,
    last_name: datos.pagador_apellidos,
    phone_number: datos.pagador_telefono.replace(/\D/g, ''),
    address: datos.pagador_direccion,
    address_city: datos.pagador_ubicacion,
    country_code: (datos.pagador_country_code ?? 'PE').toUpperCase(),
  };
}

export function appendDatosPagadorEnNotas(
  notasBase: string,
  datos: DatosPagadorCheckout,
): string {
  const nombre = `${datos.pagador_nombres} ${datos.pagador_apellidos}`.trim();
  const extras = [
    nombre ? `titular=${nombre}` : null,
    datos.pagador_telefono ? `tel=${datos.pagador_telefono}` : null,
    datos.pagador_usuario_id ? `usuario_id=${datos.pagador_usuario_id}` : null,
    datos.pagador_direccion ? `dir=${datos.pagador_direccion}` : null,
    datos.pagador_ubicacion ? `ubic=${datos.pagador_ubicacion}` : null,
  ].filter(Boolean);

  if (extras.length === 0) return notasBase;
  return `${notasBase} | ${extras.join(' | ')}`;
}
