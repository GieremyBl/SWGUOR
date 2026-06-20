'use client';

import Link from 'next/link';
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
  ESTADO_GUIA_LABELS,
  ESTADO_GUIA_STYLES,
  TIPO_GUIA_LABELS,
} from '@/lib/constants/guias-remision-ui';
import type { GuiaRemision } from '@/lib/schemas/guias-remision';
import { Eye, FileText } from 'lucide-react';

interface Props {
  guias: GuiaRemision[];
  isLoading?: boolean;
}

function formatFecha(value?: string | Date | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function GuiasRemisionTable({ guias, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center text-sm text-slate-500">
        Cargando guías de remisión...
      </div>
    );
  }

  if (guias.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center">
        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">No hay guías registradas</p>
        <p className="text-sm text-slate-400 mt-1">
          Las guías emitidas aparecerán aquí para consulta.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80">
            <TableHead>Número</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Origen → Destino</TableHead>
            <TableHead>Traslado</TableHead>
            <TableHead>Pedido</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guias.map((guia) => (
            <TableRow key={String(guia.id)} className="hover:bg-slate-50/50">
              <TableCell className="font-semibold text-slate-900">{guia.numero}</TableCell>
              <TableCell className="text-sm text-slate-600">
                {TIPO_GUIA_LABELS[guia.tipo] ?? guia.tipo}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={ESTADO_GUIA_STYLES[guia.estado] ?? ''}
                >
                  {ESTADO_GUIA_LABELS[guia.estado] ?? guia.estado}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[220px]">
                <p className="text-xs text-slate-500 truncate">{guia.origen_direccion}</p>
                <p className="text-xs text-slate-700 truncate">→ {guia.destino_direccion}</p>
              </TableCell>
              <TableCell className="text-sm">{formatFecha(guia.fecha_traslado)}</TableCell>
              <TableCell className="text-sm">
                {guia.pedido_id ? `#${guia.pedido_id}` : '—'}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/Panel-Administrativo/guias-remision/${guia.id}`}>
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
