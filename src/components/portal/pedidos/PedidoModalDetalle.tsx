'use client';

import { useEffect, useState } from 'react';
import { X, Package, MapPin, FileText, ShoppingBag } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Pedido } from './PedidoCard';
import { exportPedidoToPDF } from '@/lib/utils/export-utils';


// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PedidoItemDB {
    id: number;
    cantidad: number;
    especificaciones: Record<string, unknown> | null;
    productos: {
        sku: string;
        nombre: string;
    } | null;
    variantes_producto: {
        talla: string;
        color: string;
    } | null;
}

export interface PedidoConDetalles extends Pedido {
    direccion_envio?: string | null;
    notas?: string | null;
    // 'items' ya no se pasa como prop: se obtienen directamente desde Supabase
}

interface PedidoModalDetalleProps {
    pedido: PedidoConDetalles | null;
    isOpen: boolean;
    onClose: () => void;
    onPagar?: (pedido: Pedido) => void;
}

// ─── Skeleton de fila ─────────────────────────────────────────────────────────

function ItemSkeleton() {
    return (
        <div className="grid grid-cols-12 p-3 items-center gap-2 animate-pulse">
            <div className="col-span-7 space-y-1.5">
                <div className="h-2 w-14 bg-neutral-200 rounded" />
                <div className="h-3 w-40 bg-neutral-200 rounded" />
                <div className="h-4 w-24 bg-amber-100 rounded" />
            </div>
            <div className="col-span-2 flex justify-center">
                <div className="h-3 w-8 bg-neutral-200 rounded" />
            </div>
            <div className="col-span-3 flex justify-end">
                <div className="h-3 w-16 bg-neutral-200 rounded" />
            </div>
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function PedidoModalDetalle({
    pedido,
    isOpen,
    onClose,
    onPagar,
}: PedidoModalDetalleProps) {
    const [items, setItems] = useState<PedidoItemDB[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);
   
    // Fetch pedido_items cuando el modal abre con un pedido válido
    useEffect(() => {
        if (!isOpen || !pedido?.id) {
            setItems([]);
            return;
        }

        const fetchItems = async () => {
            setLoadingItems(true);
            try {
                const supabase = getSupabaseBrowserClient();
                const { data } = await supabase
                    .from('pedido_items')
                    .select(`
            id,
            cantidad,
            especificaciones,
            productos ( sku, nombre ),
            variantes_producto ( talla, color )
          `)
                    .eq('pedido_id', pedido.id)
                    .order('id');

                setItems((data as PedidoItemDB[]) ?? []);
            } finally {
                setLoadingItems(false);
            }
        };

        fetchItems();
    }, [isOpen, pedido?.id]);

    if (!isOpen || !pedido) return null;

    const formatMoney = (amount: number) =>
        new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: pedido.moneda || 'PEN',
        }).format(amount);

    const fechaFormateada = new Date(pedido.created_at).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const subtotalNeto = pedido.total / 1.18;
    const igvCalculado = pedido.total - subtotalNeto;
    const handleDescargarPDF = async () => {
    try {
      await exportPedidoToPDF({
        pedido,
        items,
      });
    } catch (error) {
      console.error('Error generando PDF:', error);
    }
  };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col border animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]"
                style={{ borderColor: 'var(--guor-stone)' }}
            >

                {/* ── Header ──────────────────────────────────────────────────── */}
                <div
                    className="p-5 border-b flex justify-between items-center bg-neutral-50"
                    style={{ borderColor: 'var(--guor-stone)' }}
                >
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-white border" style={{ borderColor: 'var(--guor-stone)' }}>
                            <Package size={15} style={{ color: 'var(--guor-gold)' }} />
                        </div>
                        <div>
                            <h3
                                className="text-xs font-black uppercase tracking-widest"
                                style={{ color: 'var(--guor-dark)' }}
                            >
                                Detalle del Pedido #{pedido.id}
                            </h3>
                            <p
                                className="text-[10px] font-medium opacity-50 mt-0.5"
                                style={{ color: 'var(--guor-dark)' }}
                            >
                                Registrado el {fechaFormateada}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="opacity-40 hover:opacity-100 transition-opacity p-1.5 rounded-lg border bg-white hover:bg-neutral-50"
                        style={{ color: 'var(--guor-dark)', borderColor: 'var(--guor-stone)' }}
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* ── Body ────────────────────────────────────────────────────── */}
                <div className="p-6 overflow-y-auto space-y-6 text-xs">

                    {/* Dirección y notas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                            className="p-3.5 rounded-xl border bg-neutral-50/50 space-y-1"
                            style={{ borderColor: 'var(--guor-stone)' }}
                        >
                            <span
                                className="text-[9px] font-black uppercase tracking-widest opacity-40 flex items-center gap-1"
                                style={{ color: 'var(--guor-dark)' }}
                            >
                                <MapPin size={11} /> Dirección de Envío
                            </span>
                            <p
                                className="font-bold opacity-80 uppercase text-[11px]"
                                style={{ color: 'var(--guor-dark)' }}
                            >
                                {pedido.direccion_envio || 'Retiro en Almacén Central GUOR'}
                            </p>
                        </div>

                        <div
                            className="p-3.5 rounded-xl border bg-neutral-50/50 space-y-1"
                            style={{ borderColor: 'var(--guor-stone)' }}
                        >
                            <span
                                className="text-[9px] font-black uppercase tracking-widest opacity-40 flex items-center gap-1"
                                style={{ color: 'var(--guor-dark)' }}
                            >
                                <FileText size={11} /> Notas del Pedido
                            </span>
                            <p
                                className="font-medium opacity-70 italic text-[11px]"
                                style={{ color: 'var(--guor-dark)' }}
                            >
                                {pedido.notas || 'Sin notas adicionales.'}
                            </p>
                        </div>
                    </div>

                    {/* Artículos del Pedido */}
                    <div className="space-y-2">
                        <span
                            className="text-[9px] font-black uppercase tracking-widest opacity-50 block"
                            style={{ color: 'var(--guor-dark)' }}
                        >
                            Artículos del Pedido
                        </span>

                        <div
                            className="border rounded-xl overflow-hidden bg-white"
                            style={{ borderColor: 'var(--guor-stone)' }}
                        >
                            {/* Cabecera de tabla */}
                            <div
                                className="grid grid-cols-12 bg-neutral-50 p-2.5 border-b font-black text-[9px] uppercase tracking-widest opacity-60"
                                style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}
                            >
                                <div className="col-span-7">Producto</div>
                                <div className="col-span-2 text-center">Cant.</div>
                                <div className="col-span-3 text-right">P. Unitario</div>
                            </div>

                            {/* Filas */}
                            <div className="divide-y divide-neutral-100 max-h-52 overflow-y-auto">
                                {loadingItems ? (
                                    <>
                                        <ItemSkeleton />
                                        <ItemSkeleton />
                                        <ItemSkeleton />
                                    </>
                                ) : items.length > 0 ? (
                                    items.map((item) => {
                                        // precio_unitario se guarda en especificaciones al momento de crear el pedido
                                        const precioUnitario = item.especificaciones?.precio_unitario as number | undefined;
                                        return (
                                            <div
                                                key={item.id}
                                                className="grid grid-cols-12 p-3 items-center font-medium"
                                                style={{ color: 'var(--guor-dark)' }}
                                            >
                                                <div className="col-span-7 space-y-0.5">
                                                    <span className="text-[9px] font-mono opacity-40 uppercase tracking-tight block">
                                                        {item.productos?.sku ?? '—'}
                                                    </span>
                                                    <p className="font-black uppercase text-[11px] truncate">
                                                        {item.productos?.nombre ?? 'Producto sin nombre'}
                                                    </p>
                                                    {item.variantes_producto && (
                                                        <span className="inline-flex items-center text-[10px] text-amber-600 font-bold uppercase tracking-wide bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                                            Talla {item.variantes_producto.talla} · {item.variantes_producto.color}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="col-span-2 text-center font-black tabular-nums">
                                                    {item.cantidad}
                                                    <span className="text-[9px] font-normal opacity-40"> uds</span>
                                                </div>
                                                <div className="col-span-3 text-right tabular-nums opacity-70">
                                                    {precioUnitario != null ? formatMoney(precioUnitario) : '—'}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-8 text-center" style={{ color: 'var(--guor-dark)' }}>
                                        <p className="text-[10px] opacity-40">No se encontraron artículos para este pedido.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Resumen de pago */}
                    <div
                        className="p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
                        style={{ backgroundColor: 'var(--guor-cream)', borderColor: 'var(--guor-stone)' }}
                    >
                        <div className="space-y-1">
                            <span
                                className="text-[9px] font-black uppercase tracking-widest opacity-50 block"
                                style={{ color: 'var(--guor-dark)' }}
                            >
                                Estado de Pago
                            </span>
                            <div className="flex items-center gap-1.5">
                                <div
                                    className={`w-2 h-2 rounded-full ${pedido.estado_pago === 'verificado' ? 'bg-emerald-500' : 'bg-amber-500'
                                        }`}
                                />
                                <span
                                    className="font-black uppercase text-[10px] tracking-wider"
                                    style={{ color: 'var(--guor-dark)' }}
                                >
                                    {pedido.estado_pago === 'verificado' ? 'Pago Verificado' : 'Pendiente de Pago'}
                                </span>
                            </div>
                        </div>

                        <div
                            className="space-y-1.5 text-right min-w-[180px] border-t md:border-t-0 pt-2 md:pt-0"
                            style={{ borderColor: 'var(--guor-stone)' }}
                        >
                            <div
                                className="flex justify-between text-[10px] opacity-60 font-bold"
                                style={{ color: 'var(--guor-dark)' }}
                            >
                                <span>Subtotal neto:</span>
                                <span className="tabular-nums">{formatMoney(subtotalNeto)}</span>
                            </div>
                            <div
                                className="flex justify-between text-[10px] opacity-60 font-bold"
                                style={{ color: 'var(--guor-dark)' }}
                            >
                                <span>IGV (18%):</span>
                                <span className="tabular-nums">{formatMoney(igvCalculado)}</span>
                            </div>
                            <div
                                className="flex justify-between items-baseline font-black border-t pt-1"
                                style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}
                            >
                                <span className="text-[9px] uppercase tracking-wider opacity-60">Total:</span>
                                <span className="text-sm font-black" style={{ color: 'var(--guor-gold)' }}>
                                    {formatMoney(pedido.total)}
                                </span>
                            </div>
                        </div>
                    </div>
                   
                    {/* Descarga */} 
                  {/* Descarga detalle */}
<div className="flex justify-end">
  <button
    type="button"
    onClick={handleDescargarPDF}
    className="h-10 px-5 rounded-xl font-black uppercase tracking-widest text-white shadow-md transition-all active:scale-[0.97] hover:opacity-90"
    style={{ backgroundColor: 'var(--guor-dark)' }}
  >
    Descargar PDF
  </button>

</div>
                   
                </div>

                {/* ── Footer ──────────────────────────────────────────────────── */}
                <div
                    className="p-4 border-t bg-neutral-50 flex justify-end gap-3"
                    style={{ borderColor: 'var(--guor-stone)' }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-10 px-4 rounded-xl font-bold uppercase tracking-wider text-[10px] border bg-white hover:bg-neutral-50 transition-colors"
                        style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}
                    >
                        Cerrar
                    </button>

                    {pedido.estado_pago !== 'verificado' && onPagar && (
                        <button
                            type="button"
                            onClick={() => {
                                onPagar(pedido);
                                onClose();
                            }}
                            className="h-10 px-5 rounded-xl font-black uppercase tracking-widest text-white shadow-md transition-all active:scale-[0.97] flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
                            style={{ backgroundColor: 'var(--guor-dark)' }}
                        >
                            <ShoppingBag size={13} style={{ color: 'var(--guor-gold)' }} />
                            Adjuntar Comprobante
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}