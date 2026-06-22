'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, ShieldCheck, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MONTO_MINIMO_PAGO_PARCIAL_SOLES } from '@/lib/constants/culqi-checkout';
import { usePortal } from '@/lib/hooks/usePortal';
import { PagoDireccionEntregaForm } from '@/components/portal/pago/PagoDireccionEntregaForm';
import { PagoDatosPagadorForm } from '@/components/portal/pago/PagoDatosPagadorForm';
import { PagoMetodoPagoSection } from '@/components/portal/pago/PagoMetodoPagoSection';
import {
  buildDatosPagadorIniciales,
  formatDireccionEntregaTexto,
  splitRazonSocialParaPagador,
  validarDatosPagadorPago,
} from '@/lib/helpers/datos-pagador-pago.helper';
import {
  DATOS_PAGADOR_PAGO_INICIAL,
  type DatosPagadorPago,
} from '@/lib/schemas/datos-pagador-pago';
import {
  extraerResumenPagoPedido,
  formatearSoles,
  validarMontoPagoParcial,
} from '@/lib/helpers/pago-parcial.helper';
import {
  DATOS_ENTREGA_PAGO_INICIAL,
  type DatosEntregaPago,
} from '@/lib/schemas/datos-entrega-pago';

interface PedidoPagoData {
  id: number;
  total: number;
  monto_pagado: number;
  saldo_pendiente: number;
  total_unidades?: number;
  moneda?: string;
  direccion_despacho?: string | null;
  estado?: string;
  puede_editar_direccion?: boolean;
}

export default function PagoPage() {
  const params = useParams<{ id: string }>();
  const { cliente } = usePortal();
  const pedidoId = Number(params.id);

  const [pedido, setPedido] = useState<PedidoPagoData | null>(null);
  const [loadingPedido, setLoadingPedido] = useState(true);
  const [errorPedido, setErrorPedido] = useState('');

  const [montoAPagar, setMontoAPagar] = useState('');
  const [montoError, setMontoError] = useState('');

  const [cupon, setCupon] = useState('');
  const [descuento, setDescuento] = useState(0);
  const [datosEntrega, setDatosEntrega] = useState<DatosEntregaPago>(
    DATOS_ENTREGA_PAGO_INICIAL,
  );
  const [datosPagador, setDatosPagador] = useState<DatosPagadorPago>(
    DATOS_PAGADOR_PAGO_INICIAL,
  );
  const [errorDatosPagador, setErrorDatosPagador] = useState('');

  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  const resumen = useMemo(
    () =>
      pedido
        ? extraerResumenPagoPedido(pedido)
        : { total: 0, montoPagado: 0, saldoPendiente: 0 },
    [pedido],
  );

  useEffect(() => {
    let mounted = true;
    setLoadingPedido(true);
    setErrorPedido('');

    fetch(`/api/portal/pedidos/${pedidoId}`, { cache: 'no-store' })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? 'No se pudo cargar el pedido');
        return json.data as PedidoPagoData;
      })
      .then((data) => {
        if (!mounted) return;
        setPedido(data);
        const { saldoPendiente } = extraerResumenPagoPedido(data);
        setMontoAPagar(saldoPendiente > 0 ? saldoPendiente.toFixed(2) : '');
      })
      .catch((err: Error) => {
        if (mounted) setErrorPedido(err.message);
      })
      .finally(() => {
        if (mounted) setLoadingPedido(false);
      });

    return () => {
      mounted = false;
    };
  }, [pedidoId]);

  useEffect(() => {
    if (!cliente) return;

    const { nombres, apellidos } = splitRazonSocialParaPagador(cliente.razon_social);

    setDatosPagador((prev) =>
      buildDatosPagadorIniciales({
        nombres: prev.nombres || nombres,
        apellidos: prev.apellidos || apellidos,
        telefono: prev.telefono || (cliente.telefono ? String(cliente.telefono) : ''),
        usuarioId: cliente.usuario_id,
        direccion: prev.direccion || cliente.direccion_fiscal || '',
        countryCode: datosEntrega.paisCode,
      }),
    );
  }, [cliente, datosEntrega.paisCode]);

  const montoNumerico = Number(montoAPagar);
  const validacionMonto = validarMontoPagoParcial(montoNumerico, resumen.saldoPendiente);
  const montoSolesCheckout = validacionMonto.valido
    ? Math.max(montoNumerico - descuento, 0)
    : 0;
  const emailPago = cliente?.email?.trim() || 'cliente@guor.com';
  const validacionPagador = validarDatosPagadorPago(datosPagador);
  const pagoHabilitado =
    validacionMonto.valido &&
    montoSolesCheckout > 0 &&
    !loadingPedido &&
    validacionPagador.valido;

  const mostrarToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 2500);
  }, []);

  const handleMontoChange = (value: string) => {
    setMontoAPagar(value);
    const parsed = Number(value);
    if (!value.trim()) {
      setMontoError('Ingresa el monto a pagar');
      return;
    }
    const check = validarMontoPagoParcial(parsed, resumen.saldoPendiente);
    setMontoError(check.valido ? '' : check.mensaje ?? '');
  };

  const handleAplicarCupon = () => {
    if (cupon.toLowerCase() === 'fifi10') {
      setDescuento(10);
      mostrarToast('Cupón aplicado', 'success');
    } else {
      setDescuento(0);
      mostrarToast('Cupón inválido', 'error');
    }
  };

  const handlePagoExitoso = () => {
    mostrarToast('Pago registrado correctamente', 'success');
  };

  const handlePagoError = (msg: string) => {
    mostrarToast(msg, 'error');
  };

  const handleUsarDireccionEntregaEnPagador = () => {
    setDatosPagador((prev) => ({
      ...prev,
      direccion: formatDireccionEntregaTexto(datosEntrega),
      countryCode: datosEntrega.paisCode,
    }));
    setErrorDatosPagador('');
  };

  const handleDatosPagadorChange = (value: DatosPagadorPago) => {
    setDatosPagador(value);
    const check = validarDatosPagadorPago(value);
    setErrorDatosPagador(check.valido ? '' : check.mensaje ?? '');
  };

  const porcentajePagado =
    resumen.total > 0
      ? Math.min(100, Math.round((resumen.montoPagado / resumen.total) * 100))
      : 0;

  const direccionRegistrada = Boolean(pedido?.direccion_despacho?.trim());
  const direccionSoloLectura =
    direccionRegistrada || pedido?.puede_editar_direccion === false;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf8f5] to-[#f0ebe3] px-4 py-8 md:px-8">
      {toast.show && (
        <div
          className={cn(
            'fixed top-6 right-6 z-50 px-6 py-3 rounded-xl text-white font-bold shadow-lg transition-all',
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500',
          )}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#b5854b]/70 mb-2">
          Checkout seguro
        </p>
        <h1 className="text-2xl md:text-3xl font-black text-[#231e1d]">
          Pago del pedido <span className="text-[#b5854b]">#{pedidoId}</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Completa la dirección de entrega y elige tu método de pago.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
        <div className="lg:col-span-2 space-y-6">
          <PagoDireccionEntregaForm
            value={datosEntrega}
            onChange={setDatosEntrega}
            disabled={loadingPedido}
            readOnly={direccionSoloLectura}
            readOnlyText={pedido?.direccion_despacho}
          />

          <PagoDatosPagadorForm
            value={datosPagador}
            onChange={handleDatosPagadorChange}
            disabled={loadingPedido}
            error={errorDatosPagador}
            onUsarDireccionEntrega={handleUsarDireccionEntregaEnPagador}
          />

          <div className="rounded-2xl border border-[#e4c28a]/20 bg-white p-6 shadow-sm shadow-[#231e1d]/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-[#fffdf8] border border-[#e4c28a]/30 text-[#b5854b]">
                <Tag size={18} />
              </div>
              <div>
                <h2 className="font-black text-lg text-[#231e1d]">Promociones</h2>
                <p className="text-xs text-slate-500">Aplica un cupón si tienes uno disponible.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={cupon}
                onChange={(e) => setCupon(e.target.value)}
                placeholder="Código de cupón"
                className={cn(
                  'flex-1 h-11 px-4 rounded-xl border text-sm text-[#231e1d]',
                  'border-[#e4c28a]/25 bg-[#fffdf8] placeholder:text-slate-400',
                  'focus:outline-none focus:ring-2 focus:ring-[#e4c28a]/30',
                )}
              />
              <button
                type="button"
                onClick={handleAplicarCupon}
                className="h-11 px-6 rounded-xl bg-[#231e1d] text-[#e4c28a] font-black text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Aplicar
              </button>
            </div>
          </div>

          <PagoMetodoPagoSection
            pedidoId={pedidoId}
            email={emailPago}
            montoSoles={montoSolesCheckout}
            saldoPendiente={resumen.saldoPendiente}
            datosPagador={datosPagador}
            disabled={!pagoHabilitado}
            loadingPedido={loadingPedido}
            errorPedido={errorPedido}
            onSuccess={handlePagoExitoso}
            onError={handlePagoError}
          />
        </div>

        <div className="rounded-2xl border border-[#e4c28a]/25 bg-white p-6 shadow-lg shadow-[#231e1d]/8 h-fit lg:sticky lg:top-8 space-y-5">
          <div>
            <h2 className="font-black text-lg text-[#231e1d]">Resumen de pago</h2>
            <p className="text-xs text-slate-400 mt-1">Pedido #{pedidoId}</p>
          </div>

          {loadingPedido ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando resumen...
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Progreso del pedido</span>
                  <span className="text-[#b5854b]">{porcentajePagado}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${porcentajePagado}%`,
                      background: 'linear-gradient(90deg, #b5854b 0%, #e4c28a 100%)',
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-[#e4c28a]/15 bg-[#fffdf8] p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total del pedido</span>
                  <span className="font-bold text-[#231e1d]">
                    {formatearSoles(resumen.total)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Monto pagado</span>
                  <span className="font-semibold text-emerald-700">
                    {formatearSoles(resumen.montoPagado)}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-[#e4c28a]/20">
                  <span className="text-slate-600 font-semibold">Saldo pendiente</span>
                  <span className="font-black text-[#231e1d]">
                    {formatearSoles(resumen.saldoPendiente)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="monto-a-pagar"
                  className="block text-[10px] font-black uppercase tracking-wider text-[#231e1d]/50"
                >
                  Monto a pagar hoy
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#b5854b]/60">
                    S/
                  </span>
                  <input
                    id="monto-a-pagar"
                    type="number"
                    min={0}
                    step="0.01"
                    value={montoAPagar}
                    onChange={(e) => handleMontoChange(e.target.value)}
                    className={cn(
                      'w-full pl-10 pr-4 py-3 rounded-xl border text-[#231e1d] font-black text-lg',
                      'focus:outline-none focus:ring-2 focus:ring-[#e4c28a]/40 focus:border-[#e4c28a]',
                      montoError
                        ? 'border-red-300 bg-red-50/30'
                        : 'border-[#e4c28a]/25 bg-white',
                    )}
                  />
                </div>
                {montoError ? (
                  <p className="text-xs text-red-600">{montoError}</p>
                ) : (
                  <p className="text-xs text-slate-400">
                    Mínimo S/ {MONTO_MINIMO_PAGO_PARCIAL_SOLES.toFixed(2)} · Máximo{' '}
                    {formatearSoles(resumen.saldoPendiente)}
                  </p>
                )}
              </div>

              {descuento > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Descuento cupón</span>
                  <span>-{formatearSoles(descuento)}</span>
                </div>
              )}

              <hr className="border-[#e4c28a]/15" />

              <div className="flex justify-between font-black text-xl text-[#231e1d]">
                <span>Cargo de hoy</span>
                <span className="text-[#b5854b]">{formatearSoles(montoSolesCheckout)}</span>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
                <ShieldCheck size={14} className="text-emerald-500" />
                Pago seguro con tarjeta vía Stripe
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
