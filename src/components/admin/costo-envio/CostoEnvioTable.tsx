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
import { etiquetaZonaEnvio } from '@/lib/constants/costo-envio';
import { formatCostoEnvio } from '@/lib/helpers/costo-envio-helpers';
import type { CostoEnvioFila } from '@/lib/schemas/costo-envio';
import { Ban, Pencil, Truck } from 'lucide-react';

interface Props {
  data: CostoEnvioFila[];
  isLoading?: boolean;
  canEdit: boolean;
  onEditar: (row: CostoEnvioFila) => void;
  onDesactivar: (row: CostoEnvioFila) => void;
}

function formatFecha(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function CostoEnvioTable({
  data,
  isLoading,
  canEdit,
  onEditar,
  onDesactivar,
}: Props) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center text-sm text-slate-500">
        Cargando zonas de envío...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center">
        <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">No hay zonas de envío configuradas</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80">
            <TableHead>ID</TableHead>
            <TableHead>Zona</TableHead>
            <TableHead>Costo (PEN)</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Actualizado</TableHead>
            {canEdit && <TableHead className="text-right">Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id} className="hover:bg-slate-50/50">
              <TableCell className="font-mono text-xs">#{row.id}</TableCell>
              <TableCell className="font-medium text-slate-800">
                {etiquetaZonaEnvio(row.zona)}
              </TableCell>
              <TableCell className="font-semibold">{formatCostoEnvio(row.costo)}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    row.activo
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }
                >
                  {row.activo ? 'Activa' : 'Inactiva'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-slate-500">{formatFecha(row.updated_at)}</TableCell>
              {canEdit && (
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => onEditar(row)}>
                    <Pencil className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  {row.activo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600"
                      onClick={() => onDesactivar(row)}
                    >
                      <Ban className="w-4 h-4 mr-1" />
                      Desactivar
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
