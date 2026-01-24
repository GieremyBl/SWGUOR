"use client";
import { useState, useEffect } from "react";
import { Loader2, X, PackagePlus } from "lucide-react";
import { Categoria } from "@/types/supabase.types";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateInsumoDialog({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/admin/categorias") // Ruta ajustada a tu estándar
        .then((res) => res.json())
        .then((data) => setCategorias(data))
        .catch(() => toast.error("Error al cargar categorías"));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const data = {
      nombre: formData.get("nombre"),
      tipo: formData.get("tipo"),
      unidad_medida: formData.get("unidad_medida"),
      stock_actual: Number(formData.get("stock_actual")),
      stock_minimo: Number(formData.get("stock_minimo")),
      categoria_id: Number(formData.get("categoria_id")),
    };

    try {
      const res = await fetch("/api/admin/inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Nuevo insumo registrado");
        onSuccess();
        onClose();
      } else {
        throw new Error();
      }
    } catch (err) {
      toast.error("Error al guardar el insumo");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-pink-50/30">
          <div className="flex items-center gap-2">
            <PackagePlus className="text-pink-600" size={24} />
            <h2 className="text-xl font-black text-gray-900 uppercase">Nuevo Insumo</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre del Material</label>
            <input name="nombre" placeholder="ej. Tela Lino Premium" required className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none font-medium" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</label>
              <select name="tipo" className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none font-bold text-sm bg-white" required>
                <option value="Tela">Tela</option>
                <option value="Hilo">Hilo</option>
                <option value="Avios">Avíos / Accesorios</option>
                <option value="Embalaje">Embalaje</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">U. Medida</label>
              <select name="unidad_medida" className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none font-bold text-sm bg-white">
                <option value="Metros">Metros</option>
                <option value="Unidades">Unidades</option>
                <option value="Conos">Conos</option>
                <option value="Kg">Kilogramos</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Inicial</label>
              <input name="stock_actual" type="number" step="0.01" required placeholder="0.00" className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Mínimo</label>
              <input name="stock_minimo" type="number" step="0.01" placeholder="5.00" className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none font-bold text-orange-600" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoría Relacionada</label>
            <select name="categoria_id" required className="w-full border-gray-200 border p-3 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none font-medium bg-white">
              <option value="">Seleccionar...</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700">Cancelar</button>
            <button type="submit" disabled={loading} className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-pink-100 transition-all active:scale-95">
              {loading ? <Loader2 className="animate-spin" size={18} /> : "REGISTRAR INSUMO"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}