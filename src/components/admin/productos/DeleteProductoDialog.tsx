"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Producto } from "@/types/supabase.types";
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
import { AlertCircle } from "lucide-react";

interface DeleteProductoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  producto: Producto;
}

export default function DeleteProductoDialog({
  isOpen,
  onClose,
  onSuccess,
  producto,
}: DeleteProductoDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);

      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("productos")
        .delete()
        .eq("id", producto.id);

      if (error) throw error;

      toast.success("Producto eliminado correctamente");
      onSuccess();
    } catch (error) {
      console.error("Error eliminando producto:", error);
      toast.error("Error al eliminar el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar Producto</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer
          </DialogDescription>
        </DialogHeader>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 my-4">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">¿Eliminar "{producto.nombre}"?</p>
            <p className="text-sm text-red-700 mt-1">
              Al eliminar este producto, se eliminarán todas sus referencias en pedidos y detalles.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
