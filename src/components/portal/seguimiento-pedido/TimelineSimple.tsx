'use client';

import { ClipboardCheck, Factory, ShieldCheck, Truck, CheckCircle2 } from 'lucide-react';
import type { EstadoPedido } from '@/lib/services/seguimiento-pedido.service';
import type { EtapaConfig } from './types';

const ETAPAS: EtapaConfig[] = [
    { id: 'pendiente', icon: ClipboardCheck, label: 'Confirmado' },
    { id: 'en_produccion', icon: Factory, label: 'En Confección' },
    { id: 'listo_para_despacho', icon: ShieldCheck, label: 'Control Calidad' },
    { id: 'entregado', icon: Truck, label: 'Despachado' },
];

const ESTADO_INDICE: Partial<Record<EstadoPedido, number>> = {
  pendiente: 0,
  en_produccion: 1,
  listo_para_despacho: 2,
  entregado: 3,
};

interface TimelineSimpleProps {
    estadoActual: EstadoPedido;
}

export default function TimelineSimple({ estadoActual }: TimelineSimpleProps) {
    const currentIdx = ESTADO_INDICE[estadoActual] ?? 0;

    // Calcula el porcentaje de progreso para la línea conectora horizontal (0%, 33.3%, 66.6%, 100%)
    const progresoPorcentaje = (currentIdx / (ETAPAS.length - 1)) * 100;

    return (
        <div className="relative w-full max-w-4xl mx-auto py-10 px-6 text-left md:text-center">
            {/* Línea de fondo y progreso reactivo (Solo Escritorio) */}
            <div className="absolute top-[3.25rem] left-16 right-16 h-0.5 bg-slate-100 hidden md:block">
                <div
                    className="h-full bg-[#B8962D] transition-all duration-1000 ease-out"
                    style={{ width: `${progresoPorcentaje}%` }}
                />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative gap-6 md:gap-0">
                {ETAPAS.map((etapa, index) => {
                    const Icon = etapa.icon;
                    const isCompleted = index < currentIdx;
                    const isActive = index === currentIdx;

                    return (
                        <div key={etapa.id} className="flex md:flex-col items-center gap-4 md:gap-3 flex-1 w-full md:w-auto relative z-10">

                            {/* Contenedor del Icono/Círculo */}
                            <div
                                className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-700 ${isCompleted
                                        ? 'bg-[#B8962D] border-[#B8962D] text-white shadow-md shadow-amber-500/10'
                                        : isActive
                                            ? 'bg-white border-[#B8962D] text-[#B8962D] ring-4 ring-amber-500/10 scale-105'
                                            : 'bg-white border-slate-200 text-slate-300'
                                    }`}
                            >
                                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                            </div>

                            {/* Textos Informativos */}
                            <div className="flex flex-col md:items-center text-left md:text-center">
                                <span
                                    className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isCompleted || isActive ? 'text-slate-800' : 'text-slate-400'
                                        }`}
                                >
                                    {etapa.label}
                                </span>
                                {isActive && (
                                    <span className="text-[9px] text-[#B8962D] font-extrabold uppercase tracking-widest animate-pulse mt-0.5">
                                        En curso
                                    </span>
                                )}
                            </div>

                            {/* Línea de conexión Vertical (Solo Mobile) */}
                            {index < ETAPAS.length - 1 && (
                                <div className="absolute top-11 left-5.5 w-0.5 h-7 bg-slate-100 md:hidden">
                                    <div
                                        className="w-full bg-[#B8962D] transition-all duration-1000"
                                        style={{ height: index < currentIdx ? '100%' : '0%' }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}