'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Edit3, Download, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { exportCotizacionIndividualToPDF, buildCotizacionPDFData } from '@/lib/utils/export-utils';
import type { EstadoCotizacion } from '@prisma/client';

export interface CotizacionFila {
    id: number;
    numero: string;
    total: number;
    estado: EstadoCotizacion;
    created_at: string;
    valida_hasta: string;
}

interface Props {
    cot: CotizacionFila;
    onRecotizar: (id: number) => void;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function CotizacionAccionesFila({ cot, onRecotizar }: Props) {
    const [descargando, setDescargando] = useState(false);

    const handleDescargarPDF = async () => {
        setDescargando(true);
        const tid = toast.loading('Generando PDF...');
        try {
            const res = await fetch(`/api/portal/cotizaciones/${cot.id}`);
            if (!res.ok) throw new Error('No se pudo obtener la cotización');
            const { data } = await res.json();

            const pdfData = buildCotizacionPDFData(data, data.cotizacion_items ?? []);
            await exportCotizacionIndividualToPDF(pdfData);

            toast.success('PDF descargado', { id: tid });
        } catch (e) {
            const error = e as Error;
            toast.error(error.message ?? 'Error al generar el PDF', { id: tid });
        } finally {
            setDescargando(false);
        }
    };

    return (
        <div className="flex items-center justify-end gap-2">

            {/* Ver detalle — siempre visible */}
            <Link
                href={`/portal/cotizaciones/${cot.id}`}
                className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-all"
                title="Ver detalle"
            >
                <Eye size={18} />
            </Link>

            {/* Editar — solo borradores */}
            {cot.estado === 'borrador' && (
                <Link
                    href={`/portal/cotizaciones/${cot.id}/editar`}
                    className="p-2.5 text-white bg-guor-gold rounded-xl transition-all hover:bg-guor-700 shadow-sm"
                    title="Editar borrador"
                >
                    <Edit3 size={18} />
                </Link>
            )}

            {/* Descargar PDF — todo estado excepto borrador */}
            {cot.estado !== 'borrador' && (
                <button
                    onClick={handleDescargarPDF}
                    disabled={descargando}
                    className="p-2.5 text-white bg-guor-gold rounded-xl transition-all hover:bg-guor-700 shadow-sm disabled:opacity-50"
                    title="Descargar PDF"
                >
                    {descargando
                        ? <Loader2 size={18} className="animate-spin" />
                        : <Download size={18} />
                    }
                </button>
            )}

            {/* Recotizar — expiradas o rechazadas */}
            {(cot.estado === 'expirada' || cot.estado === 'rechazada') && (
                <button
                    onClick={() => onRecotizar(cot.id)}
                    className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all"
                    title="Duplicar como nueva cotización"
                >
                    <RefreshCw size={18} />
                </button>
            )}
        </div>
    );
}