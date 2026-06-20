'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getTipoComprobanteLabel } from '@/lib/constants/portal-pago';
import type { TesoreriaPagoFila } from '@/lib/schemas/tesoreria-pagos';
import { FileText } from 'lucide-react';

interface Props {
  row: TesoreriaPagoFila | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TesoreriaComprobanteDialog({ row, open, onOpenChange }: Props) {
  if (!row?.comprobante) return null;

  const numero =
    row.comprobante.numero_completo ??
    `${row.comprobante.serie}-${row.comprobante.correlativo}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5 text-emerald-600" />
            Comprobante electrónico
          </DialogTitle>
          <DialogDescription>
            Pedido #{row.pedido_id} · {row.cliente?.razon_social ?? 'Cliente'}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border bg-slate-50 p-4 space-y-3 text-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tipo</p>
            <p className="font-semibold text-slate-900">
              {getTipoComprobanteLabel(row.comprobante.tipo)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Número</p>
            <p className="text-xl font-black text-slate-900">{numero}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monto</p>
              <p className="font-semibold">
                S/ {row.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SUNAT</p>
              <p className="font-semibold uppercase text-emerald-700">
                {row.comprobante.estado_sunat}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
