'use client';

import { useState } from 'react';
import { Ban, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { MatrizProductoRow } from '@/lib/services/matriz-descuentos.service';

interface Props {
  producto: MatrizProductoRow;
  onClose: () => void;
  onDesactivada: (reglaId: string) => void;
}

function formatPen(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

export function EditarDescuentosModal({ producto, onClose, onDesactivada }: Props) {
  const [desactivando, setDesactivando] = useState<string | null>(null);

  const handleDesactivar = async (reglaId: string) => {
    setDesactivando(reglaId);
    try {
      const res = await fetch(`/api/admin/reglas-descuento/${reglaId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'No se pudo desactivar la regla');
      }
      toast.success('Regla desactivada');
      onDesactivada(reglaId);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al desactivar');
    } finally {
      setDesactivando(null);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Editar descuentos</h2>
            <p className="text-sm text-slate-500 mt-0.5">{producto.nombre}</p>
            <p className="text-xs text-slate-400 font-mono mt-1">{producto.sku}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          <div className="flex justify-between text-sm text-slate-600 pb-2 border-b">
            <span>Precio base</span>
            <span className="font-medium tabular-nums">{formatPen(producto.precio_base)}</span>
          </div>

          {producto.descuentos.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6">
              Este producto no tiene reglas de descuento activas.
            </p>
          )}

          {producto.descuentos.map((d) => (
            <div
              key={d.regla_id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{d.label}</p>
                <p className="text-xs text-slate-500">
                  Mín. {d.cantidad_min} uds · -{d.valor_descuento}%
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                disabled={desactivando === d.regla_id}
                onClick={() => handleDesactivar(d.regla_id)}
              >
                {desactivando === d.regla_id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5 mr-1" />
                    Desactivar
                  </>
                )}
              </Button>
            </div>
          ))}

          {producto.tiene_colision && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3">
              Hay más de dos descuentos activos en este producto. Desactiva reglas conflictivas para
              reducir el riesgo de superposición.
            </p>
          )}
        </div>

        <div className="p-5 border-t flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
