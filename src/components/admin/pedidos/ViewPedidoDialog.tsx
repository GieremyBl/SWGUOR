"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Receipt, Printer, Package, Calendar, Hash } from "lucide-react";

export default function ViewPedidoDialog({ isOpen, pedido, onClose }: any) {
  const [detalles, setDetalles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && pedido?.id) {
      const loadDetalles = async () => {
        setLoading(true);
        try {
          const supabase = getSupabaseBrowserClient();
          const { data, error } = await supabase
            .from("detalles_orden" as any)
            .select("*, productos(nombre, sku)")
            .eq("orden_id", pedido.id);
          if (error) throw error;
          setDetalles(data || []);
        } catch (error) {
          console.error("Error:", error);
        } finally {
          setLoading(false);
        }
      };
      loadDetalles();
    }
  }, [isOpen, pedido]);

  if (!pedido) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-none shadow-2xl p-0 overflow-hidden bg-white rounded-4xl">
        {/* Header con Title y Description integrados para evitar el Warning */}
        <div className="p-6 bg-white">
          <DialogHeader className="space-y-1">
            <div className="flex justify-between items-start">
              <div className="bg-pink-100 text-pink-600 p-2 rounded-xl">
                <Receipt className="w-5 h-5" />
              </div>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900" onClick={() => window.print()}>
                <Printer className="w-4 h-4" />
              </Button>
            </div>
            
            <DialogTitle className="text-2xl font-black text-gray-900 mt-2">
              Venta #{pedido.id?.toString().slice(-4).toUpperCase()}
            </DialogTitle>
            
            {/* Esta es la clave para que desaparezca el warning de la consola */}
            <DialogDescription className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] flex items-center gap-3">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(pedido.fecha_pedido).toLocaleDateString()}</span>
              <span className="text-pink-300">•</span>
              <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> FOLIO: {pedido.id}</span>
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Contenedor Único Estilo "Boutique" */}
        <div className="px-6 pb-6">
          <div className="bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden">
            
            {/* Info Cliente */}
            <div className="p-4 border-b border-white flex justify-between items-center">
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Receptor</p>
                <p className="text-sm font-bold text-gray-800">{pedido.clientes?.razon_social || "General"}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Estado</p>
                <p className="text-[9px] font-black text-orange-600 uppercase">{pedido.estado || 'PENDIENTE'}</p>
              </div>
            </div>

            {/* Mini Tabla de Productos */}
            <div className="max-h-44 overflow-y-auto bg-white/50">
              {loading ? (
                <div className="p-6 text-center text-[9px] font-bold text-gray-300">Cargando...</div>
              ) : detalles.map((item) => (
                <div key={item.id} className="p-3 px-4 flex justify-between items-center border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-pink-600 bg-pink-50 w-6 h-6 rounded flex items-center justify-center">
                      {item.cantidad}
                    </span>
                    <p className="text-xs font-bold text-gray-700">{item.productos?.nombre}</p>
                  </div>
                  <p className="text-xs font-black text-gray-900">S/ {(item.precio_unitario * item.cantidad).toFixed(2)}</p>
                </div>
              ))}
            </div>

            {/* Footer Negro Total (Unificado) */}
            <div className="bg-gray-900 p-5 text-white">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Importe Neto</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-bold text-pink-500">S/</span>
                    <span className="text-3xl font-black tracking-tighter">
                      {pedido.total?.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[7px] font-bold text-gray-500 uppercase">18% IGV INC.</p>
                  <div className="mt-1 h-1.5 w-12 bg-pink-600 rounded-full ml-auto" />
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={onClose} 
            className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold h-12 rounded-xl transition-all shadow-none border-none"
          >
            Regresar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}