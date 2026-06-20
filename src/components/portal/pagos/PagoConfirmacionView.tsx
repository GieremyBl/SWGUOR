'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileBadge,
  Package,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComprobantePdfSimuladoModal } from '@/components/portal/pagos/metodos-pagos/ComprobantePdfSimuladoModal';
import {
  getMetodoPagoLabel,
  getTipoComprobanteLabel,
} from '@/lib/constants/portal-pago';
import {
  formatearFechaPortal,
  formatearMontoPortal,
} from '@/lib/helpers/pago-confirmacion.helper';
import type { PagoConfirmacionResumen } from '@/lib/schemas/pago-confirmacion';
import { cn } from '@/lib/utils';

function ResumenFila({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span
        className={cn(
          'text-sm font-semibold text-right',
          highlight ? 'text-[#231e1d] text-base' : 'text-slate-800',
        )}
      >
        {value}
      </span>
    </div>
  );
}

function ConfirmacionSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse space-y-6">
      <div className="h-24 rounded-2xl bg-slate-100" />
      <div className="h-64 rounded-2xl bg-slate-100" />
      <div className="h-48 rounded-2xl bg-slate-100" />
    </div>
  );
}

export function PagoConfirmacionView() {
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get('pedido_id');
  const comprobanteId = searchParams.get('comprobante_id');

  const [resumen, setResumen] = useState<PagoConfirmacionResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalPdfOpen, setModalPdfOpen] = useState(false);

  const cargarResumen = useCallback(async () => {
    if (!pedidoId || !comprobanteId) {
      setError('Faltan parámetros de confirmación (pedido o comprobante).');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ pedido_id: pedidoId, comprobante_id: comprobanteId });
      const res = await fetch(`/api/portal/pago/confirmacion?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'No se pudo cargar la confirmación');
      }

      setResumen(json.data as PagoConfirmacionResumen);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la confirmación');
    } finally {
      setLoading(false);
    }
  }, [pedidoId, comprobanteId]);

  useEffect(() => {
    cargarResumen();
  }, [cargarResumen]);

  if (loading) return <ConfirmacionSkeleton />;

  if (error || !resumen) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-red-600 font-semibold mb-4">{error ?? 'Confirmación no disponible'}</p>
        <Button asChild variant="outline">
          <Link href="/portal/pedidos">Volver a mis pedidos</Link>
        </Button>
      </div>
    );
  }

  const numeroComprobante =
    resumen.comprobante.numero_completo ??
    `${resumen.comprobante.serie}-${resumen.comprobante.correlativo}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 mb-4">
          <CheckCircle2 className="size-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#231e1d] tracking-tight">
          ¡Pago confirmado!
        </h1>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">
          Tu transacción fue procesada correctamente. Guarda tu comprobante para tus registros.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <Receipt className="size-4 text-[#c4a35a]" />
          <h2 className="font-bold text-[#231e1d]">Resumen de la transacción</h2>
        </div>
        <div className="px-6 py-2">
          <ResumenFila
            label="Número de pedido"
            value={`#${resumen.pedido.id}`}
          />
          <ResumenFila
            label="Monto pagado"
            value={formatearMontoPortal(resumen.pago.monto, resumen.pedido.moneda)}
            highlight
          />
          <ResumenFila
            label="Método de pago"
            value={getMetodoPagoLabel(resumen.pago.metodo_pago)}
          />
          <ResumenFila
            label="Fecha y hora"
            value={formatearFechaPortal(resumen.pago.fecha_pago)}
          />
          {resumen.pago.culqi_charge_id && (
            <ResumenFila
              label="Referencia Culqi"
              value={resumen.pago.culqi_charge_id}
            />
          )}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-[#e4c28a]/40 bg-gradient-to-br from-[#fffdf8] to-white shadow-md overflow-hidden mb-8">
        <div className="px-6 py-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#231e1d] flex items-center justify-center flex-shrink-0">
            <FileBadge className="size-6 text-[#e4c28a]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#c4a35a]">
              Comprobante emitido
            </p>
            <h3 className="text-lg font-black text-[#231e1d] mt-1">
              {getTipoComprobanteLabel(resumen.comprobante.tipo)}
            </h3>
            <p className="text-2xl font-black text-[#231e1d] mt-2 tracking-wide">
              {numeroComprobante}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
              <span>
                Total:{' '}
                <strong className="text-slate-800">
                  {formatearMontoPortal(resumen.comprobante.total, resumen.comprobante.moneda)}
                </strong>
              </span>
              <span>
                SUNAT:{' '}
                <strong className="text-emerald-700 uppercase">
                  {resumen.comprobante.estado_sunat}
                </strong>
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <Button
            size="lg"
            className="w-full h-12 rounded-xl bg-[#231e1d] text-[#e4c28a] font-black tracking-wide hover:bg-[#2f2927]"
            onClick={() => setModalPdfOpen(true)}
          >
            <Download className="size-4 mr-2" />
            Descargar Comprobante
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild variant="outline" className="flex-1 h-11 rounded-xl">
          <Link href="/portal/pedidos">
            <Package className="size-4 mr-2" />
            Ver mis pedidos
          </Link>
        </Button>
        <Button asChild className="flex-1 h-11 rounded-xl bg-[#425f7c] hover:bg-[#364e66]">
          <Link href={`/portal/pedidos?detalle=${resumen.pedido.id}`}>
            Seguimiento del pedido
            <ArrowRight className="size-4 ml-2" />
          </Link>
        </Button>
      </div>

      <ComprobantePdfSimuladoModal
        open={modalPdfOpen}
        onOpenChange={setModalPdfOpen}
        resumen={resumen}
      />
    </div>
  );
}

export function PagoConfirmacionSkeleton() {
  return <ConfirmacionSkeleton />;
}
