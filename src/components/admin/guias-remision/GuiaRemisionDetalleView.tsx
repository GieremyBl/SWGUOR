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
import type { GuiaRemisionDetalle } from '@/lib/hooks/useGuiasRemision';
import { ArrowLeft, ExternalLink } from 'lucide-react';

interface Props {
  guia: GuiaRemisionDetalle;
}

function formatFecha(value?: string | Date | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function DetalleCampo({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm text-slate-800">{value ?? '—'}</p>
    </div>
  );
}

export function GuiaRemisionDetalleView({ guia }: Props) {
  const items = guia.guias_remision_items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/Panel-Administrativo/guias-remision">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver al listado
          </Link>
        </Button>
        <Badge variant="outline" className={ESTADO_GUIA_STYLES[guia.estado]}>
          {ESTADO_GUIA_LABELS[guia.estado]}
        </Badge>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">{guia.numero}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {TIPO_GUIA_LABELS[guia.tipo] ?? guia.tipo}
            </p>
          </div>
          {guia.pdf_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={guia.pdf_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                Ver PDF
              </a>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DetalleCampo label="Fecha emisión" value={formatFecha(guia.fecha_emision)} />
          <DetalleCampo label="Fecha traslado" value={formatFecha(guia.fecha_traslado)} />
          <DetalleCampo label="Fecha entrega" value={formatFecha(guia.fecha_entrega)} />
          <DetalleCampo label="Pedido" value={guia.pedido_id ? `#${guia.pedido_id}` : null} />
          <DetalleCampo
            label="Orden producción"
            value={guia.orden_produccion_id ? `#${guia.orden_produccion_id}` : null}
          />
          <DetalleCampo label="Motivo traslado" value={guia.motivo_traslado} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700">Origen</h3>
            <DetalleCampo label="Tipo" value={guia.origen_tipo} />
            <DetalleCampo label="Dirección" value={guia.origen_direccion} />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700">Destino</h3>
            <DetalleCampo label="Tipo" value={guia.destino_tipo} />
            <DetalleCampo label="Dirección" value={guia.destino_direccion} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t">
          <DetalleCampo label="Transportista" value={guia.transportista} />
          <DetalleCampo label="RUC transportista" value={guia.ruc_transportista} />
          <DetalleCampo label="Placa vehículo" value={guia.placa_vehiculo} />
        </div>

        {guia.observaciones && (
          <div className="pt-2 border-t">
            <DetalleCampo label="Observaciones" value={guia.observaciones} />
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-bold text-slate-800">Ítems de la guía ({items.length})</h3>
        </div>
        {items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Sin ítems registrados en esta guía.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead>Descripción</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Observaciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={String(item.id)}>
                  <TableCell>{item.descripcion}</TableCell>
                  <TableCell>{Number(item.cantidad)}</TableCell>
                  <TableCell>{item.unidad}</TableCell>
                  <TableCell className="text-slate-500">{item.observaciones ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
