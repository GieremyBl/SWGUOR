'use client';

import { Package, Layers, AlertCircle } from 'lucide-react';
import { COMPANY_PALETTE } from '@/components/admin/dashboards/widgets/DashboardUtils';
import { FinRow } from './PedidoDetalleUI';
import { fmt, type DetallePedidoData } from './types';

const G = COMPANY_PALETTE;

interface TabItemsProps {
  pedido: DetallePedidoData;
}

export function TabItems({ pedido }: TabItemsProps) {
  const items = pedido.pedido_items ?? [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Package size={40} className="text-stone-200" />
        <p className="text-[11px] font-black text-stone-400 uppercase tracking-widest">
          Sin items en este pedido
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Tabla full-width */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-1.5">

          {/* Cabecera */}
          <thead>
            <tr>
              {[
                { label: 'Producto',  align: 'text-left',   width: 'w-[35%]' },
                { label: 'Variante',  align: 'text-center', width: 'w-[15%]' },
                { label: 'Cant.',     align: 'text-center', width: 'w-[12%]' },
                { label: 'P. Unit.', align: 'text-right',  width: 'w-[14%]' },
                { label: 'Subtotal', align: 'text-right',  width: 'w-[14%]' },
                { label: 'Tipo',     align: 'text-center', width: 'w-[10%]' },
              ].map((h) => (
                <th
                  key={h.label}
                  className={`${h.align} ${h.width} px-3 py-2 text-[10px] font-black text-stone-400 uppercase tracking-widest`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Filas */}
          <tbody>
            {items.map((item) => {
              const espec    = item.especificaciones as Record<string, any> | null;
              const precio   = Number(espec?.precio_unitario ?? item.precio_unitario ?? 0);
              const subtotal = precio * item.cantidad;

              return (
                <tr
                  key={item.id}
                  className="group"
                >
                  {/* Producto */}
                  <td className="bg-stone-50 group-hover:bg-white border border-r-0 border-stone-100 group-hover:border-stone-200 rounded-l-xl px-4 py-3 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.productos?.imagen ? (
                          <img
                            src={item.productos.imagen}
                            alt={item.productos.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Layers size={14} style={{ color: G.accent }} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-stone-900 leading-tight truncate">
                          {item.productos?.nombre ?? 'Producto eliminado'}
                        </p>
                        {item.productos?.sku && (
                          <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wide mt-0.5">
                            SKU: {item.productos.sku}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Variante */}
                  <td className="bg-stone-50 group-hover:bg-white border-y border-stone-100 group-hover:border-stone-200 px-3 py-3 text-center transition-all">
                    <div className="flex flex-col items-center gap-1">
                      {item.variantes_producto?.color && (
                        <span className="text-[9px] font-bold text-stone-600 bg-stone-200/60 px-2 py-0.5 rounded-md whitespace-nowrap">
                          {item.variantes_producto.color}
                        </span>
                      )}
                      {item.variantes_producto?.talla && (
                        <span className="text-[9px] font-bold text-stone-600 bg-stone-200/60 px-2 py-0.5 rounded-md">
                          T: {item.variantes_producto.talla}
                        </span>
                      )}
                      {!item.variantes_producto?.color && !item.variantes_producto?.talla && (
                        <span className="text-[9px] text-stone-300 font-bold">—</span>
                      )}
                    </div>
                  </td>

                  {/* Cantidad */}
                  <td className="bg-stone-50 group-hover:bg-white border-y border-stone-100 group-hover:border-stone-200 px-3 py-3 text-center transition-all">
                    <span className="text-xs font-black text-stone-900">
                      {item.cantidad.toLocaleString('es-PE')}
                    </span>
                    <p className="text-[9px] text-stone-400 font-bold uppercase">uds.</p>
                  </td>

                  {/* Precio unitario */}
                  <td className="bg-stone-50 group-hover:bg-white border-y border-stone-100 group-hover:border-stone-200 px-3 py-3 text-right transition-all">
                    <span className="text-xs font-bold text-stone-700">
                      {fmt(precio, pedido.moneda)}
                    </span>
                  </td>

                  {/* Subtotal */}
                  <td className="bg-stone-50 group-hover:bg-white border-y border-stone-100 group-hover:border-stone-200 px-3 py-3 text-right transition-all">
                    <span className="text-xs font-black" style={{ color: G.accent }}>
                      {fmt(subtotal, pedido.moneda)}
                    </span>
                  </td>

                  {/* Tipo prenda */}
                  <td className="bg-stone-50 group-hover:bg-white border border-l-0 border-stone-100 group-hover:border-stone-200 rounded-r-xl px-3 py-3 text-center transition-all">
                    {espec?.prenda_tipo ? (
                      <span className="text-[9px] font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded-lg whitespace-nowrap">
                        {espec.prenda_tipo}
                      </span>
                    ) : (
                      <span className="text-[9px] text-stone-300 font-bold">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Resumen financiero */}
      <div className="bg-white border border-stone-100 rounded-2xl p-5 max-w-sm ml-auto">
        <FinRow label="Subtotal"         value={pedido.subtotal}         moneda={pedido.moneda} />
        {pedido.monto_descuento > 0 && (
          <FinRow label="Descuento"      value={-pedido.monto_descuento} moneda={pedido.moneda} />
        )}
        {pedido.costo_envio > 0 && (
          <FinRow label="Costo de envío" value={pedido.costo_envio}      moneda={pedido.moneda} />
        )}
        <FinRow label="IGV (18%)"        value={pedido.igv}              moneda={pedido.moneda} />
        <div className="border-t border-stone-100 mt-2 pt-2">
          <FinRow label="TOTAL"          value={pedido.total}            moneda={pedido.moneda} accent large />
        </div>
      </div>

    </div>
  );
}