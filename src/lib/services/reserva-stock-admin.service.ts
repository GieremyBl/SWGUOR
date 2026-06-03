import { prisma } from '@/lib/prisma';
import { reservaStockService } from '@/lib/services/reserva-stock.service';

export type ReservaStockMonitorRow = {
  id: string;
  productoNombre: string;
  varianteLabel: string;
  sku: string | null;
  cantidad: number;
  pedidoId: string | null;
  pedidoEstado: string | null;
  cotizacionId: string | null;
  cotizacionNumero: string | null;
  expiraEn: string;
  estaVencida: boolean;
};

export async function listarReservasActivasAdmin(): Promise<ReservaStockMonitorRow[]> {
  const ahora = new Date();

  const reservas = await prisma.reservas_stock.findMany({
    where: { estado: 'activa' },
    include: {
      pedidos: {
        select: { id: true, estado: true },
      },
      cotizaciones: {
        select: { id: true, numero: true, estado: true },
      },
      variantes_producto: {
        select: {
          color: true,
          talla: true,
          sku: true,
          productos: {
            select: { nombre: true, sku: true },
          },
        },
      },
    },
    orderBy: [{ expira_en: 'asc' }, { id: 'desc' }],
  });

  return reservas.map((r) => {
    const producto = r.variantes_producto?.productos;
    const expira = r.expira_en;

    return {
      id: String(r.id),
      productoNombre: producto?.nombre ?? 'Producto sin nombre',
      varianteLabel: `${r.variantes_producto?.color ?? '—'} · ${r.variantes_producto?.talla ?? '—'}`,
      sku: r.variantes_producto?.sku ?? producto?.sku ?? null,
      cantidad: r.cantidad,
      pedidoId: r.pedido_id ? String(r.pedido_id) : null,
      pedidoEstado: r.pedidos?.estado ?? null,
      cotizacionId: r.cotizacion_id ? String(r.cotizacion_id) : null,
      cotizacionNumero: r.cotizaciones?.numero ?? null,
      expiraEn: expira.toISOString(),
      estaVencida: expira < ahora,
    };
  });
}

export async function liberarReservaStockAdmin(id: bigint) {
  return reservaStockService.cancelar(id);
}
