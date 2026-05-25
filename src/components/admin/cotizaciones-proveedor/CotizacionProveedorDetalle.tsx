'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Pencil,
  Lock,
  RotateCcw,
  Ban,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMontoCotizacion } from './cotizacion-proveedor-utils';
import {
  ESTADO_COTIZACION_PROVEEDOR,
  ESTADOS_COTIZACION_PROVEEDOR,
  ESTADOS_COTIZACION_PARA_GENERAR_OC,
  TRANSICIONES_COTIZACION_PROVEEDOR,
} from '@/lib/constants/cotizacion-proveedor-estados';
import { CotizacionProveedorPdfUpload } from './CotizacionProveedorPdfUpload';
import { useCotizacionProveedorMutations } from '@/lib/hooks/useCotizacionesProveedor';

interface ItemRow {
  id?: string | number;
  descripcion?: string | null;
  cantidad?: number | string;
  precio_unitario?: number | string;
  subtotal?: number | string;
  unidad?: string | null;
}

export interface CotizacionDetalleData {
  id: string | number;
  estado: string;
  numero_externo?: string | null;
  fecha_solicitud?: string;
  fecha_vencimiento?: string | null;
  moneda?: string | null;
  total_estimado?: number | string;
  notas?: string | null;
  pdf_url?: string | null;
  proveedores?: {
    razon_social?: string;
    ruc?: string;
    email?: string;
    telefono?: string;
  };
  cotizaciones_proveedor_items?: ItemRow[];
}

interface Props {
  cotizacion: CotizacionDetalleData;
  onEstadoChange: (estado: string) => void;
  onAnular: () => void;
  isChangingEstado?: boolean;
  onPdfUploaded?: () => void;
}

export function CotizacionProveedorDetalle({
  cotizacion,
  onEstadoChange,
  onAnular,
  isChangingEstado,
  onPdfUploaded,
}: Props) {
  const { subirPdf } = useCotizacionProveedorMutations();
  const badge = ESTADOS_COTIZACION_PROVEEDOR[cotizacion.estado] ?? {
    label: cotizacion.estado,
    bgColor: 'bg-slate-100',
    color: 'text-slate-600',
  };

  const puedeEditar = cotizacion.estado === ESTADO_COTIZACION_PROVEEDOR.BORRADOR;
  const transiciones = TRANSICIONES_COTIZACION_PROVEEDOR[cotizacion.estado] ?? [];
  const puedeGenerarOc = ESTADOS_COTIZACION_PARA_GENERAR_OC.includes(
    cotizacion.estado as (typeof ESTADOS_COTIZACION_PARA_GENERAR_OC)[number],
  );

  const moneda = cotizacion.moneda ?? 'PEN';
  const items = cotizacion.cotizaciones_proveedor_items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/Panel-Administrativo/cotizaciones-proveedor"
          className="inline-flex items-center rounded-xl px-4 py-2 text-sm hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver al listado
        </Link>
        <div className="flex flex-wrap gap-2">
          {puedeEditar && (
            <Link
              href={`/admin/Panel-Administrativo/cotizaciones-proveedor/${cotizacion.id}/editar`}
              className="inline-flex items-center rounded-xl bg-slate-900 text-white px-4 py-2 text-sm"
            >
              <Pencil className="w-4 h-4 mr-1" /> Editar
            </Link>
          )}
          {transiciones.includes(ESTADO_COTIZACION_PROVEEDOR.CERRADO) && (
            <Button
              variant="outline"
              className="rounded-xl"
              disabled={isChangingEstado}
              onClick={() => onEstadoChange(ESTADO_COTIZACION_PROVEEDOR.CERRADO)}
            >
              <Lock className="w-4 h-4 mr-1" /> Cerrar
            </Button>
          )}
          {transiciones.includes(ESTADO_COTIZACION_PROVEEDOR.BORRADOR) && (
            <Button
              variant="outline"
              className="rounded-xl"
              disabled={isChangingEstado}
              onClick={() => onEstadoChange(ESTADO_COTIZACION_PROVEEDOR.BORRADOR)}
            >
              <RotateCcw className="w-4 h-4 mr-1" /> Reabrir borrador
            </Button>
          )}
          {transiciones.includes(ESTADO_COTIZACION_PROVEEDOR.ANULADO) && (
            <Button
              variant="outline"
              className="rounded-xl text-red-600"
              disabled={isChangingEstado}
              onClick={onAnular}
            >
              <Ban className="w-4 h-4 mr-1" /> Anular
            </Button>
          )}
          {puedeGenerarOc && (
            <Link
              href={`/admin/Panel-Administrativo/ordenes-compra/nueva?cotizacion_id=${cotizacion.id}`}
              className="inline-flex items-center rounded-xl bg-rose-700 hover:bg-rose-800 text-white px-4 py-2 text-sm"
            >
              <ShoppingCart className="w-4 h-4 mr-1" /> Generar OC
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-6 space-y-4">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest">Proveedor</p>
            <h1 className="text-2xl font-bold text-slate-900">
              {cotizacion.proveedores?.razon_social ?? '—'}
            </h1>
            <p className="text-sm text-slate-500">
              RUC {cotizacion.proveedores?.ruc ?? '—'} · COT-{cotizacion.id}
              {cotizacion.numero_externo ? ` · ${cotizacion.numero_externo}` : ''}
            </p>
          </div>
          <span
            className={`self-start px-3 py-1 rounded-full text-xs font-bold uppercase ${badge.bgColor} ${badge.color}`}
          >
            {badge.label}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-400 text-xs">Fecha</p>
            <p className="font-medium">
              {cotizacion.fecha_solicitud
                ? new Date(cotizacion.fecha_solicitud).toLocaleDateString('es-PE')
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Vencimiento</p>
            <p className="font-medium">
              {cotizacion.fecha_vencimiento
                ? new Date(cotizacion.fecha_vencimiento).toLocaleDateString('es-PE')
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Moneda</p>
            <p className="font-medium">{moneda}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Total</p>
            <p className="font-bold text-lg">
              {formatMontoCotizacion(cotizacion.total_estimado, moneda)}
            </p>
          </div>
        </div>

        {cotizacion.notas && (
          <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{cotizacion.notas}</p>
        )}
      </div>

      <CotizacionProveedorPdfUpload
        cotizacionId={cotizacion.id}
        pdfUrl={cotizacion.pdf_url}
        onUpload={async (file) => {
          await subirPdf(cotizacion.id, file);
          onPdfUploaded?.();
        }}
      />

      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3">Descripción</th>
              <th className="text-right p-3">Cant.</th>
              <th className="text-right p-3">P. unit.</th>
              <th className="text-right p-3">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id ?? i} className="border-t">
                <td className="p-3">{item.descripcion}</td>
                <td className="p-3 text-right">
                  {Number(item.cantidad)} {item.unidad ?? ''}
                </td>
                <td className="p-3 text-right">
                  {formatMontoCotizacion(item.precio_unitario, moneda)}
                </td>
                <td className="p-3 text-right font-medium">
                  {formatMontoCotizacion(
                    item.subtotal ?? Number(item.cantidad) * Number(item.precio_unitario),
                    moneda,
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
