import { inferirAlcanceDesdeAplicacion } from '@/lib/helpers/descuento-aplicaciones.helper';
import type {
  CampanaConEscalasForm,
  CampanaRow,
  ReglaDescuentoRow,
} from '@/lib/schemas/promociones-ofertas';

type VinculoDetalle = {
  regla_id: number | string;
  prioridad: number;
  reglas_descuento?: ReglaDescuentoRow;
};

type CampanaDetalle = CampanaRow & {
  promocion_reglas?: VinculoDetalle[];
  oferta_reglas?: VinculoDetalle[];
};

function inferirAlcance(regla?: ReglaDescuentoRow): {
  alcance: CampanaConEscalasForm['alcance'];
  categoria_id: string | number | null;
  producto_id: string | number | null;
} {
  if (!regla) {
    return { alcance: 'catalogo', categoria_id: null, producto_id: null };
  }

  const apps = regla.descuento_aplicaciones ?? [];
  const appActiva = apps.find(
    (a) => inferirAlcanceDesdeAplicacion(a) !== null,
  );

  if (!appActiva) {
    return { alcance: 'catalogo', categoria_id: null, producto_id: null };
  }

  const alcanceInfo = inferirAlcanceDesdeAplicacion(appActiva);
  if (!alcanceInfo) {
    return { alcance: 'catalogo', categoria_id: null, producto_id: null };
  }

  return {
    alcance: alcanceInfo.alcance,
    categoria_id: alcanceInfo.categoria_id,
    producto_id: alcanceInfo.producto_id,
  };
}

export function emptyCampanaConEscalasForm(): CampanaConEscalasForm {
  return {
    nombre: '',
    descripcion: '',
    activo: true,
    fecha_inicio: new Date().toISOString(),
    fecha_fin: null,
    alcance: 'catalogo',
    categoria_id: null,
    producto_id: null,
    escalas: [{ cantidad_min: 400, valor_descuento: 5 }],
  };
}

export function mapCampanaDetalleToForm(data: CampanaDetalle): CampanaConEscalasForm {
  const vinculos = data.promocion_reglas ?? data.oferta_reglas ?? [];
  const primeraRegla = vinculos[0]?.reglas_descuento;
  const alcanceInfo = inferirAlcance(primeraRegla);

  return {
    id: data.id,
    nombre: data.nombre,
    descripcion: data.descripcion,
    activo: data.activo,
    fecha_inicio: data.fecha_inicio,
    fecha_fin: data.fecha_fin,
    alcance: alcanceInfo.alcance,
    categoria_id: alcanceInfo.categoria_id,
    producto_id: alcanceInfo.producto_id,
    escalas: vinculos.map((v) => ({
      id: v.reglas_descuento?.id ?? v.regla_id,
      cantidad_min: v.reglas_descuento?.cantidad_min ?? 1,
      valor_descuento: Number(v.reglas_descuento?.valor_descuento ?? 0),
    })),
  };
}
