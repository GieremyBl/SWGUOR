'use client';

import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

export default function LandingNotFound() {
    return (
        <main className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center antialiased bg-white">
            <div className="max-w-md space-y-6">

                {/* Indicador visual masivo */}
                <h1 className="text-9xl font-black text-slate-100 tracking-tighter select-none leading-none">
                    404
                </h1>

                {/* Mensaje comercial amigable */}
                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight uppercase">
                        Vaya, parece que te has desviado
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                        La página que buscas no existe, ha cambiado de nombre o fue retirada temporalmente de nuestro sitio comercial.
                    </p>
                </div>

                {/* Acciones de cara al público externo */}
                <div className="flex flex-col sm:flex-row gap-3 pt-3 justify-center max-w-xs mx-auto w-full">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="flex-1 h-11 px-5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                    >
                        <ArrowLeft size={14} strokeWidth={2.5} />
                        Volver atrás
                    </button>

                    <Link
                        href="/" // Cambia esto si el home de tu landing maneja otra ruta
                        className="flex-1 h-11 px-5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                        <Home size={14} strokeWidth={2.5} />
                        Ir al Inicio
                    </Link>
                </div>
            </div>
        </main>
    );
}