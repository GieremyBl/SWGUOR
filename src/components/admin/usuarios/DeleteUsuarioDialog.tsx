"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, User, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DeleteUsuarioDialog({ isOpen, onClose, onSuccess, usuario }: any) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/usuarios?id=${usuario?.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Usuario eliminado exitosamente");
      onSuccess();
    } catch (error) {
      toast.error("No se pudo eliminar el usuario");
    } finally {
      setLoading(false);
    }
  };

  if (!usuario) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-2xl shadow-2xl">
        {/* Borde superior decorativo ROJO */}
        <div className="h-2 w-full bg-red-600" />
        
        <div className="p-6">
          {/* Encabezado usando DialogTitle y DialogDescription */}
          <div className="flex items-start gap-4 mb-5">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-gray-900 uppercase tracking-tight">
                Eliminar Usuario
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 leading-tight mt-1">
                Esta acción es irreversible y eliminará el acceso de esta persona al sistema.
              </DialogDescription>
            </div>
          </div>

          {/* Tarjeta de resumen del usuario a eliminar */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-semibold text-sm">{usuario.nombre_completo}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{usuario.email}</span>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose} 
              className="w-full sm:w-auto rounded-xl"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleDelete}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white rounded-xl gap-2"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Sí, eliminar usuario
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}