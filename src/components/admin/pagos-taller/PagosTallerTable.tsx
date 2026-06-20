'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ESTADO_PAGO_TALLER_LABELS,
  ESTADO_PAGO_TALLER_STYLES,
  METODO_PAGO_TALLER_LABELS,
} from '@/lib/constants/pagos-taller';
import { formatMontoPagoTaller } from '@/lib/helpers/pagos-taller-helpers';
import type { PagoTallerFila } from '@/lib/schemas/pagos-talleres';
import { Coins, Eye } from 'lucide-react';
import type { EstadoPagoTaller, MetodoPago } from '@prisma/client';

interface Props {
  data: PagoTallerFila[];
  isLoading?: boolean;
  onVer: (row: PagoTallerFila) => void;
}

function formatFecha(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function estadoBadge(estado: string) {
  const key = estado as EstadoPagoTaller;
  return (
    <Badge variant="outline" className={ESTADO_PAGO_TALLER_STYLES[key] ?? ''}>
      {ESTADO_PAGO_TALLER_LABELS[key] ?? estado}
    </Badge>
  );
}

export function PagosTallerTable({ data, isLoading, onVer }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center text-sm text-slate-500">
        Cargando pagos...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center">
        <Coins className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">No hay pagos registrados</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80">
            <TableHead>ID</TableHead>
            <TableHead>Taller</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha pago</TableHead>
            <TableHead>Referencia</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={String(row.id)} className="hover:bg-slate-50/50">
              <TableCell className="font-mono text-xs">#{row.id}</TableCell>
              <TableCell className="font-medium text-slate-800 max-w-[160px] truncate">
                {row.talleres?.nombre ?? `#${row.taller_id}`}
              </TableCell>
              <TableCell className="font-semibold text-slate-900">
                {formatMontoPagoTaller(row.monto, row.moneda)}
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {METODO_PAGO_TALLER_LABELS[row.metodo_pago as MetodoPago] ?? row.metodo_pago}
              </TableCell>
              <TableCell>{estadoBadge(row.estado)}</TableCell>
              <TableCell className="text-sm text-slate-500">{formatFecha(row.fecha_pago)}</TableCell>
              <TableCell className="text-xs text-slate-500 max-w-[120px] truncate">
                {row.numero_operacion ?? '—'}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onVer(row)}>
                  <Eye className="w-4 h-4 mr-1" />
                  Ver
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
