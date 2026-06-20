'use client';

import { useCallback, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { useCartStore, selectCanCheckout } from '@/lib/store/useCartStore';
import { resolveCartMoq } from '@/lib/constants/portal-b2b';
import { usePortal } from '@/lib/hooks/usePortal';
import { formatCurrency } from '@/lib/helpers/format-helpers';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  CheckoutDireccionSelector,
  type CheckoutDireccionState,
} from '@/components/portal/compras/CheckoutDireccionSelector';

export default function ConfirmarCompraPage() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const getTotal = useCartStore((s) => s.getTotal);
  const canCheckout = useCartStore(selectCanCheckout);

  const { cliente, zonaEnvio, costosEnvio } = usePortal();
  const zonaEnvioSeleccionada = costosEnvio.find((z) => z.zona === zonaEnvio);
  const [isPending, startTransition] = useTransition();
  const [direccionState, setDireccionState] = useState<CheckoutDireccionState>({
    id: null,
    direccionDespacho: null,
    listo: false,
    vacio: false,
  });

  const handleDireccionChange = useCallback((state: CheckoutDireccionState) => {
    setDireccionState(state);
  }, []);

  const subtotal = getTotal();
  const puedeConfirmar = canCheckout && cliente && direccionState.listo;

  const handleConfirmar = () => {
    if (!puedeConfirmar) return;

    // 1. Filtrar de manera proactiva ítems sin variante válida
    const itemsValidos = items.filter((i) => i.variante_id !== undefined && i.variante_id !== null);

    if (itemsValidos.length === 0) {
      toast.error('No hay productos con variantes válidas seleccionadas.');
      return;
    }

    if (!direccionState.listo || !direccionState.direccionDespacho) {
      toast.error('Seleccione una dirección de despacho registrada para continuar.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/portal/pedidos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: itemsValidos.map((i) => ({
              producto_id: i.producto_id,
              variante_id: i.variante_id,
              cantidad: i.cantidad,
              precio_unitario: i.precio,
              color_snapshot: i.color || 'Único',
              talla_snapshot: i.talla || 'U',
            })),
            direccion_despacho: direccionState.direccionDespacho,
            zona_envio: zonaEnvio,
            zona_envio_id: zonaEnvioSeleccionada?.id ?? null,
            costo_envio: zonaEnvioSeleccionada?.costo ?? 0,
            reservar_stock: true,
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          toast.error(json.mensaje ?? json.error ?? 'No se pudo registrar el pedido');
          return;
        }

        clearCart();
        toast.success('Pedido registrado correctamente');
        window.location.href = '/portal/pedidos';
      } catch {
        toast.error('Error de conexión al confirmar la compra');
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-5">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
          style={{ backgroundColor: 'var(--guor-stone)' }}
        >
          <ShoppingCart size={36} style={{ color: 'var(--guor-gold)' }} />
        </div>
        <h1 className="text-2xl font-black" style={{ color: 'var(--guor-dark)' }}>
          No hay productos para confirmar
        </h1>
        <p className="text-sm" style={{ color: 'var(--guor-dark)', opacity: 0.5 }}>
          Agrega productos desde el catálogo o abre el carrito desde la barra superior.
        </p>
        <Link
          href="/portal/productos"
          className="inline-block px-6 py-3 rounded-xl text-white font-black text-xs uppercase tracking-widest"
          style={{ backgroundColor: 'var(--guor-gold)' }}
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div
      className="max-w-5xl mx-auto space-y-6 pb-12"
      style={{ color: 'var(--guor-dark)' }}
    >
      {/* Encabezado */}
      <header className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'var(--guor-stone)' }}>
        <Link
          href="/portal/catalogo"
          className="w-9 h-9 rounded-full flex items-center justify-center border transition-colors hover:bg-guor-cream-deep"
          style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}
          aria-label="Volver al catálogo"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--guor-dark)' }}>
            Confirmar compra
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--guor-dark)', opacity: 0.5 }}>
            Revisa cantidades, MOQ y dirección antes de generar tu pedido.
          </p>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Lista de items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => {
            const moqMin = resolveCartMoq(item.moq);
            const moqOk = item.cantidad >= moqMin;
            const lineKey = `${item.producto_id}-${item.variante_id ?? 'x'}`;
            return (
              <article
                key={lineKey}
                className="rounded-2xl border p-4 flex gap-4"
                style={{ backgroundColor: 'white', borderColor: 'var(--guor-stone)' }}
              >
                <div className="flex-1 min-w-0">
                  <h2 className="font-black truncate" style={{ color: 'var(--guor-dark)' }}>
                    {item.nombre}
                  </h2>
                  <p className="text-[10px] font-bold uppercase mt-0.5" style={{ color: 'var(--guor-dark)', opacity: 0.4 }}>
                    {item.color} · {item.talla}
                  </p>
                  <p className="text-sm font-black mt-1" style={{ color: 'var(--guor-gold)' }}>
                    {formatCurrency(item.precio)} / ud
                  </p>
                  {!moqOk && (
                    <p className="text-xs flex items-center gap-1 mt-2 font-bold" style={{ color: '#b45309' }}>
                      <AlertTriangle size={12} />
                      Mínimo {moqMin} uds para este producto
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div
                    className="flex items-center rounded-xl border overflow-hidden"
                    style={{ borderColor: 'var(--guor-stone)' }}
                  >
                    <button
                      type="button"
                      className="px-2 py-2 transition-colors"
                      style={{ backgroundColor: 'var(--guor-cream-deep)' }}
                      onClick={() => updateQuantity(item.producto_id, item.variante_id, item.cantidad - 1)}
                      aria-label="Reducir cantidad"
                    >
                      <Minus size={13} style={{ color: 'var(--guor-dark)' }} />
                    </button>
                    <span className="w-12 text-center text-sm font-black" style={{ color: 'var(--guor-dark)' }}>
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      className="px-2 py-2 transition-colors"
                      style={{ backgroundColor: 'var(--guor-cream-deep)' }}
                      onClick={() => updateQuantity(item.producto_id, item.variante_id, item.cantidad + 1)}
                      aria-label="Aumentar cantidad"
                    >
                      <Plus size={13} style={{ color: 'var(--guor-dark)' }} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.producto_id, item.variante_id)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                    aria-label="Quitar del carrito"
                  >
                    <Trash2 size={15} className="text-red-400" />
                  </button>

                  <p className="text-sm font-black" style={{ color: 'var(--guor-dark)' }}>
                    {formatCurrency(item.precio * item.cantidad)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {/* Resumen lateral */}
        <aside
          className="rounded-2xl border p-5 h-fit space-y-4 sticky top-4"
          style={{ backgroundColor: 'var(--guor-cream)', borderColor: 'var(--guor-stone)' }}
        >
          <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: 'var(--guor-dark)' }}>
            Resumen del pedido
          </h2>

          <div
            className="space-y-2 pb-3 border-b text-xs"
            style={{ borderColor: 'var(--guor-stone)' }}
          >
            <div className="flex justify-between">
              <span style={{ color: 'var(--guor-dark)', opacity: 0.5 }}>Subtotal</span>
              <span className="font-black" style={{ color: 'var(--guor-dark)' }}>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--guor-dark)', opacity: 0.5 }}>Líneas</span>
              <span className="font-black" style={{ color: 'var(--guor-dark)' }}>{items.length}</span>
            </div>
          </div>

          {!canCheckout && (
            <p
              className="text-xs rounded-xl p-3 border font-bold"
              style={{
                backgroundColor: 'var(--guor-gold-dust)',
                borderColor: 'var(--guor-gold-pale)',
                color: '#92400e',
              }}
            >
              Ajusta las cantidades: todos los productos deben cumplir su MOQ.
            </p>
          )}

          <div>
            <label
              className="block text-[10px] font-black uppercase tracking-[0.2em] mb-1.5"
              style={{ color: 'var(--guor-dark)', opacity: 0.5 }}
            >
              Dirección de despacho
            </label>
            <CheckoutDireccionSelector
              selectedId={direccionState.id}
              onDireccionChange={handleDireccionChange}
            />
          </div>

          {direccionState.vacio && (
            <p
              className="text-[10px] leading-relaxed font-bold"
              style={{ color: '#92400e' }}
            >
              Debe registrar al menos una sede de despacho antes de confirmar el pedido.
            </p>
          )}

          <button
            type="button"
            disabled={!puedeConfirmar || isPending}
            onClick={handleConfirmar}
            className={cn(
              'w-full py-3 rounded-xl text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
            style={{ backgroundColor: 'var(--guor-gold)' }}
          >
            {isPending ? (
              <><Loader2 size={16} className="animate-spin" /> Procesando…</>
            ) : (
              'Confirmar pedido'
            )}
          </button>

          <p className="text-[10px] leading-relaxed" style={{ color: 'var(--guor-dark)', opacity: 0.4 }}>
            Se genera un pedido de venta y se reserva stock si hay disponibilidad.
          </p>

          <Link
            href="/portal/cotizaciones/solicitar"
            className="block text-center text-xs font-bold hover:underline"
            style={{ color: 'var(--guor-gold)' }}
          >
            ¿Necesitas negociar precios? Solicita una cotización
          </Link>
        </aside>
      </div>
    </div>
  );
}