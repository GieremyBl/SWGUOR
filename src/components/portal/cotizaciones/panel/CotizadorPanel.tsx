'use client';

import { CheckCircle2 } from 'lucide-react';
import { ItemResumen } from './ItemResumen';
import { ResumenFinanciero } from './ResumenFinanciero';
import { BotonesAccion } from './BotonesAccion';
import { usePortal } from '@/lib/hooks/usePortal';
import { ItemCotizacion } from '@/components/portal/_contexts/PortalContext';
import { resolveCartMoq } from '@/lib/constants/portal-b2b';

interface Props {
    onEnviar: (accion: 'borrador' | 'enviar') => void;
    isSending: boolean;
}

// Escalas de descuento por número de modelos distintos
const ESCALAS_MODELOS = [11, 15, 25, 40];

export function CotizadorPanel({ onEnviar, isSending }: Props) {
    // Corregido: Extraemos las variables específicas exclusivas del flujo de borrador
    const { itemsBorrador, resumenBorrador } = usePortal();

    const itemsConMoqError = itemsBorrador.filter((i: ItemCotizacion) => i.cantidad < resolveCartMoq(i));
    const puedeEnviar = itemsBorrador.length > 0 && itemsConMoqError.length === 0;

    const modelosActuales = itemsBorrador.length;
    const proximaEscala = ESCALAS_MODELOS.find(e => modelosActuales < e);
    const modelosFaltantes = proximaEscala ? proximaEscala - modelosActuales : 0;

    return (
        <div className="flex flex-col h-full bg-white">

            {/* ── Encabezado ── */}
            <div className="px-4 py-3 border-b border-guor-stone flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-xs font-black text-guor-dark uppercase tracking-[0.15em]">
                    Resumen financiero
                </h2>
                {itemsBorrador.length > 0 && (
                    <span className="text-[10px] font-bold text-guor-soft bg-guor-100 border border-guor-stone px-2 py-0.5 rounded-full">
                        {itemsBorrador.length} modelo{itemsBorrador.length > 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* ── Lista de ítems ── */}
            <div className="flex-1 overflow-auto px-3 py-3 space-y-2">

                {/* Estado vacío */}
                {itemsBorrador.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-guor-100 border border-guor-stone flex items-center justify-center">
                            <span className="text-lg text-guor-muted">+</span>
                        </div>
                        <p className="text-xs font-bold text-guor-muted">Sin modelos aún</p>
                        <p className="text-[10px] text-guor-muted/70">
                            Selecciona un modelo del catálogo
                        </p>
                    </div>
                )}

                {/* Banner: descuento activo */}
                {resumenBorrador.descuento_pct > 0 && (
                    <div
                        className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2"
                        role="status"
                        aria-live="polite"
                    >
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        <p className="text-[10px] text-emerald-700 font-bold">
                            {resumenBorrador.descripcion_descuento}
                        </p>
                    </div>
                )}

                {/* Banner: próximo descuento */}
                {proximaEscala && modelosFaltantes > 0 && (
                    <div className="rounded-xl px-3 py-2 border border-guor-gold-pale bg-guor-gold-dust">
                        <p className="text-[10px] font-bold text-guor-gold">
                            {resumenBorrador.descuento_pct > 0
                                ? `${modelosFaltantes} modelo${modelosFaltantes > 1 ? 's' : ''} más para el siguiente descuento`
                                : `Agrega ${modelosFaltantes} modelo${modelosFaltantes > 1 ? 's' : ''} más para desbloquear descuento`
                            }
                        </p>
                    </div>
                )}

                {/* Ítems del borrador — Corregido con el origen de datos y tipado explícito */}
                {itemsBorrador.map((item: ItemCotizacion) => (
                    <ItemResumen key={item.variante_id} item={item} />
                ))}
            </div>

            {/* ── Footer: resumen + botones ── */}
            {itemsBorrador.length > 0 && (
                <div className="border-t border-guor-stone bg-guor-50 px-3 py-4 space-y-3">
                    <ResumenFinanciero />
                    <BotonesAccion
                        onEnviar={onEnviar}
                        isSending={isSending}
                        puedeEnviar={puedeEnviar}
                    />
                </div>
            )}
        </div>
    );
}