'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EMPRESA_GUOR } from '@/lib/constants/empresa';
import { getTipoComprobanteLabel } from '@/lib/constants/portal-pago';
import {
  formatearFechaCortaPortal,
  formatearMontoPortal,
} from '@/lib/helpers/pago-confirmacion.helper';
import type { PagoConfirmacionResumen } from '@/lib/schemas/pago-confirmacion';
import { FileText, Printer } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumen: PagoConfirmacionResumen;
}

export function ComprobantePdfSimuladoModal({ open, onOpenChange, resumen }: Props) {
  const { comprobante, cliente } = resumen;
  const numero =
    comprobante.numero_completo ??
    `${comprobante.serie}-${comprobante.correlativo}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-[#e4c28a]/30">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-[#231e1d]">
            <FileText className="size-5 text-[#c4a35a]" />
            Vista previa del comprobante
          </DialogTitle>
          <DialogDescription>
            Simulación de documento electrónico — no constituye un CPE legal hasta integración SUNAT.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-inner overflow-hidden">
            <div className="bg-[#231e1d] px-6 py-4 text-[#e4c28a]">
              <p className="text-xs uppercase tracking-[0.2em] opacity-80">GUOR ERP</p>
              <h3 className="text-lg font-black mt-1">{EMPRESA_GUOR.razon_social}</h3>
              <p className="text-xs mt-1 opacity-90">RUC {EMPRESA_GUOR.ruc}</p>
            </div>

            <div className="px-6 py-5 space-y-4 text-sm text-slate-700">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed pb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {getTipoComprobanteLabel(comprobante.tipo)}
                  </p>
                  <p className="text-2xl font-black text-[#231e1d] mt-1">{numero}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>Fecha emisión</p>
                  <p className="font-semibold text-slate-800">
                    {formatearFechaCortaPortal(comprobante.fecha_emision)}
                  </p>
                  <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                    {comprobante.estado_sunat}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Cliente
                  </p>
                  <p className="font-semibold text-slate-900 mt-1">
                    {cliente.razon_social ?? 'Cliente GUOR'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Doc. {cliente.ruc}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pedido
                  </p>
                  <p className="font-semibold text-slate-900 mt-1">#{resumen.pedido.id}</p>
                </div>
              </div>

              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 text-slate-500">Subtotal</td>
                    <td className="py-2 text-right font-medium">
                      {formatearMontoPortal(comprobante.subtotal, comprobante.moneda)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 text-slate-500">IGV (18%)</td>
                    <td className="py-2 text-right font-medium">
                      {formatearMontoPortal(comprobante.igv, comprobante.moneda)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold text-[#231e1d]">Total</td>
                    <td className="py-3 text-right font-black text-[#231e1d]">
                      {formatearMontoPortal(comprobante.total, comprobante.moneda)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <p className="text-[10px] text-slate-400 border-t border-dashed pt-3">
                Hash simulado · Representación impresa no válida como comprobante de pago SUNAT.
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <Button
              className="bg-[#231e1d] text-[#e4c28a] hover:bg-[#2f2927]"
              onClick={() => window.print()}
            >
              <Printer className="size-4 mr-2" />
              Imprimir vista simulada
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
