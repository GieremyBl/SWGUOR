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
  ESTADO_DEVOLUCION_PROV_LABELS,
  ESTADO_DEVOLUCION_PROV_STYLES,
  MOTIVO_DEVOLUCION_PROV_LABELS,
} from '@/lib/constants/devoluciones-proveedor';
import type { DevolucionProveedorFila } from '@/lib/schemas/devoluciones-proveedor';
import type { EstadoDevolucionProv, MotivoDevolucionProv } from '@prisma/client';
import { Eye, Truck } from 'lucide-react';

interface Props {
  data: DevolucionProveedorFila[];
  isLoading?: boolean;
  onVer: (row: DevolucionProveedorFila) => void;
}

function nombreProveedor(row: DevolucionProveedorFila) {
  return row.proveedores?.razon_social ?? `Proveedor #${row.proveedor_id}`;
}

function nombreRecurso(row: DevolucionProveedorFila) {
  if (row.tipo_recurso === 'material') {
    return row.material?.nombre ?? `Material #${row.material_id}`;
  }
  return row.insumo?.nombre ?? `Insumo #${row.insumo_id}`;
}

function formatFecha(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function DevolucionesProveedorTable({ data, isLoading, onVer }: Props) {
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
        <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">No hay devoluciones a proveedores</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80">
            <TableHead>ID</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Recurso</TableHead>
            <TableHead>Cant.</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => {
            const estadoKey = row.estado as EstadoDevolucionProv;
            const motivoKey = row.motivo as MotivoDevolucionProv;
            return (
              <TableRow key={String(row.id)} className="hover:bg-slate-50/50">
                <TableCell className="font-mono text-xs">#{row.id}</TableCell>
                <TableCell className="text-sm max-w-[160px] truncate font-medium">
                  {nombreProveedor(row)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {row.tipo_recurso}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm max-w-[180px] truncate">
                  {nombreRecurso(row)}
                </TableCell>
                <TableCell>{Number(row.cantidad)}</TableCell>
                <TableCell className="text-sm max-w-[140px] truncate">
                  {MOTIVO_DEVOLUCION_PROV_LABELS[motivoKey] ?? row.motivo}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={ESTADO_DEVOLUCION_PROV_STYLES[estadoKey] ?? ''}
                  >
                    {ESTADO_DEVOLUCION_PROV_LABELS[estadoKey] ?? row.estado}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {formatFecha(row.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onVer(row)}>
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
