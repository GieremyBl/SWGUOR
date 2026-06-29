'use client';

import { TrendingDown, Info } from 'lucide-react';

interface EscalónDescuento {
    cantidad_minima: number;
    descuento_porcentaje: number;
    precioUnitario: number;
    ahorroTotal: number;
}

interface TarifaDescuentoVolumenProps {
    escalones: EscalónDescuento[];
    cantidadActual?: number;
}

function formatPrecio(n: number) {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2,
    }).format(n);
}

export default function TarifaDescuentoVolumen({
    escalones,
    cantidadActual = 0,
}: TarifaDescuentoVolumenProps) {
    if (!escalones || escalones.length === 0) return null;

    return (
        <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <TrendingDown size={16} className="text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Escalones de Descuento por Volumen
                </h4>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="px-4 py-2.5">Volumen Mínimo</th>
                            <th className="px-4 py-2.5 text-center">Descuento</th>
                            <th className="px-4 py-2.5 text-right">Precio Unitario</th>
                            <th className="px-4 py-2.5 text-right">Ahorro Mín.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                        {escalones.map((e, idx) => {
                            const siguienteEscalon = escalones[idx + 1];
                            const activo =
                                cantidadActual >= e.cantidad_minima &&
                                (!siguienteEscalon || cantidadActual < siguienteEscalon.cantidad_minima);

                            return (
                                <tr
                                    key={idx}
                                    className={`transition-colors ${activo
                                            ? 'bg-indigo-50/70 font-medium text-indigo-900'
                                            : 'hover:bg-slate-50/50'
                                        }`}
                                >
                                    <td className="px-4 py-3 font-medium">
                                        {siguienteEscalon
                                            ? `${e.cantidad_minima.toLocaleString('es-PE')} - ${(siguienteEscalon.cantidad_minima - 1).toLocaleString('es-PE')} uds`
                                            : `${e.cantidad_minima.toLocaleString('es-PE')}+ uds`
                                        }
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${activo ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                            }`}>
                                            -{e.descuento_porcentaje}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                        {formatPrecio(e.precioUnitario)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                                        +{formatPrecio(e.ahorroTotal)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex items-start gap-2 px-4 py-2.5 bg-slate-50/50 border-t border-slate-100">
                <Info size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-slate-400 leading-normal">
                    Los descuentos se aplican automáticamente en el total de su orden al cambiar las unidades. Precios netos.
                </p>
            </div>
        </div>
    );
}