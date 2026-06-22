import React from 'react';
import Link from 'next/link';
import { Loader2, MapPin, Route, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { labelEstado } from '@/lib/helpers/despachos-helpers';

const ESTADO_STYLING: Record<string, string> = {
  pendiente: 'bg-gray-50 text-gray-700',
  preparando: 'bg-yellow-50 text-yellow-700',
  en_ruta: 'bg-blue-50 text-blue-700',
  entregado: 'bg-emerald-50 text-emerald-700',
  incidencia: 'bg-red-50 text-red-700',
};

export interface DespachoRow {
  id: number;
  despacho_id: string;
  pedido_id: string;
  cliente: string;
  direccion: string;
  estado: string;
  tracking: string;
  fecha_entrega: string;
  grupo_id?: string | null;
  numero_parada?: number;
  total_paradas_grupo?: number;
  es_ruta_agrupada?: boolean;
  estado_entrega_parada?: string;
}

interface Props {
  despachos: DespachoRow[];
  loading: boolean;
  iniciandoId: number | null;
  seleccionados: Set<number>;
  puedeGestionar: boolean;
  puedeConfirmarEntrega?: boolean;
  onToggleSeleccion: (id: number) => void;
  onIniciarRuta: (id: number) => void;
}

export function DespachoTable({
  despachos,
  loading,
  iniciandoId,
  seleccionados,
  puedeGestionar,
  puedeConfirmarEntrega = false,
  onToggleSeleccion,
  onIniciarRuta,
}: Props) {
  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-white rounded-xl border">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Sincronizando...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {puedeGestionar && (
                <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-10">
                  Sel.
                </th>
              )}
              {['Despacho', 'Cliente', 'Dirección', 'Ruta', 'Estado', 'Entrega', 'Acciones'].map((h) => (
                <th
                  key={h}
                  className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {despachos.length === 0 ? (
              <tr>
                <td colSpan={puedeGestionar ? 8 : 7} className="py-12 text-center text-gray-400 italic">
                  No se encontraron resultados
                </td>
              </tr>
            ) : (
              despachos.map((desp) => {
                const esAgrupada = Boolean(desp.es_ruta_agrupada);
                const puedeSeleccionar =
                  puedeGestionar && desp.estado === 'preparando' && !esAgrupada;

                return (
                  <tr key={desp.id} className="hover:bg-gray-50 transition-colors">
                    {puedeGestionar && (
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={seleccionados.has(desp.id)}
                          disabled={!puedeSeleccionar}
                          onChange={() => onToggleSeleccion(desp.id)}
                          aria-label={`Seleccionar ${desp.despacho_id}`}
                        />
                      </td>
                    )}
                    <td className="py-4 px-4">
                      <p className="font-bold text-gray-900">{desp.despacho_id}</p>
                      <p className="text-[10px] text-gray-400">Pedido #{desp.pedido_id}</p>
                    </td>
                    <td className="py-4 px-4 text-gray-700">{desp.cliente}</td>
                    <td className="py-4 px-4 text-gray-600 text-sm max-w-[200px] truncate">
                      {desp.direccion}
                    </td>
                    <td className="py-4 px-4">
                      {esAgrupada ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">
                          <Route className="w-3 h-3" />
                          Parada {desp.numero_parada}/{desp.total_paradas_grupo}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">Individual</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          ESTADO_STYLING[desp.estado] ?? 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {labelEstado(desp.estado)}
                      </span>
                      {desp.estado === 'en_ruta' && desp.estado_entrega_parada === 'siguiente' && (
                        <p className="text-[10px] text-blue-600 font-semibold mt-1">Siguiente parada</p>
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-700 text-sm">{desp.fecha_entrega}</td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {puedeGestionar && desp.estado === 'preparando' && (
                          <Button
                            type="button"
                            size="sm"
                            disabled={iniciandoId === desp.id}
                            onClick={() => onIniciarRuta(desp.id)}
                            className="h-8 bg-indigo-600 hover:bg-indigo-700 text-[10px] font-black uppercase tracking-widest"
                          >
                            {iniciandoId === desp.id ? (
                              <Loader2 size={14} className="animate-spin mr-1" />
                            ) : (
                              <Truck size={14} className="mr-1" />
                            )}
                            {esAgrupada ? 'Iniciar ruta grupal' : 'Iniciar Ruta'}
                          </Button>
                        )}
                        {puedeConfirmarEntrega && desp.estado === 'en_ruta' && (
                          <Link
                            href={`/admin/Panel-Administrativo/pedidos/${desp.pedido_id}/entrega`}
                            prefetch={false}
                            className="inline-flex items-center h-8 px-3 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100"
                          >
                            <MapPin size={14} className="mr-1" />
                            Confirmar entrega
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
