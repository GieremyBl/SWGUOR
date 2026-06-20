import { prisma } from '@/lib/prisma';
import { reglaAplicaProductoCatalogo } from '@/lib/helpers/promociones-catalogo.helper';
import { FUENTE_DESCUENTO, ESTADO_DESCUENTO_APLICACION } from '@/lib/constants/promociones';

export interface DescuentoActivoMatriz {
  regla_id: string;
  label: string;
  valor_descuento: number;
  cantidad_min: number;
  fuente_tipo: string | null;
  fuente_nombre: string | null;
}

export interface MatrizProductoRow {
  id: string;
  sku: string;
  nombre: string;
  categoria: string | null;
  precio_base: number;
  descuentos: DescuentoActivoMatriz[];
  precio_final_estimado: number;
  tiene_colision: boolean;
}

function isVigenteCampana(
  inicio: Date,
  fin: Date | null,
  now: Date,
): boolean {
  if (inicio > now) return false;
  if (fin && fin < now) return false;
  return true;
}

function reglaVigenteEnCampanas(
  regla: {
    oferta_reglas: Array<{
      ofertas: { activo: boolean; fecha_inicio: Date; fecha_fin: Date | null; nombre: string };
    }>;
    promocion_reglas: Array<{
      promociones: { activo: boolean; fecha_inicio: Date; fecha_fin: Date | null; nombre: string };
    }>;
  },
  now: Date,
): boolean {
  const ofertasOk = regla.oferta_reglas.some(
    (or) =>
      or.ofertas.activo &&
      isVigenteCampana(or.ofertas.fecha_inicio, or.ofertas.fecha_fin, now),
  );
  const promosOk = regla.promocion_reglas.some(
    (pr) =>
      pr.promociones.activo &&
      isVigenteCampana(pr.promociones.fecha_inicio, pr.promociones.fecha_fin, now),
  );

  const tieneCampana =
    regla.oferta_reglas.length > 0 || regla.promocion_reglas.length > 0;

  if (tieneCampana) return ofertasOk || promosOk;
  return true;
}

function fuenteCampana(
  regla: {
    oferta_reglas: Array<{
      ofertas: {
        activo: boolean;
        nombre: string;
        fecha_inicio: Date;
        fecha_fin: Date | null;
      };
    }>;
    promocion_reglas: Array<{
      promociones: {
        activo: boolean;
        nombre: string;
        fecha_inicio: Date;
        fecha_fin: Date | null;
      };
    }>;
  },
  now: Date,
): { tipo: string; nombre: string } | null {
  const oferta = regla.oferta_reglas.find(
    (or) =>
      or.ofertas.activo &&
      isVigenteCampana(or.ofertas.fecha_inicio, or.ofertas.fecha_fin, now),
  );
  if (oferta) {
    return { tipo: FUENTE_DESCUENTO.OFERTA, nombre: oferta.ofertas.nombre };
  }

  const promo = regla.promocion_reglas.find(
    (pr) =>
      pr.promociones.activo &&
      isVigenteCampana(pr.promociones.fecha_inicio, pr.promociones.fecha_fin, now),
  );
  if (promo) {
    return { tipo: FUENTE_DESCUENTO.PROMOCION, nombre: promo.promociones.nombre };
  }

  return null;
}

function buildBadgeLabel(
  regla: { cantidad_min: number; valor_descuento: unknown; nombre: string },
  fuente: { tipo: string; nombre: string } | null,
): string {
  const pct = Number(regla.valor_descuento);
  if (fuente?.tipo === FUENTE_DESCUENTO.OFERTA) {
    return `Oferta ${fuente.nombre} = -${pct}%`;
  }
  if (fuente?.tipo === FUENTE_DESCUENTO.PROMOCION) {
    return `Promoción ${fuente.nombre} = -${pct}%`;
  }
  return `Volumen: >${regla.cantidad_min} un. = -${pct}%`;
}

export async function obtenerMatrizDescuentos(busqueda?: string): Promise<MatrizProductoRow[]> {
  const now = new Date();

  const productos = await prisma.productos.findMany({
    where: {
      estado: 'activo',
      ...(busqueda
        ? {
            OR: [
              { nombre: { contains: busqueda, mode: 'insensitive' } },
              { sku: { contains: busqueda, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      sku: true,
      nombre: true,
      precio: true,
      categoria_id: true,
      categorias_productos: { select: { nombre: true } },
    },
    orderBy: { nombre: 'asc' },
  });

  const reglas = await prisma.reglas_descuento.findMany({
    where: {
      activo: true,
      fecha_inicio: { lte: now },
      fecha_fin: { gte: now },
    },
    include: {
      descuento_aplicaciones: {
        where: { estado: { not: ESTADO_DESCUENTO_APLICACION.REVERTIDO } },
      },
      oferta_reglas: { include: { ofertas: true } },
      promocion_reglas: { include: { promociones: true } },
    },
  });

  const reglasVigentes = reglas.filter((r) => reglaVigenteEnCampanas(r, now));

  return productos.map((producto) => {
    const aplicables = reglasVigentes.filter((regla) =>
      reglaAplicaProductoCatalogo(
        {
          id: regla.id,
          descuento_aplicaciones: regla.descuento_aplicaciones,
        },
        producto.id,
        producto.categoria_id,
      ),
    );

    const descuentos: DescuentoActivoMatriz[] = aplicables.map((regla) => {
      const fuente = fuenteCampana(regla, now);
      return {
        regla_id: String(regla.id),
        label: buildBadgeLabel(regla, fuente),
        valor_descuento: Number(regla.valor_descuento),
        cantidad_min: regla.cantidad_min,
        fuente_tipo: fuente?.tipo ?? null,
        fuente_nombre: fuente?.nombre ?? null,
      };
    });

    const precioBase = Number(producto.precio);
    const totalPct = Math.min(
      descuentos.reduce((sum, d) => sum + d.valor_descuento, 0),
      100,
    );
    const precioFinal = precioBase * (1 - totalPct / 100);

    return {
      id: String(producto.id),
      sku: producto.sku,
      nombre: producto.nombre,
      categoria: producto.categorias_productos?.nombre ?? null,
      precio_base: precioBase,
      descuentos,
      precio_final_estimado: precioFinal,
      tiene_colision: descuentos.length > 2,
    };
  });
}
