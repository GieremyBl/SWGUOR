"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Loader2, AlertTriangle, X } from "lucide-react";

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
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok)
        throw new Error(result.error || "No se pudo eliminar");

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
      <DialogContent className="max-w-md bg-white rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
        
        {/* Header con el estilo GUOR (Pink) */}
        <div className="bg-pink-600 p-6 text-white relative">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Trash2 className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
                Eliminar Registro
              </DialogTitle>
            </div>
            <DialogDescription className="text-pink-100 font-medium">
              Esta acción es permanente y no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Mensaje de advertencia estilizado */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex gap-4 items-start">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Confirmación Requerida</p>
              <p className="text-sm text-slate-700 leading-relaxed">
                ¿Estás seguro de que deseas retirar <span className="font-black text-slate-900">{producto?.nombre}</span> del catálogo activo?
              </p>
            </div>
          </div>

          {/* Footer de acciones */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-12 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Mantener Producto
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading}
              className="h-12 rounded-xl bg-slate-900 hover:bg-red-600 text-white font-black uppercase text-[11px] tracking-widest transition-all shadow-lg active:scale-95"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirmar Baja"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}