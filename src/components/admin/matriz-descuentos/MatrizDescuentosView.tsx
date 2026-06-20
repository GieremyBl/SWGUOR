'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Pencil, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { MatrizProductoRow } from '@/lib/services/matriz-descuentos.service';
import { EditarDescuentosModal } from './EditarDescuentosModal';

function formatPen(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

export function MatrizDescuentosView() {
  const [rows, setRows] = useState<MatrizProductoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [debounced, setDebounced] = useState('');
  const [editRow, setEditRow] = useState<MatrizProductoRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(busqueda), 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const qs = debounced ? `?busqueda=${encodeURIComponent(debounced)}` : '';
      const res = await fetch(`/api/admin/matriz-descuentos${qs}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al cargar matriz');
      setRows(Array.isArray(json.data) ? json.data : []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar datos');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [debounced]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleDesactivada = (reglaId: string) => {
    setRows((prev) =>
      prev.map((row) => {
        const descuentos = row.descuentos.filter((d) => d.regla_id !== reglaId);
        const totalPct = Math.min(
          descuentos.reduce((s, d) => s + d.valor_descuento, 0),
          100,
        );
        const precioFinal = row.precio_base * (1 - totalPct / 100);
        return {
          ...row,
          descuentos,
          precio_final_estimado: precioFinal,
          tiene_colision: descuentos.length > 2,
        };
      }),
    );
    if (editRow) {
      const updated = editRow.descuentos.filter((d) => d.regla_id !== reglaId);
      setEditRow({
        ...editRow,
        descuentos: updated,
        precio_final_estimado:
          editRow.precio_base *
          (1 - Math.min(updated.reduce((s, d) => s + d.valor_descuento, 0), 100) / 100),
        tiene_colision: updated.length > 2,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Buscar por SKU o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={cargar} disabled={loading}>
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 font-semibold w-8" />
                <th className="text-left p-3 font-semibold">SKU</th>
                <th className="text-left p-3 font-semibold">Producto</th>
                <th className="text-left p-3 font-semibold">Categoría</th>
                <th className="text-right p-3 font-semibold">Precio base</th>
                <th className="text-left p-3 font-semibold min-w-[220px]">Descuentos activos</th>
                <th className="text-right p-3 font-semibold">Precio final est.</th>
                <th className="text-right p-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-700" />
                    Cargando matriz de precios...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No hay productos que coincidan
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-t border-slate-100 transition-colors',
                      row.tiene_colision && 'bg-amber-50/80',
                    )}
                  >
                    <td className="p-3 pl-4">
                      {row.tiene_colision && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex text-amber-600">
                              <AlertTriangle className="w-4 h-4" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            Múltiples descuentos detectados. Riesgo de superposición.
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </td>
                    <td className="p-3 font-mono text-xs text-slate-600">{row.sku}</td>
                    <td className="p-3 font-medium text-slate-900">{row.nombre}</td>
                    <td className="p-3 text-slate-600">{row.categoria ?? '—'}</td>
                    <td className="p-3 text-right tabular-nums">{formatPen(row.precio_base)}</td>
                    <td className="p-3">
                      {row.descuentos.length === 0 ? (
                        <span className="text-xs text-slate-400">Sin descuentos</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {row.descuentos.map((d) => (
                            <span
                              key={d.regla_id}
                              className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {d.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right font-semibold tabular-nums text-slate-900">
                      {formatPen(row.precio_final_estimado)}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => setEditRow(row)}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Editar descuentos
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {editRow && (
        <EditarDescuentosModal
          producto={editRow}
          onClose={() => setEditRow(null)}
          onDesactivada={handleDesactivada}
        />
      )}
    </div>
  );
}
