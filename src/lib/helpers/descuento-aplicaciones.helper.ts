import {
  APLICABLE_DESCUENTO,
  ENTIDAD_DESCUENTO,
  ESTADO_DESCUENTO_APLICACION,
  type AlcanceCampanaValue,
} from '@/lib/constants/promociones';

/** Valores permitidos por CHECK constraint en PostgreSQL */
export const APLICABLE_TIPO_DB = [
  APLICABLE_DESCUENTO.COTIZACION,
  APLICABLE_DESCUENTO.PEDIDO,
] as const;

export type AplicableTipoDb = (typeof APLICABLE_TIPO_DB)[number];

const ALCANCE_DESCRIPCION_PREFIX = 'alcance:';

export function buildDescripcionAlcance(
  alcance: AlcanceCampanaValue,
  detalle?: string,
): string {
  const base = `${ALCANCE_DESCRIPCION_PREFIX}${alcance}`;
  return detalle ? `${base} — ${detalle}` : base;
}

export function parseAlcanceDescripcion(descripcion: string | null | undefined): AlcanceCampanaValue | null {
  if (!descripcion) return null;
  const match = descripcion.match(
    new RegExp(`^${ALCANCE_DESCRIPCION_PREFIX}(catalogo|categoria|producto)`),
  );
  if (!match) return null;
  return match[1] as AlcanceCampanaValue;
}

/**
 * Normaliza aplicable_tipo al CHECK de descuento_aplicaciones.
 * Alcance de campaña (catálogo/categoría/producto) se persiste como 'cotizacion'
 * con el alcance real en descripcion (alcance:...).
 */
export function normalizarAplicableTipo(
  value: string | null | undefined,
  alcance?: AlcanceCampanaValue,
): AplicableTipoDb {
  const normalized = (value ?? '').trim().toLowerCase();

  if (APLICABLE_TIPO_DB.includes(normalized as AplicableTipoDb)) {
    return normalized as AplicableTipoDb;
  }

  if (
    alcance === 'catalogo' ||
    alcance === 'categoria' ||
    alcance === 'producto' ||
    normalized === ENTIDAD_DESCUENTO.GLOBAL ||
    normalized === ENTIDAD_DESCUENTO.CATALOGO ||
    normalized === ENTIDAD_DESCUENTO.CATEGORIA ||
    normalized === ENTIDAD_DESCUENTO.PRODUCTO
  ) {
    return APLICABLE_DESCUENTO.COTIZACION;
  }

  return APLICABLE_DESCUENTO.COTIZACION;
}

export function normalizarEstadoDescuento(
  value: string | null | undefined,
): string {
  const normalized = (value ?? '').trim().toLowerCase();

  if (normalized === ESTADO_DESCUENTO_APLICACION.REVERTIDO) {
    return ESTADO_DESCUENTO_APLICACION.REVERTIDO;
  }

  if (
    normalized === ESTADO_DESCUENTO_APLICACION.APLICADO ||
    normalized === 'activo' ||
    !normalized
  ) {
    return ESTADO_DESCUENTO_APLICACION.APLICADO;
  }

  return ESTADO_DESCUENTO_APLICACION.APLICADO;
}

export function resolverAlcanceAplicacion(input: {
  alcance: AlcanceCampanaValue;
  categoriaId?: bigint | null;
  productoId?: bigint | null;
}): {
  aplicable_tipo: AplicableTipoDb;
  aplicable_id: bigint;
  descripcion: string;
  alcance: AlcanceCampanaValue;
} {
  if (input.alcance === 'producto' && input.productoId) {
    return {
      alcance: 'producto',
      aplicable_tipo: normalizarAplicableTipo(ENTIDAD_DESCUENTO.PRODUCTO, 'producto'),
      aplicable_id: input.productoId,
      descripcion: buildDescripcionAlcance('producto', 'Alcance por producto específico'),
    };
  }

  if (input.alcance === 'categoria' && input.categoriaId) {
    return {
      alcance: 'categoria',
      aplicable_tipo: normalizarAplicableTipo(ENTIDAD_DESCUENTO.CATEGORIA, 'categoria'),
      aplicable_id: input.categoriaId,
      descripcion: buildDescripcionAlcance('categoria', 'Alcance por categoría'),
    };
  }

  return {
    alcance: 'catalogo',
    aplicable_tipo: normalizarAplicableTipo(ENTIDAD_DESCUENTO.CATALOGO, 'catalogo'),
    aplicable_id: BigInt(0),
    descripcion: buildDescripcionAlcance('catalogo', 'Alcance catálogo completo'),
  };
}

export function inferirAlcanceDesdeAplicacion(app: {
  aplicable_tipo: string;
  aplicable_id: bigint | number | string;
  descripcion?: string | null;
  estado: string;
}): {
  alcance: AlcanceCampanaValue;
  categoria_id: string | number | null;
  producto_id: string | number | null;
} | null {
  if (app.estado === ESTADO_DESCUENTO_APLICACION.REVERTIDO) return null;

  const desdeDescripcion = parseAlcanceDescripcion(app.descripcion);
  if (desdeDescripcion) {
    if (desdeDescripcion === 'producto') {
      return {
        alcance: 'producto',
        categoria_id: null,
        producto_id: String(app.aplicable_id),  // ✅ Convert to string
      };
    }
    if (desdeDescripcion === 'categoria') {
      return {
        alcance: 'categoria',
        categoria_id: String(app.aplicable_id),  // ✅ Convert to string
        producto_id: null,
      };
    }
    return { alcance: 'catalogo', categoria_id: null, producto_id: null };
  }

  const tipo = app.aplicable_tipo.trim().toLowerCase();
  if (tipo === ENTIDAD_DESCUENTO.PRODUCTO) {
    return {
      alcance: 'producto',
      categoria_id: null,
      producto_id: String(app.aplicable_id),  // ✅ Convert to string
    };
  }
  if (tipo === ENTIDAD_DESCUENTO.CATEGORIA) {
    return {
      alcance: 'categoria',
      categoria_id: String(app.aplicable_id),  // ✅ Convert to string
      producto_id: null,
    };
  }
  if (
    tipo === ENTIDAD_DESCUENTO.GLOBAL ||
    tipo === ENTIDAD_DESCUENTO.CATALOGO
  ) {
    return { alcance: 'catalogo', categoria_id: null, producto_id: null };
  }

  return { alcance: 'catalogo', categoria_id: null, producto_id: null };
}