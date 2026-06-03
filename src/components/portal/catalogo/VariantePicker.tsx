'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, ShoppingBag, Plus, Minus, AlertTriangle } from 'lucide-react';
import { ProductoPortal } from '@/components/portal/_contexts/PortalContext';
import { COLOR_MAP } from '@/lib/constants/colores';

interface VarianteRaw {
    id: number;
    color: string;
    talla: string;
    stock: number;
}

interface ReglasDescuentoJson {
    variantes?: VarianteRaw[];
}

interface CatalogoVariantePickerProps {
    producto: ProductoPortal | null;
    isOpen: boolean;
    onClose: () => void;
    onAgregar: (varianteId: number, producto: ProductoPortal, cantidad: number) => Promise<void>;
}

const formatearColor = (color: string) =>
    color.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

export function VariantePicker({ producto, isOpen, onClose, onAgregar }: CatalogoVariantePickerProps) {
    const [colorSeleccionado, setColorSeleccionado] = useState<string | null>(null);
    const [tallaSeleccionada, setTallaSeleccionada] = useState<string | null>(null);
    const [cantidad, setCantidad] = useState<number>(400);
    const [loading, setLoading] = useState(false);
    const [errorLocal, setErrorLocal] = useState<string | null>(null);

    const moqRequerido = producto?.moq || 400;
    const variantes = useMemo<VarianteRaw[]>(() => {
        const reglas = producto?.reglas_descuento as unknown as ReglasDescuentoJson | null;
        return reglas?.variantes ?? [];
    }, [producto?.reglas_descuento]);

    const colores = variantes.length > 0
        ? [...new Set(variantes.map((v) => v.color))]
        : (producto?.colores_disponibles as string[] || []);

    const tallasPorColor = variantes.length > 0 && colorSeleccionado
        ? [...new Set(variantes.filter((v) => v.color === colorSeleccionado).map((v) => v.talla))]
        : (producto?.tallas_disponibles as string[] || []);

    useEffect(() => {
        if (isOpen && producto) {
            const coloresEfecto = variantes.length > 0
                ? [...new Set(variantes.map((v) => v.color))]
                : (producto.colores_disponibles ?? []) as string[];
            const tallasEfecto = variantes.length > 0
                ? [...new Set(variantes.filter((v) => v.color === coloresEfecto[0]).map((v) => v.talla))]
                : (producto.tallas_disponibles ?? []) as string[];

            setColorSeleccionado(coloresEfecto[0] ?? null);
            setTallaSeleccionada(tallasEfecto[0] ?? null);
            setCantidad(producto.moq || 400);
            setErrorLocal(null);
        }
    }, [isOpen, producto, variantes]);

    useEffect(() => {
        if (colorSeleccionado && variantes.length > 0) {
            const tallasDisponibles = variantes
                .filter((v) => v.color === colorSeleccionado)
                .map((v) => v.talla);
            if (tallaSeleccionada && !tallasDisponibles.includes(tallaSeleccionada)) {
                setTallaSeleccionada(tallasDisponibles[0] ?? null);
            }
        }
    }, [colorSeleccionado, variantes, tallaSeleccionada]);

    if (!isOpen || !producto) return null;

    const handleIncrementar = () => setCantidad((prev) => prev + 50);

    const handleDecrementar = () => {
        setCantidad((prev) => {
            if (prev - 50 < moqRequerido) {
                setErrorLocal(`El lote mínimo (MOQ) es de ${moqRequerido} unidades.`);
                return prev;
            }
            setErrorLocal(null);
            return prev - 50;
        });
    };

    const handleCambioManual = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valor = Number(e.target.value);
        setErrorLocal(valor < moqRequerido ? `Mínimo requerido: ${moqRequerido} unidades.` : null);
        setCantidad(valor);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorLocal(null);

        if (!colorSeleccionado) { setErrorLocal('Seleccione un color.'); return; }
        if (!tallaSeleccionada) { setErrorLocal('Seleccione una talla.'); return; }
        if (cantidad < moqRequerido) { setErrorLocal(`Mínimo requerido: ${moqRequerido} unidades.`); return; }

        const varianteEncontrada = variantes.find(
            (v) => v.color === colorSeleccionado && v.talla === tallaSeleccionada
        );
        const varianteId = varianteEncontrada?.id ?? producto.id;

        setLoading(true);
        try {
            await onAgregar(varianteId, producto, cantidad);
            onClose();
        } catch (err: unknown) {
            setErrorLocal(err instanceof Error ? err.message : 'Error al reservar el lote.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border animate-in fade-in zoom-in-95 duration-200"
                style={{ borderColor: 'var(--guor-stone)' }}
            >
                {/* Cabecera */}
                <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: 'var(--guor-stone)' }}>
                    <div className="flex items-center gap-2">
                        <ShoppingBag size={16} style={{ color: 'var(--guor-gold)' }} />
                        <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--guor-dark)' }}>
                            Configurar Atributos B2B
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg border transition-colors bg-white hover:bg-guor-200"
                        style={{ borderColor: 'var(--guor-stone-mid)', color: 'var(--guor-dark)' }}
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
                    {errorLocal && (
                        <div
                            className="p-3 rounded-xl border text-[11px] font-bold uppercase tracking-wide flex gap-2 items-start"
                            style={{ backgroundColor: 'var(--guor-cream)', borderColor: 'var(--guor-stone)', color: 'var(--guor-gold-warm)' }}
                        >
                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                            <span>{errorLocal}</span>
                        </div>
                    )}

                    {/* Info del Modelo */}
                    <div>
                        <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest block" style={{ color: 'var(--guor-dark)' }}>
                            {producto.sku || 'SKU-PENDIENTE'}
                        </span>
                        <h4 className="text-sm font-black uppercase tracking-wider mt-0.5" style={{ color: 'var(--guor-dark)' }}>
                            {producto.nombre}
                        </h4>
                    </div>

                    {/* Selector de Color */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--guor-dark)' }}>
                            Color —{' '}
                            <span className="normal-case font-bold">
                                {colorSeleccionado ? formatearColor(colorSeleccionado) : 'Ninguno'}
                            </span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {colores.map((c) => {
                                const activo = colorSeleccionado === c;
                                return (
                                    <button
                                        key={c}
                                        type="button"
                                        title={formatearColor(c)}
                                        onClick={() => { setColorSeleccionado(c); setErrorLocal(null); }}
                                        className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                                        style={{
                                            backgroundColor: COLOR_MAP[c] ?? '#e5e7eb',
                                            borderColor: activo ? 'var(--guor-dark)' : 'transparent',
                                            outline: activo ? '2px solid var(--guor-dark)' : '1px solid var(--guor-stone-mid)',
                                            outlineOffset: activo ? '2px' : '0px',
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Selector de Talla — filtrado por color */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--guor-dark)' }}>
                            Talla
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {tallasPorColor.map((t) => {
                                const activo = tallaSeleccionada === t;
                                return (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => { setTallaSeleccionada(t); setErrorLocal(null); }}
                                        className="px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-wider transition-all"
                                        style={{
                                            backgroundColor: activo ? 'var(--guor-dark)' : '#ffffff',
                                            borderColor: activo ? 'var(--guor-dark)' : 'var(--guor-stone)',
                                            color: activo ? '#ffffff' : 'var(--guor-dark)',
                                        }}
                                    >
                                        {t}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Cantidad */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="block text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--guor-dark)' }}>
                                Cantidad del Lote
                            </label>
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                                style={{ backgroundColor: 'var(--guor-cream)', color: 'var(--guor-dark)' }}>
                                MOQ: {moqRequerido} uds
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={handleDecrementar}
                                className="w-11 h-11 border rounded-xl flex items-center justify-center bg-white hover:bg-neutral-50 active:scale-95 transition-all"
                                style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}>
                                <Minus size={14} />
                            </button>
                            <input
                                type="number"
                                min={moqRequerido}
                                value={cantidad}
                                onChange={handleCambioManual}
                                className="flex-1 h-11 border rounded-xl text-center text-xs font-black focus:outline-none bg-white"
                                style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}
                            />
                            <button type="button" onClick={handleIncrementar}
                                className="w-11 h-11 border rounded-xl flex items-center justify-center bg-white hover:bg-neutral-50 active:scale-95 transition-all"
                                style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}>
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                        style={{ backgroundColor: 'var(--guor-gold)' }}
                    >
                        <ShoppingBag size={14} />
                        {loading ? 'Reservando Lote...' : 'Añadir al Borrador de Pedido'}
                    </button>
                </form>
            </div>
        </div>
    );
}