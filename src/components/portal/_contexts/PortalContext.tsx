'use client';

import { createContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useNotificationsPortal } from '@/lib/hooks/useNotificacionPortal';
import { calcularResumen } from './portalCalculos';
import type { ProductoBase } from '@/types/portal';
import { useCartStore } from '@/lib/store/useCartStore';
import { useQuotationStore } from '@/lib/store/useQuotationStore';
import { toast } from 'sonner';

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

export interface HitoSeguimientoPedido {
    id: number;
    pedido_id: number;
    status: 'pendiente' | 'procesando' | 'empaquetado' | 'listo_despacho' | 'en_transito' | 'entregado' | 'cancelado' | string;
    notas: string | null;
    created_at: string;
}

export interface HitoSeguimientoDespacho {
    id: number;
    grupo_despacho_id: number;
    status: 'pendiente' | 'programado' | 'en_almacen' | 'en_ruta' | 'entregado' | 'incidencia' | string;
    notas: string | null;
    created_at: string;
}

export interface PedidoSeguimiento {
    id: number;
    codigo_pedido: string;
    fecha_compra: string;
    monto_total: number;
    estado_pago: string;
    estado_pedido: string;
    items_count: number;
    historial: HitoSeguimientoPedido[];
}

export interface DespachoPortal {
    id: number;
    pedido_id: number;
    fecha_despacho: string;
    direccion_entrega: string;
    fecha_entrega: string | null;
    estado: string;
    created_at: string;
    updated_at: string;
    historial_grupo: HitoSeguimientoDespacho[];
}

// ── ACTUALIZACIÓN DE PORTALCTXPROPS ──────────────────────────────────────────
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

    // Agregados para Despachos y Seguimiento
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
    notificaciones: ReturnType<typeof useNotificationsPortal>['notificaciones'];
    unreadCount: number;
    loadingNotifs: boolean;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refetchNotifs: () => Promise<void>;
}

export const PortalContext = createContext<PortalCtxProps | null>(null);
export const MAX_UNIDADES = 2000;

export function PortalProvider({ children }: { children: ReactNode }) {
    // ── 1. ESTADOS REACTIVOS DESDE ZUSTAND ──
    const storeItemsBorrador = useQuotationStore((state) => state.itemsBorrador);
    const storeItemsCarrito = useCartStore((state) => state.items);
    const zonaEnvio = useQuotationStore((state) => state.zonaEnvio);
    const actualizarZonaEnvioState = useQuotationStore((state) => state.actualizarZonaEnvio);

    // ── 2. ESTADOS LOCALES BASE ──
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

    // ── NUEVOS ESTADOS PARA SEGUIMIENTO Y DESPACHOS ──
    const [pedidosSeguimiento, setPedidosSeguimiento] = useState<PedidoSeguimiento[]>([]);
    const [despachosActivos, setDespachosActivos] = useState<DespachoPortal[]>([]);
    const [loadingSeguimiento, setLoadingSeguimiento] = useState(false);

    const { notificaciones, unreadCount, loading: loadingNotifs, markAsRead, markAllAsRead, refetch: refetchNotifs } = useNotificationsPortal(cliente?.usuario_id);

    // Función independiente para refrescar pedidos y despachos de forma asíncrona
    const cargarSeguimientoYDespachos = useCallback(async (clienteId: number) => {
        setLoadingSeguimiento(true);
        const supabase = getSupabaseBrowserClient();
        try {
            // 1. OBTENER PEDIDOS + SU HISTORIAL DE ESTADOS (seguimiento_pedido)
            const { data: pedidosData, error: pedidosError } = await supabase
                .from('pedidos')
                .select(`
                    id, 
                    codigo_pedido:id, 
                    fecha_compra:created_at, 
                    monto_total:total, 
                    estado_pago, 
                    estado_pedido:estado,
                    historial:seguimiento_pedido (
                        id,
                        pedido_id,
                        status,
                        notas,
                        created_at
                    )
                `)
                .eq('cliente_id', clienteId)
                .order('created_at', { ascending: false })
                .order('created_at', { foreignTable: 'seguimiento_pedido', ascending: true }) // Cronológico
                .limit(10);

            if (pedidosError) throw pedidosError;

            if (pedidosData) {
                const pedidosFormateados = pedidosData.map((p: any) => ({
                    ...p,
                    items_count: p.items_count ?? 0,
                    historial: p.historial || []
                })) as PedidoSeguimiento[];

                setPedidosSeguimiento(pedidosFormateados);
            }

            // 2. OBTENER DESPACHOS + HISTORIAL DEL GRUPO (despachos -> despachos_grupo_pedidos -> despachos_grupos -> seguimiento_despachos)
            // Usamos la relación declarada 'pedidos' para filtrar por cliente.
            // Mediante 'despachos_grupo_pedidos' enlazamos al grupo y traemos su seguimiento.
            const { data: despachosData, error: despachosError } = await supabase
                .from('despachos')
                .select(`
                    id,
                    pedido_id,
                    fecha_despacho,
                    direccion_entrega,
                    fecha_entrega,
                    estado,
                    created_at,
                    updated_at,
                    pedidos!inner(cliente_id),
                    vinculo_grupo:despachos_grupo_pedidos (
                        grupo:despachos_grupos (
                            historial:seguimiento_despachos (
                                id,
                                grupo_despacho_id,
                                status,
                                notas,
                                created_at
                            )
                        )
                    )
                `)
                .eq('pedidos.cliente_id', clienteId)
                .not('estado', 'eq', 'entregado')
                .order('created_at', { foreignTable: 'despachos_grupo_pedidos.despachos_grupos.seguimiento_despachos', ascending: true });

            if (despachosError) throw despachosError;

            if (despachosData) {
                const despachosFormateados = despachosData.map((d: any) => {
                    // Extraemos el historial aplanando la estructura anidada de la tabla intermedia B2B
                    let historialGrupo: HitoSeguimientoDespacho[] = [];

                    if (d.vinculo_grupo && d.vinculo_grupo.length > 0) {
                        // Si el despacho pertenece a un grupo consolidado, extraemos sus hitos de estatus
                        const grupoData = d.vinculo_grupo[0]?.grupo;
                        if (grupoData && grupoData.historial) {
                            historialGrupo = grupoData.historial;
                        }
                    }

                    return {
                        id: d.id,
                        pedido_id: d.pedido_id,
                        fecha_despacho: d.fecha_despacho,
                        direccion_entrega: d.direccion_entrega,
                        fecha_entrega: d.fecha_entrega,
                        estado: d.estado,
                        created_at: d.created_at,
                        updated_at: d.updated_at,
                        historial_grupo: historialGrupo
                    };
                }) as DespachoPortal[];

                setDespachosActivos(despachosFormateados);
            }

        } catch (error) {
            console.error('Error detallado cargando despachos/seguimiento en el Portal:', error);
        } finally {
            setLoadingSeguimiento(false);
        }
    }, []);

    // Inicialización del Portal B2B con consulta única optimizada
    useEffect(() => {
        const init = async () => {
            const supabase = getSupabaseBrowserClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }

            try {
                const [reglasRes, productosRes, categoriasRes, costosRes] = await Promise.all([
                    supabase.from('reglas_descuento').select('*').eq('activo', true),
                    supabase.from('productos').select('*, variantes:variantes_producto(*)').order('nombre', { ascending: true }),
                    supabase.from('categorias').select('id, nombre').order('nombre', { ascending: true }),
                    supabase.from('costo_envio').select('*').eq('activo', true).order('id'),
                ]);

                if (reglasRes.data) setReglas(reglasRes.data);
                if (productosRes.data) setProductos(productosRes.data as ProductoPortal[]);
                if (categoriasRes.data) setCategorias(categoriasRes.data);
                if (costosRes.data) {
                    setCostosEnvio(costosRes.data.map(c => ({ id: c.id, zona: c.zona as ZonaEnvio, costo: Number(c.costo), activo: c.activo })));
                }

                const { data: usuarioPerfil } = await supabase
                    .from('usuarios')
                    .select(`id, cliente_datos:clientes!clientes_usuario_id_fkey (*)`)
                    .eq('auth_id', user.id)
                    .maybeSingle();

                const datosCliente = Array.isArray(usuarioPerfil?.cliente_datos)
                    ? usuarioPerfil?.cliente_datos[0]
                    : usuarioPerfil?.cliente_datos;

                if (datosCliente) {
                    const clientObj: ClientePortal = {
                        id: datosCliente.id,
                        usuario_id: usuarioPerfil!.id,
                        ruc: Number(datosCliente.ruc),
                        razon_social: datosCliente.razon_social || 'Sin Razón Social',
                        direccion_fiscal: datosCliente.direccion_fiscal || 'Sin Dirección',
                        email: datosCliente.email,
                        telefono: datosCliente.telefono ? Number(datosCliente.telefono.replace(/\D/g, '')) : null,
                        tipo_cliente: datosCliente.tipo_cliente || 'corporativo',
                        nombre_comercial: datosCliente.nombre_comercial || 'Sin Nombre Comercial',
                    };
                    setCliente(clientObj);

                    // Ejecutar carga paralela de stats y data de despachos
                    const [cotRes, ordRes, dspRes] = await Promise.all([
                        supabase.from('cotizaciones').select('id', { count: 'exact', head: true }).eq('cliente_id', datosCliente.id).in('estado', ['borrador', 'enviada', 'aprobada']),
                        supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('cliente_id', datosCliente.id).not('estado', 'in', '(finalizado,cancelado)'),
                        supabase.from('despachos').select('id', { count: 'exact', head: true }).eq('estado', 'en_ruta'), // General o filtrado por cliente
                    ]);

                    setStats({ cotizaciones_activas: cotRes.count ?? 0, ordenes_activas: ordRes.count ?? 0, despachos_en_ruta: dspRes.count ?? 0 });

                    // Disparar la carga detallada inicial de seguimiento
                    await cargarSeguimientoYDespachos(datosCliente.id);
                }
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        init();
    }, [cargarSeguimientoYDespachos]);

    const esClienteNuevo = cliente?.tipo_cliente === 'nuevo';

    // Manejador expuesto para refetch manual desde componentes de la UI (ej: botón refrescar pedido)
    const refetchSeguimiento = useCallback(async () => {
        if (cliente?.id) {
            await cargarSeguimientoYDespachos(cliente.id);
        }
    }, [cliente?.id, cargarSeguimientoYDespachos]);

    // ── 3. NORMALIZACIÓN DE TIPOS Y ADAPTACIÓN PARA CALCULOS ──
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

    // ── 4. MEMOS DE RESÚMENES FINANCIEROS ──
    const resumenBorrador = useMemo(() => calcularResumen(itemsBorradorAdaptados, zonaEnvio, reglas, esClienteNuevo), [itemsBorradorAdaptados, zonaEnvio, reglas, esClienteNuevo]);
    const resumenCarrito = useMemo(() => calcularResumen(itemsCarritoAdaptados, zonaEnvio, reglas, esClienteNuevo), [itemsCarritoAdaptados, zonaEnvio, reglas, esClienteNuevo]);

    // ── 5. ACCIONES CONECTADAS DIRECTAMENTE A ZUSTAND ──
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

        const listaVariantes = (producto.variantes ?? (producto as any).variantes_producto ?? []) as Array<{
            id: number;
            talla?: string;
            color?: string;
            stock?: number;
            stock_disponible?: number;
            imagen_url?: string | null;
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
            toast.error('Inventario agotado', {
                description: `No hay stock disponible para la combinación elegida de ${producto.nombre}.`
            });
            return;
        }

        if (cantidadAsignada > stockMaximo) {
            toast.warning('Stock limitado', {
                description: `Solo se agregarán ${stockMaximo} unidades (máximo disponible en almacén).`
            });
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
    }, [productos]);

    const actualizarCantidadBorrador = useCallback((id: number, q: number) => useQuotationStore.getState().updateBorradorQuantity(id, q), []);
    const actualizarCantidadCarrito = useCallback((v_id: number, q: number) => {
        // 1. Buscamos el item en el store del carrito
        const item = useCartStore.getState().items.find(i => i.variante_id === v_id);
        if (!item) return;

        // 2. Buscamos el producto en nuestro estado local para leer el stock de la vista
        const prodCompleto = productos.find(p => p.id === item.producto_id);
        const listaVariantes = (prodCompleto?.variantes ?? (prodCompleto as any)?.variantes_producto ?? []) as Array<{ id: number; stock_disponible?: number }>;
        const variante = listaVariantes.find(v => v.id === v_id);

        const stockMaximo = variante?.stock_disponible ?? 0;

        // 3. Si el usuario intenta escribir o subir a una cantidad mayor que el stock real de la vista
        if (q > stockMaximo) {
            toast.warning('Stock insuficiente', {
                description: `Solo quedan ${stockMaximo} unidades disponibles de este modelo.`
            });
            // Forzamos a que se quede en el máximo disponible
            useCartStore.getState().updateQuantity(item.producto_id, v_id, stockMaximo);
            return;
        }

        // Si todo está bien, actualiza normal
        useCartStore.getState().updateQuantity(item.producto_id, v_id, q);
    }, [productos]);
    const eliminarDelBorrador = useCallback((id: number) => useQuotationStore.getState().removeItemFromBorrador(id), []);
    const eliminarDelCarrito = useCallback((v_id: number) => {
        const item = useCartStore.getState().items.find(i => i.variante_id === v_id);
        if (item) {
            useCartStore.getState().removeItem(item.producto_id, v_id);
        }
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