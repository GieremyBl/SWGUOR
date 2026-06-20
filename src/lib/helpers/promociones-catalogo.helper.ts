import { ESTADO_DESCUENTO_APLICACION } from '@/lib/constants/promociones';
import {
  inferirAlcanceDesdeAplicacion,
  parseAlcanceDescripcion,
} from '@/lib/helpers/descuento-aplicaciones.helper';

type ReglaAlcance = {
  id?: bigint;
  descuento_aplicaciones?: Array<{
    aplicable_tipo: string;
    aplicable_id: bigint;
    estado: string;
    descripcion?: string | null;
  }>;
};

export function reglaAplicaProductoCatalogo(
  regla: ReglaAlcance,
  productoId: bigint,
  categoriaId: bigint | null,
): boolean {
  return reglaAplicaEnCompra(regla, productoId, categoriaId);
}

/** CUS_27 — alcance por producto, categoría o catálogo vía descuento_aplicaciones */
export function reglaAplicaEnCompra(
  regla: ReglaAlcance,
  productoId: bigint,
  categoriaId: bigint | null,
): boolean {
  const apps =
    regla.descuento_aplicaciones?.filter(
      (a) => a.estado !== ESTADO_DESCUENTO_APLICACION.REVERTIDO,
    ) ?? [];

  if (apps.length === 0) return true;

  return apps.some((app) => {
    const alcance =
      parseAlcanceDescripcion(app.descripcion) ??
      inferirAlcanceDesdeAplicacion(app)?.alcance ??
      'catalogo';

    if (alcance === 'producto') {
      return BigInt(app.aplicable_id) === productoId;
    }
    if (alcance === 'categoria') {
      if (!categoriaId) return false;
      return BigInt(app.aplicable_id) === categoriaId;
    }
    return true;
  });
}
