'use client';

import Link from 'next/link';
import { ArrowLeft, MapPin, Truck } from 'lucide-react';
import { labelEstado } from '@/lib/helpers/despachos-helpers';

interface Props {
  pedidoId: string;
  despacho: {
    id: string;
    estado: string;
    direccion_entrega: string;
  };
}

export function PedidoEntregaPendienteRuta({ pedidoId, despacho }: Props) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <Link
          href={`/admin/Panel-Administrativo/pedidos/${pedidoId}`}
          className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-violet-600 hover:opacity-80 mb-3"
        >
          <ArrowLeft size={13} /> Volver al pedido
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-sm">
            <Truck size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Entrega — Pedido #{pedidoId}
            </h1>
            <p className="text-sm text-stone-500">
              Despacho #{despacho.id} · {labelEstado(despacho.estado)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3">
        <p className="text-sm font-bold text-amber-900 flex items-center gap-2">
          <MapPin size={16} />
          El paquete aún no ha salido de la fábrica
        </p>
        <p className="text-sm text-amber-800">
          Las cajas están listas ({labelEstado('preparando')}), pero debe iniciar la ruta del
          transportista antes de registrar el acta de entrega y las fotos.
        </p>
        <p className="text-xs text-amber-700">Dirección: {despacho.direccion_entrega}</p>
        <Link
          href="/admin/Panel-Administrativo/despachos"
          className="inline-flex items-center justify-center rounded-lg bg-amber-600 text-white px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-amber-700"
        >
          Ir a gestión de despachos
        </Link>
      </div>
    </div>
  );
}
