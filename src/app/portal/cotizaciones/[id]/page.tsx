'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Download, CheckCircle2,
  Sparkles, Package, AlertCircle, Loader2
} from 'lucide-react';
import { EstadoBadge } from '@/components/portal/EstadoBadge';
import { formatCurrency, formatDateLong } from '@/lib/helpers/format-helpers';
import { toast } from 'sonner';
import { exportCotizacionIndividualToPDF, buildCotizacionPDFData } from '@/lib/utils/export-utils';

interface ClienteInfo {
  razon_social?: string;
  ruc?: string | number;
  telefono?: string;
  email?: string;
  direccion_fiscal?: string;
}

interface ProductoInfo {
  nombre: string;
  sku: string;
  imagen: string | null;
}

interface CotizacionItem {
  id: number;
  cantidad: number;
  precio_unitario_snapshot: number;
  subtotal: number;
  color_snapshot: string;
  talla_snapshot: string;
  productos: ProductoInfo | null;
}

interface CotizacionDetalle {
  id: number;
  numero: string;
  estado: string;
  created_at: string;
  valida_hasta: string;
  subtotal: number;
  monto_descuento: number;
  igv: number;
  costo_envio: number | null;
  total: number;
  notas_internas: string | null;
  cliente?: ClienteInfo | null;
  cotizacion_items: CotizacionItem[];
}

export default function DetalleCotizacionPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [cot, setCot] = useState<CotizacionDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchDetalle = async () => {
      try {
        const res = await fetch(`/api/portal/cotizaciones/${id}`);
        if (!res.ok) throw new Error('No se pudo cargar el detalle');
        const { data } = await res.json();
        setCot(data as CotizacionDetalle);
      } catch {
        toast.error("No se pudo cargar la cotización");
        router.push('/portal/cotizaciones');
      } finally {
        setLoading(false);
      }
    };

    fetchDetalle();
  }, [id, router]);

  const handleDescargarPDF = async () => {
    if (!cot) return;
    setDescargando(true);
    const tid = toast.loading('Generando PDF...');
    try {
      const pdfData = buildCotizacionPDFData({
        numero: cot.numero,
        created_at: cot.created_at,
        valida_hasta: cot.valida_hasta,
        total: cot.total,
        subtotal: cot.subtotal,
        igv: cot.igv,
        monto_descuento: cot.monto_descuento,
        costo_envio: cot.costo_envio ?? undefined,
        notas_internas: cot.notas_internas ?? undefined,
        clientes: cot.cliente ? {
          razon_social: cot.cliente.razon_social,
          ruc: cot.cliente.ruc,
          telefono: cot.cliente.telefono,
          email: cot.cliente.email,
          direccion_fiscal: cot.cliente.direccion_fiscal,
        } : null,
      }, cot.cotizacion_items.map(item => ({
        id: item.id,
        cantidad: item.cantidad,
        subtotal: item.subtotal,
        nombre: item.productos?.nombre ?? 'Producto no especificado',
        talla_snapshot: item.talla_snapshot,
        color_snapshot: item.color_snapshot,
        precio_unitario_snapshot: item.precio_unitario_snapshot,
      })));

      await exportCotizacionIndividualToPDF(pdfData);
      toast.success('PDF descargado', { id: tid });
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : 'Error al generar el PDF';
      toast.error(errorMsg, { id: tid });
    } finally {
      setDescargando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="animate-spin text-amber-500" size={40} />
        <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Obteniendo detalles...</p>
      </div>
    );
  }

  if (!cot) return null;

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8 animate-in fade-in duration-300">

      {/* Header Acciones */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <button
          onClick={() => router.push('/portal/cotizaciones')}
          className="flex items-center gap-2 text-slate-500 hover:text-black transition-all text-xs font-black uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft size={16} /> Volver al historial
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDescargarPDF}
            disabled={descargando}
            className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all text-slate-700 disabled:opacity-50 cursor-pointer"
          >
            {descargando ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Download size={18} />
            )}
            Exportar PDF
          </button>
          {(cot.estado === 'borrador' || cot.estado === 'enviada') && (
            <button
              onClick={() => toast.info('Procesando aprobación comercial...')}
              className="text-white px-8 py-2.5 rounded-xl text-sm font-black shadow-lg transition-all active:scale-95 cursor-pointer hover:opacity-90"
              style={{ backgroundColor: 'var(--guor-dark, #231e1d)' }}
            >
              Generar Pedido
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Columna Izquierda: Listado de Productos ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-amber-600">
                  Documento Oficial
                </p>
                <h1 className="text-4xl font-black text-slate-900">
                  {cot.numero}
                </h1>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Generado el {formatDateLong(cot.created_at)}
                </p>
              </div>
              <EstadoBadge estado={cot.estado} tipo="cotizacion" className="scale-125 origin-top-right" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="pb-4 text-left">Detalle del Producto</th>
                    <th className="pb-4 text-center">Cant.</th>
                    <th className="pb-4 text-right">Unitario</th>
                    <th className="pb-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cot.cotizacion_items?.map((item) => (
                    <tr key={item.id} className="group">
                      <td className="py-6">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 shadow-xs bg-slate-50 text-amber-600 overflow-hidden"
                          >
                            {item.productos?.imagen ? (
                              <img src={item.productos.imagen} className="w-full h-full object-cover" alt={item.productos.nombre} />
                            ) : (
                              <Package size={24} className="opacity-40" />
                            )}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-base">{item.productos?.nombre ?? 'Producto sin nombre'}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                              SKU: {item.productos?.sku ?? 'N/A'}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {item.color_snapshot} · {item.talla_snapshot}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 text-center font-black text-slate-700 text-base">
                        {item.cantidad}
                      </td>
                      <td className="py-6 text-right font-medium text-slate-600">
                        {formatCurrency(item.precio_unitario_snapshot)}
                      </td>
                      <td className="py-6 text-right font-black text-slate-900 text-base">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Columna Derecha: Notas e IA ── */}
        <div className="space-y-6">

          {/* Card de análisis / notas */}
          <div
            className="rounded-3xl p-8 text-white shadow-lg relative overflow-hidden bg-slate-900"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles size={80} />
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/10 rounded-lg">
                <Sparkles size={20} className="text-amber-300" />
              </div>
              <h3 className="font-black text-xs uppercase tracking-widest">Análisis Estratégico</h3>
            </div>
            <p className="text-sm text-amber-50/90 leading-relaxed italic font-medium">
              "{cot.notas_internas || "Su volumen actual le permite acceder a la tarifa preferencial Nivel 2. Recomendamos aumentar 50 unidades para alcanzar el Nivel 3 de descuento."}"
            </p>
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/50">
              <span>Smart Insight</span>
              <div className="flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>Optimizado</span>
              </div>
            </div>
          </div>

          {/* Resumen Financiero */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-6">
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-50 pb-4">
              Desglose Comercial
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-tight">Subtotal Neto</span>
                <span className="font-bold text-slate-700">
                  {formatCurrency(cot.subtotal)}
                </span>
              </div>

              {cot.monto_descuento > 0 && (
                <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-xs font-black text-emerald-700 uppercase">Ahorro</span>
                  <span className="font-black text-emerald-700">
                    -{formatCurrency(cot.monto_descuento)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-tight">Impuestos (18%)</span>
                <span className="font-bold text-slate-700">{formatCurrency(cot.igv)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-tight">Envío</span>
                <span className="font-bold text-slate-700">{formatCurrency(cot.costo_envio ?? 0)}</span>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Total Final</span>
                  <span className="text-3xl font-black leading-none text-slate-900">
                    {formatCurrency(cot.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Aviso de MOQ */}
            <div
              className="rounded-2xl p-4 flex gap-3 items-start border bg-amber-50/50 border-amber-200/50"
            >
              <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-wider text-amber-700">
                  Condiciones de Venta
                </p>
                <p className="text-[11px] font-medium text-slate-600 leading-snug">
                  Cotización sujeta a MOQ de 400 unidades. Validez de precios por 7 días calendario tras la emisión.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}