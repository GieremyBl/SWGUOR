'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { ManufacturaPrioridadOp } from '@/lib/schemas/reporte-eficiencia-manufactura';
import { cn } from '@/lib/utils';
import { Timer } from 'lucide-react';

interface Props {
  ops: ManufacturaPrioridadOp[];
  loading?: boolean;
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatHorasRestantes(horas: number): string {
  if (horas < 0) return `Vencida hace ${Math.abs(Math.round(horas))}h`;
  if (horas < 24) return `${Math.round(horas)}h restantes`;
  return `${Math.round(horas / 24)}d restantes`;
}

export function ManufacturaPrioridadTable({ ops, loading }: Props) {
  if (loading) {
    return <div className="bg-white border border-slate-200 rounded-3xl p-6 h-80 animate-pulse" />;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-rose-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Tabla de Prioridad</h2>
            <p className="text-sm text-slate-600 mt-0.5">
              OPs vencidas o con entrega en menos de 48 horas
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/70">
            <TableRow className="hover:bg-transparent">
              {[
                'OP',
                'Producto',
                'Taller',
                'Etapa',
                'Entrega',
                'Tiempo',
                'Cant.',
                'Urgencia',
              ].map((col) => (
                <TableHead
                  key={col}
                  className="font-bold text-slate-400 uppercase text-[10px] tracking-widest py-4 whitespace-nowrap"
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center text-slate-500 italic">
                  No hay órdenes críticas en la ventana de 48 horas
                </TableCell>
              </TableRow>
            ) : (
              ops.map((op) => (
                <TableRow key={op.id} className="hover:bg-slate-50/60">
                  <TableCell>
                    <Link
                      href={`/admin/Panel-Administrativo/ordenes-produccion/${op.id}/etapas`}
                      className="font-bold text-indigo-700 hover:text-indigo-900"
                    >
                      #{op.id}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate text-sm font-medium">
                    {op.producto}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{op.taller}</TableCell>
                  <TableCell className="text-xs font-semibold">{op.etapa_label}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatFecha(op.fecha_entrega)}
                  </TableCell>
                  <TableCell className="text-sm font-bold tabular-nums">
                    {formatHorasRestantes(op.horas_restantes)}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{op.cantidad_solicitada}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-bold uppercase',
                        op.urgencia === 'vencida'
                          ? 'border-red-200 text-red-700 bg-red-50'
                          : 'border-amber-200 text-amber-700 bg-amber-50',
                      )}
                    >
                      {op.urgencia === 'vencida' ? 'Vencida' : 'Próxima'}
                    </Badge>
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
