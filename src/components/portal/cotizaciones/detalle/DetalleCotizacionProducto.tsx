'use client';

import { Package } from 'lucide-react';
import { formatCurrency, formatDateLong } from '@/lib/helpers/format-helpers';
import { EstadoBadge } from '@/components/portal/EstadoBadge';

interface ProductoInfo {
    nombre: string;
    sku: string;
    imagen: string | null;
}

interface CotizacionItem {
    id: number;
    cantidad: number;
    precio_unitario_snapshot: number;
    subtotal: number;
    color_snapshot: string;
    talla_snapshot: string;
    productos: ProductoInfo | null;
}

interface DetalleCotizacionProductosProps {
    numero: string;
    estado: string;
    fechaCreacion: string;
    items: CotizacionItem[];
}

export function DetalleCotizacionProductos({
    numero,
    estado,
    fechaCreacion,
    items,
}: DetalleCotizacionProductosProps) {
    return (
        <div
            className="bg-white border rounded-xl p-8 shadow-sm"
            style={{ borderColor: 'var(--guor-stone)' }}
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-10">
                <div>
                    <p
                        className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1"
                        style={{ color: 'var(--guor-gold)' }}
                    >
                        Documento Oficial
                    </p>
                    <h1
                        className="text-4xl font-black"
                        style={{ color: 'var(--guor-dark)' }}
                    >
                        {numero}
                    </h1>
                    <p className="text-sm font-medium mt-1 opacity-60" style={{ color: 'var(--guor-dark)' }}>
                        Generado el {formatDateLong(fechaCreacion)}
                    </p>
                </div>
                <EstadoBadge
                    estado={estado}
                    tipo="cotizacion"
                    className="scale-125 origin-top-right"
                />
            </div>

            {/* Tabla de productos */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr
                            className="border-b text-[10px] font-black uppercase tracking-widest"
                            style={{ borderColor: 'var(--guor-stone)' }}
                        >
                            <th className="pb-4 text-left" style={{ color: 'var(--guor-dark)' }}>
                                Detalle del Producto
                            </th>
                            <th className="pb-4 text-center" style={{ color: 'var(--guor-dark)' }}>
                                Cant.
                            </th>
                            <th className="pb-4 text-right" style={{ color: 'var(--guor-dark)' }}>
                                Unitario
                            </th>
                            <th className="pb-4 text-right" style={{ color: 'var(--guor-dark)' }}>
                                Subtotal
                            </th>
                        </tr>
                    </thead>
                    <tbody
                        className="divide-y"
                        style={{ borderColor: 'var(--guor-stone)' }}
                    >
                        {items.map((item) => (
                            <tr key={item.id} className="group transition-colors hover:bg-neutral-50/50">
                                <td className="py-6">
                                    <div className="flex items-center gap-4">
                                        {/* Icono placeholder con la paleta corporativa */}
                                        <div
                                            className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0 border"
                                            style={{
                                                backgroundColor: 'var(--guor-cream)',
                                                borderColor: 'var(--guor-stone)',
                                            }}
                                        >
                                            <Package
                                                size={24}
                                                style={{ color: 'var(--guor-gold)' }}
                                            />
                                        </div>
                                        <div>
                                            <p className="font-bold text-base" style={{ color: 'var(--guor-dark)' }}>
                                                {item.productos?.nombre || 'Producto sin nombre'}
                                            </p>
                                            <p
                                                className="text-[10px] font-bold uppercase tracking-tight opacity-60"
                                                style={{ color: 'var(--guor-dark)' }}
                                            >
                                                SKU: {item.productos?.sku}
                                            </p>
                                            <p
                                                className="text-[10px] mt-0.5 opacity-50 font-medium"
                                                style={{ color: 'var(--guor-dark)' }}
                                            >
                                                {item.color_snapshot} · {item.talla_snapshot}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-6 text-center font-bold text-base" style={{ color: 'var(--guor-dark)' }}>
                                    {item.cantidad}
                                </td>
                                <td
                                    className="py-6 text-right font-medium"
                                    style={{ color: 'var(--guor-dark)' }}
                                >
                                    {formatCurrency(item.precio_unitario_snapshot)}
                                </td>
                                <td
                                    className="py-6 text-right font-black text-base"
                                    style={{ color: 'var(--guor-dark)' }}
                                >
                                    {formatCurrency(item.subtotal)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}