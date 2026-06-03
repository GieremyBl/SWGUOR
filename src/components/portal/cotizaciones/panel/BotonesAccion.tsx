'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    onEnviar: (accion: 'borrador' | 'enviar') => void;
    isSending: boolean;
    puedeEnviar: boolean;
}

export function BotonesAccion({ onEnviar, isSending, puedeEnviar }: Props) {
    return (
        <div className="space-y-2 pt-1">

            {/* Generar cotización */}
            <button
                type="button"
                onClick={() => onEnviar('enviar')}
                disabled={!puedeEnviar || isSending}
                aria-busy={isSending}
                className={cn(
                    'w-full py-2.5 rounded-xl text-sm font-black transition-all',
                    'bg-guor-gold text-white',
                    'focus:outline-none focus:ring-2 focus:ring-guor-gold/50 focus:ring-offset-1',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    !isSending && 'hover:bg-guor-gold-warm active:scale-95 shadow-gold',
                )}
            >
                {isSending ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        Generando…
                    </span>
                ) : (
                    'Generar cotización'
                )}
            </button>

            {/* Guardar borrador */}
            <button
                type="button"
                onClick={() => onEnviar('borrador')}
                disabled={isSending}
                className={cn(
                    'w-full py-2.5 rounded-xl text-sm font-bold transition-all',
                    'bg-white border border-guor-stone text-guor-soft',
                    'focus:outline-none focus:ring-2 focus:ring-guor-stone-mid focus:ring-offset-1',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    !isSending && 'hover:bg-guor-100 hover:text-guor-dark hover:border-guor-stone-mid active:scale-95',
                )}
            >
                Guardar borrador
            </button>
        </div>
    );
}