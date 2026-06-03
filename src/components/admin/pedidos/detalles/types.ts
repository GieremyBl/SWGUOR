import { Clock, FileText, CheckCircle2, RefreshCw, Truck, XCircle } from 'lucide-react';
import type { ElementType } from 'react';

// ─── Tipos de datos ───────────────────────────────────────────────────────────

export interface TallerOption {
  id:           string;
  nombre:       string;
  especialidad: string | null;
  contacto:     string | null;
  email:        string | null;
}

export interface PedidoItem {
  id:               string;
  cantidad:         number;
  precio_unitario:  number | null;  // puede no existir como columna directa
  subtotal:         number | null;  // ídem
  notas:            string | null;
  especificaciones: Record<string, any> | null;  // ← agregar esto
  productos: {
    id:     string;
    nombre: string;
    sku:    string | null;
    imagen: string | null;
  } | null;
  variantes_producto: {
    id:    string;
    color: string | null;
    talla: string | null;
    sku:   string | null;
  } | null;
}

export interface SeguimientoPedido {
  id:         string;
  estado:     string;
  notas:      string | null;
  created_at: string | null;
  created_by: string | null;
}

export interface DetallePedidoData {
  id:                 string;
  estado:             string;
  prioridad:          string;
  cotizacion_id?:     string | null;
  notas_cliente:      string | null;
  notas_pedido:       string | null;
  created_at:         string | null;
  updated_at:         string | null;
  subtotal:           number;
  igv:                number;
  total:              number;
  monto_descuento:    number;
  costo_envio:        number;
  moneda:             string;
  metodo_pago:        string | null;
  direccion_despacho: string | null;
  monto_pagado:       number;
  saldo_pendiente:    number;
  total_unidades:     number;
  moq_aplicado:       number;
  clientes: {
    id:               string;
    ruc:              string | null;
    razon_social:     string;
    nombre_comercial: string | null;
    telefono:         string | null;
    email:            string | null;
    tipo_cliente:     string | null;
  } | null;
  cotizacion?: {
    id:     string;
    numero: string;
  } | null;
  pedido_items:       PedidoItem[];
  seguimiento_pedido: SeguimientoPedido[];
}

// ─── Constantes de UI ─────────────────────────────────────────────────────────

export type TabId = 'items' | 'seguimiento' | 'pagos';

export interface EstadoConfig {
  label: string;
  color: string;
  icon:  ElementType;
}

export const ESTADO_CONFIG: Record<string, EstadoConfig> = {
  pendiente:           { label: 'Pendiente',            color: 'bg-amber-50 text-amber-700 border-amber-200',      icon: Clock        },
  pagado:              { label: 'Pagado',               color: 'bg-green-50 text-green-700 border-green-200',      icon: CheckCircle2 },
  cotizado:            { label: 'Cotizado',             color: 'bg-blue-50 text-blue-700 border-blue-200',         icon: FileText     },
  aprobado:            { label: 'Aprobado',             color: 'bg-violet-50 text-violet-700 border-violet-200',   icon: CheckCircle2 },
  en_produccion:       { label: 'En Producción',        color: 'bg-indigo-50 text-indigo-700 border-indigo-200',   icon: RefreshCw    },
  listo_para_despacho: { label: 'Listo para Despacho',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200',icon: Truck        },
  entregado:           { label: 'Entregado',            color: 'bg-stone-100 text-stone-600 border-stone-200',     icon: CheckCircle2 },
  cancelado:           { label: 'Cancelado',            color: 'bg-red-50 text-red-700 border-red-200',            icon: XCircle      },
};

export const PRIORIDAD_CONFIG: Record<string, { label: string; color: string }> = {
  baja:    { label: 'Baja',    color: 'bg-stone-100 text-stone-500 border-stone-200' },
  normal:  { label: 'Normal',  color: 'bg-blue-50 text-blue-600 border-blue-200'     },
  alta:    { label: 'Alta',    color: 'bg-red-50 text-red-600 border-red-200'        },
  urgente: { label: 'Urgente', color: 'bg-rose-600 text-white border-rose-700'       },
};

export const METODO_PAGO_LABELS: Record<string, string> = {
  transferencia_bancaria: 'Transferencia',
  deposito_bancario:      'Depósito',
  yape:                   'Yape',
  plin:                   'Plin',
  efectivo:               'Efectivo',
  credito_30:             'Crédito 30d',
  credito_60:             'Crédito 60d',
};

export const ETAPAS_PROGRESO = [
  'pendiente',
  'cotizado',
  'aprobado',
  'en_produccion',
  'listo_para_despacho',
  'entregado',
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const fmt = (n: number, moneda = 'PEN') =>
  new Intl.NumberFormat('es-PE', {
    style:                 'currency',
    currency:              moneda,
    minimumFractionDigits: 2,
  }).format(n);

export const fmtDate = (s: string | null) =>
  s
    ? new Date(s).toLocaleDateString('es-PE', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—';