'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Minus, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Variante {
    id: number | bigint;
    color: string;
    talla: string;
    stock: number;
    precio_adicional: number;
    precio_final: number;
    sku: string;
    imagen_url: string | null;
}

interface ReglaDescuento {
    cantidad_minima: number;
    descuento_porcentaje: number;
}

interface DetalleProductoFormProps {
    productoId: number | bigint;
    precioBase: number;
    variante: Variante | null;
    listaReglas?: ReglaDescuento[];
    onCantidadChange?: (cantidad: number) => void;
    stockMinimoPedido?: number;
}

function calcularDescuentoDinamico(
    precio: number,
    cantidad: number,
    reglas: ReglaDescuento[]
): { precioUnitario: number; descuentoPct: number; total: number; ahorro: number } {
    const reglasOrdenadas = [...reglas].sort((a, b) => b.cantidad_minima - a.cantidad_minima);
    const reglaAplicable = reglasOrdenadas.find(r => cantidad >= r.cantidad_minima);

    const descuentoPct = reglaAplicable ? reglaAplicable.descuento_porcentaje : 0;
    const precioUnitario = precio * (1 - descuentoPct / 100);
    const total = precioUnitario * cantidad;
    const ahorro = (precio - precioUnitario) * cantidad;

    return { precioUnitario, descuentoPct, total, ahorro };
}

export default function DetalleProductoForm({
    productoId,
    precioBase,
    variante,
    listaReglas = [],
    onCantidadChange,
    stockMinimoPedido = 500,
}: DetalleProductoFormProps) {
    const [cantidad, setCantidad] = useState(stockMinimoPedido);
    const [enviado, setEnviado] = useState(false);

    const { precioUnitario, descuentoPct, total, ahorro } = calcularDescuentoDinamico(
        precioBase,
        cantidad,
        listaReglas
    );

    useEffect(() => {
        if (onCantidadChange) {
            onCantidadChange(cantidad);
        }
    }, [cantidad, onCantidadChange]);

    const bajoCantidadMinima = cantidad < stockMinimoPedido;
    const puedeOrdenar = !!variante && !bajoCantidadMinima;

    function formatPrecio(n: number) {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
            minimumFractionDigits: 2,
        }).format(n);
    }

    const handleIncrement = () => setCantidad((prev) => prev + 100);
    const handleDecrement = () => setCantidad((prev) => Math.max(0, prev - 100));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        setCantidad(isNaN(val) ? 0 : val);
    };

    const handleSimulateSubmit = () => {
        if (!puedeOrdenar) return;
        setEnviado(true);
        setTimeout(() => setEnviado(false), 3000);
    };

    return (
        <div className="space-y-5">
            {/* Control de Cantidades */}
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Cantidad a solicitar
                </label>
                <div className="flex items-center gap-2">
                    {/* BOTÓN MENOS CORREGIDO: Forzado text-slate-900 y stroke-[3px] */}
                    <button
                        type="button"
                        onClick={handleDecrement}
                        className="w-12 h-12 rounded-xl border border-slate-300 flex items-center justify-center bg-white hover:bg-slate-100 text-slate-900 transition-colors active:scale-95 shadow-sm"
                    >
                        <Minus size={18} className="text-slate-900" strokeWidth={3} />
                    </button>

                    <input
                        type="number"
                        value={cantidad === 0 ? '' : cantidad}
                        onChange={handleInputChange}
                        placeholder="0"
                        className="h-12 flex-1 min-w-0 rounded-xl border border-slate-300 bg-white text-center font-bold text-slate-900 text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />

                    <button
                        type="button"
                        onClick={handleIncrement}
                        className="w-12 h-12 rounded-xl border border-slate-300 flex items-center justify-center bg-white hover:bg-slate-100 text-slate-900 transition-colors active:scale-95 shadow-sm"
                    >
                        <Plus size={18} className="text-slate-900" strokeWidth={3} />
                    </button>
                </div>

                {bajoCantidadMinima && (
                    <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200 mt-1">
                        <AlertTriangle size={14} className="shrink-0 text-amber-600" />
                        <span className="text-[11px] font-bold leading-tight">
                            El pedido mínimo para aplicar a precio mayorista es de {stockMinimoPedido.toLocaleString('es-PE')} unidades.
                        </span>
                    </div>
                )}
            </div>

            {/* Desglose de Precios */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Precio lista base</span>
                    <span className="text-slate-900 font-semibold">{formatPrecio(precioBase)} / u</span>
                </div>

                <div className="flex justify-between items-center py-2 border-t border-b border-slate-200">
                    <span className="font-bold text-slate-700">Precio Unitario Mayorista</span>
                    <div className="flex items-center gap-1.5">
                        {descuentoPct > 0 && (
                            <span className="bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded text-[10px] tracking-wide">
                                -{descuentoPct}%
                            </span>
                        )}
                        <span className="font-black text-slate-900 text-sm">
                            {formatPrecio(precioUnitario)}
                        </span>
                    </div>
                </div>

                {descuentoPct > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 font-bold">
                        <span>Tu ahorro en esta orden</span>
                        <span>{formatPrecio(ahorro)}</span>
                    </div>
                )}

                <div className="flex justify-between items-baseline pt-1">
                    <span className="font-bold text-slate-800 text-sm">Subtotal Estimado</span>
                    <span className="font-black text-indigo-600 text-lg">
                        {formatPrecio(total)}
                    </span>
                </div>
            </div>

            {/* Botón de Acción */}
            <button
                type="button"
                onClick={handleSimulateSubmit}
                disabled={!puedeOrdenar || bajoCantidadMinima}
                className={`w-full h-12 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 shadow-sm
                    ${!puedeOrdenar || bajoCantidadMinima
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                        : enviado
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] hover:shadow-md'
                    }
                `}
            >
                {enviado ? (
                    <>
                        <CheckCircle2 size={18} />
                        Pedido generado
                    </>
                ) : (
                    <>
                        <ClipboardList size={18} />
                        {!variante
                            ? 'Selecciona color y talla'
                            : bajoCantidadMinima
                                ? `Mínimo ${stockMinimoPedido.toLocaleString('es-PE')} unidades`
                                : 'Generar pedido'}
                    </>
                )}
            </button>

            {!variante && (
                <p className="text-xs text-center text-slate-500 font-medium">
                    Selecciona una variante para habilitar el pedido
                </p>
            )}
        </div>
    );
}