'use client';

import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers/format-helpers';

interface DetalleCotizacionResumenProps {
    subtotal: number;
    descuento: number;
    igv: number;
    costoEnvio: number | null;
    total: number;
    notasInternas?: string | null;
}

export function DetalleCotizacionResumen({
    subtotal,
    descuento,
    igv,
    costoEnvio,
    total,
    notasInternas,
}: DetalleCotizacionResumenProps) {
    return (
        <div className="space-y-6">
            {/* Card de análisis con IA — Adaptado a la paleta GUOR Dark */}
            <div
                className="rounded-xl p-8 text-white shadow-lg relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, var(--guor-dark) 0%, #1c1c1c 100%)',
                }}
            >
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Sparkles size={80} style={{ color: 'var(--guor-gold)' }} />
                </div>

                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                        <Sparkles size={20} style={{ color: 'var(--guor-gold)' }} />
                    </div>
                    <h3 className="font-black text-xs uppercase tracking-widest" style={{ color: 'var(--guor-gold)' }}>
                        Análisis Estratégico
                    </h3>
                </div>

                <p className="text-sm leading-relaxed italic font-medium relative z-10 opacity-90">
                    "{notasInternas ||
                        'Su volumen actual le permite acceder a la tarifa preferencial. Recomendamos aumentar el pedido para optimizar costos.'}"
                </p>

                <div
                    className="mt-8 pt-6 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-widest relative z-10 opacity-60"
                    style={{ borderTopColor: 'rgba(255,255,255,0.1)' }}
                >
                    <span>Smart Insight</span>
                    <div className="flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>Optimizado</span>
                    </div>
                </div>
            </div>

            {/* Resumen Financiero */}
            <div
                className="bg-white border rounded-xl p-8 shadow-sm space-y-6"
                style={{ borderColor: 'var(--guor-stone)' }}
            >
                <h3
                    className="font-black text-xs uppercase tracking-widest border-b pb-4"
                    style={{
                        color: 'var(--guor-dark)',
                        borderColor: 'var(--guor-stone)',
                    }}
                >
                    Desglose Comercial
                </h3>

                <div className="space-y-4">
                    {/* Subtotal */}
                    <div className="flex justify-between items-center">
                        <span
                            className="text-sm font-bold uppercase tracking-tight opacity-60"
                            style={{ color: 'var(--guor-dark)' }}
                        >
                            Subtotal Neto
                        </span>
                        <span
                            className="font-bold"
                            style={{ color: 'var(--guor-dark)' }}
                        >
                            {formatCurrency(subtotal)}
                        </span>
                    </div>

                    {/* Descuento */}
                    {descuento > 0 && (
                        <div
                            className="flex justify-between items-center p-3 rounded-lg border"
                            style={{
                                backgroundColor: 'var(--guor-cream)',
                                borderColor: 'var(--guor-stone)',
                            }}
                        >
                            <span
                                className="text-xs font-black uppercase tracking-wider"
                                style={{ color: 'var(--guor-gold)' }}
                            >
                                Ahorro corporativo
                            </span>
                            <span
                                className="font-black"
                                style={{ color: 'var(--guor-gold)' }}
                            >
                                -{formatCurrency(descuento)}
                            </span>
                        </div>
                    )}

                    {/* Impuestos */}
                    <div className="flex justify-between items-center">
                        <span
                            className="text-sm font-bold uppercase tracking-tight opacity-60"
                            style={{ color: 'var(--guor-dark)' }}
                        >
                            Impuestos (18%)
                        </span>
                        <span
                            className="font-bold"
                            style={{ color: 'var(--guor-dark)' }}
                        >
                            {formatCurrency(igv)}
                        </span>
                    </div>

                    {/* Envío */}
                    <div className="flex justify-between items-center">
                        <span
                            className="text-sm font-bold uppercase tracking-tight opacity-60"
                            style={{ color: 'var(--guor-dark)' }}
                        >
                            Envío
                        </span>
                        <span
                            className="font-bold"
                            style={{ color: 'var(--guor-dark)' }}
                        >
                            {formatCurrency(costoEnvio ?? 0)}
                        </span>
                    </div>

                    {/* Total */}
                    <div
                        className="pt-6 border-t"
                        style={{ borderColor: 'var(--guor-stone)' }}
                    >
                        <div className="flex justify-between items-end">
                            <span
                                className="text-xs font-black uppercase tracking-widest"
                                style={{ color: 'var(--guor-dark)' }}
                            >
                                Total Final
                            </span>
                            <span
                                className="text-4xl font-black leading-none"
                                style={{ color: 'var(--guor-dark)' }}
                            >
                                {formatCurrency(total)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Aviso de condiciones — Integrado a la paleta cálida de alertas GUOR */}
                <div
                    className="rounded-xl p-4 flex gap-3 items-start border text-xs"
                    style={{
                        backgroundColor: 'var(--guor-cream)',
                        borderColor: 'var(--guor-stone)',
                    }}
                >
                    <AlertCircle
                        size={20}
                        style={{ color: 'var(--guor-gold-warm)' }}
                        className="shrink-0 mt-0.5"
                    />
                    <div className="space-y-1">
                        <p
                            className="font-black uppercase tracking-wider"
                            style={{ color: 'var(--guor-gold-warm)' }}
                        >
                            Condiciones de Venta
                        </p>
                        <p
                            className="font-medium leading-relaxed opacity-80"
                            style={{ color: 'var(--guor-dark)' }}
                        >
                            Cotización sujeta a MOQ de 400 unidades. Validez de precios por 7 días calendario tras la emisión.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}