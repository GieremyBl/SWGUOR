'use client';

import Link from 'next/link';
import { Eye, CheckCircle2, XCircle, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ESTADOS_ORDEN_COMPRA,
  ESTADOS_PAGO_ORDEN_COMPRA,
} from '@/lib/constants/estados';
import { formatNumeroOc } from '@/lib/helpers/ordenes-compra-helpers';
import type { OrdenCompraRow } from './types';
import { OrdenCompraArchiveModal, OrdenCompraConfirmModal } from './OrdenCompraModals';

interface Props {
  ordenes: OrdenCompraRow[];
  onVer: (orden: OrdenCompraRow) => void;
  onConfirmar?: (orden: OrdenCompraRow) => void;
  onCancelar?: (orden: OrdenCompraRow) => void;
  canConfirm?: boolean;
  canCancel?: boolean;
  isCancelling?: boolean;
}

const tableWrap =
  'bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden';
const thClass =
  'text-left py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest';
const tdClass = 'py-4 px-5';
const badgeClass =
  'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider';

export default function OrdenesCompraTable({
  ordenes,
  onVer,
  onConfirmar,
  onCancelar,
  canConfirm = false,
  canCancel = false,
  isCancelling = false,
}: Props) {

  // ESTADOS para confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [ordenToConfirm, setOrdenToConfirm] = useState<OrdenCompraRow | null>(null);
  const [isConfirmingState, setIsConfirmingState] = useState(false);

  // ESTADOS para cancelación
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [ordenToCancel, setOrdenToCancel] = useState<OrdenCompraRow | null>(null);

  if (!ordenes.length) {
    return (
      <div className={tableWrap}>
        <div className="py-16 text-center flex flex-col items-center gap-2">
          <ClipboardList className="w-8 h-8 text-gray-300" />
          <span className="text-gray-400 italic text-sm">No hay órdenes de compra</span>
        </div>
      </div>
    );
  }

  return (
    <div className={tableWrap}>
      <table className="w-full">
        <thead className="bg-gray-50/50">
          <tr>
            <th className={thClass}>N° OC</th>
            <th className={thClass}>Proveedor</th>
            <th className={thClass}>Cotización</th>
            <th className={`${thClass} text-right`}>Total</th>
            <th className={thClass}>F. prometida</th>
            <th className={thClass}>Estado</th>
            <th className={thClass}>Pago</th>
            <th className={`${thClass} text-center`}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ordenes.map((orden) => {
            const est = ESTADOS_ORDEN_COMPRA[orden.estado] ?? {
              label: orden.estado,
              color: 'text-slate-600',
              bgColor: 'bg-slate-100',
            };
            const pago = ESTADOS_PAGO_ORDEN_COMPRA[orden.estado_pago] ?? {
              label: orden.estado_pago,
              color: 'text-slate-600',
              bgColor: 'bg-slate-100',
            };
            const puedeConfirmar =
              canConfirm && orden.estado === 'pendiente' && !!onConfirmar;
            const puedeCancelar =
              canCancel &&
              orden.estado !== 'cancelada' &&
              orden.estado !== 'completada' &&
              !!onCancelar;

            return (
              <tr
                key={orden.id}
                className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors"
              >
                <td className={`${tdClass} font-bold text-slate-900`}>
                  <Link
                    href={`/admin/Panel-Administrativo/ordenes-compra/${orden.id}`}
                    className="hover:text-rose-600"
                  >
                    {formatNumeroOc(orden.id)}
                  </Link>
                </td>
                <td className={tdClass}>
                  <span className="font-medium text-slate-800 text-sm">
                    {orden.proveedores?.razon_social ?? `Prov. #${orden.proveedor_id}`}
                  </span>
                </td>
                <td className={`${tdClass} text-slate-500 text-xs`}>
                  {orden.cotizaciones_proveedor?.numero_externo
                    ? `#${orden.cotizaciones_proveedor.numero_externo}`
                    : orden.cotizacion_proveedor_id
                      ? `COT-${orden.cotizacion_proveedor_id}`
                      : 'Manual'}
                </td>
                <td className={`${tdClass} text-right font-bold text-slate-800 text-sm`}>
                  S/ {Number(orden.total_orden).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </td>
                <td className={`${tdClass} text-slate-500 text-xs`}>
                  {orden.fecha_prometida
                    ? new Date(orden.fecha_prometida).toLocaleDateString('es-PE')
                    : '—'}
                </td>
                <td className={tdClass}>
                  <span className={`${badgeClass} ${est.bgColor} ${est.color}`}>
                    {est.label}
                  </span>
                </td>
                <td className={tdClass}>
                  <span className={`${badgeClass} ${pago.bgColor} ${pago.color}`}>
                    {pago.label}
                  </span>
                </td>
                <td className={tdClass}>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => onVer(orden)}
                      title="Ver detalle"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    {puedeConfirmar && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl text-emerald-600 hover:bg-emerald-50"
                        onClick={() => {
                          setOrdenToConfirm(orden);
                          setShowConfirmModal(true);
                        }}
                        title="Confirmar"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    )}

                    {puedeCancelar && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setOrdenToCancel(orden);
                          setShowCancelModal(true);
                        }}
                        title="Cancelar"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Renderizado de Modales de Acción */}
      <>
        {showCancelModal && (
          <OrdenCompraArchiveModal
            ordenCompra={ordenToCancel}
            isArchiving={isCancelling}
            onClose={() => {
              setShowCancelModal(false);
              setOrdenToCancel(null);
            }}
            onConfirm={async () => {
              if (ordenToCancel && onCancelar) {
                try {
                  await onCancelar(ordenToCancel);
                } finally {
                  setShowCancelModal(false);
                  setOrdenToCancel(null);
                }
              }
            }}
          />
        )}

        {showConfirmModal && (
          <OrdenCompraConfirmModal
            ordenCompra={ordenToConfirm}
            isConfirming={isConfirmingState}
            onClose={() => {
              setShowConfirmModal(false);
              setOrdenToConfirm(null);
            }}
            onConfirm={async () => {
              if (ordenToConfirm && onConfirmar) {
                try {
                  setIsConfirmingState(true);
                  await onConfirmar(ordenToConfirm);
                } catch (error) {
                  console.error("Error al confirmar la orden:", error);
                } finally {
                  setIsConfirmingState(false);
                  setShowConfirmModal(false);
                  setOrdenToConfirm(null);
                }
              }
            }}
          />
        )}
      </>
    </div>
  );
}