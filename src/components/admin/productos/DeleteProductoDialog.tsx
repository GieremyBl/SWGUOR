"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function DeleteProductoDialog({
  isOpen,
  onClose,
  onSuccess,
  producto,
}: any) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!producto?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/productos?id=${producto.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "No se pudo eliminar");

      toast.success("Producto eliminado del catálogo");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-4xl border-none shadow-2xl">
        <DialogHeader className="items-center text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <DialogTitle className="text-xl font-black">¿Estás seguro?</DialogTitle>
          <DialogDescription className="text-balance font-medium text-gray-500">
            Estás a punto de eliminar <b>{producto?.nombre}</b>. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-col gap-2 mt-4">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="w-full h-12 rounded-2xl font-black text-lg bg-red-600 hover:bg-red-700 transition-all shadow-lg shadow-red-100"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : "Sí, eliminar producto"}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="w-full h-12 rounded-2xl font-bold text-gray-400"
          >
            No, mantenerlo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}