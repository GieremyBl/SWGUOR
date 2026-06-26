import { prisma } from '@/lib/prisma';
import { reglaAplicaEnCompra } from '@/lib/helpers/promociones-catalogo.helper';
import { ESTADO_DESCUENTO_APLICACION } from '@/lib/constants/promociones';
import { roundMoney } from '@/lib/helpers/money.helper';

export interface EscalaPrecioProducto {
  cantidad_min: number;
  porcentaje_descuento: number;
  precio_unitario: number;
}

export interface EscalasPrecioProductoResultado {
  precio_base: number;
  escalas: EscalaPrecioProducto[];
}

function isVigenteCampana(inicio: Date, fin: Date | null, now: Date): boolean {
  if (inicio > now) return false;
  if (fin && fin < now) return false;
  return true;
}

function reglaVigenteEnCampanas(
  regla: {
    oferta_reglas: Array<{ ofertas: { activo: boolean; fecha_inicio: Date; fecha_fin: Date | null } }>;
    promocion_reglas: Array<{ promociones: { activo: boolean; fecha_inicio: Date; fecha_fin: Date | null } }>;
  },
  now: Date,
): boolean {
  const ofertasOk = regla.oferta_reglas.some(
    (or) => or.ofertas.activo && isVigenteCampana(or.ofertas.fecha_inicio, or.ofertas.fecha_fin, now),
  );
  const promosOk = regla.promocion_reglas.some(
    (pr) => pr.promociones.activo && isVigenteCampana(pr.promociones.fecha_inicio, pr.promociones.fecha_fin, now),
  );
  const tieneCampana = regla.oferta_reglas.length > 0 || regla.promocion_reglas.length > 0;
  if (tieneCampana) return ofertasOk || promosOk;
  return true;
}

/**
 * CUS_27 — escalas de precio por cantidad para UN producto, leídas desde la
 * matriz de `reglas_descuento` (mismo criterio de vigencia/alcance que usa
 * la matriz de descuentos del admin), para mostrarlas en el detalle del
 * producto antes de que el cliente decida cuánto comprar.
 */
export async function obtenerEscalasPrecioProducto(
  productoId: bigint,
): Promise<EscalasPrecioProductoResultado | null> {
  const producto = await prisma.productos.findUnique({
    where: { id: productoId },
    select: { id: true, precio: true, categoria_id: true },
  });

  if (!producto) return null;

  const now = new Date();
  const reglas = await prisma.reglas_descuento.findMany({
    where: { activo: true, fecha_inicio: { lte: now }, fecha_fin: { gte: now } },
    include: {
      descuento_aplicaciones: {
        where: { estado: { not: ESTADO_DESCUENTO_APLICACION.REVERTIDO } },
      },
      oferta_reglas: { include: { ofertas: true } },
      promocion_reglas: { include: { promociones: true } },
    },
  });

  const precioBase = Number(producto.precio);

  const escalas = reglas
    .filter((regla) => reglaVigenteEnCampanas(regla, now))
    .filter((regla) =>
      reglaAplicaEnCompra(
        { id: regla.id, descuento_aplicaciones: regla.descuento_aplicaciones },
        producto.id,
        producto.categoria_id,
      ),
    )
    .map((regla) => {
      const porcentaje = Number(regla.valor_descuento);
      return {
        cantidad_min: regla.cantidad_min,
        porcentaje_descuento: porcentaje,
        precio_unitario: roundMoney(precioBase * (1 - porcentaje / 100)),
      };
    })
    .sort((a, b) => a.cantidad_min - b.cantidad_min);

  return { precio_base: precioBase, escalas };
}
