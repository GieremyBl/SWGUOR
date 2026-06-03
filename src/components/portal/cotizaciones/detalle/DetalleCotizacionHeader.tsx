'use client';

import { ArrowLeft, Download } from 'lucide-react';

interface DetalleCotizacionHeaderProps {
    numero: string;
    onVolver: () => void;
    onDescargarPDF?: () => void;
    onAprobar?: () => void;
    estado: string;
    loading?: boolean;
}

export function DetalleCotizacionHeader({
    onVolver,
    onDescargarPDF,
    onAprobar,
    estado,
    loading = false,
}: DetalleCotizacionHeaderProps) {
    const puedeAprobar = ['borrador', 'enviada'].includes(estado);

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Botón volver */}
            <button
                onClick={onVolver}
                className="flex items-center gap-2 transition-all text-xs font-bold uppercase tracking-wider opacity-60 hover:opacity-100"
                style={{ color: 'var(--guor-dark)' }}
            >
                <ArrowLeft size={16} />
                Volver al historial
            </button>

            {/* Acciones */}
            <div className="flex items-center gap-3 flex-wrap">
                {onDescargarPDF && (
                    <button
                        onClick={onDescargarPDF}
                        className="flex items-center gap-2 px-5 py-2.5 border rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                        style={{
                            borderColor: 'var(--guor-stone)',
                            color: 'var(--guor-dark)',
                            backgroundColor: '#ffffff'
                        }}
                    >
                        <Download size={18} />
                        Exportar PDF
                    </button>
                )}

                {puedeAprobar && onAprobar && (
                    <button
                        onClick={onAprobar}
                        disabled={loading}
                        className="text-white px-8 py-2.5 rounded-lg text-sm font-semibold shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: 'var(--guor-gold)' }}
                    >
                        {loading ? 'Procesando...' : 'Aprobar y Confirmar Pedido'}
                    </button>
                )}
            </div>
        </div>
    );
}