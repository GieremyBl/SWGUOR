"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";

export default function DeleteCategoriaDialog({ isOpen, categoria, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      // LLAMADA A TU API CON MÉTODO DELETE
      const response = await fetch(`/api/admin/categorias?id=${categoria.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        // Si el error es por integridad referencial (productos asociados)
        throw new Error(result.error || "No se puede eliminar la categoría");
      }

      toast.success("Categoría eliminada de Modas GUOR");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-100 rounded-3xl">
        <DialogHeader className="flex flex-col items-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-2">
            <AlertTriangle className="text-red-600 w-6 h-6" />
          </div>
          <DialogTitle className="text-red-600 text-xl font-bold text-center">
            ¿Eliminar categoría?
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Esta acción eliminará permanentemente la categoría: <br />
            <span className="font-bold text-gray-900 text-lg">"{categoria?.nombre}"</span>
          </DialogDescription>
        </DialogHeader>

        <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl mb-4">
          <p className="text-[11px] text-amber-700 leading-tight">
            <strong>Nota:</strong> Si esta categoría tiene productos asignados, el sistema rechazará la eliminación para proteger tu inventario.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="rounded-xl flex-1 order-2 sm:order-1"
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 rounded-xl flex-1 font-bold order-1 sm:order-2"
          >
            {loading ? "Procesando..." : "Confirmar Eliminación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}