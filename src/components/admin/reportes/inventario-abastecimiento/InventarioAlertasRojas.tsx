'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { ReporteInventarioAlerta } from '@/lib/schemas/reporte-inventario-abastecimiento';
import { cn } from '@/lib/utils';
import { AlertOctagon } from 'lucide-react';

interface Props {
  alertas: ReporteInventarioAlerta[];
  loading?: boolean;
}

function StockProgressBar({ porcentaje }: { porcentaje: number }) {
  const color =
    porcentaje <= 25 ? 'bg-red-500' : porcentaje <= 50 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="w-full min-w-[100px]">
      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
        <span>Nivel</span>
        <span>{porcentaje.toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={cn('h-full transition-all', color)} style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  );
}

export function InventarioAlertasRojas({ alertas, loading }: Props) {
  if (loading) {
    return <div className="bg-white border border-red-100 rounded-3xl p-6 h-64 animate-pulse" />;
  }

  return (
    <div className="bg-white border border-red-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-red-100 bg-red-50/50">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-red-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Alertas Rojas de Reposición</h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Insumos y materiales con stock en almacén ≤ stock mínimo
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-red-50/30">
            <TableRow className="hover:bg-transparent">
              {[
                'Artículo',
                'Tipo',
                'Almacén',
                'Stock / Mín.',
                'Déficit',
                'Nivel vs máximo',
              ].map((col) => (
                <TableHead
                  key={col}
                  className="font-bold text-red-400 uppercase text-[10px] tracking-widest py-4 whitespace-nowrap"
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {alertas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-slate-500 italic">
                  No hay alertas de reposición con los filtros aplicados
                </TableCell>
              </TableRow>
            ) : (
              alertas.map((alerta) => (
                <TableRow key={alerta.stock_id} className="hover:bg-red-50/20">
                  <TableCell>
                    <p className="font-semibold text-slate-900">{alerta.nombre}</p>
                    {alerta.categoria && (
                      <p className="text-[11px] text-slate-500">{alerta.categoria}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase font-bold border-red-200 text-red-700"
                    >
                      {alerta.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">{alerta.almacen_nombre}</TableCell>
                  <TableCell className="text-sm font-bold tabular-nums text-red-700">
                    {alerta.cantidad.toLocaleString('es-PE')} / {alerta.stock_minimo.toLocaleString('es-PE')}
                  </TableCell>
                  <TableCell className="text-sm font-bold tabular-nums text-amber-700">
                    +{alerta.deficit.toLocaleString('es-PE')}
                  </TableCell>
                  <TableCell className="min-w-[140px]">
                    <StockProgressBar porcentaje={alerta.porcentaje_stock} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
