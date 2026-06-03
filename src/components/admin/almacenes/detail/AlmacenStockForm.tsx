'use client';

import { useState, useEffect } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Zona } from './AlmacenZonasTab';

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface ItemInventario {
    id: number;
    nombre: string;
    tipo: 'producto' | 'insumo' | 'material';
}

interface NuevoStockForm {
    item: ItemInventario | null;
    zona_id: string;
    cantidad: string;
    stock_minimo: string;
}

interface AlmacenStockFormProps {
    almacenId: number;
    zonas: Zona[];
    onSuccess: () => void;
    onCancel: () => void;
}

const EMPTY: NuevoStockForm = {
    item: null, zona_id: '', cantidad: '', stock_minimo: '0',
};

const TIPO_CONFIG = {
    producto: { label: 'Producto', color: 'bg-blue-100 text-blue-700' },
    insumo: { label: 'Insumo', color: 'bg-violet-100 text-violet-700' },
    material: { label: 'Material', color: 'bg-amber-100 text-amber-700' },
} as const;

// ── Componente ─────────────────────────────────────────────────────────────────
export function AlmacenStockForm({ almacenId, zonas, onSuccess, onCancel }: AlmacenStockFormProps) {
    const [form, setForm] = useState<NuevoStockForm>(EMPTY);
    const [busqueda, setBusqueda] = useState('');
    const [resultados, setResultados] = useState<ItemInventario[]>([]);
    const [buscando, setBuscando] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // ── Búsqueda con debounce ──────────────────────────────────────────────────
    useEffect(() => {
        if (busqueda.length < 2) { setResultados([]); return; }
        const t = setTimeout(async () => {
            setBuscando(true);
            try {
                const res = await fetch(`/api/admin/inventario/buscar?q=${encodeURIComponent(busqueda)}`);
                const data = await res.json();
                setResultados(data);
                setShowResults(true);
            } catch {
                toast.error('Error al buscar items');
            } finally {
                setBuscando(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [busqueda]);

    const selectItem = (item: ItemInventario) => {
        setForm(v => ({ ...v, item }));
        setBusqueda(item.nombre);
        setResultados([]);
        setShowResults(false);
    };

    const clearItem = () => {
        setForm(v => ({ ...v, item: null }));
        setBusqueda('');
        setResultados([]);
    };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.item) return toast.error('Selecciona un item del inventario');
        if (!form.cantidad) return toast.error('Ingresa una cantidad');

        setIsSaving(true);
        try {
            const body = {
                [`${form.item.tipo}_id`]: form.item.id,
                zona_id: form.zona_id ? Number(form.zona_id) : null,
                cantidad: parseFloat(form.cantidad),
                stock_minimo: parseFloat(form.stock_minimo) || 0,
            };

            const res = await fetch(`/api/admin/almacenes/${almacenId}/stock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.status === 409)
                return toast.error('Ya existe stock para ese item en esta zona');
            if (!res.ok) throw new Error();

            toast.success('Stock agregado correctamente');
            onSuccess();
        } catch {
            toast.error('Error al agregar stock');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700">Agregar item al stock</p>
                <button
                    onClick={onCancel}
                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4 text-slate-400" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* ── Buscador ──────────────────────────────────────────────────────── */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                        Producto / Insumo / Material *
                    </label>
                    <div className="relative">
                        <div className={cn(
                            'flex items-center gap-2 h-10 px-3 border rounded-xl bg-white transition-colors',
                            showResults ? 'border-pink-400 ring-1 ring-pink-400' : 'border-slate-200',
                        )}>
                            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <input
                                value={busqueda}
                                onChange={e => { setBusqueda(e.target.value); setForm(v => ({ ...v, item: null })); }}
                                onFocus={() => resultados.length > 0 && setShowResults(true)}
                                placeholder="Busca por nombre..."
                                className="flex-1 text-sm bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
                            />
                            {buscando && <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin flex-shrink-0" />}
                            {form.item && (
                                <button type="button" onClick={clearItem}>
                                    <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 transition-colors" />
                                </button>
                            )}
                        </div>

                        {/* Dropdown resultados */}
                        {showResults && resultados.length > 0 && (
                            <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                                {resultados.map(r => (
                                    <button
                                        key={`${r.tipo}-${r.id}`}
                                        type="button"
                                        onClick={() => selectItem(r)}
                                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-pink-50 transition-colors text-left"
                                    >
                                        <span className="text-sm font-medium text-slate-800">{r.nombre}</span>
                                        <Badge className={cn('text-[10px] border-none ml-2 flex-shrink-0', TIPO_CONFIG[r.tipo].color)}>
                                            {TIPO_CONFIG[r.tipo].label}
                                        </Badge>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Item seleccionado */}
                        {form.item && (
                            <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                                <span className="text-xs font-semibold text-emerald-700 flex-1 truncate">
                                    {form.item.nombre}
                                </span>
                                <Badge className={cn('text-[10px] border-none', TIPO_CONFIG[form.item.tipo].color)}>
                                    {TIPO_CONFIG[form.item.tipo].label}
                                </Badge>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Zona + Cantidad + Mínimo ───────────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                            Zona
                        </label>
                        <select
                            value={form.zona_id}
                            onChange={e => setForm(v => ({ ...v, zona_id: e.target.value }))}
                            className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                        >
                            <option value="">Sin zona</option>
                            {zonas.map(z => (
                                <option key={z.id} value={String(z.id)}>{z.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                            Cantidad *
                        </label>
                        <input
                            type="number"
                            min={0}
                            step="any"
                            value={form.cantidad}
                            onChange={e => setForm(v => ({ ...v, cantidad: e.target.value }))}
                            placeholder="0"
                            className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                            Stock mínimo
                        </label>
                        <input
                            type="number"
                            min={0}
                            step="any"
                            value={form.stock_minimo}
                            onChange={e => setForm(v => ({ ...v, stock_minimo: e.target.value }))}
                            placeholder="0"
                            className="w-full h-10 px-3 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                    </div>
                </div>

                {/* ── Acciones ──────────────────────────────────────────────────────── */}
                <div className="flex gap-2 justify-end pt-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        disabled={isSaving}
                        className="rounded-xl"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        size="sm"
                        disabled={isSaving || !form.item || !form.cantidad}
                        className="rounded-xl bg-pink-600 hover:bg-pink-700 text-white px-5"
                    >
                        {isSaving
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Guardando...</>
                            : 'Agregar stock'
                        }
                    </Button>
                </div>
            </form>
        </div>
    );
}