'use client';

import Link from 'next/link';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

export default function LandingNotFound() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center antialiased bg-white">
            <div className="max-w-md space-y-6">
                {/* Gran indicador visual */}
                <h1 className="text-9xl font-black text-slate-100 tracking-tighter select-none">
                    404
                </h1>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                        UY, PARECE QUE TE HAS PERDIDO
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        La página que buscas no existe o ha sido movida temporalmente. Puedes volver al catálogo principal usando los accesos inferiores.
                    </p>
                </div>

                {/* Acciones */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="h-11 px-5 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                    >
                        <ArrowLeft size={14} />
                        Volver atrás
                    </button>
                    <Link
                        href="/"
                        className="h-11 px-5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                        <ShoppingBag size={14} />
                        Ir al Inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}