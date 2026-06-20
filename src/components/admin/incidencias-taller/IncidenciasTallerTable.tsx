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
  ESTADO_RESOLUCION_LABELS,
  ESTADO_RESOLUCION_STYLES,
  SEVERIDAD_INCIDENCIA_LABELS,
  SEVERIDAD_INCIDENCIA_STYLES,
  TIPO_INCIDENCIA_TALLER_LABELS,
} from '@/lib/constants/incidencias-taller';
import type { IncidenciaTallerFila } from '@/lib/schemas/incidencias-taller';
import { AlertTriangle, Eye } from 'lucide-react';
import type { SeveridadIncidencia, TipoIncidencia } from '@prisma/client';

interface Props {
  data: IncidenciaTallerFila[];
  isLoading?: boolean;
  onVer: (row: IncidenciaTallerFila) => void;
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

function severidadBadge(severidad: string) {
  const key = severidad as SeveridadIncidencia;
  return (
    <Badge variant="outline" className={SEVERIDAD_INCIDENCIA_STYLES[key] ?? ''}>
      {SEVERIDAD_INCIDENCIA_LABELS[key] ?? severidad}
    </Badge>
  );
}

function estadoBadge(resuelto: boolean) {
  const key = resuelto ? 'resuelto' : 'pendiente';
  return (
    <Badge variant="outline" className={ESTADO_RESOLUCION_STYLES[key]}>
      {ESTADO_RESOLUCION_LABELS[key]}
    </Badge>
  );
}

export function IncidenciasTallerTable({ data, isLoading, onVer }: Props) {
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
            <TableHead>Taller</TableHead>
            <TableHead>Confección</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Severidad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Reporte</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={String(row.id)} className="hover:bg-slate-50/50">
              <TableCell className="font-mono text-xs">#{row.id}</TableCell>
              <TableCell className="font-medium text-slate-800 max-w-[140px] truncate">
                {row.confecciones?.talleres?.nombre ?? '—'}
              </TableCell>
              <TableCell className="max-w-[120px] truncate text-sm">
                {row.confecciones?.prenda ?? (row.confeccion_id ? `#${row.confeccion_id}` : '—')}
              </TableCell>
              <TableCell className="max-w-[150px] truncate text-sm text-slate-600">
                {TIPO_INCIDENCIA_TALLER_LABELS[row.tipo as TipoIncidencia] ?? row.tipo}
              </TableCell>
              <TableCell>{severidadBadge(row.severidad)}</TableCell>
              <TableCell>{estadoBadge(row.resuelto)}</TableCell>
              <TableCell className="text-sm text-slate-500">{formatFecha(row.fecha_reporte)}</TableCell>
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
