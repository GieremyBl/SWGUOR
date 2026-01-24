"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DeleteUsuarioDialog({ isOpen, onClose, onSuccess, usuario }: any) {
  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/usuarios?id=${usuario.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Usuario eliminado");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("No se pudo eliminar el usuario");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-red-600 font-bold uppercase">¿Eliminar Usuario?</DialogTitle>
          <DialogDescription>
            Esta acción eliminará a <strong>{usuario?.nombre_completo}</strong> del sistema. No se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete}>Confirmar Eliminación</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}