'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Pencil, Ban, Loader2, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTarifasTaller } from '@/lib/hooks/useTarifaTalleres';
import { ESPECIALIDAD_TALLER_LABELS } from '@/lib/constants/talleres';
import { estaActivaYVigente } from '@/lib/helpers/tarifas-taller-helpers';
import type { TarifaTallerRow } from '@/lib/schemas/tarifa-talleres';
import type { TarifaTallerForm } from '@/lib/schemas/tarifa-talleres';

const TarifaTallerFormDialog = dynamic(
  () => import('@/components/admin/talleres/tarifas/TarifaTallerFormDialog'),
  { ssr: false } // Es buena práctica desactivar SSR en modales dinámicos
);

interface Props {
  tallerId: string;
  canEdit?: boolean;
}

function formatFecha(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function TarifasTallerSection({ tallerId, canEdit = true }: Props) {
  const {
    tarifas,
    isLoading,
    create,
    update,
    deactivate,
    isCreating,
    isUpdating,
    isDeactivating,
  } = useTarifasTaller(tallerId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TarifaTallerRow | null>(null);

  const isSaving = isCreating || isUpdating;
  const activas = tarifas.filter((t) => t.activo).length;

  // Modificamos la función para que devuelva Promise<void> descartando el retorno 
  // o manejándolo según lo requiera tu modal interno.
  const handleSave = async (
    payload: Omit<TarifaTallerForm, 'taller_id'>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (editing) {
        const res = await update(String(editing.id), payload);
        // Nos aseguramos de retornar la estructura exacta que pide el diálogo
        return {
          success: res?.success === true,
          error: res?.error ?? undefined
        };
      }

      const res = await create(payload);
      return {
        success: res?.success === true,
        error: res?.error ?? undefined
      };
    } catch (err: any) {
      // Por seguridad ante fallos inesperados de red o servidor
      return {
        success: false,
        error: err?.message || 'Error inesperado al guardar la tarifa'
      };
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('¿Desactivar esta tarifa?')) return;
    await deactivate(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold">
          <Coins className="w-4 h-4 text-amber-500" />
          <span>{tarifas.length} tarifas · {activas} activas</span>
        </div>
        {canEdit && (
          <Button
            size="sm"
            onClick={() => { setEditing(null); setDialogOpen(true); }}
            className="bg-rose-600 hover:bg-rose-700 text-white gap-2 h-9"
          >
            <Plus className="w-4 h-4" />
            Nueva tarifa
          </Button>
        )}
      </div>

      {tarifas.length === 0 ? (
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-4">
          Sin tarifas registradas para este taller.
        </p>
      ) : (
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {tarifas.map((row) => {
            const vigente = estaActivaYVigente(row);
            const espLabel = ESPECIALIDAD_TALLER_LABELS[
              row.especialidad as keyof typeof ESPECIALIDAD_TALLER_LABELS
            ] ?? row.especialidad;

            return (
              <div
                key={String(row.id)}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800">{espLabel}</span>
                    {!row.activo && (
                      <Badge variant="secondary" className="text-[10px]">Inactiva</Badge>
                    )}
                    {row.activo && vigente && (
                      <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100">Vigente</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {row.moneda} {Number(row.precio_unitario).toFixed(2)} ·{' '}
                    {formatFecha(row.vigente_desde)}
                    {row.vigente_hasta ? ` → ${formatFecha(row.vigente_hasta)}` : ''}
                  </p>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => { setEditing(row); setDialogOpen(true); }}
                      disabled={isSaving || isDeactivating}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    {row.activo && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-600"
                        onClick={() => void handleDeactivate(String(row.id))}
                        disabled={isSaving || isDeactivating}
                      >
                        {isDeactivating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Ban className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <TarifaTallerFormDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        editing={editing}
        isSaving={isSaving}
      />
    </div>
  );
}