'use client';

import { XCircle, RefreshCw } from 'lucide-react';

interface Props {
    mensaje: string;
    onReintentar: () => void;
}

export function PedidosError({ mensaje, onReintentar }: Props) {
    return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#e4c28a]/15 flex items-center justify-center">
                <XCircle size={20} className="text-[#b5854b]/50" />
            </div>
            <p className="text-xs font-bold text-[#231e1d]/40">{mensaje}</p>
            <button
                onClick={onReintentar}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#231e1d] text-[#e4c28a] text-xs font-bold hover:bg-[#b5854b] hover:text-[#fff4e2] transition-all duration-200"
            >
                <RefreshCw size={12} />
                Reintentar
            </button>
        </div>
    );
}