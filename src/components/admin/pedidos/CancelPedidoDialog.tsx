"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CancelPedidoDialog({ isOpen, pedido, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      
      // 1. Cambiar estado a cancelado
      const { error } = await supabase
        .from("pedidos")
        .update({ estado: "cancelado" })
        .eq("id", pedido.id);

      if (error) throw error;

      // NOTA: Aquí podrías disparar un Trigger en Supabase para devolver el stock
      // o hacerlo manualmente recorriendo los detalles del pedido.

      toast.success("Pedido anulado correctamente");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("No se pudo anular el pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-100">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="text-red-600 w-6 h-6" />
          </div>
          <DialogTitle className="text-center text-xl font-black">¿Anular Pedido #{pedido?.id}?</DialogTitle>
          <p className="text-center text-gray-500 text-sm">
            Esta acción marcará el pedido como cancelado. Deberás ajustar el stock manualmente si es necesario.
          </p>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1 font-bold">
            No, mantener
          </Button>
          <Button 
            onClick={handleCancel} 
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 font-bold gap-2"
          >
            {loading ? "Procesando..." : "Sí, anular pedido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}