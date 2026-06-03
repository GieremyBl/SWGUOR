'use client';

import { Trash2, AlertTriangle, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers/format-helpers';
import { cn } from '@/lib/utils';
import { usePortal } from '@/lib/hooks/usePortal';
import { type ItemCotizacion } from '@/components/portal/_contexts/PortalContext';
import { resolveCartMoq } from '@/lib/constants/portal-b2b';


interface Props {
    item: ItemCotizacion;
}

export function ItemResumen({ item }: Props) {
    const { eliminarDelBorrador } = usePortal();
    const moqOk = item.cantidad >= resolveCartMoq(item);

    return (
        <article
            className={cn(
                'border rounded-xl p-3 space-y-2 transition-colors',
                moqOk
                    ? 'border-guor-stone bg-white hover:border-guor-stone-mid'
                    : 'border-amber-200 bg-amber-50/40',
            )}
        >
            {/* Imagen + nombre + eliminar */}
            <div className="flex items-start gap-3">

                {/* Thumbnail — igual que en CatalogoCotizacion */}
                <div
                    className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border"
                    style={{
                        backgroundColor: 'var(--guor-cream, #fff4e2)',
                        borderColor: 'var(--guor-stone, #e2d9cf)',
                    }}
                >
                    {item.imagen
                        ? (
                            <img
                                src={item.imagen}
                                alt={item.nombre}
                                className="w-full h-full object-cover"
                            />
                        )
                        : (
                            <Package size={18} className="m-auto mt-3 opacity-20" />
                        )
                    }
                </div>

                {/* Info + botón eliminar */}
                <div className="flex items-start justify-between gap-2 flex-1 min-w-0">
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-guor-dark truncate">{item.nombre}</p>
                        <p className="text-[10px] text-guor-muted mt-0.5">
                            {item.talla} · {item.color}
                        </p>
                        <p className="text-[9px] text-guor-muted/70 mt-0.5 font-mono uppercase tracking-wide">
                            {item.sku}
                        </p>
                    </div>
                    <button
                        onClick={() => eliminarDelBorrador(item.variante_id)}
                        aria-label={`Eliminar ${item.nombre}`}
                        className="text-guor-300 hover:text-red-500 transition-colors shrink-0 focus:outline-none focus:ring-1 focus:ring-red-400 rounded"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            {/* Cantidad + subtotal */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-guor-muted">
                        Cant.
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-guor-100 text-guor-dark tabular-nums border border-guor-stone">
                        {item.cantidad.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-guor-muted">uds</span>
                </div>
                <span className="text-xs font-black text-guor-dark tabular-nums">
                    {formatCurrency(item.subtotal)}
                </span>
            </div>

            {/* Aviso MOQ */}
            {!moqOk && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-700 font-medium" role="alert">
                    <AlertTriangle size={11} aria-hidden="true" />
                    Mínimo {resolveCartMoq.toLocaleString()} uds — ajusta la cantidad
                </div>
            )}
        </article>
    );
}