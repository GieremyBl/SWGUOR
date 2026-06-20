/** Tipos de vía habituales en direcciones (LatAm y uso internacional) */
export const TIPOS_VIA_DIRECCION = [
  { value: 'avenida', label: 'Avenida' },
  { value: 'calle', label: 'Calle' },
  { value: 'jiron', label: 'Jirón' },
  { value: 'pasaje', label: 'Pasaje' },
  { value: 'carretera', label: 'Carretera' },
  { value: 'boulevard', label: 'Boulevard' },
  { value: 'camino', label: 'Camino' },
  { value: 'plaza', label: 'Plaza' },
  { value: 'via', label: 'Vía' },
  { value: 'ruta', label: 'Ruta' },
  { value: 'otro', label: 'Otro' },
] as const;

/** Referencias de ubicación para facilitar la entrega */
export const TIPOS_REFERENCIA_ENTREGA = [
  { value: 'frente_a', label: 'Frente a' },
  { value: 'al_costado', label: 'Al costado de' },
  { value: 'cerca_de', label: 'Cerca de' },
  { value: 'entre_calles', label: 'Entre calles' },
  { value: 'edificio', label: 'Edificio / torre' },
  { value: 'centro_comercial', label: 'Centro comercial' },
  { value: 'parque_industrial', label: 'Parque industrial' },
  { value: 'zona_industrial', label: 'Zona industrial' },
  { value: 'urbanizacion', label: 'Urbanización' },
  { value: 'condominio', label: 'Condominio' },
  { value: 'sin_referencia', label: 'Sin referencia adicional' },
] as const;

export type TipoViaDireccion = (typeof TIPOS_VIA_DIRECCION)[number]['value'];
export type TipoReferenciaEntrega = (typeof TIPOS_REFERENCIA_ENTREGA)[number]['value'];

export const PAIS_DEFAULT_ENTREGA = 'PE';

export interface EtiquetasUbicacionPais {
  region: string;
  subregion: string;
  localidad: string;
}

const ETIQUETAS_POR_PAIS: Record<string, EtiquetasUbicacionPais> = {
  PE: { region: 'Departamento', subregion: 'Provincia', localidad: 'Distrito' },
  US: { region: 'Estado', subregion: 'Condado', localidad: 'Ciudad' },
  MX: { region: 'Estado', subregion: 'Municipio', localidad: 'Colonia / Ciudad' },
  BR: { region: 'Estado', subregion: 'Municipio', localidad: 'Ciudad' },
  AR: { region: 'Provincia', subregion: 'Partido', localidad: 'Localidad' },
  CO: { region: 'Departamento', subregion: 'Municipio', localidad: 'Ciudad' },
  CL: { region: 'Región', subregion: 'Provincia', localidad: 'Comuna' },
  EC: { region: 'Provincia', subregion: 'Cantón', localidad: 'Parroquia' },
};

const ETIQUETAS_DEFAULT: EtiquetasUbicacionPais = {
  region: 'Estado / Región',
  subregion: 'Provincia / Municipio',
  localidad: 'Ciudad / Distrito',
};

export function obtenerEtiquetasUbicacionPais(paisCode: string): EtiquetasUbicacionPais {
  return ETIQUETAS_POR_PAIS[paisCode] ?? ETIQUETAS_DEFAULT;
}

export function etiquetaTipoVia(value: string): string {
  return TIPOS_VIA_DIRECCION.find((t) => t.value === value)?.label ?? value;
}

export function etiquetaTipoReferencia(value: string): string {
  return TIPOS_REFERENCIA_ENTREGA.find((t) => t.value === value)?.label ?? value;
}
