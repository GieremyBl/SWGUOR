'use client';

import { Loader2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Proveedor } from '@/lib/schemas/proveedor';

// ─────────────────────────────────────────────────────────────
// DELETE MODAL
// ─────────────────────────────────────────────────────────────

interface DeleteProps {
  proveedor: Proveedor;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ProveedorDeleteModal({ proveedor, isDeleting, onClose, onConfirm }: DeleteProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Desactivar Proveedor</h3>
        <p className="text-sm text-gray-500 mt-2">
          ¿Estás seguro de desactivar a{' '}
          <span className="font-semibold text-gray-900">{proveedor.razon_social}</span>?
          Esta acción es un borrado lógico y se puede revertir.
        </p>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11" disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white"
            disabled={isDeleting}
          >
            {isDeleting
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Desactivando...</>
              : 'Desactivar'
            }
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DETAIL MODAL
// ─────────────────────────────────────────────────────────────

interface DetailProps {
  proveedor: Proveedor;
  onClose: () => void;
}

export function ProveedorDetailModal({ proveedor, onClose }: DetailProps) {
  const fields = [
    { label: 'RUC', value: proveedor.ruc },
    { label: 'Razón Social', value: proveedor.razon_social },
    { label: 'Contacto', value: proveedor.contacto },
    { label: 'Teléfono', value: proveedor.telefono },
    { label: 'Email', value: proveedor.email },
    { label: 'Dirección', value: proveedor.direccion },
    { label: 'Categoría', value: proveedor.categoria_suministro },
    { label: 'Estado', value: proveedor.estado === 'activo' ? 'Activo' : 'Inactivo' },
    { label: 'Insumos asociados', value: String(proveedor._count?.insumos ?? 0) },
    { label: 'Órdenes de compra', value: String(proveedor._count?.ordenes_compra ?? 0) },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 rounded-xl">
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{proveedor.razon_social}</h3>
              <p className="text-xs text-gray-500">RUC: {proveedor.ruc}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {fields.map((f) => (
            <div key={f.label} className="flex justify-between items-center py-2 border-b last:border-0">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{f.label}</span>
              <span className="text-sm font-medium text-gray-900">{f.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}