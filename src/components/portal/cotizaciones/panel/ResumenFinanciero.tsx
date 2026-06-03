'use client';

import { MapPin } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers/format-helpers';
import { SelectorZonaEnvio } from './SelectorZonaEnvio';
import { usePortal } from '@/lib/hooks/usePortal';

export function ResumenFinanciero() {
    // Asegúrate de que PortalContext exponga `cliente` con su campo `direccion_fiscal`
    const { resumenBorrador, cliente } = usePortal();

    return (
        <div className="space-y-2">

            {/* ── Dirección de despacho (fiscal) ── */}
            {cliente?.direccion_fiscal && (
                <div
                    className="flex items-start gap-2.5 rounded-xl border p-3"
                    style={{
                        backgroundColor: 'var(--guor-cream-deep)',
                        borderColor: 'var(--guor-gold-pale)',
                    }}
                >
                    <MapPin
                        size={13}
                        className="shrink-0 mt-0.5"
                        style={{ color: 'var(--guor-gold)' }}
                    />
                    <div className="min-w-0">
                        <p
                            className="text-[9px] font-black uppercase tracking-[0.2em]"
                            style={{ color: 'var(--guor-gold)' }}
                        >
                            Dirección de despacho
                        </p>
                        <p
                            className="text-[10px] font-medium leading-snug mt-0.5 break-words"
                            style={{ color: 'var(--guor-dark)' }}
                        >
                            {cliente.direccion_fiscal}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Subtotal ── */}
            <div className="flex justify-between items-center text-xs">
                <span className="text-guor-soft">
                    Subtotal ({resumenBorrador.total_unidades.toLocaleString()} uds)
                </span>
                <span className="font-bold text-guor-dark tabular-nums">
                    {formatCurrency(resumenBorrador.subtotal)}
                </span>
            </div>

            {/* ── Descuento (sólo si aplica) ── */}
            {resumenBorrador.descuento_pct > 0 && (
                <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-700 font-medium">
                        Descuento {resumenBorrador.descuento_pct}%
                    </span>
                    <span className="font-bold text-emerald-700 tabular-nums">
                        − {formatCurrency(resumenBorrador.descuento_monto)}
                    </span>
                </div>
            )}

            {/* ── IGV ── */}
            <div className="flex justify-between items-center text-xs">
                <span className="text-guor-soft">IGV 18%</span>
                <span className="font-bold text-guor-dark tabular-nums">
                    {formatCurrency(resumenBorrador.igv)}
                </span>
            </div>

            {/* ── Selector de zona de envío ── */}
            <SelectorZonaEnvio />

            {/* ── Total ── */}
            <div className="flex justify-between items-center pt-2 border-t border-guor-stone">
                <span className="text-sm font-black text-guor-dark uppercase tracking-tight">
                    Total a pagar
                </span>
                <span className="text-lg font-black text-guor-gold tabular-nums">
                    {formatCurrency(resumenBorrador.total)}
                </span>
            </div>
        </div>
    );
}