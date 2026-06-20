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
  ESTADO_DEVOLUCION_LABELS,
  ESTADO_DEVOLUCION_STYLES,
  MOTIVO_DEVOLUCION_LABELS,
} from '@/lib/constants/devoluciones-cliente';
import type { DevolucionClienteFila } from '@/lib/schemas/devoluciones-cliente';
import { Eye, RotateCcw } from 'lucide-react';

interface Props {
  data: DevolucionClienteFila[];
  isLoading?: boolean;
  onVer: (row: DevolucionClienteFila) => void;
}

function nombreCliente(row: DevolucionClienteFila) {
  return (
    row.clientes?.razon_social ??
    row.clientes?.nombre_comercial ??
    `Cliente #${row.cliente_id}`
  );
}

function formatFecha(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function DevolucionesClienteTable({ data, isLoading, onVer }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center text-sm text-slate-500">
        Cargando devoluciones...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center">
        <RotateCcw className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">No hay devoluciones registradas</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80">
            <TableHead>ID</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Pedido</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Cant.</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={String(row.id)} className="hover:bg-slate-50/50">
              <TableCell className="font-mono text-xs">#{row.id}</TableCell>
              <TableCell className="text-sm">{nombreCliente(row)}</TableCell>
              <TableCell className="text-sm">
                {row.pedido_id ? `#${row.pedido_id}` : '—'}
              </TableCell>
              <TableCell className="text-sm max-w-[160px] truncate">
                {row.productos?.nombre ?? '—'}
              </TableCell>
              <TableCell className="text-sm">
                {MOTIVO_DEVOLUCION_LABELS[row.motivo] ?? row.motivo}
              </TableCell>
              <TableCell>{row.cantidad}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={ESTADO_DEVOLUCION_STYLES[row.estado_solicitud]}
                >
                  {ESTADO_DEVOLUCION_LABELS[row.estado_solicitud]}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{formatFecha(row.created_at)}</TableCell>
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
