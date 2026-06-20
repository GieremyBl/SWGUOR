'use client';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CUENTA_CONTABLE_LABELS,
  TIPO_ASIENTO_LABELS,
  TIPO_ASIENTO_STYLES,
} from '@/lib/constants/asientos-contables-ui';
import type { AsientoContable } from '@/lib/schemas/asientos-contables';
import { BookOpen } from 'lucide-react';

export interface AsientoContableFila {
  id: number | string;
  fecha: string | Date;
  tipo: AsientoContable['tipo'];
  monto: number | string;
  cuenta: AsientoContable['cuenta'];
  descripcion?: string | null;
  pedido_id?: number | string | null;
  pago_id?: string | null;
}

interface Props {
  asientos: AsientoContableFila[];
  isLoading?: boolean;
  totales?: { debe: number; haber: number };
}

function formatMoney(value: number | string) {
  const n = Number(value);
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatFecha(value: string | Date) {
  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function AsientosContablesTable({ asientos, isLoading, totales }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center text-sm text-slate-500">
        Cargando libro diario...
      </div>
    );
  }

  if (asientos.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center">
        <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">No hay asientos en el período seleccionado</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {totales && (
        <div className="flex flex-wrap gap-4 px-6 py-3 bg-slate-50 border-b text-sm">
          <span>
            <strong className="text-indigo-700">Total Debe:</strong>{' '}
            {formatMoney(totales.debe)}
          </span>
          <span>
            <strong className="text-violet-700">Total Haber:</strong>{' '}
            {formatMoney(totales.haber)}
          </span>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80">
            <TableHead>Fecha</TableHead>
            <TableHead>Cuenta</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead>Ref. pedido</TableHead>
            <TableHead>Ref. pago</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {asientos.map((asiento) => (
            <TableRow key={String(asiento.id)} className="hover:bg-slate-50/50">
              <TableCell className="text-sm whitespace-nowrap">
                {formatFecha(asiento.fecha)}
              </TableCell>
              <TableCell className="text-sm font-medium">
                {CUENTA_CONTABLE_LABELS[asiento.cuenta] ?? asiento.cuenta}
              </TableCell>
              <TableCell className="text-sm text-slate-600 max-w-[240px] truncate">
                {asiento.descripcion ?? '—'}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={TIPO_ASIENTO_STYLES[asiento.tipo]}>
                  {TIPO_ASIENTO_LABELS[asiento.tipo]}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatMoney(asiento.monto)}
              </TableCell>
              <TableCell className="text-sm">
                {asiento.pedido_id ? `#${asiento.pedido_id}` : '—'}
              </TableCell>
              <TableCell className="text-xs text-slate-500 font-mono truncate max-w-[120px]">
                {asiento.pago_id ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
