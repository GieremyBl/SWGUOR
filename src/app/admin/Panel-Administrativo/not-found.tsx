'use client';

import Link from 'next/link';
import { LayoutDashboard, ShieldAlert, RefreshCw } from 'lucide-react';

export default function ErpNotFound() {
    return (
        <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-slate-200/60 shadow-sm">
            <div className="max-w-sm w-full text-center space-y-5">

                {/* Icono de Alerta de Sistema */}
                <div className="mx-auto w-14 h-14 bg-red-50 text-red-600 rounded-xl flex items-center justify-center border border-red-100 shadow-sm">
                    <ShieldAlert size={28} className="stroke-[2]" />
                </div>

                <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase tracking-wider">
                        Código de Error: 404_NOT_FOUND
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight pt-1">
                        Recurso no encontrado en el ERP
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        El registro, cliente, SKU o reporte solicitado no existe en la base de datos o no cuenta con los privilegios de sesión necesarios.
                    </p>
                </div>

                {/* Acciones ERP */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="h-10 px-4 rounded-lg border border-slate-300 bg-white font-bold text-xs text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <RefreshCw size={13} />
                        Reintentar
                    </button>

                    <Link
                        href="/dashboard" // Ajusta a la ruta base de tu ERP
                        className="h-10 px-4 rounded-lg font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                        <LayoutDashboard size={13} />
                        Panel Base
                    </Link>
                </div>
            </div>
        </div>
    );
}