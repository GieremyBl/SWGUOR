'use client';

import {
  createContext, useContext, useEffect, useState,
  useCallback, useMemo, ReactNode,
} from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';

// ── Tipos ────────────────────────────────────────────────────────
export interface ClientePortal {
  id: number;
  ruc: number;
  razon_social: string;
  direccion?: string;
  email: string | null;
  telefono: number | null;
  tipo: string;
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
}

export interface ResumenCotizacion {
  subtotal: number;
  total_unidades: number;
  descuento_pct: number;
  descuento_monto: number;
  base_igv: number;
  igv: number;
  total: number;
  descripcion_descuento: string;
}

interface PortalCtx {
  cliente: ClientePortal | null;
  loading: boolean;
  items: ItemCotizacion[];
  resumen: ResumenCotizacion;
  agregarAlBorrador: (item: any) => void;
  actualizarCantidad: (variante_id: number, cantidad: number) => void;
  eliminarDelBorrador: (variante_id: number) => void;
  limpiarBorrador: () => void;
  stats: { cotizaciones_activas: number; ordenes_activas: number; despachos_en_ruta: number };
}

// ── Reglas de negocio ────────────────────────────────────────────
export const MOQ_MINIMO = 400;
const IGV = 0.18;
const ESCALAS = [
  { min: 2000, pct: 15, label: '≥ 2,000 uds' },
  { min: 1000, pct: 10, label: '≥ 1,000 uds' },
  { min: 500,  pct: 5,  label: '≥ 500 uds'   },
];

function calcularResumen(items: ItemCotizacion[]): ResumenCotizacion {
  const subtotal       = items.reduce((s, i) => s + i.subtotal, 0);
  const total_unidades = items.reduce((s, i) => s + i.cantidad, 0);
  const escala         = ESCALAS.find(e => total_unidades >= e.min);
  const descuento_pct  = escala?.pct ?? 0;
  const descuento_monto = subtotal * (descuento_pct / 100);
  const base_igv       = subtotal - descuento_monto;
  const igv            = base_igv * IGV;
  return {
    subtotal, total_unidades, descuento_pct, descuento_monto,
    base_igv, igv, total: base_igv + igv,
    descripcion_descuento: escala
      ? `Descuento escala ${escala.pct}% (${escala.label})`
      : 'Sin descuento por volumen',
  };
}

const PortalContext = createContext<PortalCtx | null>(null);

export function PortalProvider({ children }: { children: ReactNode }) {
  const [cliente, setCliente] = useState<ClientePortal | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ItemCotizacion[]>([]);
  const [stats, setStats] = useState({
    cotizaciones_activas: 0, ordenes_activas: 0, despachos_en_ruta: 0,
  });

  useEffect(() => {
    const init = async () => {
      const supabase = getSupabaseBrowserClient();
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setLoading(false);
        return;
      }

      try {
        // 1. Obtener el ID del usuario
        const { data: usuarioData, error: userError } = await supabase
          .from('usuarios')
          .select('id')
          .eq('auth_id', user.id)
          .maybeSingle();

        if (userError || !usuarioData) {
          setLoading(false);
          return;
        }

        // 2. Obtener los datos del cliente usando el JOIN explícito que arreglamos
        const { data: perfilCompleto, error: joinError } = await supabase
          .from('usuarios')
          .select(`
            id,
            cliente_datos:clientes!clientes_usuario_id_fkey (*)
          `)
          .eq('id', usuarioData.id)
          .single();

        if (joinError) console.error("Error join:", joinError.message);

        // 3. Extraer el objeto cliente de forma segura
        const datosCliente = Array.isArray(perfilCompleto?.cliente_datos) 
          ? perfilCompleto?.cliente_datos[0] 
          : perfilCompleto?.cliente_datos;

        if (datosCliente) {
          setCliente(datosCliente as ClientePortal);
          
          // 4. CARGAR ESTADÍSTICAS (Aquí estaba el error 400 por variable inexistente)
          try {
            const [cotRes, ordRes, dspRes] = await Promise.all([
              supabase.from('cotizaciones').select('id', { count: 'exact', head: true })
                .eq('cliente_id', datosCliente.id).in('estado', ['borrador', 'enviada', 'aprobada']),
              supabase.from('ordenes').select('id', { count: 'exact', head: true })
                .eq('cliente_id', datosCliente.id).not('estado', 'in', '(finalizado,cancelado)'),
              supabase.from('despachos').select('id', { count: 'exact', head: true })
                .eq('estado', 'en_ruta'),
            ]);

            setStats({
              cotizaciones_activas: cotRes.count ?? 0,
              ordenes_activas: ordRes.count ?? 0,
              despachos_en_ruta: dspRes.count ?? 0,
            });
          } catch (e) {
            console.warn("Error en estadísticas:", e);
          }
        }
      } catch (err) {
        console.error("Falla general:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const resumen = useMemo(() => calcularResumen(items), [items]);

  const agregarAlBorrador = useCallback((nuevoItem: any) => {
    setItems((prev: ItemCotizacion[]) => { 
      const idx = prev.findIndex(i => i.producto_id === nuevoItem.id);
      
      if (idx >= 0) {
        return prev.map((i, n) => n === idx
          ? { 
              ...i, 
              cantidad: i.cantidad + (nuevoItem.cantidad || 1), 
              subtotal: (i.cantidad + (nuevoItem.cantidad || 1)) * i.precio_unitario 
            }
          : i
        );
      }

      const itemFormateado: ItemCotizacion = {
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
        stock_disponible: 1000
      };

      return [...prev, itemFormateado];
    });
  }, []);

  const actualizarCantidad = useCallback((variante_id: number, cantidad: number) => {
    setItems(prev => prev.map(i =>
      i.variante_id === variante_id
        ? { ...i, cantidad: Math.max(1, cantidad), subtotal: Math.max(1, cantidad) * i.precio_unitario }
        : i
    ));
  }, []);

  const eliminarDelBorrador = useCallback((vid: number) =>
    setItems(prev => prev.filter(i => i.variante_id !== vid)), []);
  const limpiarBorrador = useCallback(() => setItems([]), []);

  return (
    <PortalContext.Provider value={{
      cliente, loading, items, resumen, stats,
      agregarAlBorrador,
      actualizarCantidad,
      eliminarDelBorrador,
      limpiarBorrador,
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