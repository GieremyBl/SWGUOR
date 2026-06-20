'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Loader2, MapPin, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  buscarDireccionPorId,
  formatearDireccionDespachoPedido,
  formatearUbigeo,
  resolverDireccionSeleccionDefault,
} from '@/lib/helpers/direcciones-cliente-helpers';
import { useDireccionesClientePortal } from '@/lib/hooks/useDireccionesClientePortal';
import { cn } from '@/lib/utils';

export interface CheckoutDireccionState {
  id: string | null;
  direccionDespacho: string | null;
  listo: boolean;
  vacio: boolean;
}

interface CheckoutDireccionSelectorProps {
  selectedId: string | null;
  onDireccionChange: (state: CheckoutDireccionState) => void;
}

export function CheckoutDireccionSelector({
  selectedId,
  onDireccionChange,
}: CheckoutDireccionSelectorProps) {
  const { direcciones, isLoading } = useDireccionesClientePortal();

  const effectiveSelectedId = useMemo(() => {
    if (direcciones.length === 0) return null;
    if (selectedId && direcciones.some((d) => d.id === selectedId)) return selectedId;
    return resolverDireccionSeleccionDefault(direcciones);
  }, [direcciones, selectedId]);

  useEffect(() => {
    if (isLoading) {
      onDireccionChange({
        id: null,
        direccionDespacho: null,
        listo: false,
        vacio: false,
      });
      return;
    }

    if (direcciones.length === 0) {
      onDireccionChange({
        id: null,
        direccionDespacho: null,
        listo: false,
        vacio: true,
      });
      return;
    }

    const id = effectiveSelectedId;
    const dir = buscarDireccionPorId(direcciones, id);

    onDireccionChange({
      id,
      direccionDespacho: dir ? formatearDireccionDespachoPedido(dir) : null,
      listo: Boolean(dir),
      vacio: false,
    });
  }, [direcciones, effectiveSelectedId, isLoading, onDireccionChange]);

  if (isLoading) {
    return (
      <div
        className="flex items-center gap-2 rounded-xl border px-3 py-4 text-xs font-medium"
        style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)', opacity: 0.6 }}
      >
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        Cargando direcciones registradas…
      </div>
    );
  }

  if (direcciones.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed p-4 text-center space-y-3"
        style={{ borderColor: 'var(--guor-stone)', backgroundColor: 'white' }}
      >
        <div
          className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: 'var(--guor-cream-deep)' }}
        >
          <MapPin className="w-5 h-5" style={{ color: 'var(--guor-gold)' }} />
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--guor-dark)', opacity: 0.65 }}>
          Aún no tiene sedes de despacho registradas. Debe agregar al menos una para confirmar su
          pedido.
        </p>
        <Link
          href="/portal/direcciones"
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--guor-gold)' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Registrar dirección de despacho obligatoria para continuar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2" role="radiogroup" aria-label="Dirección de despacho">
      {direcciones.map((direccion) => {
        const selected = effectiveSelectedId === direccion.id;
        const ubigeo = formatearUbigeo(direccion);

        return (
          <button
            key={direccion.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() =>
              onDireccionChange({
                id: direccion.id,
                direccionDespacho: formatearDireccionDespachoPedido(direccion),
                listo: true,
                vacio: false,
              })
            }
            className={cn(
              'w-full text-left rounded-xl border-2 p-3.5 transition-all',
              selected
                ? 'border-[var(--guor-gold)] bg-[var(--guor-gold-dust)] shadow-sm'
                : 'border-[var(--guor-stone)] bg-white hover:border-[var(--guor-gold-pale)]',
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span
                className="text-sm font-black"
                style={{ color: 'var(--guor-dark)' }}
              >
                {direccion.alias}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {direccion.es_principal && (
                  <Badge
                    className="text-[10px] px-2 py-0 border-0"
                    style={{ backgroundColor: 'var(--guor-gold)', color: 'white' }}
                  >
                    Principal
                  </Badge>
                )}
                <span
                  className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                    selected ? 'border-[var(--guor-gold)]' : 'border-slate-300',
                  )}
                  aria-hidden
                >
                  {selected && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: 'var(--guor-gold)' }}
                    />
                  )}
                </span>
              </div>
            </div>
            <p
              className="text-xs leading-relaxed mb-1"
              style={{ color: 'var(--guor-dark)', opacity: 0.75 }}
            >
              {direccion.direccion}
            </p>
            <p
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--guor-dark)', opacity: 0.45 }}
            >
              {ubigeo}
            </p>
          </button>
        );
      })}
    </div>
  );
}
