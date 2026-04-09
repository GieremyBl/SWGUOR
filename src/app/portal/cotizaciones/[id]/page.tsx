'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Download, CheckCircle2, 
  Clock, Sparkles, Package, AlertCircle 
} from 'lucide-react';
import { EstadoBadge } from '@/components/portal/EstadoBadge';
import { formatCurrency, formatDateLong } from '@/lib/helpers/format-helpers';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { toast } from 'sonner';

export default function DetalleCotizacionPage() {
  const params = useParams();
  const id = params?.id as string; // Forzamos el tipo a string para Supabase
  const router = useRouter();
  
  const [cot, setCot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si por alguna razón el ID no está presente, no ejecutamos la consulta
    if (!id) return;

    const fetchDetalle = async () => {
      try {
        const { data, error } = await getSupabaseBrowserClient()
          .from('cotizaciones')
          .select(`
            *,
            items:cotizacion_items(
              id, cantidad, precio_unitario, subtotal,
              producto:productos(nombre, sku, imagen_url)
            )
          `)
          .eq('id', Number(id)) // Convertir string a número
          .single();

        if (error) throw error;
        setCot(data);
      } catch (error) {
        toast.error("No se pudo cargar la cotización");
        router.push('/portal/cotizaciones');
      } finally {
        setLoading(false);
      }
    };

    fetchDetalle();
  }, [id, router]);

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400">Cargando detalles...</div>;
  if (!cot) return null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header Acciones */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Volver al historial
        </button>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all">
            <Download size={16} /> Descargar PDF
          </button>
          {cot.estado === 'pendiente' && (
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all">
              Aprobar y Pagar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Información y Productos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{cot.numero}</h1>
                <p className="text-sm text-slate-500 mt-1">Emitida el {formatDateLong(cot.created_at)}</p>
              </div>
              <EstadoBadge estado={cot.estado} tipo="cotizacion" className="scale-110" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="py-3 text-left">Producto</th>
                    <th className="py-3 text-center">Cant.</th>
                    <th className="py-3 text-right">Unitario</th>
                    <th className="py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cot.items.map((item: any) => (
                    <tr key={item.id} className="group">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-md overflow-hidden shrink-0">
                             {/* Imagen de producto o placeholder */}
                             <Package className="m-auto mt-2 text-slate-400" size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{item.producto?.nombre}</p>
                            <p className="text-[11px] text-slate-500 uppercase">SKU: {item.producto?.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-center font-medium">{item.cantidad}</td>
                      <td className="py-4 text-right">{formatCurrency(item.precio_unitario)}</td>
                      <td className="py-4 text-right font-bold">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Resumen Financiero e IA */}
        <div className="space-y-6">
          {/* Card de IA (CUS-07) */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-blue-200" />
              <h3 className="font-bold text-sm">Asistente Estratégico</h3>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed italic">
              "{cot.analisis_ia || "Estamos analizando tu pedido para ofrecerte mejores escalas de precio. Por ahora, has alcanzado el Nivel 2 de descuento."}"
            </p>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-blue-200">
              <span>Sugerencia IA</span>
              <Clock size={12} />
            </div>
          </div>

          {/* Resumen de Totales */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b pb-3">Resumen de Pago</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal Bruto</span>
                <span>{formatCurrency(cot.subtotal_bruto)}</span>
              </div>
              {cot.descuento > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Descuento Aplicado ({cot.porcentaje_descuento}%)</span>
                  <span>-{formatCurrency(cot.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>IGV (18%)</span>
                <span>{formatCurrency(cot.igv)}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-slate-900 pt-3 border-t">
                <span>TOTAL</span>
                <span>{formatCurrency(cot.total)}</span>
              </div>
            </div>
            
            {/* Aviso de MOQ */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-3">
              <AlertCircle size={18} className="text-blue-600 shrink-0" />
              <p className="text-[11px] text-blue-800 leading-snug">
                Esta cotización respeta el MOQ de 400 unidades y tiene una validez de 7 días calendario.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}