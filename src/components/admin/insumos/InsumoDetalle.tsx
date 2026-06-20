'use client';

import Link from 'next/link';
import { ArrowLeft, Package, Building2, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TIPOS_INSUMO } from '@/lib/constants/insumos';
import { UNIDADES_MEDIDA, ESTADOS_ORDEN_COMPRA, ESTADOS_PAGO_ORDEN_COMPRA } from '@/lib/constants/estados';
import { formatNumeroOc } from '@/lib/helpers/ordenes-compra-helpers';
import type { InsumoDetalleRow } from '@/lib/helpers/insumos-helpers';
import type { EstadoOrdenCompra, EstadoPagoOrdenCompra, TipoInsumo, UnidadMedida } from '@prisma/client';

interface Props {
  insumo: InsumoDetalleRow;
}

const cardClass = 'bg-white border border-gray-100 rounded-2xl shadow-sm p-6';

export function InsumoDetalle({ insumo }: Props) {
  const stock = Number(insumo.stock_actual);
  const minimo = Number(insumo.stock_minimo);
  const unidad = UNIDADES_MEDIDA[insumo.unidad_medida as UnidadMedida]?.label ?? insumo.unidad_medida;
  const items = insumo.ordenes_compra_items ?? [];

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/admin/Panel-Administrativo/insumos">
            <Button variant="outline" size="icon" className="rounded-xl">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-guor-ink">{insumo.nombre}</h1>
            <p className="text-sm text-guor-soft mt-1">
              {TIPOS_INSUMO[insumo.tipo as TipoInsumo]?.label} · {insumo.categoria_insumo?.nombre ?? 'Sin categoría'}
            </p>
          </div>
        </div>
        <Link href="/admin/Panel-Administrativo/inventario">
          <Button variant="outline" className="rounded-xl">
            <Warehouse className="w-4 h-4 mr-2" />
            Ver en inventario
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Package className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Stock</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stock.toLocaleString('es-PE')} <span className="text-sm font-normal text-gray-500">{unidad}</span></p>
          <p className="text-xs text-gray-500 mt-1">Mínimo: {minimo.toLocaleString('es-PE')}</p>
        </div>
        <div className={cardClass}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Precio referencial</p>
          <p className="text-2xl font-bold text-gray-900">S/ {Number(insumo.precio_unitario ?? 0).toFixed(2)}</p>
        </div>
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Building2 className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Proveedor</span>
          </div>
          <p className="font-semibold text-gray-800">{insumo.proveedores?.razon_social ?? '—'}</p>
          {insumo.proveedores?.ruc && (
            <p className="text-xs text-gray-500">RUC {insumo.proveedores.ruc}</p>
          )}
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Historial en órdenes de compra ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Este insumo aún no aparece en ninguna orden de compra.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b">
                  <th className="py-3 pr-4">N° OC</th>
                  <th className="py-3 pr-4">Proveedor OC</th>
                  <th className="py-3 pr-4 text-right">Cant. pedida</th>
                  <th className="py-3 pr-4 text-right">Recibida</th>
                  <th className="py-3 pr-4 text-right">P. unit.</th>
                  <th className="py-3 pr-4">Estado</th>
                  <th className="py-3">Pago</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const oc = item.ordenes_compra;
                  const estadoCfg = ESTADOS_ORDEN_COMPRA[oc.estado as EstadoOrdenCompra];
                  const pagoCfg = ESTADOS_PAGO_ORDEN_COMPRA[oc.estado_pago as EstadoPagoOrdenCompra];
                  return (
                    <tr key={item.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/admin/Panel-Administrativo/ordenes-compra/${oc.id}`}
                          className="font-semibold text-amber-700 hover:underline"
                        >
                          {formatNumeroOc(oc.id)}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-sm text-gray-600">
                        {oc.proveedores?.razon_social ?? '—'}
                      </td>
                      <td className="py-3 pr-4 text-right font-medium">
                        {Number(item.cantidad_pedida).toLocaleString('es-PE')}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        {Number(item.cantidad_recibida).toLocaleString('es-PE')}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        S/ {Number(item.precio_unitario).toFixed(2)}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${estadoCfg?.bgColor ?? 'bg-gray-100'} ${estadoCfg?.color ?? 'text-gray-600'}`}>
                          {estadoCfg?.label ?? oc.estado}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${pagoCfg?.bgColor ?? 'bg-gray-100'} ${pagoCfg?.color ?? 'text-gray-600'}`}>
                          {pagoCfg?.label ?? oc.estado_pago}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
