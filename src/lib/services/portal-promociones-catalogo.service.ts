import { prisma } from '@/lib/prisma';
import { ESTADO_DESCUENTO_APLICACION } from '@/lib/constants/promociones';
import { reglaAplicaProductoCatalogo } from '@/lib/helpers/promociones-catalogo.helper';

export type TipoCampanaPortal = 'promocion' | 'oferta';

export interface CampanaCatalogoItem {
  key: string;
  tipo: TipoCampanaPortal;
  id: string;
  nombre: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  reglas_resumen: string[];
}

export interface ProductoCampanaBadge {
  tipo: TipoCampanaPortal;
  campana_id: string;
  campana_nombre: string;
  campana_descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  regla_nombre: string;
  valor_descuento: number;
  tipo_beneficio: string;
  prioridad: number;
}

function isVigenteInicioFin(
  inicio: Date,
  fin: Date | null,
  now: Date,
): boolean {
  if (inicio > now) return false;
  if (fin && fin < now) return false;
  return true;
}

function reglaVigente(
  regla: { activo: boolean | null; fecha_inicio: Date; fecha_fin: Date },
  now: Date,
): boolean {
  if (regla.activo === false) return false;
  return regla.fecha_inicio <= now && regla.fecha_fin >= now;
}

export async function obtenerCatalogoPromocionesPortal() {
  const now = new Date();

  const [promociones, ofertas, productos] = await Promise.all([
    prisma.promociones.findMany({
      where: { activo: true },
      include: {
        promocion_reglas: {
          orderBy: { prioridad: 'asc' },
          include: {
            reglas_descuento: {
              include: {
                descuento_aplicaciones: {
                  where: { estado: { not: ESTADO_DESCUENTO_APLICACION.REVERTIDO } },
                },
              },
            },
          },
        },
      },
    }),
    prisma.ofertas.findMany({
      where: { activo: true },
      include: {
        oferta_reglas: {
          orderBy: { prioridad: 'asc' },
          include: {
            reglas_descuento: {
              include: {
                descuento_aplicaciones: {
                  where: { estado: { not: ESTADO_DESCUENTO_APLICACION.REVERTIDO } },
                },
              },
            },
          },
        },
      },
    }),
    prisma.productos.findMany({
      where: { estado: 'activo' },
      select: { id: true, categoria_id: true },
    }),
  ]);

  const campanas: CampanaCatalogoItem[] = [];
  const productoBadges = new Map<string, ProductoCampanaBadge[]>();

  const addBadge = (productoId: bigint, badge: ProductoCampanaBadge) => {
    const key = String(productoId);
    const list = productoBadges.get(key) ?? [];
    const dup = list.some(
      (b) => b.tipo === badge.tipo && b.campana_id === badge.campana_id,
    );
    if (!dup) list.push(badge);
    productoBadges.set(key, list);
  };

  for (const promo of promociones) {
    if (!isVigenteInicioFin(promo.fecha_inicio, promo.fecha_fin, now)) continue;

    const reglasValidas = promo.promocion_reglas.filter((pr) =>
      reglaVigente(pr.reglas_descuento, now),
    );
    if (reglasValidas.length === 0) continue;

    const campanaId = String(promo.id);
    campanas.push({
      key: `promocion-${campanaId}`,
      tipo: 'promocion',
      id: campanaId,
      nombre: promo.nombre,
      descripcion: promo.descripcion,
      fecha_inicio: promo.fecha_inicio.toISOString(),
      fecha_fin: promo.fecha_fin?.toISOString() ?? null,
      reglas_resumen: reglasValidas.map(
        (pr) =>
          `${pr.reglas_descuento.nombre} (${Number(pr.reglas_descuento.valor_descuento)}%)`,
      ),
    });

    for (const producto of productos) {
      const match = reglasValidas.some((pr) =>
        reglaAplicaProductoCatalogo(
          pr.reglas_descuento,
          producto.id,
          producto.categoria_id,
        ),
      );
      if (!match) continue;

      const mejor = reglasValidas.find((pr) =>
        reglaAplicaProductoCatalogo(
          pr.reglas_descuento,
          producto.id,
          producto.categoria_id,
        ),
      );
      if (!mejor) continue;

      addBadge(producto.id, {
        tipo: 'promocion',
        campana_id: campanaId,
        campana_nombre: promo.nombre,
        campana_descripcion: promo.descripcion,
        fecha_inicio: promo.fecha_inicio.toISOString(),
        fecha_fin: promo.fecha_fin?.toISOString() ?? null,
        regla_nombre: mejor.reglas_descuento.nombre,
        valor_descuento: Number(mejor.reglas_descuento.valor_descuento),
        tipo_beneficio: mejor.reglas_descuento.tipo_beneficio,
        prioridad: mejor.prioridad,
      });
    }
  }

  for (const oferta of ofertas) {
    if (!isVigenteInicioFin(oferta.fecha_inicio, oferta.fecha_fin, now)) continue;

    const reglasValidas = oferta.oferta_reglas.filter((or) =>
      reglaVigente(or.reglas_descuento, now),
    );
    if (reglasValidas.length === 0) continue;

    const campanaId = String(oferta.id);
    campanas.push({
      key: `oferta-${campanaId}`,
      tipo: 'oferta',
      id: campanaId,
      nombre: oferta.nombre,
      descripcion: oferta.descripcion,
      fecha_inicio: oferta.fecha_inicio.toISOString(),
      fecha_fin: oferta.fecha_fin?.toISOString() ?? null,
      reglas_resumen: reglasValidas.map(
        (or) =>
          `${or.reglas_descuento.nombre} (${Number(or.reglas_descuento.valor_descuento)}%)`,
      ),
    });

    for (const producto of productos) {
      const match = reglasValidas.some((or) =>
        reglaAplicaProductoCatalogo(
          or.reglas_descuento,
          producto.id,
          producto.categoria_id,
        ),
      );
      if (!match) continue;

      const mejor = reglasValidas.find((or) =>
        reglaAplicaProductoCatalogo(
          or.reglas_descuento,
          producto.id,
          producto.categoria_id,
        ),
      );
      if (!mejor) continue;

      addBadge(producto.id, {
        tipo: 'oferta',
        campana_id: campanaId,
        campana_nombre: oferta.nombre,
        campana_descripcion: oferta.descripcion,
        fecha_inicio: oferta.fecha_inicio.toISOString(),
        fecha_fin: oferta.fecha_fin?.toISOString() ?? null,
        regla_nombre: mejor.reglas_descuento.nombre,
        valor_descuento: Number(mejor.reglas_descuento.valor_descuento),
        tipo_beneficio: mejor.reglas_descuento.tipo_beneficio,
        prioridad: mejor.prioridad,
      });
    }
  }

  campanas.sort((a, b) => a.nombre.localeCompare(b.nombre));

  const productosRecord: Record<string, ProductoCampanaBadge[]> = {};
  productoBadges.forEach((badges, id) => {
    productosRecord[id] = badges.sort((a, b) => a.prioridad - b.prioridad);
  });

  return { campanas, productos: productosRecord };
}
