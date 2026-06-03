'use client';

import { useState } from 'react';
import { Package, MapPin, Calendar, AlertTriangle, CheckCircle2, Clock, Truck } from 'lucide-react';
import type { DespachoPortal } from '../_contexts/PortalContext';
import BadgeEstado from './BadgeEstado';
import EtaWidget from './EtaWidget';
import ModalIncidencia from './ModalIncidencia';
import MapaRuta from './MapaRuta';
import { formatFecha } from '@/lib/helpers/despachos-helpers';

interface CardDespachoProps {
  despacho: DespachoPortal;
}

export default function CardDespacho({ despacho }: CardDespachoProps) {
  const [modalAbierto, setModalAbierto] = useState(false);

  return (
    <>
      {modalAbierto && (
        <ModalIncidencia
          despacho={despacho}
          onClose={() => setModalAbierto(false)}
        />
      )}

      <article className="bg-white border border-slate-200 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.03)] overflow-hidden transition-all hover:shadow-[0_4px_24px_rgba(15,23,42,0.06)]">

        {/* ── Header ── */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/60 shadow-sm flex-shrink-0">
                <Package className="w-5 h-5 text-[#B8962D]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-1">
                  <h2 className="font-bold text-slate-800 text-base tracking-tight">
                    Despacho #DG-{despacho.id}
                  </h2>
                  <BadgeEstado estado={despacho.estado} />
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Vinculado al Pedido:{' '}
                  <span className="font-semibold text-slate-700">
                    #{despacho.pedido_id}
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-white sm:text-right p-2.5 px-4 rounded-xl border border-slate-100 shadow-xs flex-shrink-0">
              <div className="flex items-center sm:justify-end gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                <Calendar className="w-3 h-3 text-[#B8962D]" /> Entrega Est.
              </div>
              <p className="text-sm font-bold text-slate-700">
                {despacho.fecha_entrega ? formatFecha(despacho.fecha_entrega) : 'Por confirmar'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Cuerpo Principal Grid Mapeado ── */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Columna Izquierda: Información y Mapa (7/12) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <MapPin className="w-4 h-4 text-[#B8962D] mt-0.5 flex-shrink-0" />
              <div className="space-y-0.5">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dirección de Entrega</span>
                <span className="text-xs font-semibold text-slate-600 leading-relaxed">
                  {despacho.direccion_entrega}
                </span>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-100 shadow-inner">
              <MapaRuta despacho={despacho} />
            </div>

            <EtaWidget despacho={despacho} />
          </div>

          {/* Columna Derecha: Timeline de Estados en Tiempo Real (5/12) */}
          <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5 flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-400" /> Historial de Ruta
            </h3>

            {despacho.historial_grupo && despacho.historial_grupo.length > 0 ? (
              <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-slate-100">
                {despacho.historial_grupo.map((hito, index) => {
                  const esUltimo = index === despacho.historial_grupo.length - 1;
                  return (
                    <div key={hito.id} className="relative group text-left">
                      {/* Marcador del Stepper */}
                      <span className={`absolute -left-[21px] top-0.5 p-0.5 rounded-full z-10 bg-white transition-transform ${esUltimo ? 'scale-110' : ''}`}>
                        {esUltimo ? (
                          <CheckCircle2 className="w-4 h-4 text-[#B8962D]" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-300" />
                        )}
                      </span>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-bold capitalize ${esUltimo ? 'text-slate-800 font-extrabold' : 'text-slate-500'}`}>
                            {hito.status.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">
                            {formatFecha(hito.created_at)}
                          </span>
                        </div>
                        {hito.notas && (
                          <p className={`text-xs p-2.5 rounded-lg border border-slate-100 ${esUltimo ? 'bg-amber-50/40 text-slate-600' : 'bg-slate-50/50 text-slate-400'}`}>
                            {hito.notas}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Clock className="w-6 h-6 text-slate-300 mb-2" />
                <p className="text-xs text-slate-400 font-medium">Sin eventos registrados todavía</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-[11px] text-slate-400 font-medium">
            * Despachado el: <span className="text-slate-500 font-semibold">{formatFecha(despacho.fecha_despacho)}</span>
          </p>
          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center justify-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors bg-white hover:bg-rose-50/50 p-2 px-4 rounded-xl border border-slate-200 shadow-xs uppercase tracking-wider w-full sm:w-auto"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Reportar incidencia
          </button>
        </div>
      </article>
    </>
  );
}