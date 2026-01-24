"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function CancelPedidoDialog({ isOpen, pedido, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      // LLAMADA A TU NUEVA API (MÉTODO PATCH)
      const response = await fetch(`/api/admin/pedidos?id=${pedido.id}`, {
        method: 'PATCH',
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Error al anular");

      toast.success("Pedido anulado y stock restaurado");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "No se pudo anular el pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-100 rounded-3xl">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <XCircle className="text-red-600 w-10 h-10" />
          </div>
          <DialogTitle className="text-center text-2xl font-black text-gray-900">
            Anular Pedido
          </DialogTitle>
          <div className="text-center space-y-2">
            <p className="text-sm font-bold text-pink-600 uppercase tracking-widest">
              Folio: #{pedido?.id?.toString().slice(0, 8)}
            </p>
            <p className="text-gray-500 text-sm px-4">
              ¿Estás seguro? Esta acción cambiará el estado a <span className="font-bold text-red-600">CANCELADO</span> y las prendas regresarán automáticamente al inventario.
            </p>
          </div>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1 rounded-xl font-bold h-12 border-gray-200 hover:bg-gray-50"
          >
            No, mantener
          </Button>
          <Button 
            onClick={handleCancel} 
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold h-12 shadow-lg shadow-red-100 transition-all"
          >
            {loading ? "Sincronizando..." : "Sí, anular pedido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}