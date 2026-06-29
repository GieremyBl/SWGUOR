'use client';

import Link from 'next/link';
import { ArrowLeft, Home, FileQuestion, HelpCircle } from 'lucide-react';

export default function NotFound() {
    return (
        <main className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-4 antialiased">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-6">

                {/* Icono e Indicador 404 */}
                <div className="relative mx-auto w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 text-indigo-600 shadow-inner">
                    <FileQuestion size={40} className="stroke-[1.75]" />
                    <span className="absolute -bottom-2 -right-2 bg-slate-900 text-white font-mono font-black text-[10px] px-1.5 py-0.5 rounded-md tracking-wider shadow-sm">
                        ERR_404
                    </span>
                </div>

                {/* Textos Informativos */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        Página no encontrada
                    </h1>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                        Lo sentimos, el producto, catálogo o sección a la que intentas acceder no está disponible o ha sido reubicada en el portal.
                    </p>
                </div>

                {/* Enlaces de Soporte Cortos */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-medium">¿Necesitas asistencia comercial?</span>
                    <a
                        href="mailto:soporte@guor.com"
                        className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                        <HelpCircle size={13} />
                        Soporte B2B
                    </a>
                </div>

                {/* Acciones del Sistema */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="flex-1 h-11 px-4 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-700 flex items-center justify-center gap-2 transition-all hover:bg-slate-50 active:scale-[0.98] shadow-sm"
                    >
                        <ArrowLeft size={14} strokeWidth={2.5} />
                        Regresar
                    </button>

                    <Link
                        href="/portal" // Cambiar por tu ruta raíz real del portal (ej. /portal o /catalogo)
                        className="flex-1 h-11 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm hover:shadow-indigo-100"
                    >
                        <Home size={14} strokeWidth={2.5} />
                        Ir al Catálogo
                    </Link>
                </div>
            </div>

            {/* Footer institucional minimalista */}
            <p className="text-[10px] text-slate-400 font-medium mt-6 uppercase tracking-widest font-mono">
                Portal B2B GUOR — Sistema de Órdenes Mayoristas
            </p>
        </main>
    );
}