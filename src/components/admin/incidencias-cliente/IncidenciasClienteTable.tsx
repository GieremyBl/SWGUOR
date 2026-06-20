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
  ESTADO_INCIDENCIA_LABELS,
  ESTADO_INCIDENCIA_STYLES,
  TIPO_INCIDENCIA_CLIENTE_LABELS,
} from '@/lib/constants/incidencias-cliente';
import type { IncidenciaClienteFila } from '@/lib/schemas/incidencias-cliente';
import { AlertTriangle, Eye } from 'lucide-react';
import type { TipoIncidenciaCliente } from '@prisma/client';

interface Props {
  data: IncidenciaClienteFila[];
  isLoading?: boolean;
  onVer: (row: IncidenciaClienteFila) => void;
}

function nombreCliente(row: IncidenciaClienteFila) {
  return (
    row.cliente?.razon_social ??
    row.cliente?.nombre_comercial ??
    (row.cliente_id ? `Cliente #${row.cliente_id}` : '—')
  );
}

function formatFecha(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function estadoBadge(estado: string | null) {
  const key = (estado ?? 'abierta') as keyof typeof ESTADO_INCIDENCIA_LABELS;
  const label = ESTADO_INCIDENCIA_LABELS[key] ?? estado ?? '—';
  const style = ESTADO_INCIDENCIA_STYLES[key] ?? 'bg-slate-100 text-slate-600';
  return (
    <Badge variant="outline" className={style}>
      {label}
    </Badge>
  );
}

export function IncidenciasClienteTable({ data, isLoading, onVer }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center text-sm text-slate-500">
        Cargando incidencias...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center">
        <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">No hay incidencias registradas</p>
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
            <TableHead>Tipo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={String(row.id)} className="hover:bg-slate-50/50">
              <TableCell className="font-mono text-xs">#{row.id}</TableCell>
              <TableCell className="font-medium text-slate-800 max-w-[180px] truncate">
                {nombreCliente(row)}
              </TableCell>
              <TableCell>#{row.pedido_id ?? '—'}</TableCell>
              <TableCell className="max-w-[160px] truncate text-sm text-slate-600">
                {row.tipo
                  ? TIPO_INCIDENCIA_CLIENTE_LABELS[row.tipo as TipoIncidenciaCliente]
                  : '—'}
              </TableCell>
              <TableCell>{estadoBadge(row.estado)}</TableCell>
              <TableCell className="text-sm text-slate-500">{formatFecha(row.created_at)}</TableCell>
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
