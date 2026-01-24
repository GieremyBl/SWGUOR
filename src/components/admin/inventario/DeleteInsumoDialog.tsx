"use client";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  insumo: { id: number; nombre: string } | null;
}

export default function DeleteInsumoDialog({ isOpen, onClose, onSuccess, insumo }: DeleteProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !insumo) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inventario?id=${insumo.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Insumo eliminado correctamente");
        onSuccess();
        onClose();
      } else {
        throw new Error();
      }
    } catch (err) {
      toast.error("No se pudo eliminar el insumo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-110 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-red-50">
        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          
          <div>
            <h3 className="text-xl font-black text-gray-900 uppercase">¿Confirmar eliminación?</h3>
            <p className="text-gray-500 text-sm mt-2 font-medium">
              Estás por eliminar <span className="text-red-600 font-bold">{insumo.nombre}</span>...
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={onClose} 
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              No, cancelar
            </button>
            <button 
              onClick={handleDelete} 
              disabled={loading}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-black hover:bg-red-700 shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={16} />} SÍ, ELIMINAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}