'use client';

import Image from 'next/image';
import {
  ChevronDown,
  ExternalLink,
  FileText,
  Layers,
  Ruler,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { urlVerArchivoFicha } from '@/lib/helpers/ficha-tecnica-upload.client';
import type { ItemCorteConFicha } from '@/lib/helpers/registrar-corte-pedido.helper';

interface Props {
  item: ItemCorteConFicha;
  defaultOpen?: boolean;
}

function abrirArchivo(ref: string | null | undefined) {
  const url = urlVerArchivoFicha(ref);
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
}

export function CortadorItemFichaCard({ item, defaultOpen = true }: Props) {
  const { ficha } = item;
  const variante =
    [item.varianteColor, item.varianteTalla].filter(Boolean).join(' · ') || null;

  return (
    <details
      open={defaultOpen}
      className="group rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm"
    >
      <summary className="cursor-pointer list-none px-5 py-4 flex flex-wrap items-center justify-between gap-3 hover:bg-stone-50/80 transition-colors [&::-webkit-details-marker]:hidden">
        <div className="flex items-start gap-3 min-w-0">
          <FileText size={18} className="text-orange-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h3 className="font-black text-stone-900 text-sm truncate">
              {item.productoNombre}
            </h3>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">
              Ítem #{item.itemId}
              {item.productoSku ? ` · SKU ${item.productoSku}` : ''}
              {variante ? ` · ${variante}` : ''}
              {' · '}
              Cant. {item.cantidad}
            </p>
            {ficha && (
              <p className="text-[10px] text-stone-500 font-medium mt-1">
                Ficha v{ficha.version ?? '—'} · {ficha.estado ?? '—'}
              </p>
            )}
          </div>
        </div>
        <ChevronDown
          size={18}
          className="text-stone-400 shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-stone-100 p-5 space-y-5">
        {!ficha ? (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
            No hay ficha técnica aprobada para este producto. Solicite al diseñador que la
            complete y apruebe antes de cortar.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {ficha.ficha_url && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] font-black uppercase tracking-widest"
                  onClick={() => abrirArchivo(ficha.ficha_url)}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  Ver PDF
                </Button>
              )}
              {ficha.imagen_geometral && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] font-black uppercase tracking-widest"
                  onClick={() => abrirArchivo(ficha.imagen_geometral)}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  Ver Firma
                </Button>
              )}
            </div>

            {(ficha.ficha_url || ficha.imagen_geometral) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ficha.ficha_url && (
                  <div className="rounded-xl border border-stone-200 bg-stone-50 overflow-hidden shadow-inner">
                    <iframe
                      title={`Ficha PDF — ${item.productoNombre}`}
                      src={urlVerArchivoFicha(ficha.ficha_url) ?? undefined}
                      className="w-full h-[260px] bg-white"
                    />
                  </div>
                )}
                {ficha.imagen_geometral && (
                  <div className="relative rounded-xl border border-stone-200 bg-stone-50 overflow-hidden min-h-[260px] flex items-center justify-center p-2">
                    <Image
                      src={
                        urlVerArchivoFicha(ficha.imagen_geometral) ??
                        ficha.imagen_geometral
                      }
                      alt="Imagen geométrica / firma"
                      width={400}
                      height={260}
                      className="max-h-[240px] w-auto object-contain"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            )}

            {ficha.descripcionTexto && (
              <p className="text-sm text-stone-600 whitespace-pre-wrap rounded-lg bg-stone-50 border border-stone-100 px-4 py-3">
                {ficha.descripcionTexto}
              </p>
            )}

            <div>
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Layers size={12} /> Materiales e insumos
              </h4>
              {ficha.detalle.length === 0 ? (
                <p className="text-xs text-stone-400">Sin detalle de consumo registrado.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-stone-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-stone-50 text-left">
                        <th className="px-3 py-2 text-[10px] font-black uppercase text-stone-500">
                          Material / Insumo
                        </th>
                        <th className="px-3 py-2 text-[10px] font-black uppercase text-stone-500">
                          Cantidad
                        </th>
                        <th className="px-3 py-2 text-[10px] font-black uppercase text-stone-500">
                          Desperdicio
                        </th>
                        <th className="px-3 py-2 text-[10px] font-black uppercase text-stone-500 hidden sm:table-cell">
                          Observaciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ficha.detalle.map((d) => {
                        const nombre =
                          d.material?.nombre ?? d.insumo?.nombre ?? 'Sin nombre';
                        const unidad =
                          d.material?.unidad ?? d.insumo?.unidad ?? 'u.';
                        return (
                          <tr key={d.id} className="border-t border-stone-100">
                            <td className="px-3 py-2 font-semibold text-stone-800">
                              {nombre}
                              {d.material?.color && (
                                <span className="block text-xs font-normal text-stone-500">
                                  Color: {d.material.color}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-stone-700 whitespace-nowrap">
                              {d.cantidad_consumo} {unidad}
                            </td>
                            <td className="px-3 py-2 text-stone-700 whitespace-nowrap">
                              {d.porcentaje_desperdicio != null
                                ? `${d.porcentaje_desperdicio}%`
                                : '—'}
                            </td>
                            <td className="px-3 py-2 text-xs text-stone-500 hidden sm:table-cell">
                              {d.observaciones ?? '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {ficha.medidas.length > 0 && (
              <div>
                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Ruler size={12} /> Tabla de medidas
                </h4>
                <div className="overflow-x-auto rounded-lg border border-stone-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-stone-50 text-left">
                        <th className="px-3 py-2 text-[10px] font-black uppercase text-stone-500">
                          Punto de medida
                        </th>
                        <th className="px-3 py-2 text-[10px] font-black uppercase text-stone-500">
                          Talla
                        </th>
                        <th className="px-3 py-2 text-[10px] font-black uppercase text-stone-500">
                          Valor (cm)
                        </th>
                        <th className="px-3 py-2 text-[10px] font-black uppercase text-stone-500">
                          Tolerancia (cm)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ficha.medidas.map((m) => (
                        <tr key={m.id} className="border-t border-stone-100">
                          <td className="px-3 py-2 font-medium text-stone-800">
                            {m.punto_medida ?? '—'}
                          </td>
                          <td className="px-3 py-2 text-stone-700">{m.talla ?? '—'}</td>
                          <td className="px-3 py-2 text-stone-700">
                            {m.valor_cm != null ? m.valor_cm : '—'}
                          </td>
                          <td className="px-3 py-2 text-stone-700">
                            {m.tolerancia != null ? m.tolerancia : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </details>
  );
}
