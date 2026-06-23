'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { ChevronsUpDown, Check, Loader2, PackageOpen, Boxes, Factory } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TipoItem = 'producto' | 'insumo' | 'material';

export interface ItemOpcion {
    id: string;
    nombre: string;
    sku?: string;
    stock?: number;
    unidad?: string;
}

interface ApiResponseItem {
    id: string | number;
    nombre: string;
    sku?: string;
    stock_actual?: number;
    stock?: number;
    unidad_medida?: string;
    unidad?: string;
}

const ENDPOINTS: Record<TipoItem, string> = {
    producto: '/api/admin/productos',
    insumo: '/api/admin/insumos',
    material: '/api/admin/materiales',
};

const ICONOS: Record<TipoItem, React.ElementType> = {
    producto: PackageOpen,
    insumo: Boxes,
    material: Factory,
};

const PLACEHOLDER_BUSQUEDA: Record<TipoItem, string> = {
    producto: 'Buscar producto por nombre o SKU...',
    insumo: 'Buscar insumo...',
    material: 'Buscar material...',
};

const PLACEHOLDER_VACIO: Record<TipoItem, string> = {
    producto: 'Seleccionar producto...',
    insumo: 'Seleccionar insumo...',
    material: 'Seleccionar material...',
};

// Cada endpoint devuelve una forma distinta de respuesta — confirmado leyendo
// las 3 rutas. NO unificar esto "a ojo": producto va plano, insumo va anidado
// bajo data.insumos, material va como array directo bajo data.
function parseRespuesta(json: unknown, tipo: TipoItem): ApiResponseItem[] {
    const j = json as Record<string, unknown>;
    switch (tipo) {
        case 'producto':
            return Array.isArray(j?.productos) ? (j.productos as ApiResponseItem[]) : [];
        case 'insumo': {
            const data = j?.data as Record<string, unknown> | undefined;
            return Array.isArray(data?.insumos) ? (data!.insumos as ApiResponseItem[]) : [];
        }
        case 'material':
            return Array.isArray(j?.data) ? (j.data as ApiResponseItem[]) : [];
        default:
            return [];
    }
}

interface ArticuloComboboxProps {
    tipoItem: TipoItem;
    value: ItemOpcion | null;
    onChange: (item: ItemOpcion | null) => void;
    disabled?: boolean;
}

export function ArticuloCombobox({ tipoItem, value, onChange, disabled }: ArticuloComboboxProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [resultados, setResultados] = useState<ItemOpcion[]>([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const Icon = ICONOS[tipoItem];

    const buscar = useCallback(async (texto: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limite: '20' });
            if (texto.trim()) params.set('busqueda', texto.trim());
            // Para productos, evita traer variantes_producto + fichas_tecnicas
            // completas: es lo que más pesa en el render del listado.
            if (tipoItem === 'producto') params.set('ligero', 'true');

            const res = await fetch(`${ENDPOINTS[tipoItem]}?${params.toString()}`);
            if (!res.ok) throw new Error('Error al buscar artículos');
            const json = await res.json();
            const raw = parseRespuesta(json, tipoItem);

            setResultados(
                raw.map((item) => ({
                    id: String(item.id),
                    nombre: item.nombre,
                    sku: item.sku,
                    stock: item.stock_actual ?? item.stock ?? undefined,
                    unidad: item.unidad_medida ?? item.unidad ?? undefined,
                })),
            );
        } catch (error) {
            console.error('Error buscando artículos:', error);
            setResultados([]);
        } finally {
            setLoading(false);
        }
    }, [tipoItem]);

    // Carga inicial (primeros 20 alfabéticos) al abrir o al cambiar de tipo
    useEffect(() => {
        if (open) buscar(query);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, tipoItem]);

    // Búsqueda con debounce mientras el usuario escribe
    useEffect(() => {
        if (!open) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => buscar(query), 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    disabled={disabled}
                    className="h-11 w-full rounded-xl border border-slate-200/70 bg-[#FBF9F4] px-3 text-left text-sm font-medium text-slate-700 flex items-center justify-between gap-2 focus:bg-white focus:outline-none disabled:opacity-50 transition-colors"
                >
                    <span className="flex items-center gap-2 truncate">
                        <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className={cn('truncate', !value && 'text-slate-400 font-normal')}>
                            {value ? value.nombre : PLACEHOLDER_VACIO[tipoItem]}
                        </span>
                    </span>
                    <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200/70"
                align="start"
            >
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={PLACEHOLDER_BUSQUEDA[tipoItem]}
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {loading && (
                            <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Buscando...
                            </div>
                        )}
                        {!loading && (
                            <CommandEmpty className="py-6 text-center text-xs text-slate-400">
                                No se encontraron resultados
                            </CommandEmpty>
                        )}
                        {!loading && resultados.length > 0 && (
                            <CommandGroup>
                                {resultados.map((item) => (
                                    <CommandItem
                                        key={item.id}
                                        value={item.id}
                                        onSelect={() => {
                                            onChange(item);
                                            setOpen(false);
                                            setQuery('');
                                        }}
                                        className="rounded-lg text-xs gap-2"
                                    >
                                        <Check
                                            className={cn(
                                                'w-3.5 h-3.5 shrink-0',
                                                value?.id === item.id ? 'opacity-100' : 'opacity-0',
                                            )}
                                        />
                                        <span className="font-medium text-slate-700 truncate">{item.nombre}</span>
                                        {item.stock !== undefined && (
                                            <span className="ml-auto text-[10px] text-slate-400 shrink-0 pl-3">
                                                {item.stock} {item.unidad ?? ''}
                                            </span>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}