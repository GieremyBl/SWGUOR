"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { toast } from "sonner";

export default function DeleteCategoriaDialog({ isOpen, categoria, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("categorias").delete().eq("id", categoria.id);
      if (error) throw error;
      toast.success("Categoría eliminada");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error("No se puede eliminar: tiene productos asociados");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-red-600">¿Eliminar categoría?</DialogTitle>
          <DialogDescription>
            Esta acción eliminará permanentemente la categoría <strong>{categoria?.nombre}</strong>. 
            Asegúrate de que no tenga productos asociados antes de continuar.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Eliminando..." : "Confirmar Eliminación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}