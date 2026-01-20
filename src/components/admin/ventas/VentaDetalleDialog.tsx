"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { XCircle, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function VentaDetalleDialog({ venta, isOpen, onClose, onUpdate }: any) {
  const [detalles, setDetalles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (isOpen && venta?.id) {
      loadDetalle();
    }
  }, [isOpen, venta]);

  const loadDetalle = async () => {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("detalles_ventas")
      .select(`*, producto:producto_id(nombre)`)
      .eq("venta_id", venta.id);
    
    setDetalles(data || []);
    setLoading(false);
  };

  const handleCancelarVenta = async () => {
    const confirmar = confirm("¿Estás seguro de cancelar esta venta? Esta acción devolverá los productos al stock.");
    if (!confirmar) return;

    setCancelling(true);
    const supabase = getSupabaseBrowserClient();

    try {
      // 1. Actualizar el estado de la venta
      const { error: errorVenta } = await supabase
        .from("ventas")
        .update({ estado_pedido: "cancelado" })
        .eq("id", venta.id);

      if (errorVenta) throw errorVenta;

      // 2. Devolver stock (Solo si la venta NO estaba ya cancelada)
      // Usamos la función RPC que creamos anteriormente pero para SUMAR
      for (const item of detalles) {
        await supabase.rpc('increment_stock', { 
          row_id: item.producto_id, 
          quantity: item.cantidad 
        });
      }

      toast.success("Venta cancelada e inventario actualizado");
      onUpdate(); // Recargar la tabla principal
      onClose();
    } catch (error) {
      toast.error("Error al cancelar la venta");
    } finally {
      setCancelling(false);
    }
  };

  if (!venta) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <DialogTitle className="text-xl font-bold">
            Pedido: <span className="text-pink-600">{venta.codigo_pedido}</span>
          </DialogTitle>
          <Badge className={venta.estado_pedido === 'cancelado' ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>
            {venta.estado_pedido.toUpperCase()}
          </Badge>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          {/* Listado de Productos */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700">Artículos del Pedido</h4>
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="animate-spin text-pink-600" /></div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 border space-y-2">
                {detalles.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.producto?.nombre} (x{item.cantidad})</span>
                    <span className="font-medium">S/ {(item.cantidad * item.precio_unitario).toFixed(2)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-pink-600">S/ {Number(venta.total).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Sección de Acciones de Peligro */}
          {venta.estado_pedido !== "cancelado" && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-600 w-5 h-5" />
                <div>
                  <p className="text-sm font-bold text-red-900">Anulación de Venta</p>
                  <p className="text-xs text-red-700">Esto restaurará el stock de los productos.</p>
                </div>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleCancelarVenta}
                disabled={cancelling}
                className="bg-red-600 hover:bg-red-700"
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                Cancelar Pedido
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}