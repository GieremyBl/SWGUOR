'use client';

import Link from 'next/link';
import { PackageSearch, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PedidosEmpty() {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center py-24 gap-5',
                'rounded-3xl border-2 border-dashed border-[#e4c28a]/40 bg-white/50',
            )}
        >
            <div className="w-16 h-16 rounded-3xl bg-[#e4c28a]/15 flex items-center justify-center">
                <PackageSearch size={26} className="text-[#b5854b]/50" />
            </div>
            <div className="text-center">
                <p className="text-sm font-black text-[#231e1d]/30">Sin pedidos registrados</p>
                <p className="text-[11px] text-[#231e1d]/20 font-medium mt-1">
                    Cuando realices un pedido aparecerá aquí
                </p>
            </div>
            <Link
                href="/portal/cotizaciones/nueva"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#231e1d] text-[#e4c28a] text-xs font-black hover:bg-[#b5854b] hover:text-[#fff4e2] transition-all duration-200"
            >
                <Plus size={13} />
                Crear cotización
            </Link>
        </div>
    );
}