'use client';

import Link from 'next/link';
import { ArrowUpRight, FileText } from 'lucide-react';
import { EstadoBadge } from '@/components/portal/EstadoBadge';
import { formatCurrency } from '@/lib/helpers/format-helpers';
import { CotizacionHistorial } from './types';

interface Props {
    cotizaciones: CotizacionHistorial[];
}

export function CotizacionesRecientes({ cotizaciones }: Props) {
    return (
        <div className="bg-white border border-[#e4c28a]/25 rounded-2xl overflow-hidden">

            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-[#e4c28a]/15">
                <div>
                    <h2 className="text-[11px] font-black text-[#231e1d] uppercase tracking-[0.18em]">
                        Historial de cotizaciones
                    </h2>
                    <p className="text-[10px] text-[#b5854b]/50 font-medium mt-0.5">
                        Guardadas automáticamente al enviar cotización
                    </p>
                </div>
                <Link
                    href="/portal/cotizaciones"
                    className="group flex items-center gap-1 text-[11px] font-bold text-[#b5854b] hover:text-[#231e1d] transition-colors"
                >
                    Ver todo
                    <ArrowUpRight
                        size={12}
                        className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                    />
                </Link>
            </div>

            {/* Lista */}
            <div className="p-3">
                {cotizaciones.length > 0 ? (
                    <div className="space-y-2">
                        {cotizaciones.map((cot) => (
                            <Link
                                key={cot.id}
                                href={`/portal/cotizaciones/${cot.id}`}
                                className="group flex items-center justify-between gap-3 p-4 rounded-2xl border border-[#e4c28a]/20 bg-white hover:bg-[#fff4e2]/40 hover:border-[#e4c28a]/40 transition-all"
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-10 h-10 rounded-xl bg-[#e4c28a]/15 flex items-center justify-center flex-shrink-0">
                                        <FileText size={16} className="text-[#b5854b]" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-[#231e1d] truncate">{cot.numero}</p>
                                        <p className="text-[10px] font-medium text-[#231e1d]/35 truncate">
                                            {new Date(cot.created_at).toLocaleDateString('es-PE', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                            })}{' '}
                                            · Envío {formatCurrency(cot.costo_envio)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[9px] font-bold text-[#b5854b]/40 uppercase tracking-widest">Total</p>
                                        <p className="text-sm font-black text-[#231e1d] tabular-nums">
                                            {formatCurrency(cot.total)}
                                        </p>
                                    </div>
                                    <EstadoBadge estado={cot.estado} tipo="cotizacion" />
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="py-10 flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-[#e4c28a]/10 flex items-center justify-center">
                            <FileText size={16} className="text-[#b5854b]/30" />
                        </div>
                        <p className="text-[10px] font-bold text-[#231e1d]/25 uppercase tracking-widest">
                            Sin cotizaciones aún
                        </p>
                        <p className="text-[11px] text-[#231e1d]/20 font-medium text-center">
                            Cuando envíes una cotización se guardará automáticamente aquí.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}