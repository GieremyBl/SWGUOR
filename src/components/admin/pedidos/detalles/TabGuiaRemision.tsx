'use client';

import { ArrowRight, Truck, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    ESTADO_GUIA_LABELS,
    ESTADO_GUIA_STYLES,
} from '@/lib/constants/guias-remision-ui';

interface TabGuiaRemisionProps {
    pedido: any;
    pdfFallbackUrl?: string;
}

export function TabGuiaRemision({ pedido, pdfFallbackUrl }: TabGuiaRemisionProps) {
    const router = useRouter();

    const guias = Array.isArray(pedido.guias_remision) ? pedido.guias_remision : [];
    const pdfFallback = pdfFallbackUrl ?? null;

    const irADespachos = () => {
        router.push('/admin/Panel-Administrativo/despachos');
    };

    if (guias.length === 0) {
        return (
            <div className="p-12 text-center border border-stone-200 rounded-xl max-w-2xl mx-auto my-6 bg-white shadow-sm">
                <div className="w-12 h-12 bg-stone-100 text-stone-800 rounded-lg flex items-center justify-center mx-auto mb-4 border border-stone-200">
                    <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-stone-900 mb-1">Sin Guía de Remisión Electrónica</h3>
                <p className="text-sm text-stone-500 max-w-md mx-auto mb-6">
                    Este despacho aún no cuenta con un documento de traslado (GRE) autorizado ante SUNAT.
                </p>
                <button
                    onClick={irADespachos}
                    className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-medium px-4 py-2 rounded-lg text-sm transition"
                >
                    <FileText className="w-4 h-4" />
                    Ir a Despachos
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-3">
                {guias.map((guia: any) => (
                    <div
                        key={guia.id}
                        className="p-4 border border-stone-200 rounded-lg bg-white hover:bg-stone-50 transition"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText className="w-4 h-4 text-stone-600" />
                                    <span className="font-semibold text-stone-900">GRE #{guia.numero}</span>
                                    <span
                                        className={`text-xs font-medium px-2 py-1 rounded border ${ESTADO_GUIA_STYLES[guia.estado as keyof typeof ESTADO_GUIA_STYLES] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}
                                    >
                                        {ESTADO_GUIA_LABELS[guia.estado as keyof typeof ESTADO_GUIA_LABELS] ?? guia.estado}
                                    </span>
                                </div>
                                <p className="text-xs text-stone-500 mb-2">
                                    Emitido: {new Date(guia.fecha_emision).toLocaleDateString('es-PE')}
                                </p>
                                <p className="text-sm text-stone-600">
                                    <strong>Origen:</strong> {guia.origen_direccion}
                                </p>
                                <p className="text-sm text-stone-600">
                                    <strong>Destino:</strong> {guia.destino_direccion}
                                </p>
                                {(guia.pdf_url || pdfFallback) && (
                                    <a
                                        href={guia.pdf_url || pdfFallback}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                                    >
                                        Descargar PDF
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-stone-200">
                <button
                    onClick={irADespachos}
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    Gestionar despachos
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}