'use client';

import { Building2, MapPin, Phone, Mail, BarChart3, Package, Hash, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AlmacenResumenTabProps {
    almacen: {
        id: number;
        nombre: string;
        descripcion?: string | null;
        direccion?: string | null;
        telefono?: string | null;
        email?: string | null;
        capacidad_total?: number | null;
        unidad_capacidad?: string | null;
        estado: string;
        created_at: string;
        _count?: { zonas: number; stock: number };
    };
}

export function AlmacenResumenTab({ almacen }: AlmacenResumenTabProps) {
    const infoRows = [
        { icon: MapPin, label: 'Dirección', value: almacen.direccion },
        { icon: Phone, label: 'Teléfono', value: almacen.telefono },
        { icon: Mail, label: 'Email', value: almacen.email },
        { icon: BarChart3, label: 'Capacidad', value: almacen.capacidad_total ? `${Number(almacen.capacidad_total).toLocaleString()} ${almacen.unidad_capacidad ?? ''}` : null },
        { icon: Calendar, label: 'Registrado', value: new Date(almacen.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }) },
    ];

    const statCards = [
        { label: 'Zonas', value: almacen._count?.zonas ?? 0, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Items en stock', value: almacen._count?.stock ?? 0, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    return (
        <div className="space-y-6">
            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-4">
                {statCards.map(card => (
                    <div key={card.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                        <div className={cn('p-3 rounded-xl', card.bg)}>
                            <card.icon className={cn('w-5 h-5', card.color)} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{card.value}</p>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Info panel */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Datos del almacén</h3>
                    <Badge
                        className={cn(
                            'rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border-none',
                            almacen.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        )}
                    >
                        {almacen.estado}
                    </Badge>
                </div>

                <div className="divide-y divide-gray-50">
                    {infoRows.map(row => (
                        <div key={row.label} className="flex items-center gap-4 px-6 py-4">
                            <div className="p-2 bg-slate-50 rounded-lg flex-shrink-0">
                                <row.icon className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{row.label}</p>
                                <p className="text-sm font-medium text-slate-800 truncate">{row.value ?? '—'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Notas */}
            {almacen.descripcion && (
                <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-5">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Notas</p>
                    <p className="text-sm text-amber-900 leading-relaxed">{almacen.descripcion}</p>
                </div>
            )}
        </div>
    );
}