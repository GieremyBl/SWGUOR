'use client';

// GUOR PRO Modal Design — Órdenes de Compra
import { Loader2, ShieldOff, CheckCircle2} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumeroOc } from '@/lib/helpers/ordenes-compra-helpers';

// ─────────────────────────────────────────────────────────────
// CANCEL / ARCHIVE MODAL
// ─────────────────────────────────────────────────────────────

interface ArchiveProps {
  ordenCompra: { id: number | string } | null;
  isArchiving?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function OrdenCompraArchiveModal({ ordenCompra, isArchiving = false, onClose, onConfirm }: ArchiveProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldOff className="w-7 h-7 text-amber-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Cancelar Orden de Compra</h3>
        <p className="text-sm text-gray-500 mt-2">
          ¿Estás seguro de cancelar la orden de compra{' '}
          <span className="font-semibold text-amber-600">
            {ordenCompra ? formatNumeroOc(ordenCompra.id) : ''}
          </span>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11 rounded-xl" disabled={isArchiving}>
            Cerrar
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
            disabled={isArchiving}
          >
            {isArchiving
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Cancelando...</>
              : 'Confirmar Cancelación'
            }
          </Button>
        </div>
      </div>
    </div>
  );
}



// ─────────────────────────────────────────────────────────────
// CONFIRM / APPROVE MODAL
// ─────────────────────────────────────────────────────────────
interface ConfirmProps {
  ordenCompra: { id: number | string } | null;
  isConfirming?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function OrdenCompraConfirmModal({ ordenCompra, isConfirming = false, onClose, onConfirm }: ConfirmProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Confirmar Orden de Compra</h3>
        <p className="text-sm text-gray-500 mt-2">
          ¿Estás seguro de confirmar la orden de compra{' '}
          <span className="font-semibold text-emerald-600">
            {ordenCompra ? formatNumeroOc(ordenCompra.id) : ''}
          </span>?
        </p>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11 rounded-xl" disabled={isConfirming}>
            Cerrar
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            disabled={isConfirming}
          >
            {isConfirming ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Confirmando...</>
            ) : (
              'Confirmar Orden'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
