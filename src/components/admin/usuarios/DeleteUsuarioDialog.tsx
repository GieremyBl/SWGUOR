"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteUsuarioDialog({ isOpen, onClose, onSuccess, usuario }: any) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/usuarios?id=${usuario.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Usuario eliminado");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("No se pudo eliminar el usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0">
        {/* Banner rojo superior */}
        <div className="h-2 bg-red-600 w-full" />

        <div className="p-6 space-y-5">
          {/* Header con icono */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-50 rounded-lg flex-shrink-0">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Eliminar Usuario
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600">
                Esta acción no se puede deshacer
              </DialogDescription>
            </div>
          </div>

          {/* Mensaje de advertencia */}
          <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <p className="text-sm text-slate-700">
              ¿Estás seguro que deseas eliminar a{" "}
              <span className="font-bold text-red-600">
                {usuario?.nombre_completo}
              </span>
              ? Esta acción eliminará toda la información asociada al usuario.
            </p>
          </div>

          {/* Footer */}
          <DialogFooter className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}