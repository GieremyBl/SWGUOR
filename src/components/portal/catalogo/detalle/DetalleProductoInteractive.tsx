'use client';

import { useState, useMemo } from 'react';
import InfoProducto from './InfoProducto';
import TarifaDescuentoVolumen from './TarifaDescuentoVolumen';
import DetalleProductoForm from './DetalleProductoForm';
import { COLOR_MAP } from '@/lib/constants/colores';

interface DetalleProductoInteractiveProps {
    producto: any;
}

export default function DetalleProductoInteractive({ producto }: DetalleProductoInteractiveProps) {
    const [colorSeleccionado, setColorSeleccionado] = useState<string>(producto.colores_disponibles[0] ?? '');
    const [tallaSeleccionada, setTallaSeleccionada] = useState<string>(producto.tallas_disponibles[0] ?? '');

    const varianteActiva = producto.variantes.find(
        (v: any) => v.color === colorSeleccionado && v.talla === tallaSeleccionada
    ) ?? producto.variantes[0] ?? null;

    const precioActual = varianteActiva ? varianteActiva.precio_final : producto.precio;

    // Lista de reglas mapeada desde los registros reales de tu script SQL
    const listaReglasDeBaseDeDatos = useMemo(() => {
        return [
            { cantidad_minima: 500, descuento_porcentaje: 5 },
            { cantidad_minima: 1000, descuento_porcentaje: 10 },
            { cantidad_minima: 1500, descuento_porcentaje: 15 },
            { cantidad_minima: 2000, descuento_porcentaje: 20 },
            { cantidad_minima: 2500, descuento_porcentaje: 25 },
        ];
    }, []);

    // Preparar los escalones con cálculos financieros exactos según el precio actual de la variante
    const escalonesCalculados = useMemo(() => {
        return listaReglasDeBaseDeDatos.map((r) => {
            const precioUnitario = precioActual * (1 - r.descuento_porcentaje / 100);
            return {
                cantidad_minima: r.cantidad_minima,
                descuento_porcentaje: r.descuento_porcentaje,
                precioUnitario,
                ahorroTotal: (precioActual - precioUnitario) * r.cantidad_minima
            };
        }).sort((a, b) => a.cantidad_minima - b.cantidad_minima);
    }, [precioActual, listaReglasDeBaseDeDatos]);

    // Cantidad inicial fijada en el tramo mínimo (500)
    const [cantidadSeleccionada, setCantidadSeleccionada] = useState<number>(500);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* COLUMNA IZQUIERDA: Imagen + Tabla estructurada debajo */}
            <div className="flex flex-col gap-6">
                <div className="relative aspect-square w-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                    <img
                        src={varianteActiva?.imagen_url ?? producto.imagen ?? '/images/placeholder-producto.png'}
                        alt={producto.nombre}
                        className="object-cover w-full h-full"
                    />
                </div>

                <TarifaDescuentoVolumen
                    escalones={escalonesCalculados}
                    cantidadActual={cantidadSeleccionada}
                />
            </div>

            {/* COLUMNA DERECHA: Datos del producto y Formulario */}
            <div className="flex flex-col gap-6">
                <InfoProducto
                    nombre={producto.nombre}
                    descripcion={producto.descripcion}
                    codigo={producto.codigo}
                    categoria={producto.categoria}
                    stockDisponible={varianteActiva ? varianteActiva.stock : producto.stock_disponible}
                    precioBase={precioActual}
                />

                {/* Colores */}
                {producto.colores_disponibles.length > 0 && (
                    <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Color: <span className="text-slate-800 capitalize">{colorSeleccionado.replace(/_/g, ' ')}</span>
                        </span>
                        <div className="flex gap-2 flex-wrap">
                            {producto.colores_disponibles.map((color: string) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setColorSeleccionado(color)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all shrink-0 ${colorSeleccionado === color ? 'border-indigo-600 scale-110 shadow-sm' : 'border-slate-200 hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: COLOR_MAP[color] ?? '#e5e7eb' }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Tallas */}
                {producto.tallas_disponibles.length > 0 && (
                    <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Talla Seleccionada
                        </span>
                        <div className="flex gap-1.5 flex-wrap">
                            {producto.tallas_disponibles.map((talla: string) => (
                                <button
                                    key={talla}
                                    type="button"
                                    onClick={() => setTallaSeleccionada(talla)}
                                    className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all ${tallaSeleccionada === talla ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700'
                                        }`}
                                >
                                    {talla}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Formulario Mayorista */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-900 mb-4">Configurar Orden Mayorista</h2>
                    <DetalleProductoForm
                        productoId={producto.id}
                        nombreProducto={producto.nombre}
                        precioBase={precioActual}
                        variante={varianteActiva}
                        listaReglas={listaReglasDeBaseDeDatos}
                        stockMinimoPedido={500}
                        onCantidadChange={(nuevaCant) => setCantidadSeleccionada(nuevaCant)}
                    />
                </div>
            </div>
        </div>
    );
}