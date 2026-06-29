'use client';

import Link from 'next/link';
import { LayoutDashboard, ShieldAlert, RefreshCw } from 'lucide-react';

export default function ErpNotFound() {
    return (
        <div className="w-full min-h-[75vh] flex items-center justify-center p-6 bg-slate-50">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-5">

                {/* Icono de Alerta de Sistema Técnico */}
                <div className="mx-auto w-14 h-14 bg-red-50 text-red-600 rounded-xl flex items-center justify-center border border-red-100 shadow-sm">
                    <ShieldAlert size={28} className="stroke-[2]" />
                </div>

                {/* Mensaje de Control Operativo */}
                <div className="space-y-1.5">
                    <span className="inline-block text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider">
                        Código: 404_OPERATIONAL_NOT_FOUND
                    </span>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight pt-1">
                        Recurso no encontrado en el ERP
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                        El ID de registro, SKU, cliente o reporte consultado no existe en los registros actuales de la base de datos o su sesión no cuenta con los privilegios suficientes.
                    </p>
                </div>

                {/* Acciones del Operador */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="h-11 px-4 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm"
                    >
                        <RefreshCw size={13} strokeWidth={2.5} />
                        Reintentar
                    </button>

                    <Link
                        href="/dashboard" // Cambia esto por la ruta raíz de tu Dashboard ERP
                        className="h-11 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm shadow-indigo-100"
                    >
                        <LayoutDashboard size={13} strokeWidth={2.5} />
                        Panel Base
                    </Link>
                </div>
            </div>
        </div>
    );
}