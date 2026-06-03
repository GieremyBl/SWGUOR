'use client';

import Link from 'next/link';
import { FileText, Plus, Loader2 } from 'lucide-react';
import { formatCurrency, formatDateLong } from '@/lib/helpers/format-helpers';
import { EstadoBadge } from '@/components/portal/EstadoBadge';
import { CotizacionAccionesFila, type CotizacionFila } from './CotizacionAccionesFila';

interface Props {
    cots: CotizacionFila[];
    loading: boolean;
    onRecotizar: (id: number) => void;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function CotizacionTabla({ cots, loading, onRecotizar }: Props) {
    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-guor-gold" size={32} />
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Cargando...</p>
            </div>
        );
    }

    if (cots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText size={48} className="text-slate-300 mb-4" />
                <p className="font-bold text-slate-500 mb-2">No hay cotizaciones</p>
                <p className="text-sm text-slate-400 mb-6">
                    Crea tu primera cotización para verla aquí
                </p>
                <Link
                    href="/portal/cotizaciones/nueva"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all bg-guor-gold hover:bg-guor-700 shadow-sm"
                >
                    <Plus size={16} />
                    Nueva Cotización
                </Link>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                        {['Documento', 'Emisión', 'Estado', 'Total', ''].map(col => (
                            <th
                                key={col}
                                className={`px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest ${!col ? 'text-right' : ''}`}
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {cots.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-5 font-black text-slate-900">{c.numero}</td>
                            <td className="px-6 py-5 text-sm text-slate-600 font-medium">
                                {formatDateLong(c.created_at)}
                            </td>
                            <td className="px-6 py-5">
                                <EstadoBadge estado={c.estado} tipo="cotizacion" />
                            </td>
                            <td className="px-6 py-5 font-black text-slate-900 text-lg tabular-nums">
                                {formatCurrency(c.total)}
                            </td>
                            <td className="px-6 py-5">
                                <CotizacionAccionesFila cot={c} onRecotizar={onRecotizar} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}