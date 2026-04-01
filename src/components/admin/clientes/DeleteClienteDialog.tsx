"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Building2, Hash, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DeleteClienteDialog({ isOpen, onClose, cliente, onSuccess }: any) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/clientes?id=${cliente?.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "No se pudo eliminar");

      toast.success("Cliente eliminado exitosamente");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar cliente");
    } finally {
      setLoading(false);
    }
  };

  if (!cliente) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-2xl shadow-2xl outline-none">
        {/* Borde superior decorativo ROJO */}
        <div className="h-2 w-full bg-red-600" />
        
        <div className="p-6">
          {/* Encabezado */}
          <div className="flex items-start gap-4 mb-5">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-gray-900 uppercase tracking-tight">
                Eliminar Cliente
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 leading-tight mt-1">
                Esta acción es irreversible y podría afectar el historial de pedidos asociados a esta empresa.
              </DialogDescription>
            </div>
          </div>

          {/* Tarjeta de resumen del cliente a eliminar */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="font-semibold text-sm line-clamp-1">
                  {cliente.razon_social}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Hash className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm">
                  {cliente.ruc || "Sin documento registrado"}
                </span>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose} 
              className="w-full sm:w-auto rounded-xl font-medium"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleDelete}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white rounded-xl gap-2 shadow-sm hover:shadow-md transition-all font-medium"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Sí, eliminar cliente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}