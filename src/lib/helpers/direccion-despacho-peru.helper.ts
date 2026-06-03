import { normalizarUbigeoTexto } from '@/lib/helpers/peru-ubigeo.helper';

export interface DireccionDespachoPartes {
  ubicacionExacta: string;
  departamento: string;
  provincia: string;
  distrito: string;
}

export function componerDireccionDespachoPeru(
  partes: DireccionDespachoPartes,
): string {
  const exacta = partes.ubicacionExacta.trim();
  const distrito = partes.distrito.trim();
  const provincia = partes.provincia.trim();
  const departamento = partes.departamento.trim();

  return `${exacta}, ${distrito}, ${provincia}, ${departamento}`;
}

export function parsearDireccionDespachoPeru(
  texto: string | null | undefined,
): DireccionDespachoPartes {
  const raw = (texto ?? '').trim();
  if (!raw) {
    return {
      ubicacionExacta: '',
      departamento: '',
      provincia: '',
      distrito: '',
    };
  }

  const partes = raw.split(',').map((p) => p.trim()).filter(Boolean);

  if (partes.length >= 4) {
    return {
      ubicacionExacta: partes.slice(0, -3).join(', '),
      distrito: partes[partes.length - 3] ?? '',
      provincia: partes[partes.length - 2] ?? '',
      departamento: partes[partes.length - 1] ?? '',
    };
  }

  return {
    ubicacionExacta: raw,
    departamento: '',
    provincia: '',
    distrito: '',
  };
}

export function validarPartesDireccionDespachoPeru(
  partes: DireccionDespachoPartes,
): string | null {
  if (partes.ubicacionExacta.trim().length < 5) {
    return 'Indique calle, número y referencia de la ubicación exacta (mín. 5 caracteres).';
  }

  if (!partes.departamento.trim()) {
    return 'Seleccione el departamento.';
  }

  if (!partes.provincia.trim()) {
    return 'Seleccione la provincia.';
  }

  if (!partes.distrito.trim()) {
    return 'Seleccione el distrito.';
  }

  return null;
}

export function esDireccionDespachoPeruValida(texto: string): boolean {
  const partes = parsearDireccionDespachoPeru(texto);
  return validarPartesDireccionDespachoPeru(partes) === null;
}

export function formatearVistaDireccionDespacho(texto: string | null | undefined): string {
  const partes = parsearDireccionDespachoPeru(texto);
  if (!partes.departamento) return (texto ?? '').trim();

  return componerDireccionDespachoPeru(partes);
}

export function coincidenNombresUbigeo(a: string, b: string): boolean {
  return normalizarUbigeoTexto(a) === normalizarUbigeoTexto(b);
}
