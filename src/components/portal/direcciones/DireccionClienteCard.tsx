'use client';

import { useState } from 'react';
import { Loader2, MapPin, Pencil, Star, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatearUbigeo } from '@/lib/helpers/direcciones-cliente-helpers';
import type { DireccionClienteRecord } from '@/lib/schemas/direcciones-cliente';
import { cn } from '@/lib/utils';

interface DireccionClienteCardProps {
  direccion: DireccionClienteRecord;
  onEditar: (direccion: DireccionClienteRecord) => void;
  onMarcarPrincipal: (id: string) => Promise<void>;
  onEliminar: (id: string) => Promise<void>;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function DireccionClienteCard({
  direccion,
  onEditar,
  onMarcarPrincipal,
  onEliminar,
  isUpdating,
  isDeleting,
}: DireccionClienteCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const esPrincipal = Boolean(direccion.es_principal);
  const ubigeo = formatearUbigeo(direccion);
  const busy = isUpdating || isDeleting;

  const handleConfirmDelete = async () => {
    await onEliminar(direccion.id);
    setConfirmOpen(false);
  };

  return (
    <>
      <article
        className={cn(
          'group relative flex flex-col rounded-2xl border bg-white shadow-[0_4px_20px_rgba(15,23,42,0.03)]',
          'transition-all duration-200 hover:shadow-[0_8px_30px_rgba(15,23,42,0.06)]',
          esPrincipal ? 'border-rose-200 ring-1 ring-rose-100' : 'border-slate-200',
        )}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-base font-bold text-slate-900 truncate">{direccion.alias}</h3>
              {esPrincipal && (
                <Badge className="bg-rose-500 hover:bg-rose-500 text-white border-0 shadow-sm">
                  Principal
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{direccion.direccion}</p>
          </div>
          <div className="shrink-0 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <MapPin className="w-4 h-4 text-rose-500" />
          </div>
        </div>

        <div className="px-5 pb-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Ubigeo
          </p>
          <p className="text-sm font-medium text-slate-700">{ubigeo}</p>
        </div>

        <div className="mt-auto border-t border-slate-100 px-5 py-4 flex flex-col gap-3">
          {!esPrincipal && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => onMarcarPrincipal(direccion.id)}
              className="justify-start h-9 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
            >
              <span className="inline-flex items-center">
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Star className="w-4 h-4 mr-2" />
                )}
                Marcar como principal
              </span>
            </Button>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => onEditar(direccion)}
              className="flex-1 h-9 rounded-xl"
            >
              <span className="inline-flex items-center">
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy || esPrincipal}
              onClick={() => setConfirmOpen(true)}
              className={cn(
                'flex-1 h-9 rounded-xl',
                esPrincipal
                  ? 'text-slate-300 border-slate-100'
                  : 'text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700',
              )}
              title={
                esPrincipal
                  ? 'No puede eliminar la dirección principal'
                  : 'Eliminar dirección'
              }
            >
              <span className="inline-flex items-center">
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Eliminar
              </span>
            </Button>
          </div>
        </div>
      </article>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta dirección?</AlertDialogTitle>
            <AlertDialogDescription>
              <span>
                Se eliminará permanentemente la sede <strong>{direccion.alias}</strong>.
                Esta acción no se puede deshacer.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
            >
              <span className="inline-flex items-center">
                {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Sí, eliminar
              </span>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
