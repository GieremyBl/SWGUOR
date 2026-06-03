'use client';

import { Truck } from 'lucide-react';
import { formatCurrency } from '@/lib/helpers/format-helpers';
import { usePortal } from '@/lib/hooks/usePortal';
import { type ZonaEnvio } from '@/components/portal/_contexts/PortalContext';

export function SelectorZonaEnvio() {
    // Corregido: Extraemos 'resumenBorrador' en lugar del antiguo 'resumen'
    const { zonaEnvio, actualizarZonaEnvio, resumenBorrador, costosEnvio } = usePortal();
    const zonaActual = costosEnvio.find(c => c.zona === zonaEnvio);

    return (
        <div className="rounded-xl border border-guor-gold-pale bg-guor-cream-deep p-3 space-y-2.5">

            {/* Cabecera: zona actual + costo */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Truck size={13} className="text-guor-gold shrink-0" />
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-guor-gold">
                            Envío
                        </p>
                        <p className="text-[10px] font-bold text-guor-soft">
                            {zonaActual?.zona ?? zonaEnvio}
                        </p>
                    </div>
                </div>
                <span className="text-sm font-black text-guor-dark tabular-nums">
                    {/* Corregido: Accedemos al costo de envío calculado en el resumen del borrador */}
                    {formatCurrency(resumenBorrador.costo_envio)}
                </span>
            </div>

            {/* Selector */}
            <div>
                <label
                    htmlFor="zona-envio-select"
                    className="text-[9px] font-black uppercase tracking-[0.2em] text-guor-gold block mb-1.5"
                >
                    Zona de envío
                </label>
                <select
                    id="zona-envio-select"
                    value={zonaEnvio}
                    onChange={e => actualizarZonaEnvio(e.target.value as ZonaEnvio)}
                    disabled={costosEnvio.length === 0}
                    className="w-full h-8 rounded-lg border border-guor-gold-pale bg-white text-guor-dark text-xs px-2 focus:outline-none focus:ring-1 focus:ring-guor-gold transition-all disabled:opacity-50"
                >
                    {costosEnvio.length === 0 ? (
                        <option>Cargando zonas...</option>
                    ) : (
                        costosEnvio.map(c => (
                            <option key={c.id} value={c.zona}>
                                {c.zona} — S/ {Number(c.costo).toFixed(2)}
                            </option>
                        ))
                    )}
                </select>
            </div>
        </div>
    );
}