'use client';

import { AlertCircle, CheckCircle, X, CreditCard, Receipt } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface MetodoPago {
  id: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  bg: string;
  tag?: string;
}

const METODOS_PAGO: MetodoPago[] = [
  {
    id: 'tarjeta',
    nombre: 'Tarjeta de crédito/débito',
    descripcion: 'Visa, MasterCard, American Express',
    imagen: '/metodos_pago/tarjeta.png',
    bg: 'bg-blue-50/50',
  },
  {
    id: 'paypal',
    nombre: 'PayPal',
    descripcion: 'Paga con tu cuenta corporativa PayPal',
    imagen: '/metodos_pago/paypal.png',
    bg: 'bg-amber-50/50',
    tag: 'Recomendado',
  },
  {
    id: 'yape',
    nombre: 'Yape B2B',
    descripcion: 'Paga mediante Yape al número central 987654321',
    imagen: '/metodos_pago/yape.png',
    bg: 'bg-emerald-50/50',
  },
  {
    id: 'plin',
    nombre: 'Plin',
    descripcion: 'Paga mediante Plin al número central 987654321',
    imagen: '/metodos_pago/plin.png',
    bg: 'bg-purple-50/50',
  },
];

type PasosPago = 'seleccion' | 'confirmacion' | 'procesando' | 'exito' | 'error';

interface PedidoParaPago {
  id: number;
  total: number;
  moneda: string;
}

export function PedidoModalPago({
  pedido,
  onClose,
}: {
  pedido: PedidoParaPago;
  onClose: () => void;
}) {
  const [paso, setPaso] = useState<PasosPago>('seleccion');
  const [metodo, setMetodo] = useState<string | null>(null);

  const totalFormateado = Number(pedido.total ?? 0).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const metodoSeleccionado = METODOS_PAGO.find(m => m.id === metodo);

  const handleConfirmar = async () => {
    setPaso('procesando');
    try {
      // Simulación de pasarela de pagos B2B corporativa
      await new Promise(r => setTimeout(r, 2000));
      setPaso('exito');
    } catch {
      setPaso('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border animate-in fade-in zoom-in-95 duration-200"
        style={{ borderColor: 'var(--guor-stone)' }}
      >

        {/* ── PASO 1: Selección de método ─────────────────────────────── */}
        {paso === 'seleccion' && (
          <>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--guor-stone)' }}>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--guor-gold)' }}>Pasarela Comercial</p>
                <h2 className="text-lg font-black uppercase tracking-wider" style={{ color: 'var(--guor-dark)' }}>Selecciona método</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl border flex items-center justify-center transition-all active:scale-95 bg-white hover:bg-neutral-50"
                style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}
              >
                <X size={14} />
              </button>
            </div>

            <div
              className="mx-6 mt-5 p-4 rounded-xl border flex items-center justify-between"
              style={{ backgroundColor: 'var(--guor-cream)', borderColor: 'var(--guor-stone)' }}
            >
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-60" style={{ color: 'var(--guor-dark)' }}>Orden de Manufactura #{pedido.id}</p>
                <p className="font-black text-lg" style={{ color: 'var(--guor-dark)' }}>{pedido.moneda ?? 'PEN'} {totalFormateado}</p>
              </div>
              <Receipt size={18} className="opacity-40" style={{ color: 'var(--guor-dark)' }} />
            </div>

            <div className="p-6 space-y-2.5">
              {METODOS_PAGO.map((m) => {
                const isSelected = metodo === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMetodo(m.id)}
                    className={cn(
                      'w-full p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 relative text-left',
                      isSelected ? 'bg-neutral-50 shadow-xs' : 'bg-white hover:bg-neutral-50/50'
                    )}
                    style={{ borderColor: isSelected ? 'var(--guor-gold)' : 'var(--guor-stone)' }}
                  >
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border', m.bg)} style={{ borderColor: 'var(--guor-stone)' }}>
                      <Image src={m.imagen} alt={m.nombre} width={24} height={24} className="object-contain" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-black text-xs uppercase tracking-wide" style={{ color: 'var(--guor-dark)' }}>{m.nombre}</p>
                      <p className="text-[11px] font-medium opacity-50 mt-0.5" style={{ color: 'var(--guor-dark)' }}>{m.descripcion}</p>
                    </div>

                    {m.tag && (
                      <span className="text-[8px] font-black uppercase tracking-widest text-white px-2 py-0.5 rounded-md shrink-0" style={{ backgroundColor: 'var(--guor-gold)' }}>
                        {m.tag}
                      </span>
                    )}

                    <div
                      className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                      style={{ borderColor: isSelected ? 'var(--guor-gold)' : 'var(--guor-stone)', backgroundColor: isSelected ? 'var(--guor-gold)' : 'transparent' }}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 h-11 rounded-xl border text-xs font-bold uppercase tracking-wider bg-white hover:bg-neutral-50 transition-colors"
                style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}
              >
                Cancelar
              </button>
              <button
                disabled={!metodo}
                onClick={() => setPaso('confirmacion')}
                className="flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                style={{ backgroundColor: 'var(--guor-dark)' }}
              >
                <CreditCard size={13} style={{ color: 'var(--guor-gold)' }} />
                Continuar
              </button>
            </div>
          </>
        )}

        {/* ── PASO 2: Confirmación ────────────────────────────────────── */}
        {paso === 'confirmacion' && metodoSeleccionado && (
          <>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--guor-stone)' }}>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--guor-gold)' }}>Confirmar Fondos</p>
                <h2 className="text-lg font-black uppercase tracking-wider" style={{ color: 'var(--guor-dark)' }}>Resumen de Cuenta</h2>
              </div>
              <button onClick={() => setPaso('seleccion')} className="w-8 h-8 rounded-xl border flex items-center justify-center bg-white hover:bg-neutral-50 transition-colors" style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}>
                <X size={14} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center py-6 border rounded-xl" style={{ backgroundColor: 'var(--guor-cream)', borderColor: 'var(--guor-stone)' }}>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1" style={{ color: 'var(--guor-dark)' }}>Importe Neto Total</p>
                <p className="text-3xl font-black" style={{ color: 'var(--guor-gold)' }}>{pedido.moneda ?? 'PEN'} {totalFormateado}</p>
                <p className="text-[10px] font-bold opacity-40 mt-1" style={{ color: 'var(--guor-dark)' }}>Referencia Logística #{pedido.id}</p>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl border bg-neutral-50/50" style={{ borderColor: 'var(--guor-stone)' }}>
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center border bg-white', metodoSeleccionado.bg)} style={{ borderColor: 'var(--guor-stone)' }}>
                  <Image src={metodoSeleccionado.imagen} alt={metodoSeleccionado.nombre} width={22} height={22} className="object-contain" />
                </div>
                <div>
                  <p className="text-[10px] font-medium opacity-40" style={{ color: 'var(--guor-dark)' }}>Canal de Abono</p>
                  <p className="font-black text-xs uppercase" style={{ color: 'var(--guor-dark)' }}>{metodoSeleccionado.nombre}</p>
                </div>
                <button onClick={() => setPaso('seleccion')} className="ml-auto text-xs font-black transition-all hover:opacity-75 underline" style={{ color: 'var(--guor-gold)' }}>
                  Cambiar
                </button>
              </div>

              <p className="text-[11px] font-medium opacity-50 text-center leading-relaxed" style={{ color: 'var(--guor-dark)' }}>
                Al procesar el abono, declara la conformidad de los lotes seleccionados. El estatus pasará a revisión financiera por tesorería de GUOR.
              </p>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setPaso('seleccion')} className="flex-1 h-11 rounded-xl border text-xs font-bold uppercase tracking-wider bg-white hover:bg-neutral-50 transition-colors" style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}>
                Volver
              </button>
              <button
                onClick={handleConfirmar}
                className="flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                style={{ backgroundColor: 'var(--guor-dark)' }}
              >
                <CheckCircle size={13} style={{ color: 'var(--guor-gold)' }} />
                Confirmar Transferencia
              </button>
            </div>
          </>
        )}

        {/* ── PASO 3: Procesando ──────────────────────────────────────── */}
        {paso === 'procesando' && (
          <div className="p-12 flex flex-col items-center justify-center gap-5 text-center">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-neutral-100" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent animate-spin" style={{ borderTopColor: 'var(--guor-gold)' }} />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-wider" style={{ color: 'var(--guor-dark)' }}>Validando Operación</p>
              <p className="text-xs opacity-50 mt-1" style={{ color: 'var(--guor-dark)' }}>Sincronizando con los servidores de tesorería...</p>
            </div>
          </div>
        )}

        {/* ── PASO 4: Éxito ───────────────────────────────────────────── */}
        {paso === 'exito' && (
          <div className="p-10 flex flex-col items-center justify-center gap-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-wider" style={{ color: 'var(--guor-dark)' }}>¡Transacción Notificada!</p>
              <p className="text-xs opacity-50 mt-2 max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--guor-dark)' }}>
                Tu solicitud de abono con <strong style={{ color: 'var(--guor-gold)' }}>{metodoSeleccionado?.nombre}</strong> se registró correctamente. La orden comenzará manufactura tras el cruce de cuentas.
              </p>
            </div>
            <div className="w-full mt-1 p-4 rounded-xl border text-left space-y-2" style={{ backgroundColor: 'var(--guor-cream)', borderColor: 'var(--guor-stone)' }}>
              <div className="flex justify-between text-xs">
                <span className="opacity-50" style={{ color: 'var(--guor-dark)' }}>Contrato Logístico</span>
                <span className="font-black" style={{ color: 'var(--guor-dark)' }}>#{pedido.id}</span>
              </div>
              <div className="flex justify-between text-xs border-t pt-2" style={{ borderColor: 'var(--guor-stone)' }}>
                <span className="opacity-50" style={{ color: 'var(--guor-dark)' }}>Importe Declarado</span>
                <span className="font-black text-sm" style={{ color: 'var(--guor-dark)' }}>{pedido.moneda ?? 'PEN'} {totalFormateado}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full h-11 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-md transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--guor-dark)' }}
            >
              Concluir Ventana
            </button>
          </div>
        )}

        {/* ── PASO 5: Error ───────────────────────────────────────────── */}
        {paso === 'error' && (
          <div className="p-10 flex flex-col items-center justify-center gap-5 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center">
              <AlertCircle size={28} className="text-rose-500" />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-wider" style={{ color: 'var(--guor-dark)' }}>Conflicto de Enlace</p>
              <p className="text-xs opacity-50 mt-2" style={{ color: 'var(--guor-dark)' }}>
                No se pudo procesar la solicitud del token de pago. Intente de nuevo.
              </p>
            </div>
            <div className="flex gap-3 w-full mt-2">
              <button onClick={onClose} className="flex-1 h-11 rounded-xl border text-xs font-bold uppercase tracking-wider bg-white hover:bg-neutral-50 transition-colors" style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}>
                Cancelar
              </button>
              <button onClick={() => setPaso('seleccion')} className="flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-md transition-colors" style={{ backgroundColor: 'var(--guor-dark)' }}>
                Reintentar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}