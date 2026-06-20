'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatearSoles } from '@/lib/helpers/pago-parcial.helper';

type BotonPagoTema = 'stripe' | 'mercadopago' | 'default';

const TEMAS: Record<BotonPagoTema, string> = {
  stripe: 'bg-[#635bff] hover:bg-[#5851ea] text-white disabled:bg-[#635bff]/50',
  mercadopago: 'bg-[#009ee3] hover:bg-[#008ecf] text-white disabled:bg-[#009ee3]/50',
  default: 'bg-[#231e1d] hover:bg-[#231e1d]/90 text-[#e4c28a] disabled:bg-[#231e1d]/50',
};

export interface BotonPagoAccionProps {
  onPagar: () => void | Promise<void>;
  procesando: boolean;
  /** Bloquea el cobro; no afecta la interacción con el formulario de la pasarela. */
  deshabilitado?: boolean;
  montoSoles: number;
  pasarela: string;
  tema?: BotonPagoTema;
  className?: string;
}

export function BotonPagoAccion({
  onPagar,
  procesando,
  deshabilitado = false,
  montoSoles,
  pasarela,
  tema = 'default',
  className,
}: BotonPagoAccionProps) {
  const bloqueado = deshabilitado || procesando || montoSoles <= 0;

  return (
    <button
      type="button"
      onClick={() => {
        if (bloqueado) return;
        void onPagar();
      }}
      disabled={bloqueado}
      aria-busy={procesando}
      className={cn(
        'inline-flex w-full h-12 items-center justify-center gap-2 rounded-xl font-black tracking-wide text-sm transition-opacity',
        'disabled:cursor-not-allowed disabled:opacity-60',
        TEMAS[tema],
        className,
      )}
    >
      {procesando ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          Procesando...
        </>
      ) : (
        `Pagar ${formatearSoles(montoSoles)} con ${pasarela}`
      )}
    </button>
  );
}
