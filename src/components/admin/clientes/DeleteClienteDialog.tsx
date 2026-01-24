"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, AlertCircle } from "lucide-react"; // Trash2 es más semántico para eliminar

export default function DeleteClienteDialog({ isOpen, onClose, cliente, onSuccess }: any) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      // LLAMADA A TU API USANDO EL MÉTODO DELETE Y PASANDO EL ID EN LA URL
      const response = await fetch(`/api/admin/clientes?id=${cliente.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "No se pudo eliminar");

      toast.success("Cliente eliminado del sistema");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-100 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" /> Eliminar Cliente
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <p className="text-gray-600">
              ¿Estás seguro de que deseas eliminar a:
            </p>
            <p className="text-lg font-bold text-gray-900">
              {cliente?.razon_social || "este cliente"}
            </p>
            <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded-lg border border-dashed">
              Esta acción es permanente y podría afectar el historial de pedidos asociados.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            disabled={loading}
            className="flex-1 rounded-xl"
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading}
            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100"
          >
            {loading ? 'Eliminando...' : 'Sí, Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}