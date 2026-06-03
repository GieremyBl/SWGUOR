'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Warehouse, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { AlmacenResumenTab } from '@/components/admin/almacenes/detail/AlmacenResumenTab';
import { AlmacenZonasTab } from '@/components/admin/almacenes/detail/AlmacenZonasTab';
import { AlmacenStockTab } from '@/components/admin/almacenes/detail/AlmacenStockTab';
import AlmacenFormModal from '@/components/admin/almacenes/AlmacenFormModal';

interface AlmacenDetalle {
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
    zonas: Array<{
        id: number;
        almacen_id: number;
        nombre: string;
        descripcion?: string | null;
        activo: boolean;
        created_at: string;
        _count: { stock: number };
    }>;
    _count: { zonas: number; stock: number };
}

// ─── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'zonas', label: 'Zonas' },
    { id: 'stock', label: 'Stock' },
] as const;
type TabId = typeof TABS[number]['id'];

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function AlmacenDetallePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [almacen, setAlmacen] = useState<AlmacenDetalle | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabId>('resumen');
    const [editOpen, setEditOpen] = useState(false);

    const loadAlmacen = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/almacenes/${id}`);
            console.log(res);
            const data = await res.json();
            console.log(data);
            if (res.status === 404) { toast.error('Almacén no encontrado'); router.push('/admin/almacenes'); return; }
            if (!res.ok) throw new Error();
            setAlmacen(data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar el almacén');
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => { loadAlmacen(); }, [loadAlmacen]);

    // ── Loading ─────────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
    );

    if (!almacen) return null;

    return (
        <div className="p-4 md:p-8 bg-gray-50/50 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* ── Back + header ─────────────────────────────────────────────── */}
                <div className="flex items-start gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/admin/almacenes')}
                        className="mt-1 rounded-xl h-9 w-9 p-0 hover:bg-white hover:shadow-sm transition-all"
                    >
                        <ArrowLeft className="w-4 h-4 text-slate-500" />
                    </Button>

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                                <Warehouse className="w-5 h-5 text-rose-500" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 leading-tight">
                                    {almacen.nombre}
                                </h1>
                                {almacen.direccion && (
                                    <p className="text-sm text-slate-400 mt-0.5">{almacen.direccion}</p>
                                )}
                            </div>
                            <Badge
                                className={cn(
                                    'rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border-none ml-auto',
                                    almacen.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                )}
                            >
                                {almacen.estado}
                            </Badge>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditOpen(true)}
                        className="rounded-xl h-9 px-4 border-gray-200 hover:bg-pink-50 hover:border-pink-200 hover:text-pink-600 transition-all gap-1.5"
                    >
                        <Edit className="w-3.5 h-3.5" />
                        Editar
                    </Button>
                </div>

                {/* ── Tabs ──────────────────────────────────────────────────────── */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    {/* Tab bar */}
                    <div className="flex border-b border-gray-100">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex-1 py-4 text-sm font-semibold transition-all relative',
                                    activeTab === tab.id
                                        ? 'text-pink-600'
                                        : 'text-slate-400 hover:text-slate-600'
                                )}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-pink-600 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <div className="p-6">
                        {activeTab === 'resumen' && (
                            <AlmacenResumenTab almacen={almacen} />
                        )}
                        {activeTab === 'zonas' && (
                            <AlmacenZonasTab
                                almacenId={almacen.id}
                                zonas={almacen.zonas ?? []}
                                onRefresh={loadAlmacen}
                            />
                        )}
                        {activeTab === 'stock' && (
                            <AlmacenStockTab
                                almacenId={almacen.id}
                                zonas={(almacen.zonas ?? []).filter(zona => zona.activo === true)}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Edit modal */}
            {editOpen && (
                <AlmacenFormModal
                    almacen={almacen}
                    onClose={() => setEditOpen(false)}
                    onSuccess={loadAlmacen}
                />
            )}
        </div>
    );
}