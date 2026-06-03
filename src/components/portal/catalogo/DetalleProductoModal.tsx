'use client';

import { X, Info, Package } from 'lucide-react';
import { ProductoPortal } from '@/components/portal/_contexts/PortalContext';
import { formatCurrency } from '@/lib/helpers/format-helpers';
import { COLOR_MAP } from '@/lib/constants/colores';

interface DetallesProductoModalProps {
    producto: ProductoPortal | null;
    isOpen: boolean;
    onClose: () => void;
}

const formatearColor = (color: string) =>
    color.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

/**
 * Función auxiliar para asegurar que colores y tallas 
 * se transformen en un array iterable sin importar cómo vengan desde la DB.
 */
function parsearAtributoSeguro(data: unknown): string[] {
    if (!data) return [];
    if (Array.isArray(data)) return data.map(String);
    if (typeof data === 'string') {
        try {
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch {
            // Si no es un JSON válido pero tiene texto separado por comas
            return data.split(',').map((str) => str.trim()).filter(Boolean);
        }
    }
    return [];
}

export function DetallesProductoModal({ producto, isOpen, onClose }: DetallesProductoModalProps) {
    if (!isOpen || !producto) return null;

    // Ejecución del parseo seguro para evitar "colores.map is not a function"
    const colores = parsearAtributoSeguro(producto.colores_disponibles);
    const tallas = parsearAtributoSeguro(producto.tallas_disponibles);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                style={{ backgroundColor: 'var(--guor-cream)', border: '1px solid var(--guor-stone)' }}
            >
                {/* Encabezado */}
                <div
                    className="px-6 py-5 flex justify-between items-center border-b"
                    style={{ backgroundColor: 'var(--guor-cream-deep)', borderColor: 'var(--guor-stone)' }}
                >
                    <div>
                        <h2
                            className="text-lg font-black uppercase tracking-tight"
                            style={{ color: 'var(--guor-dark)' }}
                        >
                            {producto.nombre}
                        </h2>
                        <p
                            className="text-[11px] font-bold uppercase tracking-widest mt-0.5"
                            style={{ color: 'var(--guor-gold)' }}
                        >
                            SKU: {producto.sku || 'N/D'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-black/10"
                        style={{ color: 'var(--guor-dark)' }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Contenido */}
                <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">

                    {/* Descripción */}
                    <section>
                        <div
                            className="flex items-center gap-2 mb-2"
                            style={{ color: 'var(--guor-gold)' }}
                        >
                            <Info size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Descripción</span>
                        </div>
                        <p
                            className="text-sm leading-relaxed p-4 rounded-2xl border"
                            style={{
                                backgroundColor: 'white',
                                borderColor: 'var(--guor-stone)',
                                color: 'var(--guor-dark)',
                            }}
                        >
                            {producto.descripcion || 'Sin descripción técnica disponible.'}
                        </p>
                    </section>

                    {/* Estructura del Modelo */}
                    <section>
                        <div
                            className="flex items-center gap-2 mb-3"
                            style={{ color: 'var(--guor-gold)' }}
                        >
                            <Package size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Estructura del Modelo</span>
                        </div>

                        <div
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border"
                            style={{ backgroundColor: 'white', borderColor: 'var(--guor-stone)' }}
                        >
                            {/* Colores */}
                            <div>
                                <span
                                    className="block text-[10px] font-black uppercase tracking-widest mb-3"
                                    style={{ color: 'var(--guor-dark)', opacity: 0.5 }}
                                >
                                    Colores Habilitados
                                </span>
                                {colores.length === 0 ? (
                                    <p className="text-xs italic text-slate-400">Estándar / Único</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {colores.map((c) => (
                                            <span
                                                key={c}
                                                title={formatearColor(c)}
                                                className="w-7 h-7 rounded-full border-2 border-white shadow-sm shrink-0 hover:scale-110 transition-transform"
                                                style={{
                                                    backgroundColor: COLOR_MAP[c.toLowerCase()] ?? '#e5e7eb',
                                                    outline: '1px solid var(--guor-stone-mid)',
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Tallas */}
                            <div>
                                <span
                                    className="block text-[10px] font-black uppercase tracking-widest mb-3"
                                    style={{ color: 'var(--guor-dark)', opacity: 0.5 }}
                                >
                                    Tallas Disponibles
                                </span>
                                {tallas.length === 0 ? (
                                    <p className="text-xs italic text-slate-400">Tamaño Único (U)</p>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                        {tallas.map((t) => (
                                            <span
                                                key={t}
                                                className="px-3 py-1 rounded-lg font-black text-xs border"
                                                style={{
                                                    backgroundColor: 'var(--guor-cream-deep)',
                                                    borderColor: 'var(--guor-stone-mid)',
                                                    color: 'var(--guor-dark)',
                                                }}
                                            >
                                                {t.toUpperCase()}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Detalles de MOQ y Precio */}
                        <div className="mt-4 flex justify-between items-center px-1">
                            <div>
                                {producto.moq && (
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Pedido Mínimo (MOQ): <span className="font-black text-slate-700">{producto.moq} uds</span>
                                    </p>
                                )}
                            </div>
                            <div>
                                <p
                                    className="text-[10px] uppercase tracking-widest font-bold"
                                    style={{ color: 'var(--guor-dark)', opacity: 0.5 }}
                                >
                                    Precio base:{' '}
                                    <span
                                        className="text-sm font-black normal-case tracking-normal"
                                        style={{ color: 'var(--guor-gold)', opacity: 1 }}
                                    >
                                        {formatCurrency(producto.precio)}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}