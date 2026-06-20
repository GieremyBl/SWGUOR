'use client';

import { createContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useNotificationsPortal } from '@/lib/hooks/useNotificacionPortal';
import { calcularResumen } from './portalCalculos';
import type { ProductoBase } from '@/types/portal';
import { useCartStore } from '@/lib/store/useCartStore';
import { useQuotationStore } from '@/lib/store/useQuotationStore';
import { toast } from 'sonner';
import { fetchDespachosPortal } from '@/lib/helpers/despachos-helpers';

// ── Interfaces y Tipos Existentes ───────────────────────────────────────────
export interface ClientePortal { id: number; usuario_id: number; ruc: number; razon_social: string; nombre_comercial: string; direccion_fiscal?: string; email: string | null; telefono: number | null; tipo_cliente: string; }
export type ItemCotizacion = ItemLineaB2B;
export type ItemCarrito = ItemLineaB2B;
export type ZonaEnvio = 'cercana_sjl' | 'media' | 'lejana';
export interface CostoEnvioDb { id: number; zona: ZonaEnvio; costo: number; activo: boolean; }
export interface ReglaDescuento { id: number; nombre: string; cantidad_min: number | null; monto_min_compra: number | null; tipo_beneficio: string; valor_descuento: number; fecha_inicio: string; fecha_fin: string; activo: boolean | null; tipo_conteo: string | null; }
export interface CategoriaPortal { id: number; nombre: string; }
export interface ProductoPortal extends ProductoBase {
    id: number; nombre: string;
    descripcion: string | null; created_at: string; imagen: string | null;
    precio: number; stock: number; updated_at: string;
    estado: 'activo' | 'inactivo' | 'en_produccion' | 'agotado' | 'descontinuado';
    sku: string; destacado: boolean | null;
    categoria_id: number | null; moq: number;
    colores_disponibles: string[] | null;
    tallas_disponibles: string[] | null;
    reglas_descuento: string[] | null;
    almacen_id: number | null;
    variantes?: any[];
    variantes_producto?: any[];
}
export interface ResumenCotizacion { subtotal: number; total_unidades: number; modelos_distintos: number; descuento_pct: number; descuento_monto: number; base_igv: number; igv: number; costo_envio: number; total: number; descripcion_descuento: string; descripcion_envio: string; es_cliente_nuevo: boolean; }
export interface AgregarCotizacionPayload { variante_id: number; producto_id: number; cantidad: number; nombre: string; sku: string; imagen: string | null; color: string; talla: string; precio_unitario: number; }
export type AgregarPedidoPayload = | { tipo: 'catalogo_rapido'; producto: ProductoPortal } | { tipo: 'picker_variante'; variante_id: number; producto: ProductoPortal; cantidad: number };
export interface ItemLineaB2B { producto_id: number; variante_id: number; nombre: string; sku: string; imagen: string | null; precio_unitario: number; cantidad: number; talla: string; color: string; subtotal: number; stock_disponible: number; }

export const ZONAS_ENVIO: Record<ZonaEnvio, { label: string; costo: number }> = {
    cercana_sjl: { label: 'Cercana a SJL', costo: 15 },
    media: { label: 'Zona media', costo: 20 },
    lejana: { label: 'Zona lejana', costo: 25 },
};

export interface HitoSeguimientoPedido { id: number; pedido_id: number; status: string; notas: string | null; created_at: string; }
export interface HitoSeguimientoDespacho { id: number; grupo_despacho_id: number; status: string; notas: string | null; created_at: string; }
export interface PedidoSeguimiento { id: number; codigo_pedido: string; fecha_compra: string; monto_total: number; estado_pago: string; estado_pedido: string; items_count: number; historial: HitoSeguimientoPedido[]; }
export interface DespachoPortal { id: number; pedido_id: number; fecha_despacho: string; direccion_entrega: string; fecha_entrega: string | null; estado: string; created_at: string; updated_at: string; historial_grupo: HitoSeguimientoDespacho[]; }

export interface PortalCtxProps {
    cliente: ClientePortal | null;
    loading: boolean;
    itemsBorrador: ItemCotizacion[];
    itemsCarrito: ItemCotizacion[];
    resumenBorrador: ResumenCotizacion;
    resumenCarrito: ResumenCotizacion;
    zonaEnvio: ZonaEnvio;
    costosEnvio: CostoEnvioDb[];
    productos: ProductoPortal[];
    categorias: CategoriaPortal[];
    stats: { cotizaciones_activas: number; ordenes_activas: number; despachos_en_ruta: number };
    pedidosSeguimiento: PedidoSeguimiento[];
    despachosActivos: DespachoPortal[];
    loadingSeguimiento: boolean;
    refetchSeguimiento: () => Promise<void>;
    actualizarZonaEnvio: (zona: ZonaEnvio) => void;
    agregarACotizacion: (payload: AgregarCotizacionPayload) => void;
    agregarDesdeCatalogo: (payload: AgregarPedidoPayload) => void;
    actualizarCantidadBorrador: (variante_id: number, cantidad: number) => void;
    actualizarCantidadCarrito: (variante_id: number, cantidad: number) => void;
    eliminarDelBorrador: (variante_id: number) => void;
    eliminarDelCarrito: (variante_id: number) => void;
    limpiarBorrador: () => void;
    limpiarCarrito: () => void;
    actualizarCliente: (updates: Partial<ClientePortal>) => void;
    notificaciones: any[];
    unreadCount: number;
    loadingNotifs: boolean;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refetchNotifs: () => Promise<void>;
}

export const PortalContext = createContext<PortalCtxProps | null>(null);
export const MAX_UNIDADES = 2000;

export function PortalProvider({ children }: { children: ReactNode }) {
    const storeItemsBorrador = useQuotationStore((state) => state.itemsBorrador);
    const storeItemsCarrito = useCartStore((state) => state.items);
    const zonaEnvio = useQuotationStore((state) => state.zonaEnvio);
    const actualizarZonaEnvioState = useQuotationStore((state) => state.actualizarZonaEnvio);

    const [cliente, setCliente] = useState<ClientePortal | null>(null);
    const [loading, setLoading] = useState(true);
    const [reglas, setReglas] = useState<ReglaDescuento[]>([]);
    const [stats, setStats] = useState({ cotizaciones_activas: 0, ordenes_activas: 0, despachos_en_ruta: 0 });
    const [costosEnvio, setCostosEnvio] = useState<CostoEnvioDb[]>([
        { id: 1, zona: 'cercana_sjl', costo: 15, activo: true },
        { id: 2, zona: 'media', costo: 20, activo: true },
        { id: 3, zona: 'lejana', costo: 25, activo: true }
    ]);
    const [productos, setProductos] = useState<ProductoPortal[]>([]);
    const [categorias, setCategorias] = useState<CategoriaPortal[]>([]);

    const [pedidosSeguimiento, setPedidosSeguimiento] = useState<PedidoSeguimiento[]>([]);
    const [despachosActivos, setDespachosActivos] = useState<DespachoPortal[]>([]);
    const [loadingSeguimiento, setLoadingSeguimiento] = useState(false);

    const { notificaciones, unreadCount, loading: loadingNotifs, markAsRead, markAllAsRead, refetch: refetchNotifs } = useNotificationsPortal(cliente?.usuario_id);

    const cargarSeguimientoYDespachos = useCallback(async (clienteId: number) => {
        if (!clienteId) return;
        setLoadingSeguimiento(true);

        try {
            const res = await fetch('/api/portal/pedidos?vista=contexto', { cache: 'no-store' });
            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.error ?? 'Error al cargar pedidos');
            }

            setPedidosSeguimiento(json.data ?? []);

            const despachosFormateados = await fetchDespachosPortal();
            setDespachosActivos(despachosFormateados);

        } catch (error) {
            console.warn('Advertencia: No se pudieron cargar los seguimientos:', error);
        } finally {
            setLoadingSeguimiento(false);
        }
    }, []);

    // Inicialización del Portal B2B optimizada mediante peticiones HTTP internas
    useEffect(() => {
        const init = async () => {
            const supabase = getSupabaseBrowserClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }

            try {
                const [resReglas, resProductos, resCategorias, resCostos] = await Promise.all([
                    supabase.from('reglas_descuento').select('*').eq('activo', true),
                    fetch('/api/portal/productos').then((r) => r.json()),
                    fetch('/api/portal/categorias').then((r) => r.json()),
                    supabase.from('costo_envio').select('*').eq('activo', true).order('id'),
                ]);

                if (resReglas.data) setReglas(resReglas.data);

                // Mapear los productos desde tu API route de Prisma
                if (resProductos.success && resProductos.data) {
                    setProductos(resProductos.data as ProductoPortal[]);
                }

                // Mapear las categorías desde tu API route de Prisma
                if (resCategorias.success && resCategorias.data) {
                    setCategorias(resCategorias.data as CategoriaPortal[]);
                }

                if (resCostos.data) {
                    setCostosEnvio(resCostos.data.map(c => ({ id: c.id, zona: c.zona as ZonaEnvio, costo: Number(c.costo), activo: c.activo })));
                }

                const resPerfil = await fetch('/api/portal/perfil').then(r => r.json());

                if (resPerfil.success && resPerfil.data) {
                    const { cliente: datosCliente, usuario: datosUsuario } = resPerfil.data;

                    const clientObj: ClientePortal = {
                        id: datosCliente.id,
                        usuario_id: datosUsuario.id,
                        ruc: Number(datosCliente.ruc),
                        razon_social: datosCliente.razon_social || 'Sin Razón Social',
                        direccion_fiscal: datosCliente.direccion_fiscal || 'Sin Dirección',
                        nombre_comercial: datosCliente.nombre_comercial || 'Sin Nombre Comercial',
                        email: datosCliente.email,
                        telefono: datosCliente.telefono
                            ? Number(String(datosCliente.telefono).replace(/\D/g, ''))
                            : null,
                        tipo_cliente: datosCliente.tipo_cliente || 'corporativo',
                    };
                    setCliente(clientObj);

                    const despachosFormateados = await fetchDespachosPortal().catch(() => []);
                    const despachoCount = despachosFormateados.filter((d) => d.estado === 'en_ruta').length;

                    setStats({
                        cotizaciones_activas: resPerfil.data.stats.cotizaciones ?? 0,
                        ordenes_activas: resPerfil.data.stats.pedidos ?? 0,
                        despachos_en_ruta: despachoCount,
                    });

                    await cargarSeguimientoYDespachos(datosCliente.id);
                }
            } catch (err) {
                console.error('Error inicializando el PortalProvider:', err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [cargarSeguimientoYDespachos]);

    const esClienteNuevo = cliente?.tipo_cliente === 'nuevo';

    const refetchSeguimiento = useCallback(async () => {
        if (cliente?.id) {
            await cargarSeguimientoYDespachos(cliente.id);
        }
    }, [cliente?.id, cargarSeguimientoYDespachos]);

    const itemsBorradorAdaptados = useMemo<ItemLineaB2B[]>(() => {
        return storeItemsBorrador.map((item) => ({
            producto_id: item.producto_id,
            variante_id: item.variante_id,
            nombre: item.nombre,
            sku: item.sku,
            imagen: item.imagen,
            precio_unitario: item.precio_unitario,
            cantidad: item.cantidad,
            talla: item.talla,
            color: item.color,
            stock_disponible: item.stock_disponible ?? 0,
            subtotal: item.precio_unitario * item.cantidad
        }));
    }, [storeItemsBorrador]);

    const itemsCarritoAdaptados = useMemo<ItemLineaB2B[]>(() => {
        return storeItemsCarrito.map((item) => {
            const prodCompleto = productos.find(p => p.id === item.producto_id);
            const listaVariantes = (prodCompleto?.variantes ?? (prodCompleto)?.variantes_producto ?? []) as Array<{ id: number; stock_disponible?: number; stock?: number }>;
            const vReal = listaVariantes.find(v => v.id === item.variante_id);
            const stockReal = vReal?.stock_disponible ?? vReal?.stock ?? 0;

            return {
                producto_id: item.producto_id,
                variante_id: item.variante_id ?? 0,
                nombre: item.nombre,
                sku: prodCompleto?.sku || '',
                imagen: item.imagen_url,
                precio_unitario: item.precio,
                cantidad: item.cantidad,
                talla: item.talla,
                color: item.color,
                stock_disponible: stockReal,
                subtotal: item.precio * item.cantidad
            };
        });
    }, [storeItemsCarrito, productos]);

    const resumenBorrador = useMemo(
        () => calcularResumen(itemsBorradorAdaptados, zonaEnvio, reglas, esClienteNuevo, costosEnvio),
        [itemsBorradorAdaptados, zonaEnvio, reglas, esClienteNuevo, costosEnvio],
    );
    const resumenCarrito = useMemo(
        () => calcularResumen(itemsCarritoAdaptados, zonaEnvio, reglas, esClienteNuevo, costosEnvio),
        [itemsCarritoAdaptados, zonaEnvio, reglas, esClienteNuevo, costosEnvio],
    );

    const actualizarZonaEnvio = useCallback((zona: ZonaEnvio) => {
        actualizarZonaEnvioState(zona);
    }, [actualizarZonaEnvioState]);

    const agregarACotizacion = useCallback((p: AgregarCotizacionPayload) => {
        useQuotationStore.getState().addItemToBorrador({
            producto_id: p.producto_id,
            variante_id: p.variante_id,
            nombre: p.nombre,
            sku: p.sku,
            imagen: p.imagen,
            precio_unitario: p.precio_unitario,
            talla: p.talla,
            color: p.color,
            stock_disponible: 9999
        }, p.cantidad);
    }, []);

    const agregarDesdeCatalogo = useCallback((payload: AgregarPedidoPayload) => {
        const { producto } = payload;
        const listaVariantes = (producto.variantes ?? (producto).variantes_producto ?? []) as Array<{
            id: number; talla?: string; color?: string; stock?: number; stock_disponible?: number; imagen_url?: string | null;
        }>;

        let v_id: number | undefined;
        let cantidadAsignada = 1;

        if (payload.tipo === 'picker_variante') {
            v_id = payload.variante_id;
            cantidadAsignada = payload.cantidad;
        } else if (payload.tipo === 'catalogo_rapido') {
            const varianteConStock = listaVariantes.find(v => Number(v.stock_disponible ?? v.stock ?? 0) > 0);
            v_id = varianteConStock?.id ?? listaVariantes[0]?.id;
            cantidadAsignada = producto.moq || 1;
        }

        const varianteSeleccionada = listaVariantes.find((v) => v.id === v_id);
        const stockMaximo = varianteSeleccionada?.stock_disponible ?? varianteSeleccionada?.stock ?? 0;

        if (stockMaximo <= 0) {
            toast.error('Inventario agotado', { description: `No hay stock disponible para la combinación elegida de ${producto.nombre}.` });
            return;
        }

        if (cantidadAsignada > stockMaximo) {
            toast.warning('Stock limitado', { description: `Solo se agregarán ${stockMaximo} unidades (máximo disponible en almacén).` });
            cantidadAsignada = stockMaximo;
        }

        useCartStore.getState().addItem({
            producto_id: producto.id,
            variante_id: v_id ?? 0,
            nombre: producto.nombre,
            precio: Number(producto.precio),
            moq: producto.moq || 1,
            imagen_url: varianteSeleccionada?.imagen_url || producto.imagen || null,
            talla: varianteSeleccionada?.talla || producto.tallas_disponibles?.[0] || 'M',
            color: varianteSeleccionada?.color || producto.colores_disponibles?.[0] || 'Estándar'
        }, cantidadAsignada);

        toast.success(`${producto.nombre} agregado al borrador de pedido.`);
    }, []);

    const actualizarCantidadBorrador = useCallback((id: number, q: number) => useQuotationStore.getState().updateBorradorQuantity(id, q), []);

    const actualizarCantidadCarrito = useCallback((v_id: number, q: number) => {
        const item = useCartStore.getState().items.find(i => i.variante_id === v_id);
        if (!item) return;

        const prodCompleto = productos.find(p => p.id === item.producto_id);
        const listaVariantes = (prodCompleto?.variantes ?? (prodCompleto as any)?.variantes_producto ?? []) as Array<{ id: number; stock_disponible?: number }>;
        const variante = listaVariantes.find(v => v.id === v_id);
        const stockMaximo = variante?.stock_disponible ?? 0;

        if (q > stockMaximo) {
            toast.warning('Stock insuficiente', { description: `Solo quedan ${stockMaximo} unidades disponibles de este modelo.` });
            useCartStore.getState().updateQuantity(item.producto_id, v_id, stockMaximo);
            return;
        }
        useCartStore.getState().updateQuantity(item.producto_id, v_id, q);
    }, [productos]);

    const eliminarDelBorrador = useCallback((id: number) => useQuotationStore.getState().removeItemFromBorrador(id), []);
    const eliminarDelCarrito = useCallback((v_id: number) => {
        const item = useCartStore.getState().items.find(i => i.variante_id === v_id);
        if (item) useCartStore.getState().removeItem(item.producto_id, v_id);
    }, []);
    const limpiarBorrador = useCallback(() => useQuotationStore.getState().clearBorrador(), []);
    const limpiarCarrito = useCallback(() => useCartStore.getState().clearCart(), []);
    const actualizarCliente = useCallback((u: Partial<ClientePortal>) => setCliente(prev => prev ? { ...prev, ...u } : prev), []);

    return (
        <PortalContext.Provider value={{
            cliente, loading, itemsBorrador: itemsBorradorAdaptados, itemsCarrito: itemsCarritoAdaptados, resumenBorrador, resumenCarrito, zonaEnvio, costosEnvio, productos, categorias, stats,
            pedidosSeguimiento, despachosActivos, loadingSeguimiento, refetchSeguimiento,
            actualizarZonaEnvio, agregarACotizacion, agregarDesdeCatalogo, actualizarCantidadBorrador, actualizarCantidadCarrito, eliminarDelBorrador, eliminarDelCarrito, limpiarBorrador, limpiarCarrito, actualizarCliente,
            notificaciones, unreadCount, loadingNotifs, markAsRead, markAllAsRead, refetchNotifs
        }}>
            {children}
        </PortalContext.Provider>
    );
}