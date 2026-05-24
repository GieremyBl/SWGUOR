'use client';

import {
  createContext, useContext, useEffect, useState,
  useCallback, useMemo, useRef, ReactNode,
} from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { Notificacion } from '@/lib/schemas/notificaciones';

// ── Tipos ────────────────────────────────────────────────────────
export interface ClientePortal {
  id: number;
  usuario_id: number;
  ruc: number;
  razon_social: string;
  nombre_comercial: string;
  direccion?: string;
  email: string | null;
  telefono: number | null;
  tipo_cliente: string;
}

export interface ItemCotizacion {
  producto_id: number;
  variante_id: number;
  nombre: string;
  sku: string;
  imagen: string | null;
  precio_unitario: number;
  cantidad: number;
  talla: string;
  color: string;
  subtotal: number;
  stock_disponible: number;
  colores_disponibles?: string[];
  tallas_disponibles?: string[];
  variantes?: Array<{
    id: number;
    color: string;
    talla: string;
    stock: number;
  }>;
}

export type ZonaEnvio = 'cercana_sjl' | 'media' | 'lejana';

export interface CostoEnvioDb {
  id: number;
  zona: ZonaEnvio;
  costo: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export const ZONAS_ENVIO: Record<ZonaEnvio, { label: string; costo: number }> = {
  cercana_sjl: { label: 'Cercana a SJL', costo: 15 },
  media: { label: 'Zona media', costo: 20 },
  lejana: { label: 'Zona lejana', costo: 25 },
};

interface ReglaDescuento {
  id: number;
  nombre: string;
  cantidad_min: number | null;
  monto_min_compra: number | null;
  tipo_beneficio: string;
  valor_descuento: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean | null;
  tipo_conteo: string | null;
}

export interface ResumenCotizacion {
  subtotal: number;
  total_unidades: number;
  modelos_distintos: number;
  descuento_pct: number;
  descuento_monto: number;
  base_igv: number;
  igv: number;
  costo_envio: number;
  total: number;
  descripcion_descuento: string;
  descripcion_envio: string;
  es_cliente_nuevo: boolean;
}

// ── Tipo del contexto — añadimos notificaciones ──────────────────
interface PortalCtx {
  cliente: ClientePortal | null;
  loading: boolean;
  items: ItemCotizacion[];
  resumen: ResumenCotizacion;
  zonaEnvio: ZonaEnvio;
  costosEnvio: CostoEnvioDb[];
  actualizarZonaEnvio: (zona: ZonaEnvio) => void;
  agregarAlBorrador: (item: any) => void;
  actualizarCantidad: (variante_id: number, cantidad: number) => void;
  eliminarDelBorrador: (variante_id: number) => void;
  limpiarBorrador: () => void;
  actualizarItem: (params: {
    variante_id: number;
    nueva_variante_id?: number;
    talla?: string;
    color?: string;
    cantidad?: number;
  }) => void;
  stats: { cotizaciones_activas: number; ordenes_activas: number; despachos_en_ruta: number };
  actualizarCliente: (updates: Partial<ClientePortal>) => void;
  // ── Notificaciones (instancia única, sin duplicados) ──
  notificaciones: Notificacion[];
  unreadCount: number;
  loadingNotifs: boolean;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetchNotifs: () => Promise<void>;
}

// ── Constantes ───────────────────────────────────────────────────
export const MOQ_MINIMO = 400;
export const MAX_UNIDADES = 2000;
const IGV = 0.18;
const TIPO_CLIENTE_NUEVO = 'nuevo';

// ── Lógica de negocio ────────────────────────────────────────────
function resolverDescuento(
  items: ItemCotizacion[],
  reglas: ReglaDescuento[],
  esClienteNuevo: boolean,
): { pct: number; descripcion: string } {
  if (items.length === 0) return { pct: 0, descripcion: 'Sin descuento' };

  const ahora = new Date();
  const reglasActivas = reglas.filter(r =>
    r.activo &&
    new Date(r.fecha_inicio) <= ahora &&
    new Date(r.fecha_fin) >= ahora,
  );

  if (esClienteNuevo) {
    const reglaCliente = reglasActivas.find(r =>
      r.tipo_conteo === 'modelos_distintos' &&
      r.cantidad_min !== null &&
      r.cantidad_min <= 1 &&
      r.valor_descuento === 20,
    );
    if (reglaCliente) return { pct: 20, descripcion: `${reglaCliente.nombre} (20%)` };
  }

  const modelos = items.length;
  const reglasEscala = reglasActivas
    .filter(r => r.tipo_conteo === 'modelos_distintos' && (r.cantidad_min ?? 0) > 1)
    .sort((a, b) => (b.cantidad_min ?? 0) - (a.cantidad_min ?? 0));

  const reglaAplicable = reglasEscala.find(r => modelos >= (r.cantidad_min ?? 0));

  if (reglaAplicable) {
    const pct = reglaAplicable.valor_descuento;
    return { pct, descripcion: `${reglaAplicable.nombre} (${pct}%) — ${modelos} modelos` };
  }

  return { pct: 0, descripcion: 'Sin descuento por volumen' };
}

function calcularResumen(
  items: ItemCotizacion[],
  zonaEnvio: ZonaEnvio,
  reglas: ReglaDescuento[],
  esClienteNuevo: boolean,
): ResumenCotizacion {
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const total_unidades = items.reduce((s, i) => s + i.cantidad, 0);
  const modelos_distintos = items.length;

  const { pct: descuento_pct, descripcion: descripcion_descuento } =
    resolverDescuento(items, reglas, esClienteNuevo);

  const descuento_monto = subtotal * (descuento_pct / 100);
  const base_igv = subtotal - descuento_monto;
  const igv = base_igv * IGV;
  const costo_envio = items.length > 0 ? (ZONAS_ENVIO[zonaEnvio]?.costo ?? 0) : 0;

  return {
    subtotal,
    total_unidades,
    modelos_distintos,
    descuento_pct,
    descuento_monto,
    base_igv,
    igv,
    costo_envio,
    total: base_igv + igv + costo_envio,
    descripcion_descuento,
    descripcion_envio: ZONAS_ENVIO[zonaEnvio].label,
    es_cliente_nuevo: esClienteNuevo,
  };
}

// ── Context ──────────────────────────────────────────────────────
const PortalContext = createContext<PortalCtx | null>(null);

export function PortalProvider({ children }: { children: ReactNode }) {
  const [cliente, setCliente] = useState<ClientePortal | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ItemCotizacion[]>([]);
  const [zonaEnvio, setZonaEnvio] = useState<ZonaEnvio>('cercana_sjl');
  const [reglas, setReglas] = useState<ReglaDescuento[]>([]);
  const [stats, setStats] = useState({
    cotizaciones_activas: 0, ordenes_activas: 0, despachos_en_ruta: 0,
  });
  const [costosEnvio, setCostosEnvio] = useState<CostoEnvioDb[]>([]);

  // ── Estado de notificaciones (única fuente de verdad) ────────
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Ref estable para que el canal realtime nunca recree dependencias
  const fetchNotifsRef = useRef<() => Promise<void>>(async () => {});

  // ── Init: datos del cliente ──────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { setLoading(false); return; }

      try {
        const { data: reglasData } = await supabase.from('reglas_descuento').select('*').eq('activo', true);
        if (reglasData) setReglas(reglasData);

        const { data: usuarioData } = await supabase.from('usuarios').select('id').eq('auth_id', user.id).maybeSingle();
        if (!usuarioData) { setLoading(false); return; }

        const { data: perfilCompleto } = await supabase
          .from('usuarios')
          .select(`id, cliente_datos:clientes!clientes_usuario_id_fkey (*)`)
          .eq('id', usuarioData.id)
          .single();

        const datosCliente = Array.isArray(perfilCompleto?.cliente_datos)
          ? perfilCompleto?.cliente_datos[0]
          : perfilCompleto?.cliente_datos;

        if (datosCliente) {
          setCliente({
            id: datosCliente.id,
            usuario_id: usuarioData.id,
            ruc: Number(datosCliente.ruc),
            razon_social: datosCliente.razon_social || 'Sin Razón Social',
            direccion: datosCliente.direccion_fiscal || 'Sin Dirección',
            email: datosCliente.email,
            telefono: datosCliente.telefono ? Number(datosCliente.telefono.replace(/\D/g, '')) : null,
            tipo_cliente: datosCliente.tipo_cliente || 'corporativo',
            nombre_comercial: datosCliente.nombre_comercial || 'Sin Nombre Comercial',
          });

          const [cotRes, ordRes, dspRes, costosRes] = await Promise.all([
            supabase.from('cotizaciones').select('id', { count: 'exact', head: true })
              .eq('cliente_id', datosCliente.id).in('estado', ['borrador', 'enviada', 'aprobada']),
            supabase.from('pedidos').select('id', { count: 'exact', head: true })
              .eq('cliente_id', datosCliente.id).not('estado', 'in', '(finalizado,cancelado)'),
            supabase.from('despachos').select('id', { count: 'exact', head: true }).eq('estado', 'en_ruta'),
            supabase.from('costo_envio').select('*').eq('activo', true).order('id'),
          ]);

          setStats({
            cotizaciones_activas: cotRes.count ?? 0,
            ordenes_activas: ordRes.count ?? 0,
            despachos_en_ruta: dspRes.count ?? 0,
          });

          if (costosRes.data) {
            const mapping: Record<string, ZonaEnvio> = {
              'cercana_sjl': 'cercana_sjl', 'Cercana a SJL': 'cercana_sjl',
              'media': 'media', 'Zona media': 'media',
              'lejana': 'lejana', 'Zona lejana': 'lejana',
            };
            setCostosEnvio(costosRes.data.map(c => ({
              id: c.id,
              zona: mapping[c.zona] || 'cercana_sjl',
              costo: Number(c.costo),
              activo: c.activo,
            })));
          }
        }
      } catch (err) {
        console.error('Error init Portal:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ── userId estable para notificaciones ───────────────────────
  const userId = cliente?.usuario_id;

  // ── Fetch notificaciones ─────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoadingNotifs(true);
    try {
      const res = await fetch(`/api/admin/notificaciones?usuario_id=${userId}`);
      if (!res.ok) return;
      const response = await res.json();
      const raw: any[] = Array.isArray(response.data) ? response.data : [];
      const normalized: Notificacion[] = raw.map((n) => ({
        ...n,
        id: Number(n.id),
        leido_at: n.leido_at ? new Date(n.leido_at) : null,
      }));
      setNotificaciones(normalized);
      setUnreadCount(response.kpis?.sinLeer ?? normalized.filter((n) => !n.leido).length);
    } catch (err) {
      console.error('Error fetching notificaciones:', err);
    } finally {
      setLoadingNotifs(false);
    }
  }, [userId]);

  // Mantener ref siempre actualizada sin re-crear el canal
  useEffect(() => {
    fetchNotifsRef.current = fetchNotifications;
  }, [fetchNotifications]);

  // Polling + fetch inicial
  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45_000);
    return () => clearInterval(interval);
  }, [fetchNotifications, userId]);

  // ── Canal Realtime — UNA sola instancia en todo el portal ────
  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabaseBrowserClient();
    const canalName = `notif_portal_${userId}`;

    const canal = supabase
      .channel(canalName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `usuario_id=eq.${userId}`,
        },
        () => {
          // Llama via ref — no genera dependencia en este efecto
          fetchNotifsRef.current();
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn(`[Portal] Error canal realtime ${canalName}`);
        }
      });

    return () => {
      supabase.removeChannel(canal);
    };
  }, [userId]); // ✅ Solo userId — canal se crea una vez por sesión

  // ── Acciones de notificaciones ───────────────────────────────
  const markAsRead = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/admin/notificaciones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('No se pudo actualizar');
      setNotificaciones(prev =>
        prev.map(n => n.id === id ? { ...n, leido: true, leido_at: new Date() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error markAsRead:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId || unreadCount === 0) return;
    try {
      const res = await fetch('/api/admin/notificaciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: userId }),
      });
      if (!res.ok) throw new Error('Error al actualizar lote masivo');
      setNotificaciones(prev =>
        prev.map(n => !n.leido ? { ...n, leido: true, leido_at: new Date() } : n)
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error markAllAsRead:', err);
    }
  }, [userId, unreadCount]);

  // ── Lógica cotización ────────────────────────────────────────
  const esClienteNuevo = cliente?.tipo_cliente === TIPO_CLIENTE_NUEVO;

  const resumen = useMemo(
    () => calcularResumen(items, zonaEnvio, reglas, esClienteNuevo),
    [items, zonaEnvio, reglas, esClienteNuevo]
  );

  const actualizarItem = useCallback(({ variante_id, nueva_variante_id, talla, color, cantidad }: any) => {
    setItems(prev => prev.map(item => {
      if (item.variante_id !== variante_id) return item;
      const updates: any = {};
      if (nueva_variante_id !== undefined) updates.variante_id = nueva_variante_id;
      if (talla !== undefined) updates.talla = talla;
      if (color !== undefined) updates.color = color;
      if (cantidad !== undefined) {
        const cant = Math.min(MAX_UNIDADES, Math.max(1, cantidad));
        updates.cantidad = cant;
        updates.subtotal = cant * item.precio_unitario;
      }
      return { ...item, ...updates };
    }));
  }, []);

  const agregarAlBorrador = useCallback((nuevoItem: any) => {
    setItems((prev: ItemCotizacion[]) => {
      const idx = prev.findIndex(i => i.producto_id === nuevoItem.id);
      if (idx >= 0) {
        return prev.map((i, n) => n === idx
          ? {
              ...i,
              cantidad: Math.min(MAX_UNIDADES, i.cantidad + (nuevoItem.cantidad || 1)),
              subtotal: Math.min(MAX_UNIDADES, i.cantidad + (nuevoItem.cantidad || 1)) * i.precio_unitario,
            }
          : i
        );
      }
      return [...prev, {
        producto_id: nuevoItem.id,
        variante_id: nuevoItem.id,
        nombre: nuevoItem.nombre,
        sku: `SKU-${nuevoItem.id.toString().slice(0, 5)}`,
        imagen: nuevoItem.imagen || nuevoItem.imagen_url,
        precio_unitario: nuevoItem.precio || nuevoItem.precio_base,
        cantidad: nuevoItem.cantidad || 1,
        talla: 'M',
        color: 'Estándar',
        subtotal: (nuevoItem.cantidad || 1) * (nuevoItem.precio || nuevoItem.precio_base),
        stock_disponible: 1000,
        colores_disponibles: nuevoItem.colores_disponibles || [],
        tallas_disponibles: nuevoItem.tallas_disponibles || [],
        variantes: nuevoItem.variantes || [],
      }];
    });
  }, []);

  const actualizarCantidad = useCallback((variante_id: number, cantidad: number) => {
    setItems(prev => prev.map(i => {
      if (i.variante_id !== variante_id) return i;
      const cant = Math.min(MAX_UNIDADES, Math.max(1, cantidad));
      return { ...i, cantidad: cant, subtotal: cant * i.precio_unitario };
    }));
  }, []);

  const eliminarDelBorrador = useCallback((vid: number) =>
    setItems(prev => prev.filter(i => i.variante_id !== vid)), []);

  const limpiarBorrador = useCallback(() => setItems([]), []);

  const actualizarZonaEnvio = useCallback((zona: ZonaEnvio) => setZonaEnvio(zona), []);

  const actualizarCliente = useCallback((updates: Partial<ClientePortal>) => {
    setCliente((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  return (
    <PortalContext.Provider value={{
      cliente, loading, items, resumen, zonaEnvio, costosEnvio,
      actualizarZonaEnvio, stats, agregarAlBorrador,
      actualizarCantidad, actualizarItem, eliminarDelBorrador, limpiarBorrador,
      actualizarCliente,
      // ── Notificaciones ──
      notificaciones,
      unreadCount,
      loadingNotifs,
      markAsRead,
      markAllAsRead,
      refetchNotifs: fetchNotifications,
    }}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal debe estar dentro de PortalProvider');
  return ctx;
}