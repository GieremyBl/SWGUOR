'use client';

import { Tag, Package } from 'lucide-react';

interface Categoria {
    id: number | bigint | null;
    nombre: string;
    imagen: string | null;
}

interface InfoProductoProps {
    nombre: string;
    descripcion?: string | null;
    codigo?: string | null;
    categoria: Categoria;
    stockDisponible: number;
    precioBase: number;
}

function formatPrecio(n: number) {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2,
    }).format(n);
}

export default function InfoProducto({
    nombre,
    descripcion,
    codigo,
    categoria,
    stockDisponible,
    precioBase,
}: InfoProductoProps) {
    const stockBajo = stockDisponible < 600;

    return (
        <div className="space-y-4">
            {/* Categoría */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                    <Tag size={11} />
                    {categoria.nombre}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                    <Package size={11} />
                    Catálogo Mayorista
                </span>
            </div>

            {/* Título del Producto */}
            <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    {nombre}
                </h1>
                {codigo && (
                    <p className="text-xs text-slate-500 mt-1 font-mono tracking-wide">
                        Código: {codigo}
                    </p>
                )}
            </div>

            {/* Descripción */}
            {descripcion && (
                <p className="text-sm text-slate-600 leading-relaxed">{descripcion}</p>
            )}

            {/* Precio base + Stock disponible (BLOQUE DE CONTRASTE MEJORADO) */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 mt-4 bg-slate-50 p-4 rounded-xl">
                <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Precio lista</p>
                    <p className="text-lg font-extrabold text-slate-900 opacity-100">
                        {formatPrecio(precioBase)}
                        <span className="text-xs font-normal text-slate-500 ml-1">/ u</span>
                    </p>
                </div>
            </div>
        </div>
    );
}