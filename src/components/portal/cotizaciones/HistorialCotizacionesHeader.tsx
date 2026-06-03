'use client';

import { useRouter } from 'next/navigation';
import { Plus, FileText } from 'lucide-react';

interface HistorialCotizacionesHeaderProps {
    onNuevaCotizacion?: () => void;
}

export function HistorialCotizacionesHeader({
    onNuevaCotizacion,
}: HistorialCotizacionesHeaderProps) {
    const router = useRouter();

    const handleNavigation = () => {
        if (onNuevaCotizacion) {
            onNuevaCotizacion();
        } else {
            router.push('/portal/cotizaciones/nueva');
        }
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div
                    className="p-3 text-white rounded-lg shadow-lg"
                    style={{ backgroundColor: 'var(--guor-dark)' }}
                >
                    <FileText size={24} style={{ color: 'var(--guor-gold)' }} />
                </div>
                <div>
                    <h1
                        className="text-2xl font-black uppercase tracking-wide"
                        style={{ color: 'var(--guor-dark)' }}
                    >
                        Historial Comercial
                    </h1>
                    <p
                        className="text-sm font-medium opacity-60"
                        style={{ color: 'var(--guor-dark)' }}
                    >
                        Gestione sus cotizaciones y solicitudes B2B.
                    </p>
                </div>
            </div>

            {/* Cambiamos Link por button */}
            <button
                onClick={handleNavigation}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-wider text-white transition-all shadow-lg hover:brightness-110 active:scale-95 cursor-pointer"
                style={{ backgroundColor: 'var(--guor-gold)' }}
            >
                <Plus size={18} />
                Nueva Cotización
            </button>
        </div>
    );
}