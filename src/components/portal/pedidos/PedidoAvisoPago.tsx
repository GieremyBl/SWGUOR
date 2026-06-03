'use client';

import { CreditCard } from 'lucide-react';
import { Pedido } from './types';

interface Props {
    pedidos: Pedido[];
}

export function PedidoAvisoPago({ pedidos }: Props) {
    const pendientes = pedidos.filter((p) => p.estado_pago === 'pendiente');
    if (pendientes.length === 0) return null;

    return (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <CreditCard size={14} className="text-amber-600" />
            </div>
            <div className="flex-1">
                <p className="text-xs font-bold text-amber-700">
                    Tienes {pendientes.length} pago(s) pendiente(s)
                </p>
                <p className="text-[10px] text-amber-500 mt-0.5">
                    Usa el botón <strong>Pagar</strong> en cada pedido para completar tu pago.
                </p>
            </div>
        </div>
    );
}