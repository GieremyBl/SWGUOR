'use client';

import Link from 'next/link';
import { ArrowLeft, Palette } from 'lucide-react';
import type { DetallePedidoData } from '@/components/admin/pedidos/detalles/types';
import { PedidoDetalleLectura } from './PedidoDetalleLectura';
import { FichaTecnicaDisenadorForm, type FichaTecnicaData } from './FichaTecnicaDisenadorForm';

export interface ProductoConFicha {
  productoId: string;
  nombre: string;
  sku: string | null;
  ficha: FichaTecnicaData | null;
}

interface Props {
  pedido: DetallePedidoData;
  productos: ProductoConFicha[];
  progresoFichas: { total: number; aprobadas: number; todasAprobadas: boolean };
  pedidoBloqueado: boolean;
}

export function DisenadorPedidoWorkspace({
  pedido,
  productos,
  progresoFichas,
  pedidoBloqueado,
}: Props) {
  return (
    <div className="max-w-[96rem] mx-auto px-4 py-6 space-y-6">
      <div>
        <Link
          href="/admin/Panel-Administrativo/pedidos"
          className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-violet-600 hover:opacity-80 mb-3"
        >
          <ArrowLeft size={13} /> Volver a pedidos
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-600 text-white shadow-sm">
            <Palette size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Diseño — Pedido #{pedido.id}
            </h1>
            <p className="text-sm text-stone-500 font-medium">
              Revise el pedido y complete la ficha técnica por producto
            </p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">
          Detalle del pedido (solo lectura)
        </h2>
        <PedidoDetalleLectura pedido={pedido} />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
            Fichas técnicas por producto
          </h2>
          <span
            className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
              progresoFichas.todasAprobadas
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-violet-100 text-violet-800'
            }`}
          >
            {progresoFichas.aprobadas}/{progresoFichas.total} aprobadas
          </span>
        </div>

        {pedidoBloqueado && (
          <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 font-medium">
            Todas las fichas están aprobadas. El pedido está en{' '}
            <strong>{pedido.estado?.replace(/_/g, ' ') ?? 'producción'}</strong> y no
            admite más cambios en las fichas.
          </p>
        )}
        {productos.length === 0 ? (
          <p className="text-sm text-stone-500 py-8 text-center border border-dashed rounded-xl">
            Este pedido no tiene productos asociados.
          </p>
        ) : (
          productos.map((p) => (
            <FichaTecnicaDisenadorForm
              key={p.productoId}
              pedidoId={pedido.id}
              productoId={p.productoId}
              productoNombre={p.nombre}
              fichaInicial={p.ficha}
              pedidoBloqueado={pedidoBloqueado}
            />
          ))
        )}
      </section>
    </div>
  );
}
