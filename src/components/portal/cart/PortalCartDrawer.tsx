'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertTriangle,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useCartStore, selectCanCheckout } from '@/lib/store/useCartStore';
import { resolveCartMoq } from '@/lib/constants/portal-b2b';
import { formatCurrency } from '@/lib/helpers/format-helpers';
import { cn } from '@/lib/utils';

interface PortalCartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PortalCartDrawer({ open, onOpenChange }: PortalCartDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const getTotal = useCartStore((s) => s.getTotal);
  const canCheckout = useCartStore(selectCanCheckout);

  useEffect(() => setMounted(true), []);

  const total = mounted ? getTotal() : 0;
  const checkoutEnabled = mounted && canCheckout;
  const totalUnidades = items.reduce((s, i) => s + i.cantidad, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 gap-0 border-l border-border bg-background"
      >
        {/* Cabecera con fondo sutil de la paleta cálida (bg-muted) */}
        <SheetHeader className="px-5 py-5 border-b border-border bg-muted/60">
          <SheetTitle className="flex items-center gap-2 text-foreground font-black tracking-tight">
            <ShoppingCart size={20} className="text-primary" />
            Carrito de compras
          </SheetTitle>
          <SheetDescription className="text-muted-foreground font-medium">
            {mounted && items.length > 0
              ? `${items.length} producto(s) · ${totalUnidades} unidades`
              : 'Compra rápida B2B — solo pedidos directos'}
          </SheetDescription>
        </SheetHeader>

        {/* Contenedor del listado */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-background">
          {!mounted ? (
            <p className="text-sm text-muted-foreground text-center py-8 font-medium">Cargando carrito…</p>
          ) : items.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <ShoppingCart size={28} className="text-muted-foreground/60" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-foreground font-bold">Tu carrito está vacío</p>
                <p className="text-xs text-muted-foreground">Añade productos desde el catálogo B2B para empezar.</p>
              </div>
              <Link
                href="/portal/catalogo"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-secondary px-4 text-xs font-bold text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80"
              >
                Ir al catálogo
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => {
                const moqMin = resolveCartMoq(item.moq);
                const moqOk = item.cantidad >= moqMin;
                const lineKey = `${item.producto_id}-${item.variante_id ?? 'x'}`;
                return (
                  <li
                    key={lineKey}
                    className="flex gap-3 p-3 rounded-xl border border-border bg-card shadow-sm transition-all hover:border-border/80"
                  >
                    {/* Contenedor de la Imagen */}
                    <div className="w-16 h-16 rounded-lg bg-muted border border-border overflow-hidden shrink-0 relative">
                      {item.imagen_url ? (
                        <Image
                          src={item.imagen_url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="64px"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                          <ShoppingCart size={20} />
                        </div>
                      )}
                    </div>

                    {/* Detalles del Item */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-foreground truncate">{item.nombre}</p>
                          <p className="text-sm font-black text-foreground shrink-0">
                            {formatCurrency(item.precio * item.cantidad)}
                          </p>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                          {item.color} · {item.talla} · <span className="text-primary/90 font-medium">{formatCurrency(item.precio)} c/u</span>
                        </p>
                      </div>

                      {/* Selectores de Cantidad y Alerta de MOQ */}
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <div className="flex items-center border border-border rounded-lg bg-background">
                          <button
                            type="button"
                            className="p-1.5 hover:bg-muted text-muted-foreground rounded-l-lg transition-colors"
                            onClick={() =>
                              updateQuantity(
                                item.producto_id,
                                item.variante_id,
                                item.cantidad - 1,
                              )
                            }
                            aria-label="Reducir cantidad"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-foreground">
                            {item.cantidad}
                          </span>
                          <button
                            type="button"
                            className="p-1.5 hover:bg-muted text-muted-foreground rounded-r-lg transition-colors"
                            onClick={() =>
                              updateQuantity(
                                item.producto_id,
                                item.variante_id,
                                item.cantidad + 1,
                              )
                            }
                            aria-label="Aumentar cantidad"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Alerta de MOQ semántica utilizando el color destructivo de Shadcn */}
                          {!moqOk && (
                            <span className="text-[10px] bg-destructive/10 text-destructive border border-destructive/20 rounded-md px-1.5 py-0.5 flex items-center gap-0.5 font-bold">
                              <AlertTriangle size={10} />
                              Mín. {moqMin}
                            </span>
                          )}

                          {/* Botón Eliminar */}
                          <button
                            type="button"
                            onClick={() => removeItem(item.producto_id, item.variante_id)}
                            className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                            aria-label="Quitar del carrito"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer del Carrito con separación clara */}
        {mounted && items.length > 0 && (
          <SheetFooter className="border-t border-border px-5 py-5 bg-muted/40 flex-col gap-3 sm:flex-col">
            <div className="flex justify-between w-full text-sm items-center">
              <span className="text-muted-foreground font-medium">Subtotal estimado</span>
              <span className="text-xl font-black text-foreground tracking-tight">{formatCurrency(total)}</span>
            </div>

            {/* Banner preventivo de MOQ usando tokens destructivos suaves */}
            {!checkoutEnabled && (
              <div className="w-full text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2.5 font-medium flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>Algunos productos en tu carrito no cumplen con la cantidad mínima (MOQ) requerida.</span>
              </div>
            )}

            {/* Botones de acción principales */}
            <div className="space-y-2 w-full mt-2">
              <Link
                href="/portal/compras"
                onClick={() => onOpenChange(false)}
                className={cn(
                  'flex w-full py-3 items-center justify-center rounded-xl text-center font-bold text-sm text-primary-foreground shadow-sm transition-all',
                  checkoutEnabled
                    ? 'bg-primary hover:opacity-90 active:scale-[0.99]'
                    : 'pointer-events-none opacity-40 bg-muted-foreground text-muted shadow-none',
                )}
                aria-disabled={!checkoutEnabled}
              >
                Confirmar compra
              </Link>

              <Link
                href="/portal/catalogo"
                onClick={() => onOpenChange(false)}
                className="flex w-full py-2 items-center justify-center text-center text-xs font-bold text-muted-foreground hover:text-foreground transition-colors hover:underline"
              >
                Seguir comprando
              </Link>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}