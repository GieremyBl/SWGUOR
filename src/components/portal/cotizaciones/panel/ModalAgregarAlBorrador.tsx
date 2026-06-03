'use client';

import { useState, CSSProperties, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { COLOR_MAP } from '@/lib/constants/colores';
import { usePortal } from '@/lib/hooks/usePortal';
import { MAX_UNIDADES, type AgregarCotizacionPayload } from '@/components/portal/_contexts/PortalContext';
import { resolveCartMoq } from '@/lib/constants/portal-b2b';

interface VarianteBackend {
    id: number;
    color: string;
    talla: string;
    stock: number;
    precio_adicional?: number;
    sku?: string;
    imagen_url?: string | null;
}

interface ProductoParaModal {
    id: number;
    nombre: string;
    sku: string;
    imagen: string | null;
    precio: number;
    moq: number;
    colores_disponibles: string[] | null;
    tallas_disponibles: string[] | null;
    tallas_por_color?: Record<string, string[]>;
    variantes?: VarianteBackend[];
}

interface Props {
    producto: ProductoParaModal;
    onClose: () => void;
}

const formatearColor = (color: string) =>
    color.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

export function ModalAgregarAlBorrador({ producto, onClose }: Props) {
    const { agregarACotizacion } = usePortal();

    const colores = producto.colores_disponibles ?? [];
    const [colorSel, setColorSel] = useState<string>(colores[0] ?? '');

    // Obtener las tallas disponibles según el color activo
    const tallas = producto.tallas_por_color?.[colorSel] ?? producto.tallas_disponibles ?? [];

    // Inicializar la primera talla válida disponible de forma nativa
    const [tallaSel, setTallaSel] = useState<string>('');

    // Sincronizar la talla por defecto si cambia el color o está vacía
    useEffect(() => {
        if (tallas.length > 0 && (!tallaSel || !tallas.includes(tallaSel))) {
            setTallaSel(tallas[0]);
        }
    }, [colorSel, tallas, tallaSel]);

    const moqProducto = resolveCartMoq(producto.moq);
    const [cantidad, setCantidad] = useState<number>(moqProducto);

    // Búsqueda blindada insensible a mayúsculas/minúsculas (.toLowerCase y .trim)
    const varianteSel = producto.variantes?.find(
        v =>
            v.color?.trim().toLowerCase() === colorSel?.trim().toLowerCase() &&
            v.talla?.trim().toLowerCase() === tallaSel?.trim().toLowerCase()
    );

    const precioFinal = producto.precio + (varianteSel?.precio_adicional ?? 0);
    const subtotal = precioFinal * Math.max(1, cantidad);

    const handleAgregar = () => {
        if (!varianteSel) {
            toast.error('La combinación de color y talla seleccionada no está disponible.');
            return;
        }

        const payload: AgregarCotizacionPayload = {
            variante_id: varianteSel.id,
            producto_id: producto.id,
            cantidad,
            nombre: producto.nombre,
            sku: varianteSel.sku ?? producto.sku,
            imagen: varianteSel.imagen_url ?? producto.imagen,
            color: colorSel,
            talla: tallaSel,
            precio_unitario: precioFinal,
        };

        agregarACotizacion(payload);
        toast.success(`${producto.nombre} agregado al borrador`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div
                className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
                style={{ backgroundColor: 'var(--guor-cream, #fff4e2)' }}
            >
                {/* ── Encabezado ── */}
                <div
                    className="flex items-start justify-between px-6 pt-6 pb-4"
                    style={{ backgroundColor: 'var(--guor-cream, #fff4e2)' }}
                >
                    <div>
                        <h2
                            className="text-lg font-black uppercase tracking-tight leading-tight"
                            style={{ color: 'var(--guor-dark, #231e1d)' }}
                        >
                            {producto.nombre}
                        </h2>
                        <p
                            className="text-[11px] font-bold uppercase tracking-widest mt-0.5"
                            style={{ color: 'var(--guor-gold, #b5854b)' }}
                        >
                            {varianteSel?.sku ?? producto.sku}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-black/10"
                        style={{ color: 'var(--guor-dark, #231e1d)' }}
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="px-6 pb-6 space-y-5">

                    {/* ── Selector de color ── */}
                    <div>
                        <p
                            className="text-[10px] font-black uppercase tracking-[0.2em] mb-2"
                            style={{ color: 'var(--guor-dark, #231e1d)', opacity: 0.5 }}
                        >
                            Color —{' '}
                            <span style={{ opacity: 1, fontWeight: 700, textTransform: 'none', letterSpacing: 'normal' }}>
                                {colorSel ? formatearColor(colorSel) : 'Ninguno'}
                            </span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {colores.map(c => {
                                const activo = colorSel?.toLowerCase() === c?.toLowerCase();
                                return (
                                    <button
                                        key={c}
                                        type="button"
                                        title={formatearColor(c)}
                                        onClick={() => setColorSel(c)}
                                        className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                                        style={{
                                            backgroundColor: COLOR_MAP[c.toLowerCase()] ?? '#e5e7eb',
                                            borderColor: activo ? 'var(--guor-dark, #231e1d)' : 'transparent',
                                            outline: activo
                                                ? '2px solid var(--guor-dark, #231e1d)'
                                                : '1px solid #d1c9be',
                                            outlineOffset: activo ? '2px' : '0px',
                                        } as CSSProperties}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Selector de talla ── */}
                    {tallas.length > 0 && (
                        <div>
                            <p
                                className="text-[10px] font-black uppercase tracking-[0.2em] mb-2"
                                style={{ color: 'var(--guor-dark, #231e1d)', opacity: 0.5 }}
                            >
                                Talla disponible
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {tallas.map(t => {
                                    const activo = tallaSel?.toLowerCase() === t?.toLowerCase();
                                    return (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setTallaSel(t)}
                                            className="w-12 h-10 rounded-xl text-xs font-bold border transition-all"
                                            style={{
                                                backgroundColor: activo
                                                    ? 'var(--guor-dark, #231e1d)'
                                                    : 'white',
                                                color: activo
                                                    ? 'var(--guor-cream, #fff4e2)'
                                                    : 'var(--guor-dark, #231e1d)',
                                                borderColor: activo
                                                    ? 'var(--guor-dark, #231e1d)'
                                                    : 'var(--guor-stone, #e2d9cf)',
                                            } as CSSProperties}
                                        >
                                            {t}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Alerta en caso de no vinculación */}
                    {!varianteSel && colorSel && tallaSel && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl font-medium">
                            <AlertTriangle size={16} className="shrink-0 text-amber-600" />
                            <span>Sku no mapeado en variantes para {formatearColor(colorSel)} - {tallaSel}.</span>
                        </div>
                    )}

                    {/* ── Precio e Info de stock ── */}
                    <div
                        className="grid grid-cols-2 rounded-2xl p-4 border bg-white divide-x"
                        style={{ borderColor: 'var(--guor-stone, #e2d9cf)' }}
                    >
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--guor-dark)', opacity: 0.4 }}>
                                Precio unitario
                            </p>
                            <p className="text-lg font-black" style={{ color: 'var(--guor-gold, #b5854b)' }}>
                                S/ {precioFinal.toFixed(2)}
                            </p>
                        </div>
                        <div className="pl-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--guor-dark)', opacity: 0.4 }}>
                                Stock Central
                            </p>
                            <p className="text-lg font-black" style={{ color: varianteSel && varianteSel.stock > 0 ? '#16a34a' : '#dc2626' }}>
                                {varianteSel ? `${varianteSel.stock.toLocaleString()} uds` : '0 uds'}
                            </p>
                        </div>
                    </div>

                    {/* ── Cantidad ── */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--guor-dark)', opacity: 0.5 }}>
                                Cantidad a solicitar
                            </p>
                            <p className="text-[10px] font-bold" style={{ color: 'var(--guor-gold)' }}>
                                Mínimo corporativo: {moqProducto.toLocaleString()} uds
                            </p>
                        </div>
                        <input
                            type="number"
                            min={moqProducto}
                            max={MAX_UNIDADES}
                            value={cantidad}
                            onChange={e => setCantidad(Math.max(moqProducto, parseInt(e.target.value, 10) || moqProducto))}
                            className="w-full h-12 text-center text-lg font-bold border rounded-2xl focus:outline-none focus:ring-2 transition-all bg-white"
                            style={{
                                borderColor: cantidad < moqProducto ? '#f59e0b' : 'var(--guor-stone, #e2d9cf)',
                                color: 'var(--guor-dark, #231e1d)',
                                '--tw-ring-color': 'var(--guor-gold, #b5854b)',
                            } as CSSProperties}
                        />
                    </div>

                    {/* ── Subtotal estimado ── */}
                    <div className="flex items-center justify-between rounded-2xl px-5 py-4 border bg-white" style={{ borderColor: 'var(--guor-stone, #e2d9cf)' }}>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--guor-dark)', opacity: 0.5 }}>
                            Subtotal estimado
                        </p>
                        <p className="text-xl font-black" style={{ color: 'var(--guor-dark, #231e1d)' }}>
                            S/ {subtotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </p>
                    </div>

                    {/* ── Botón agregar ── */}
                    <button
                        type="button"
                        onClick={handleAgregar}
                        disabled={!varianteSel || varianteSel.stock <= 0 || cantidad < moqProducto}
                        className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                            backgroundColor: 'var(--guor-gold, #b5854b)',
                            color: 'white',
                        }}
                    >
                        Agregar al borrador
                    </button>
                </div>
            </div>
        </div>
    );
}