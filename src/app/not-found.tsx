'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Home, ShieldAlert, FileQuestion, ShoppingBag, RefreshCw, HelpCircle } from 'lucide-react';

export default function GlobalNotFound() {
    // Por defecto asumimos que el error ocurrió en el contexto del Landing (la raíz)
    const [context, setContext] = useState<'landing' | 'b2b' | 'erp'>('landing');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            if (path.startsWith('/admin')) {
                setContext('erp');
            } else if (path.startsWith('/portal')) {
                setContext('b2b');
            } else {
                setContext('landing');
            }
        }
    }, []);

    // Configuración visual y de textos según dónde se perdió el usuario
    const config = {
        erp: {
            bg: 'bg-slate-50',
            card: 'bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-5',
            tag: 'Código: 404_OPERATIONAL_NOT_FOUND',
            tagClass: 'bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider inline-block',
            icon: <ShieldAlert size={28} className="stroke-[2]" />,
            iconContainer: 'bg-red-50 text-red-600 rounded-xl w-14 h-14',
            title: 'Recurso no encontrado en el ERP',
            desc: 'El registro, SKU, cliente o reporte consultado no existe en el sistema o la sesión actual no cuenta con los privilegios requeridos.',
            actionBtn: (
                <button
                    onClick={() => window.location.reload()}
                    className="h-11 px-4 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm"
                >
                    <RefreshCw size={13} strokeWidth={2.5} />
                    Reintentar
                </button>
            ),
            primaryBtn: (
                <Link
                    href="/admin/Panel-Administrativo"
                    className="h-11 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm"
                >
                    <Home size={13} strokeWidth={2.5} />
                    Panel Base
                </Link>
            )
        },
        b2b: {
            bg: 'bg-slate-50/50',
            card: 'bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-6',
            tag: 'B2B_404',
            tagClass: 'bg-slate-900 text-white text-[10px] absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded-md font-mono tracking-wider shadow-sm font-black',
            icon: <FileQuestion size={40} className="stroke-[1.75]" />,
            iconContainer: 'bg-indigo-50 text-indigo-600 rounded-2xl w-20 h-20 border border-indigo-100 shadow-inner relative',
            title: 'Página no encontrada',
            desc: 'Lo sentimos, el producto, catálogo o sección a la que intentas acceder no está disponible o ha sido reubicada en el portal mayorista.',
            actionBtn: (
                <button
                    onClick={() => window.history.back()}
                    className="flex-1 h-11 px-4 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-700 flex items-center justify-center gap-2 transition-all hover:bg-slate-50 shadow-sm"
                >
                    <ArrowLeft size={14} strokeWidth={2.5} />
                    Regresar
                </button>
            ),
            primaryBtn: (
                <Link
                    href="/portal"
                    className="flex-1 h-11 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                    <Home size={14} strokeWidth={2.5} />
                    Ir al Catálogo
                </Link>
            )
        },
        landing: {
            bg: 'bg-white',
            card: 'max-w-md space-y-6 text-center p-4',
            tag: '404',
            tagClass: 'text-9xl font-black text-slate-100 tracking-tighter select-none leading-none block',
            icon: null,
            iconContainer: 'hidden',
            title: 'VAYA, PARECE QUE TE HAS DESVIADO',
            desc: 'La página que buscas no existe, cambió de nombre o fue retirada temporalmente de nuestro sitio comercial público.',
            actionBtn: (
                <button
                    onClick={() => window.history.back()}
                    className="flex-1 h-11 px-5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <ArrowLeft size={14} strokeWidth={2.5} />
                    Volver atrás
                </button>
            ),
            primaryBtn: (
                <Link
                    href="/"
                    className="flex-1 h-11 px-5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                    <ShoppingBag size={14} strokeWidth={2.5} />
                    Ir al Inicio
                </Link>
            )
        }
    }[context];

    return (
        <main className={`min-h-[90vh] w-full flex flex-col items-center justify-center p-4 antialiased ${config.bg}`}>
            <div className={config.card}>

                {/* Visual Superior (Número 404 grande o Iconos corporativos) */}
                {context === 'landing' ? (
                    <span className={config.tagClass}>{config.tag}</span>
                ) : (
                    <div className={`mx-auto flex items-center justify-center ${config.iconContainer}`}>
                        {config.icon}
                        {context === 'b2b' && <span className={config.tagClass}>{config.tag}</span>}
                    </div>
                )}

                {/* Textos Informativos */}
                <div className="space-y-2">
                    {context === 'erp' && (
                        <span className={config.tagClass}>{config.tag}</span>
                    )}
                    <h1 className={`${context === 'landing' ? 'text-xl font-bold uppercase' : 'text-2xl font-black'} text-slate-900 tracking-tight`}>
                        {config.title}
                    </h1>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                        {config.desc}
                    </p>
                </div>

                {/* Caja de Soporte adicional, visible únicamente en el Portal B2B */}
                {context === 'b2b' && (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600 text-left">
                        <span className="font-medium">¿Necesitas asistencia comercial?</span>
                        <a href="mailto:soporte@guor.com" className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-700 transition-colors shrink-0">
                            <HelpCircle size={13} />
                            Soporte B2B
                        </a>
                    </div>
                )}

                {/* Botones de acción (Grid para sistemas cerrados, Flex horizontal para Landing) */}
                <div className={context === 'landing' ? "flex flex-col sm:flex-row gap-3 pt-3 justify-center max-w-xs mx-auto w-full" : "grid grid-cols-2 gap-2.5 pt-2"}>
                    {config.actionBtn}
                    {config.primaryBtn}
                </div>
            </div>

            {/* Footer de control técnico inferior (Oculto en el Landing) */}
            {context !== 'landing' && (
                <p className="text-[10px] text-slate-400 font-medium mt-6 uppercase tracking-widest font-mono">
                    {context === 'erp' ? 'GUOR ERP — Panel de Control Corporativo' : 'Portal B2B GUOR — Sistema de Órdenes Mayoristas'}
                </p>
            )}
        </main>
    );
}