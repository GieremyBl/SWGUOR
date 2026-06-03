'use client';

import { Eye, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CotizacionActions } from './CotizacionActions';
import type { CotizacionRow } from '@/lib/services/cotizaciones.service';

export const ESTADO_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  borrador: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Borrador' },
  enviada: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Enviada' },
  aprobada: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Aprobada' },
  convertida: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Convertida' },
  rechazada: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rechazada' },
  expirada: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Expirada' },
};

interface CotizacionesTableProps {
  paginated: CotizacionRow[];
  filtered: CotizacionRow[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export function CotizacionesTable({
  paginated, filtered, currentPage, totalPages, onPageChange, onRefresh,
}: CotizacionesTableProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="text-left py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cotización</th>
              <th className="text-left py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cliente</th>
              <th className="text-left py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden lg:table-cell">Descripción</th>
              <th className="text-right py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monto</th>
              <th className="text-left py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado</th>
              <th className="text-left py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden md:table-cell">Vencimiento</th>
              <th className="text-center py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <ClipboardList className="w-8 h-8 text-gray-300" />
                    <span className="text-gray-400 italic text-sm">No hay cotizaciones que mostrar</span>
                  </div>
                </td>
              </tr>
            ) : paginated.map((cot) => {
              const badge = ESTADO_BADGE[cot.estado] ?? ESTADO_BADGE.borrador;
              const isExpirada = cot.estado === 'expirada';
              return (
                <tr
                  key={cot.id}
                  className={`group border-b border-gray-50 hover:bg-slate-50/50 transition-colors ${isExpirada ? 'bg-orange-50/30' : ''}`}
                >
                  <td className="py-4 px-5">
                    <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                      {cot.cotizacion_id}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-600 text-sm">{cot.cliente ?? '—'}</td>
                  <td className="py-4 px-5 text-slate-400 text-xs max-w-xs truncate hidden lg:table-cell">{cot.descripcion ?? '—'}</td>
                  <td className="py-4 px-5 text-right font-bold text-slate-800 text-sm">
                    S/ {cot.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-500 text-xs hidden md:table-cell">
                    {cot.fecha_vencimiento}
                    {isExpirada && (
                      <span className="ml-2 text-[10px] text-orange-600 font-bold uppercase">(Vencida)</span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-center">
                    {['borrador', 'enviada'].includes(cot.estado) ? (
                      <CotizacionActions
                        cotizacionId={cot.id}
                        estado={cot.estado}
                        validaHasta={cot.fecha_vencimiento}
                        onSuccess={onRefresh}
                      />
                    ) : (
                      <Button variant="ghost" size="sm" className="rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90">
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-xs text-gray-500">
          Mostrando <span className="font-bold text-gray-900">{paginated.length}</span> de{' '}
          <span className="font-bold text-gray-900">{filtered.length}</span>
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-4 py-1.5 text-xs font-bold bg-gray-50 border rounded-xl flex items-center">
            Página {currentPage + 1} de {totalPages || 1}
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage + 1 >= totalPages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}