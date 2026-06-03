'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { COLOR_MAP, TALLAS } from '@/lib/constants/colores';

interface Categoria {
    id: number;
    nombre: string;
}

interface FiltrosCatalogoProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    categoriaSeleccionada: number | null;
    setCategoriaSeleccionada: (id: number | null) => void;
    categorias: Categoria[];
    rangoPrecio: [number, number];
    setRangoPrecio: (rango: [number, number]) => void;
    precioMaximoLimite: number;
    tallaSeleccionada: string | null;
    setTallaSeleccionada: (talla: string | null) => void;
    colorSeleccionado: string | null;
    setColorSeleccionado: (color: string | null) => void;
}

const formatearColor = (color: string) =>
    color.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

export function FiltrosCatalogo({
    searchQuery,
    setSearchQuery,
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    categorias,
    rangoPrecio,
    setRangoPrecio,
    precioMaximoLimite,
    tallaSeleccionada,
    setTallaSeleccionada,
    colorSeleccionado,
    setColorSeleccionado,
}: FiltrosCatalogoProps) {

    const handleLimpiarFiltros = () => {
        setSearchQuery('');
        setCategoriaSeleccionada(null);
        setRangoPrecio([0, precioMaximoLimite || 100]);
        setTallaSeleccionada(null);
        setColorSeleccionado(null);
    };

    const tieneFiltrosActivos =
        searchQuery !== '' ||
        categoriaSeleccionada !== null ||
        tallaSeleccionada !== null ||
        colorSeleccionado !== null ||
        rangoPrecio[0] !== 0 ||
        rangoPrecio[1] !== precioMaximoLimite;

    return (
        <div className="space-y-6">
            {/* Encabezado */}
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--guor-stone)' }}>
                <div className="flex items-center gap-2">
                    <SlidersHorizontal size={16} style={{ color: 'var(--guor-dark)' }} />
                    <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--guor-dark)' }}>
                        Filtrar Catálogo
                    </h2>
                </div>
                {tieneFiltrosActivos && (
                    <button
                        type="button"
                        onClick={handleLimpiarFiltros}
                        className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-opacity hover:opacity-70"
                        style={{ color: 'var(--guor-gold)' }}
                    >
                        Limpiar todo <X size={12} />
                    </button>
                )}
            </div>

            {/* 1. Buscador */}
            <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--guor-dark)' }}>
                    Buscar Modelo
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Escribe nombre del modelo..."
                        className="w-full h-10 pl-9 pr-4 border rounded-xl text-xs font-bold focus:outline-none transition-colors bg-white"
                        style={{ borderColor: 'var(--guor-stone)', color: 'var(--guor-dark)' }}
                    />
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40"
                        style={{ color: 'var(--guor-dark)' }}
                    />
                </div>
            </div>

            {/* 2. Categorías */}
            <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--guor-dark)' }}>
                    Líneas de Colección
                </label>
                <div className="flex flex-col gap-1.5">
                    <button
                        type="button"
                        onClick={() => setCategoriaSeleccionada(null)}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all border"
                        style={{
                            backgroundColor: categoriaSeleccionada === null ? 'var(--guor-dark)' : '#ffffff',
                            borderColor: categoriaSeleccionada === null ? 'var(--guor-dark)' : 'var(--guor-stone)',
                            color: categoriaSeleccionada === null ? '#ffffff' : 'var(--guor-dark)',
                        }}
                    >
                        Todas las colecciones
                    </button>
                    {categorias.map((cat) => {
                        const esActivo = categoriaSeleccionada === cat.id;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setCategoriaSeleccionada(cat.id)}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all border"
                                style={{
                                    backgroundColor: esActivo ? 'var(--guor-dark)' : '#ffffff',
                                    borderColor: esActivo ? 'var(--guor-dark)' : 'var(--guor-stone)',
                                    color: esActivo ? '#ffffff' : 'var(--guor-dark)',
                                }}
                            >
                                {cat.nombre}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. Rango de Precios */}
            <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--guor-dark)' }}>
                        Rango de Precios B2B
                    </label>
                    <span className="text-[11px] font-black" style={{ color: 'var(--guor-gold)' }}>
                        S/ {rangoPrecio[0]} - S/ {rangoPrecio[1]}
                    </span>
                </div>
                <div className="space-y-2">
                    <input
                        type="range"
                        min={0}
                        max={precioMaximoLimite || 100}
                        value={rangoPrecio[1]}
                        onChange={(e) => setRangoPrecio([rangoPrecio[0], Number(e.target.value)])}
                        className="w-full accent-neutral-950 bg-neutral-200 h-1 rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: 'var(--guor-dark)' }}
                    />
                    <div className="flex justify-between text-[9px] font-bold opacity-40" style={{ color: 'var(--guor-dark)' }}>
                        <span>S/ 0</span>
                        <span>MÁX: S/ {precioMaximoLimite || 100}</span>
                    </div>
                </div>
            </div>

            {/* 4. Tallas */}
            <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--guor-dark)' }}>
                    Talla
                </label>
                <div className="flex flex-wrap gap-1.5">
                    {TALLAS.map((talla) => {
                        const esActivo = tallaSeleccionada === talla;
                        return (
                            <button
                                key={talla}
                                type="button"
                                onClick={() => setTallaSeleccionada(esActivo ? null : talla)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-black border transition-all"
                                style={{
                                    backgroundColor: esActivo ? 'var(--guor-dark)' : '#ffffff',
                                    borderColor: esActivo ? 'var(--guor-dark)' : 'var(--guor-stone)',
                                    color: esActivo ? '#ffffff' : 'var(--guor-dark)',
                                }}
                            >
                                {talla}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 5. Colores */}
            <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--guor-dark)' }}>
                    Color
                    {colorSeleccionado && (
                        <span className="ml-2 normal-case font-bold opacity-80">
                            — {formatearColor(colorSeleccionado)}
                        </span>
                    )}
                </label>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(COLOR_MAP).map(([valor, hex]) => {
                        const esActivo = colorSeleccionado === valor;
                        return (
                            <button
                                key={valor}
                                type="button"
                                title={formatearColor(valor)}
                                onClick={() => setColorSeleccionado(esActivo ? null : valor)}
                                className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                                style={{
                                    backgroundColor: hex,
                                    borderColor: esActivo ? 'var(--guor-gold)' : '#d1d5db',
                                    boxShadow: esActivo ? '0 0 0 2px var(--guor-gold)' : 'none',
                                }}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}