'use client';

import { X, Layers, ShoppingBag, MapPin, FileText } from 'lucide-react';
import { Pedido } from './PedidoCard';

// Tipado estricto para las líneas de artículos integrados dentro del lote mayorista
interface DetalleItemB2B {
    id: number;
    cantidad: number;
    precio_unitario: number;
    producto: {
        sku: string;
        nombre: string;
    };
    variante?: {
        talla: string;
        color: string;
    };
}

export interface PedidoConDetalles extends Pedido {
    direccion_envio?: string | null;
    notas?: string | null;
    items?: DetalleItemB2B[]; // Relación con ítems reales en la base de datos
}

interface PedidoModalDetalleProps {
    pedido: PedidoConDetalles | null;
    isOpen: boolean;
    onClose: () => void;
    onPagar?: (pedido: Pedido) => void;
}

export function PedidoModalDetalle({
    pedido,
    isOpen,
    onClose,
    onPagar,
}: PedidoModalDetalleProps) {
    if (!isOpen || !pedido) return null;

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: pedido.moneda || 'PEN',
        }).format(amount);
    };

    const fechaFormateada = new Date(pedido.created_at).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    // Cálculos internos de impuestos comerciales
    const subtotalNeto = pedido.total / 1.18;
    const igvCalculado = pedido.total - subtotalNeto;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col border animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]"
                style={{ borderColor: 'var(--guor-stone)' }}
            >
                {/* Cabecera del Contrato / Orden */}
                <div className="p-5 border-b flex justify-between items-center bg-neutral-50" style={{ borderColor: 'var(--guor-stone)' }}>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-white border" style={{ borderColor: 'var(--guor-stone)' }}>
                            <Layers size={15} style={{ color: 'var(--guor-gold)' }} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--guor-dark)' }}>
                                    Orden Comercial #{pedido.id}
                                </h3>
                            </div>
                            <p className="text-[10px] font-medium opacity-50 mt-0.5" style={{ color: 'var(--guor-dark)' }}>
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

                {/* Cuerpo del Detalle Logístico */}
                <div className="p-6 overflow-y-auto space-y-6 text-xs">

                    {/* Metadatos de Despacho Corporativo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-xl border bg-neutral-50/50 space-y-1" style={{ borderColor: 'var(--guor-stone)' }}>
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-40 flex items-center gap-1" style={{ color: 'var(--guor-dark)' }}>
                                <MapPin size={11} /> Destino Consignado
                            </span>
                            <p className="font-bold opacity-80 uppercase text-[11px]" style={{ color: 'var(--guor-dark)' }}>
                                {pedido.direccion_envio || 'Retiro directo en Almacén Central (GUOR)'}
                            </p>
                        </div>

                        <div className="p-3.5 rounded-xl border bg-neutral-50/50 space-y-1" style={{ borderColor: 'var(--guor-stone)' }}>
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-40 flex items-center gap-1" style={{ color: 'var(--guor-dark)' }}>
                                <FileText size={11} /> Instrucciones de Manufactura
                            </span>
                            <p className="font-medium opacity-70 italic text-[11px]" style={{ color: 'var(--guor-dark)' }}>
                                {pedido.notas || 'Sin especificaciones técnicas adicionales por el cliente.'}
                            </p>
                        </div>
                    </div>

                    {/* Tabla de Lotes Mayoristas */}
                    <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-50 block" style={{ color: 'var(--guor-dark)' }}>
                            Desglose de Modelos & Curva de Tallas
                        </span>

                        <div className="border rounded-xl overflow-hidden bg-white" style={{ borderColor: 'var(--guor-stone)' }}>
                            <div className="grid grid-cols-12 bg-neutral-50 p-2.5 border-b font-black text-[9px] uppercase tracking-widest opacity-60" style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}>
                                <div className="col-span-6">Descripción del Modelo</div>
                                <div className="col-span-2 text-center">Cantidad</div>
                                <div className="col-span-2 text-right">P. Unitario</div>
                                <div className="col-span-2 text-right">Subtotal</div>
                            </div>

                            <div className="divide-y divide-neutral-100 max-h-48 overflow-y-auto">
                                {pedido.items && pedido.items.length > 0 ? (
                                    pedido.items.map((item) => (
                                        <div key={item.id} className="grid grid-cols-12 p-3 items-center font-medium" style={{ color: 'var(--guor-dark)' }}>
                                            <div className="col-span-6 space-y-0.5">
                                                <span className="text-[9px] font-mono opacity-40 uppercase tracking-tight block">
                                                    {item.producto.sku}
                                                </span>
                                                <p className="font-black uppercase text-[11px] truncate">{item.producto.nombre}</p>
                                                {item.variante && (
                                                    <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wide bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                                        Talla {item.variante.talla} — {item.variante.color}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="col-span-2 text-center font-black tabular-nums">
                                                {item.cantidad} <span className="text-[9px] font-normal opacity-40">uds</span>
                                            </div>
                                            <div className="col-span-2 text-right tabular-nums opacity-70">
                                                {formatMoney(item.precio_unitario)}
                                            </div>
                                            <div className="col-span-2 text-right font-black tabular-nums">
                                                {formatMoney(item.precio_unitario * item.cantidad)}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    /* Mock defensivo por si viene directo del historial plano */
                                    <div className="grid grid-cols-12 p-3 items-center font-medium" style={{ color: 'var(--guor-dark)' }}>
                                        <div className="col-span-6">
                                            <p className="font-black uppercase text-[11px]">Consolidado Lote B2B de Calzado</p>
                                            <span className="text-[10px] opacity-40">Distribución mixta configurada</span>
                                        </div>
                                        <div className="col-span-2 text-center font-black tabular-nums">{pedido.total_unidades} uds</div>
                                        <div className="col-span-2 text-right opacity-40">—</div>
                                        <div className="col-span-2 text-right font-black tabular-nums">{formatMoney(pedido.total)}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Liquidación Comercial */}
                    <div className="p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ backgroundColor: 'var(--guor-cream)', borderColor: 'var(--guor-stone)' }}>
                        <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-50 block" style={{ color: 'var(--guor-dark)' }}>
                                Estatus de Crédito / Tesorería
                            </span>
                            <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${pedido.estado_pago === 'verificado' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <span className="font-black uppercase text-[10px] tracking-wider" style={{ color: 'var(--guor-dark)' }}>
                                    Pago {pedido.estado_pago === 'verificado' ? 'Verificado de Fondos' : 'Pendiente de Validación'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1.5 text-right min-w-[180px] border-t md:border-t-0 pt-2 md:pt-0" style={{ borderColor: 'var(--guor-stone)' }}>
                            <div className="flex justify-between text-[10px] opacity-60 font-bold" style={{ color: 'var(--guor-dark)' }}>
                                <span>Subtotal Neto:</span>
                                <span className="tabular-nums">{formatMoney(subtotalNeto)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] opacity-60 font-bold" style={{ color: 'var(--guor-dark)' }}>
                                <span>IGV (18%):</span>
                                <span className="tabular-nums">{formatMoney(igvCalculado)}</span>
                            </div>
                            <div className="flex justify-between items-baseline font-black border-t pt-1" style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}>
                                <span className="text-[9px] uppercase tracking-wider opacity-60">Total Orden:</span>
                                <span className="text-sm font-black" style={{ color: 'var(--guor-gold)' }}>{formatMoney(pedido.total)}</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Comercial */}
                <div className="p-4 border-t bg-neutral-50 flex justify-end gap-3" style={{ borderColor: 'var(--guor-stone)' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-10 px-4 rounded-xl font-bold uppercase tracking-wider text-[10px] border bg-white hover:bg-neutral-50 transition-colors"
                        style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}
                    >
                        Cerrar Ventana
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