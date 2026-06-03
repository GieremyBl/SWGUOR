'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag, ArrowUpRight, Calendar,
  PackageSearch, RefreshCw, ChevronRight,
  Layers, Clock, CheckCircle2, XCircle, Truck,
  Plus, CreditCard, X, CheckCircle, AlertCircle,
  Receipt, Banknote, Smartphone, FileText,
} from 'lucide-react';

import { usePortal } from '@/lib/hooks/usePortal';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { EstadoBadge } from '@/components/portal/EstadoBadge';
import { formatCurrency } from '@/lib/helpers/format-helpers';
import { cn } from '@/lib/utils';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type EstadoPedido =
  | 'pendiente'
  | 'en_produccion'
  | 'listo_para_despacho'
  | 'entregado'
  | 'cancelado';

type EstadoPago = 'pendiente' | 'verificado' | 'rechazado';

interface Pedido {
  id: number;
  total: number;
  estado: EstadoPedido;
  estado_pago: EstadoPago;
  created_at: string;
  total_unidades: number;
  moneda: string;
  fecha_entrega_est?: string | null;
  notas_cliente?: string | null;
  clientes?: unknown;
  seguimiento_pedido?: unknown;
}

interface PedidoConDetalles extends Pedido {
  direccion_envio: string | null;
  notas: string | null;
  items: unknown[];
}

interface CotizacionHistorial {
  id: string;
  numero: string;
  created_at: string;
  costo_envio: number;
  total: number;
  estado: string;
}

interface PedidoFilaDB {
  id: string;
  total: number;
  estado: string;
  created_at: string;
  total_unidades: number;
  moneda: string;
  monto_pagado: number;
  saldo_pendiente: number;
}

// ─── Metadatos visuales de estado ────────────────────────────────────────────

const ESTADO_META: Record<EstadoPedido, {
  icon: React.ElementType;
  bg: string;
  text: string;
  border: string;
  label: string;
}> = {
  pendiente: { icon: Clock, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', label: 'Pendiente' },
  en_produccion: { icon: Layers, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', label: 'En producción' },
  listo_para_despacho: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'Listo para despacho' },
  entregado: { icon: Truck, bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100', label: 'Entregado' },
  cancelado: { icon: XCircle, bg: 'bg-rose-50', text: 'text-rose-500', border: 'border-rose-100', label: 'Cancelado' },
};

const PAGO_META: Record<EstadoPago, { label: string; dot: string; bg: string; text: string }> = {
  pendiente: { label: 'Pago pendiente', dot: 'bg-amber-400', bg: 'bg-amber-50', text: 'text-amber-600' },
  verificado: { label: 'Pago verificado', dot: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  rechazado: { label: 'Pago rechazado', dot: 'bg-rose-400', bg: 'bg-rose-50', text: 'text-rose-500' },
};

const METODOS_PAGO = [
  {
    id: 'yape',
    nombre: 'Yape',
    descripcion: 'Pago inmediato con código QR',
    imagen: '/images/yape.png',
    icon: Smartphone,
    color: '#6C3CE1',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    tag: 'Más usado',
  },
  {
    id: 'tarjeta',
    nombre: 'Tarjeta de Débito / Crédito',
    descripcion: 'Visa, Mastercard, American Express',
    imagen: '/images/visa.png',
    icon: CreditCard,
    color: '#1A56DB',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    tag: null,
  },
  {
    id: 'transferencia',
    nombre: 'Transferencia Bancaria',
    descripcion: 'BCP, Interbank, BBVA, Scotiabank',
    imagen: '/images/transferencia.png',
    icon: Banknote,
    color: '#057A55',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    tag: null,
  },
];

const PAISES_SUDAMERICA = [
  'Perú', 'Argentina', 'Bolivia', 'Brasil', 'Chile',
  'Colombia', 'Ecuador', 'Guyana', 'Paraguay', 'Surinam',
  'Uruguay', 'Venezuela',
];

const PASOS = [
  { id: 'entrega', numero: 1, label: 'Entrega' },
  { id: 'metodo', numero: 2, label: 'Método' },
  { id: 'datos_pago', numero: 3, label: 'Pago' },
  { id: 'confirmacion', numero: 4, label: 'Confirmación' },
];

// ─── Animaciones globales ─────────────────────────────────────────────────────

const GLOBAL_STYLES = `
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.92) translateY(12px); }
  to   { opacity: 1; transform: scale(1)    translateY(0);     }
}
@keyframes popIn {
  from { opacity: 0; transform: scale(0.5); }
  to   { opacity: 1; transform: scale(1);   }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(100%); }
  to   { opacity: 1; transform: translateX(0);    }
}
`;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Pulse({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-[#e4c28a]/15', className)} />;
}

function PedidoSkeleton() {
  return (
    <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-[#e4c28a]/20 animate-pulse">
      <Pulse className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Pulse className="h-3 w-28" />
        <Pulse className="h-2.5 w-40" />
      </div>
      <Pulse className="hidden sm:block h-4 w-20" />
      <Pulse className="hidden md:block h-6 w-24 rounded-full" />
      <Pulse className="w-8 h-8 rounded-lg flex-shrink-0" />
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between p-5 rounded-2xl border bg-white',
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
      )}
      style={{ borderColor: `${accent}30` }}
    >
      <p className="text-4xl font-black tabular-nums leading-none mb-2" style={{ color: accent }}>
        {value}
      </p>
      <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: `${accent}80` }}>
        {label}
      </p>
    </div>
  );
}

// ─── Modal Detalle ────────────────────────────────────────────────────────────

function ModalDetalle({
  pedido,
  onClose,
  onPagar,
}: {
  pedido: Pedido;
  onClose: () => void;
  onPagar: () => void;
}) {
  const estado = ESTADO_META[pedido.estado] ?? ESTADO_META.pendiente;
  const pago = PAGO_META[pedido.estado_pago] ?? PAGO_META.pendiente;
  const Icon = estado.icon;
  const isPending = pedido.estado_pago === 'pendiente';

  const fecha = new Date(pedido.created_at).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const total = Number(pedido.total ?? 0).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden"
        style={{ animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#231e1d] to-[#3d3128] p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={14} />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', estado.bg, estado.border)}>
              <Icon size={16} className={estado.text} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#e4c28a]/60 uppercase tracking-widest">Detalle del pedido</p>
              <p className="font-black text-lg text-[#e4c28a]">Pedido #{pedido.id}</p>
            </div>
          </div>

          <div className="text-4xl font-black text-white mb-1">
            {pedido.moneda ?? 'PEN'} {total}
          </div>
          <p className="text-sm text-white/50">{pedido.total_unidades} unidades · {fecha}</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Estado de producción</p>
              <div className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold', estado.bg, estado.text)}>
                <Icon size={11} />
                {estado.label}
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Estado de pago</p>
              <div className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold', pago.bg, pago.text)}>
                <span className={cn('w-1.5 h-1.5 rounded-full', pago.dot)} />
                {pago.label}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Número de pedido</span>
                <span className="font-bold text-[#b5854b]">#{pedido.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha de creación</span>
                <span className="font-semibold text-slate-700">{fecha}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unidades</span>
                <span className="font-semibold text-slate-700">{pedido.total_unidades.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Moneda</span>
                <span className="font-semibold text-slate-700">{pedido.moneda ?? 'PEN'}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3">
                <span className="font-bold text-slate-700">Total</span>
                <span className="font-black text-[#231e1d]">{pedido.moneda ?? 'PEN'} {total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-colors"
          >
            Cerrar
          </button>

          {isPending && (
            <button
              onClick={onPagar}
              className="flex-1 py-3 rounded-2xl bg-[#231e1d] hover:bg-[#b5854b] text-[#e4c28a] text-sm font-bold transition-all flex items-center justify-center gap-2"
            >
              <CreditCard size={14} />
              Pagar ahora
            </button>
          )}

          <Link
            href={`/portal/pedidos/${pedido.id}`}
            className="px-4 py-3 rounded-2xl bg-[#e4c28a]/20 hover:bg-[#e4c28a]/30 text-[#b5854b] text-sm font-bold transition-colors flex items-center gap-1"
          >
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Pasarela de Pagos ──────────────────────────────────────────────────

type PasosPago = 'entrega' | 'metodo' | 'datos_pago' | 'procesando' | 'confirmacion' | 'error';

function ModalPago({
  pedido,
  onClose,
}: {
  pedido: Pedido;
  onClose: () => void;
}) {
  const [paso, setPaso] = useState<PasosPago>('entrega');
  const [metodo, setMetodo] = useState('');

  const [datosEntrega, setDatosEntrega] = useState({
    pais: 'Perú',
    departamento: '',
    distrito: '',
    direccion: '',
    referencia: '',
  });

  const [datosTarjeta, setDatosTarjeta] = useState({
    numero: '',
    nombre: '',
    vencimiento: '',
    cvv: '',
  });

  const [datosTransferencia, setDatosTransferencia] = useState({
    banco: '',
    numeroOperacion: '',
    titular: '',
  });

  const pasoActual = PASOS.findIndex((p) => p.id === paso);

  const total = Number(pedido.total ?? 0).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const metodoSeleccionado = METODOS_PAGO.find((m) => m.id === metodo);

  const handleConfirmar = async () => {
    try {
      setPaso('procesando');

      const response = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total: Number(pedido.total) }),
      });

      const data = await response.json();

      setPaso('confirmacion');
    } catch (error) {
      console.error(error);
      setPaso('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="w-full max-w-5xl h-screen bg-white overflow-y-auto">

        {/* Sticky header con stepper */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-8 py-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Logo" width={42} height={42} className="object-contain" />
              <div>
                <p className="text-lg font-black text-[#231e1d] leading-none">SWGUOR</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#b5854b] font-bold mt-1">Pasarela de pago</p>
              </div>
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-between">
            {PASOS.map((p, index) => {
              const activo = index <= pasoActual;
              return (
                <div key={p.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center relative z-10">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all',
                      activo ? 'bg-[#231e1d] text-[#e4c28a]' : 'bg-slate-100 text-slate-400',
                    )}>
                      {p.numero}
                    </div>
                    <span className={cn(
                      'text-[10px] font-bold mt-2 uppercase tracking-wider',
                      activo ? 'text-[#231e1d]' : 'text-slate-400',
                    )}>
                      {p.label}
                    </span>
                  </div>
                  {index < PASOS.length - 1 && (
                    <div className="flex-1 h-[2px] mx-3 bg-slate-200 relative top-[-10px]">
                      <div className={cn('h-full transition-all', index < pasoActual ? 'bg-[#231e1d]' : 'bg-slate-200')} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── PASO 1: ENTREGA ────────────────────────────────────────────── */}
        {paso === 'entrega' && (
          <div className="p-8 space-y-5">
            <div>
              <p className="text-xl font-black text-[#231e1d]">Datos de entrega</p>
              <p className="text-sm text-slate-400 mt-1">Completa la información para el envío</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500">País</label>
              <select
                value={datosEntrega.pais}
                onChange={(e) => setDatosEntrega({ ...datosEntrega, pais: e.target.value })}
                className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-3 bg-white"
              >
                {PAISES_SUDAMERICA.map((pais) => (
                  <option key={pais} value={pais}>{pais}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500">Departamento</label>
                <input
                  type="text"
                  value={datosEntrega.departamento}
                  onChange={(e) => setDatosEntrega({ ...datosEntrega, departamento: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-3"
                  placeholder="Lima"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Distrito</label>
                <input
                  type="text"
                  value={datosEntrega.distrito}
                  onChange={(e) => setDatosEntrega({ ...datosEntrega, distrito: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-3"
                  placeholder="Miraflores"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500">Dirección</label>
              <input
                type="text"
                value={datosEntrega.direccion}
                onChange={(e) => setDatosEntrega({ ...datosEntrega, direccion: e.target.value })}
                className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-3"
                placeholder="Av. Ejemplo 123"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500">Referencia</label>
              <input
                type="text"
                value={datosEntrega.referencia}
                onChange={(e) => setDatosEntrega({ ...datosEntrega, referencia: e.target.value })}
                className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-3"
                placeholder="Frente al parque"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setPaso('metodo')}
                className="flex-1 py-3 rounded-2xl bg-[#231e1d] hover:bg-[#b5854b] text-[#e4c28a] text-sm font-bold transition-all"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 2: MÉTODO ────────────────────────────────────────────── */}
        {paso === 'metodo' && (
          <>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-[#231e1d]">Selecciona método</h2>
            </div>

            <div className="mx-6 mt-4 p-4 rounded-2xl bg-[#fff4e2] border border-[#e4c28a]/40 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#b5854b]/60 uppercase tracking-wider">Pedido #{pedido.id}</p>
                <p className="font-black text-[#231e1d] text-lg">{pedido.moneda ?? 'PEN'} {total}</p>
              </div>
              <Receipt size={20} className="text-[#b5854b]/40" />
            </div>

            <div className="p-6 grid grid-cols-2 gap-6">
              {METODOS_PAGO.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMetodo(m.id)}
                  className={cn(
                    'w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4 relative',
                    metodo === m.id
                      ? 'border-[#b5854b] bg-[#fff4e2] shadow-md shadow-[#b5854b]/10'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50',
                  )}
                >
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', m.bg)}>
                    <Image src={m.imagen} alt={m.nombre} width={32} height={32} className="object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#231e1d] text-sm">{m.nombre}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{m.descripcion}</p>
                  </div>
                  {m.tag && (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-[#b5854b] text-white px-2 py-1 rounded-full">
                      {m.tag}
                    </span>
                  )}
                  {metodo === m.id && (
                    <div className="w-5 h-5 rounded-full bg-[#b5854b] flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={12} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setPaso('entrega')}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition-colors"
              >
                Volver
              </button>
              <button
                disabled={!metodo}
                onClick={() => {
                  if (!metodo) { alert('Selecciona un método de pago'); return; }
                  setPaso('datos_pago');
                }}
                className="flex-1 py-3 rounded-2xl bg-[#231e1d] hover:bg-[#b5854b] text-[#e4c28a] text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CreditCard size={14} />
                Continuar
              </button>
            </div>
          </>
        )}

        {/* ── PASO 3: DATOS DE PAGO ────────────────────────────────────── */}
        {paso === 'datos_pago' && (
          <div className="p-6">
            {metodo === 'tarjeta' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500">Número de tarjeta</label>
                  <input
                    type="text"
                    value={datosTarjeta.numero}
                    onChange={(e) => setDatosTarjeta({ ...datosTarjeta, numero: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-3"
                    placeholder="0000 0000 0000 0000"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Nombre del titular</label>
                  <input
                    type="text"
                    value={datosTarjeta.nombre}
                    onChange={(e) => setDatosTarjeta({ ...datosTarjeta, nombre: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-3"
                    placeholder="Juan Pérez"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500">Vencimiento</label>
                    <input
                      type="text"
                      value={datosTarjeta.vencimiento}
                      onChange={(e) => setDatosTarjeta({ ...datosTarjeta, vencimiento: e.target.value })}
                      className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-3"
                      placeholder="MM/AA"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500">CVV</label>
                    <input
                      type="text"
                      value={datosTarjeta.cvv}
                      onChange={(e) => setDatosTarjeta({ ...datosTarjeta, cvv: e.target.value })}
                      className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-3"
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>
            )}

            {metodo === 'transferencia' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500">Banco</label>
                  <input
                    type="text"
                    value={datosTransferencia.banco}
                    onChange={(e) => setDatosTransferencia({ ...datosTransferencia, banco: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-3"
                    placeholder="BCP"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Número de operación</label>
                  <input
                    type="text"
                    value={datosTransferencia.numeroOperacion}
                    onChange={(e) => setDatosTransferencia({ ...datosTransferencia, numeroOperacion: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-3"
                    placeholder="123456789"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">Titular</label>
                  <input
                    type="text"
                    value={datosTransferencia.titular}
                    onChange={(e) => setDatosTransferencia({ ...datosTransferencia, titular: e.target.value })}
                    className="w-full mt-1 rounded-xl border border-slate-200 px-4 py-3"
                    placeholder="Juan Pérez"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setPaso('metodo')}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition-colors"
              >
                Volver
              </button>
              <button
                onClick={handleConfirmar}
                className="flex-1 py-3 rounded-2xl bg-[#231e1d] hover:bg-[#b5854b] text-[#e4c28a] text-sm font-bold transition-all"
              >
                Pagar ahora
              </button>
            </div>
          </div>
        )}

        {/* ── PROCESANDO ──────────────────────────────────────────────── */}
        {paso === 'procesando' && (
          <div className="p-12 flex flex-col items-center justify-center gap-5 text-center">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-[#e4c28a]/20" />
              <div
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#b5854b]"
                style={{ animation: 'spin 0.8s linear infinite' }}
              />
            </div>
            <div>
              <p className="font-black text-[#231e1d] text-lg">Procesando pago</p>
              <p className="text-sm text-slate-400 mt-1">Por favor espera un momento...</p>
            </div>
          </div>
        )}

        {/* ── CONFIRMACIÓN ────────────────────────────────────────────── */}
        {paso === 'confirmacion' && (
          <div className="p-12 flex flex-col items-center justify-center gap-5 text-center">
            <div
              className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center"
              style={{ animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}
            >
              <CheckCircle size={36} className="text-emerald-500" />
            </div>
            <div>
              <p className="font-black text-[#231e1d] text-xl">¡Pago registrado!</p>
              <p className="text-sm text-slate-400 mt-2">
                Tu pago con{' '}
                <strong className="text-[#b5854b]">{metodoSeleccionado?.nombre}</strong>{' '}
                ha sido registrado y está pendiente de verificación.
              </p>
            </div>
            <div className="w-full mt-2 p-4 rounded-2xl bg-[#fff4e2] border border-[#e4c28a]/40 text-left">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Pedido</span>
                <span className="font-bold text-[#b5854b]">#{pedido.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Monto</span>
                <span className="font-black text-[#231e1d]">{pedido.moneda ?? 'PEN'} {total}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-[#231e1d] hover:bg-[#b5854b] text-[#e4c28a] text-sm font-bold transition-all"
            >
              Listo
            </button>
          </div>
        )}

        {/* ── ERROR ───────────────────────────────────────────────────── */}
        {paso === 'error' && (
          <div className="p-12 flex flex-col items-center justify-center gap-5 text-center">
            <div className="w-20 h-20 rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center">
              <AlertCircle size={36} className="text-rose-500" />
            </div>
            <div>
              <p className="font-black text-[#231e1d] text-xl">Error al procesar</p>
              <p className="text-sm text-slate-400 mt-2">
                No se pudo procesar el pago. Por favor intenta nuevamente.
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setPaso('metodo')}
                className="flex-1 py-3 rounded-2xl bg-[#231e1d] hover:bg-[#b5854b] text-[#e4c28a] text-sm font-bold transition-all"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tarjeta de pedido ────────────────────────────────────────────────────────

function PedidoCard({
  pedido,
  index,
  onVerDetalle,
}: {
  pedido: Pedido;
  index: number;
  onVerDetalle: (p: Pedido) => void;
}) {
  const router = useRouter();
  const estado = ESTADO_META[pedido.estado] ?? ESTADO_META.pendiente;
  const pago = PAGO_META[pedido.estado_pago] ?? PAGO_META.pendiente;
  const Icon = estado.icon;
  const isPending = pedido.estado_pago === 'pendiente';

  const fecha = new Date(pedido.created_at).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  const total = Number(pedido.total ?? 0).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div
      className={cn(
        'group flex items-center gap-4 p-4 md:p-5 rounded-2xl border bg-white',
        'transition-all duration-200 hover:-translate-y-0.5',
        'hover:shadow-lg hover:shadow-[#b5854b]/8 hover:border-[#e4c28a]/50',
        'border-[#e4c28a]/20',
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
        'border transition-all duration-300',
        estado.bg, estado.border,
        'group-hover:scale-105',
      )}>
        <Icon size={16} className={estado.text} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-[#231e1d]">
          Pedido <span className="text-[#b5854b]">#{pedido.id}</span>
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <Calendar size={10} className="text-[#b5854b]/40 flex-shrink-0" />
          <span className="text-[10px] font-medium text-[#231e1d]/35 truncate">{fecha}</span>
          {pedido.total_unidades > 0 && (
            <span className="text-[10px] font-medium text-[#231e1d]/25">
              · {pedido.total_unidades.toLocaleString()} und
            </span>
          )}
        </div>
      </div>

      <div className="hidden sm:flex flex-col items-end flex-shrink-0">
        <p className="text-[9px] font-bold text-[#b5854b]/40 uppercase tracking-widest mb-0.5">{pedido.moneda ?? 'PEN'}</p>
        <p className="text-base font-black text-[#231e1d] tabular-nums">{total}</p>
      </div>

      <div className="hidden md:block flex-shrink-0">
        <EstadoBadge estado={pedido.estado} tipo="pedido" />
      </div>

      <div
        className={cn(
          'hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0 border',
          pago.bg,
        )}
        style={{ borderColor: `${pago.dot}30` }}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', pago.dot)} />
        <span className={cn('text-[10px] font-bold', pago.text)}>{pago.label}</span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {isPending && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/portal/pago/${pedido.id}?total=${pedido.total}&unidades=${pedido.total_unidades}`);
            }}
            className={cn(
              'hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl',
              'bg-[#231e1d] hover:bg-[#b5854b] text-[#e4c28a]',
              'text-[10px] font-black uppercase tracking-wide',
              'transition-all duration-200 hover:scale-105',
            )}
          >
            <CreditCard size={11} />
            Pagar
          </button>
        )}
        <button
          onClick={() => onVerDetalle(pedido)}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
            'bg-[#e4c28a]/15 text-[#b5854b]/40',
            'group-hover:bg-[#231e1d] group-hover:text-[#e4c28a]',
            'transition-all duration-200',
          )}
        >
          <ArrowUpRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function MisPedidosPage() {
  const { cliente, loading: authLoading } = usePortal() as { cliente: { id: string } | null; loading: boolean };
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cotizaciones, setCotizaciones] = useState<CotizacionHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pedidoDetalle, setPedidoDetalle] = useState<Pedido | null>(null);

  // Cotizaciones recientes: últimas 3
  const cotizacionesRecientes = useMemo(() => cotizaciones.slice(0, 3), [cotizaciones]);

  const fetchPedidos = useCallback(async () => {
    if (!cliente?.id) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();

      const { data, error } = await supabase
        .from('pedidos')
        .select('id, total, estado, created_at, total_unidades, moneda, monto_pagado, saldo_pendiente')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const filasFiltradas = (data as unknown as PedidoFilaDB[] | null) ?? [];

      const pedidosFormateados: Pedido[] = filasFiltradas.map((p) => {
        const estadoPagoCalculado: EstadoPago =
          Number(p.saldo_pendiente) <= 0 && Number(p.monto_pagado) > 0
            ? 'verificado'
            : 'pendiente';

        return {
          id: Number(p.id),
          total: Number(p.total),
          estado: (p.estado as EstadoPedido) || 'pendiente',
          estado_pago: estadoPagoCalculado,
          created_at: p.created_at,
          total_unidades: p.total_unidades || 0,
          moneda: p.moneda || 'PEN',
        };
      });

      setPedidos(pedidosFormateados);
    } catch (err: unknown) {
      console.error('Error al recopilar el historial:', err);
      setError('No se pudieron cargar los pedidos. Intenta nuevamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cliente?.id]);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  const kpisCalculados = useMemo(() => ({
    total: pedidos.length,
    activos: pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'en_produccion').length,
    listos: pedidos.filter(p => p.estado === 'listo_para_despacho').length,
    entregados: pedidos.filter(p => p.estado === 'entregado').length,
  }), [pedidos]);

  return (
    <>
      <style>{GLOBAL_STYLES}</style>

      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 text-white rounded-2xl shadow-lg bg-guor-gold shadow-guor-gold/30">
              <PackageSearch size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Mis Pedidos</h1>
              <p className="text-sm text-slate-500">
                {cliente ? 'Socio Corporativo GUOR' : 'Portal B2B'}
              </p>
            </div>
          </div>

          {/* Botón nueva solicitud */}
          <Link
            href="/portal/catalogo"
            className="h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer hover:opacity-90"
            style={{ backgroundColor: 'var(--guor-dark)' }}
          >
            <Plus size={14} style={{ color: 'var(--guor-gold)' }} />
            Nueva Solicitud
          </Link>
        </div>

        {/* KPIs */}
        {!loading && !error && pedidos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Total" value={kpisCalculados.total} accent="#b5854b" />
            <KpiCard label="Activos" value={kpisCalculados.activos} accent="#3b82f6" />
            <KpiCard label="Listos" value={kpisCalculados.listos} accent="#10b981" />
            <KpiCard label="Entregados" value={kpisCalculados.entregados} accent="#14b8a6" />
          </div>
        )}

        {/* Aviso pagos pendientes */}
        {!loading && !error && pedidos.some(p => p.estado_pago === 'pendiente') && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <CreditCard size={14} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-amber-700">
                Tienes {pedidos.filter(p => p.estado_pago === 'pendiente').length} pago(s) pendiente(s)
              </p>
              <p className="text-[10px] text-amber-500 mt-0.5">
                Usa el botón <strong>Pagar</strong> en cada pedido para completar tu pago.
              </p>
            </div>
          </div>
        )}

        {/* Historial de cotizaciones */}
        {!loading && !error && (
          <div className="bg-white border border-[#e4c28a]/25 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between border-b border-[#e4c28a]/15">
              <div>
                <h2 className="text-[11px] font-black text-[#231e1d] uppercase tracking-[0.18em]">
                  Historial de cotizaciones
                </h2>
                <p className="text-[10px] text-[#b5854b]/50 font-medium mt-0.5">
                  Guardadas automáticamente al enviar cotización
                </p>
              </div>
              <Link
                href="/portal/cotizaciones"
                className="group flex items-center gap-1 text-[11px] font-bold text-[#b5854b] hover:text-[#231e1d] transition-colors"
              >
                Ver todo
                <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>

            <div className="p-3">
              {cotizacionesRecientes.length > 0 ? (
                <div className="space-y-2">
                  {cotizacionesRecientes.map((cot: CotizacionHistorial) => (
                    <Link
                      key={cot.id}
                      href={`/portal/cotizaciones/${cot.id}`}
                      className="group flex items-center justify-between gap-3 p-4 rounded-2xl border border-[#e4c28a]/20 bg-white hover:bg-[#fff4e2]/40 hover:border-[#e4c28a]/40 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-[#e4c28a]/15 flex items-center justify-center flex-shrink-0">
                          <FileText size={16} className="text-[#b5854b]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-[#231e1d] truncate">{cot.numero}</p>
                          <p className="text-[10px] font-medium text-[#231e1d]/35 truncate">
                            {new Date(cot.created_at).toLocaleDateString('es-PE', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })} · Envío {formatCurrency(cot.costo_envio)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-[9px] font-bold text-[#b5854b]/40 uppercase tracking-widest">Total</p>
                          <p className="text-sm font-black text-[#231e1d] tabular-nums">{formatCurrency(cot.total)}</p>
                        </div>
                        <EstadoBadge estado={cot.estado} tipo="cotizacion" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#e4c28a]/10 flex items-center justify-center">
                    <FileText size={16} className="text-[#b5854b]/30" />
                  </div>
                  <p className="text-[10px] font-bold text-[#231e1d]/25 uppercase tracking-widest">
                    Sin cotizaciones aún
                  </p>
                  <p className="text-[11px] text-[#231e1d]/20 font-medium text-center">
                    Cuando envíes una cotización se guardará automáticamente aquí.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lista de pedidos */}
        {loading || authLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <PedidoSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#e4c28a]/15 flex items-center justify-center">
              <XCircle size={20} className="text-[#b5854b]/50" />
            </div>
            <p className="text-xs font-bold text-[#231e1d]/40">{error}</p>
            <button
              onClick={fetchPedidos}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#231e1d] text-[#e4c28a] text-xs font-bold hover:bg-[#b5854b] hover:text-[#fff4e2] transition-all duration-200"
            >
              <RefreshCw size={12} />
              Reintentar
            </button>
          </div>
        ) : pedidos.length === 0 ? (
          <div className={cn(
            'flex flex-col items-center justify-center py-24 gap-5',
            'rounded-3xl border-2 border-dashed border-[#e4c28a]/40 bg-white/50',
          )}>
            <div className="w-16 h-16 rounded-3xl bg-[#e4c28a]/15 flex items-center justify-center">
              <PackageSearch size={26} className="text-[#b5854b]/50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-[#231e1d]/30">Sin pedidos registrados</p>
              <p className="text-[11px] text-[#231e1d]/20 font-medium mt-1">
                Cuando realices un pedido aparecerá aquí
              </p>
            </div>
            <Link
              href="/portal/cotizaciones/nueva"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#231e1d] text-[#e4c28a] text-xs font-black hover:bg-[#b5854b] hover:text-[#fff4e2] transition-all duration-200"
            >
              <Plus size={13} />
              Crear cotización
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pedidos.map((pedido, i) => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                index={i}
                onVerDetalle={setPedidoDetalle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal detalle */}
      {pedidoDetalle && (
        <ModalDetalle
          pedido={pedidoDetalle}
          onClose={() => setPedidoDetalle(null)}
          onPagar={() => { }}
        />
      )}
    </>
  );
}