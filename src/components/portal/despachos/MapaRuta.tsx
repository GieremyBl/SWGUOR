'use client';

import { MapPin, Building2, Truck } from 'lucide-react';
import type { DespachoPortal } from '../_contexts/PortalContext';

interface MapaRutaProps {
  despacho: DespachoPortal;
}

export default function MapaRuta({ despacho }: MapaRutaProps) {
  const { estado, direccion_entrega } = despacho;
  const estaEnRuta = estado === 'en_ruta';

  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 flex items-center gap-5 shadow-inner transition-colors duration-300">

      {/* ── Indicador Visual de la Ruta (Eje Vertical) ── */}
      <div className="flex flex-col items-center self-stretch justify-between py-1 flex-shrink-0 w-5">
        {/* Punto de Origen: Almacén */}
        <div className="relative flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-slate-700 border-2 border-amber-400 z-10" />
          <div className="absolute w-5 h-5 bg-slate-200/60 rounded-full animate-ping opacity-25" />
        </div>

        {/* Línea Conectora con animación si está en tránsito */}
        <div className="relative flex-1 w-full flex items-center justify-center my-1.5 min-h-[40px]">
          <div className="w-0.5 h-full border-l-2 border-dashed border-amber-400/40" />
          {estaEnRuta && (
            <div className="absolute top-0 animate-[bounce_2s_infinite] text-[#B8962D]">
              <Truck className="w-3.5 h-3.5 bg-slate-50 rounded-full p-0.5 border border-amber-200 shadow-xs" />
            </div>
          )}
        </div>

        {/* Punto de Destino: Cliente */}
        <div className="relative flex items-center justify-center">
          <MapPin className={`w-4 h-4 z-10 ${estaEnRuta ? 'text-[#B8962D] animate-bounce' : 'text-slate-400'}`} />
          {estaEnRuta && (
            <div className="absolute w-6 h-6 bg-amber-400/20 rounded-full animate-ping opacity-45" />
          )}
        </div>
      </div>

      {/* ── Detalles del Itinerario de Despacho ── */}
      <div className="flex flex-col justify-between gap-4 flex-1">
        {/* Bloque de Origen */}
        <div className="space-y-0.5 text-left">
          <div className="flex items-center gap-2 text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-xs font-bold tracking-tight">Almacén Central GUOR</span>
          </div>
          <p className="text-[11px] text-slate-400 pl-5 font-medium">
            SJL, Lima — Punto de carga y despacho de mercancía
          </p>
        </div>

        {/* Divisor estético horizontal discreto */}
        <div className="h-px bg-slate-200/60" />

        {/* Bloque de Destino */}
        <div className="space-y-0.5 text-left">
          <div className="flex items-center gap-2 text-slate-800">
            <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${estaEnRuta ? 'text-[#B8962D]' : 'text-slate-400'}`} />
            <span className={`text-xs ${estaEnRuta ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'}`}>
              Punto de Entrega Solicitado
            </span>
          </div>
          <p className="text-[11px] font-medium text-slate-500 pl-5 leading-relaxed">
            {direccion_entrega}
          </p>
        </div>
      </div>

    </div>
  );
}