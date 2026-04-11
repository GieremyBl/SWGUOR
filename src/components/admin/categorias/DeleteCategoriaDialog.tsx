"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

export default function DeleteCategoriaDialog({ isOpen, categoria, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/categorias?id=${categoria.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "No se puede eliminar la categoría");
      }

      toast.success("Categoría eliminada de Modas y Estilos GUOR");
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
      <DialogContent className="max-w-md bg-white rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
        
        {/* Header Estilo GUOR (Pink) */}
        <div className="bg-pink-600 p-6 text-white relative">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Trash2 className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
                Eliminar Categoría
              </DialogTitle>
            </div>
            <DialogDescription className="text-pink-100 font-medium">
              Esta acción retirará la agrupación del catálogo.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Advertencia Estilizada */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex gap-4 items-start">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Protección de Datos</p>
              <p className="text-sm text-slate-700 leading-relaxed">
                ¿Seguro que deseas eliminar <span className="font-black text-slate-900">"{categoria?.nombre}"</span>? 
              </p>
              <p className="text-[11px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg mt-2 border border-amber-100">
                Nota: El sistema rechazará la acción si existen productos vinculados a esta categoría.
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-12 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading}
              className="h-12 rounded-xl bg-slate-900 hover:bg-red-600 text-white font-black uppercase text-[11px] tracking-widest transition-all shadow-lg active:scale-95"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirmar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}