"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  User, Calendar, Hash, 
  Package, Printer, CreditCard, Receipt, XCircle, CheckCircle2, Clock
} from "lucide-react";

export default function ViewPedidoDialog({ isOpen, pedido, onClose }: any) {
  const [detalles, setDetalles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && pedido?.id) {
      const loadDetalles = async () => {
        setLoading(true);
        try {
          const supabase = getSupabaseBrowserClient();
          // Importante: Traemos la relación con productos
          const { data, error } = await supabase
            .from("detalles_pedido")
            .select("*, productos(nombre, sku)")
            .eq("pedido_id", pedido.id);
          
          if (error) throw error;
          setDetalles(data || []);
        } catch (error) {
          console.error("Error al cargar detalles:", error);
        } finally {
          setLoading(false);
        }
      };
      loadDetalles();
    }
  }, [isOpen, pedido]);

  if (!pedido) return null;

  // Helper para el color del estado
  const getStatusStyles = (estado: string) => {
    switch (estado?.toUpperCase()) {
      case 'COMPLETADO': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'CANCELADO': return 'bg-red-50 text-red-700 border-red-100';
      case 'PENDIENTE': return 'bg-orange-50 text-orange-700 border-orange-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado?.toUpperCase()) {
      case 'COMPLETADO': return <CheckCircle2 className="w-3 h-3" />;
      case 'CANCELADO': return <XCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl border-none shadow-2xl p-0 overflow-hidden bg-gray-50 rounded-4xl">
        {/* Header de la Boleta */}
        <div className="bg-white p-8 border-b">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-pink-100 text-pink-600 p-1.5 rounded-lg">
                  <Receipt className="w-5 h-5" />
                </span>
                <DialogTitle className="text-2xl font-black tracking-tight">
                  Detalle de Venta
                </DialogTitle>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> 
                    {pedido.fecha_pedido ? new Date(pedido.fecha_pedido).toLocaleDateString() : 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" /> 
                    FOLIO: {pedido.id?.toString().slice(0,8)}
                </span>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="gap-2 font-bold border-gray-200 rounded-xl hover:bg-gray-50 transition-all active:scale-95" 
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" /> Imprimir
            </Button>
          </DialogHeader>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Columna de Información */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <User className="w-3 h-3 text-pink-500" /> Cliente Receptor
              </h4>
              <p className="font-bold text-gray-900 leading-tight">
                {pedido.clientes?.razon_social || "Cliente General"}
              </p>
              <p className="text-xs text-gray-500 mt-1 font-medium">RUC: {pedido.clientes?.ruc || "Sin RUC"}</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CreditCard className="w-3 h-3 text-blue-500" /> Estado y Pago
              </h4>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border ${getStatusStyles(pedido.estado)}`}>
                {getStatusIcon(pedido.estado)}
                {pedido.estado}
              </div>
              <p className="text-[10px] text-gray-400 mt-3 font-bold uppercase">MÉTODO: {pedido.metodo_pago || 'EFECTIVO'}</p>
            </div>
          </div>

          {/* Lista de Productos (Resumen) */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-gray-50/30">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Package className="w-3 h-3 text-pink-500" /> Artículos en Pedido
                </h4>
              </div>
              
              <div className="divide-y divide-gray-50 max-h-75 overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="p-12 text-center animate-pulse text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                    Cargando almacén...
                  </div>
                ) : detalles.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-xs font-bold uppercase">
                    No hay detalles registrados
                  </div>
                ) : detalles.map((item) => (
                  <div key={item.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div className="flex gap-4 items-center">
                      <div className="w-11 h-11 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600 font-black text-xs border border-pink-100">
                        {item.cantidad}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900 leading-none mb-1">{item.productos?.nombre}</p>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">SKU: {item.productos?.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-900 text-sm">S/ {(item.precio_unitario * item.cantidad).toFixed(2)}</p>
                      <p className="text-[9px] text-gray-400 font-bold">UNIT: S/ {item.precio_unitario.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer del Resumen con el Total */}
              <div className="p-6 bg-gray-900 text-white">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Final Recaudado</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-bold text-pink-500">S/</span>
                      <span className="text-3xl font-black tracking-tighter leading-none">
                        {pedido.total?.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-[9px] font-bold text-gray-500 uppercase leading-none">
                    IGV INCLUIDO (18%)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t flex justify-end">
          <Button 
            onClick={onClose} 
            className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-black px-10 h-12 rounded-2xl transition-all"
          >
            Volver al Listado
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}