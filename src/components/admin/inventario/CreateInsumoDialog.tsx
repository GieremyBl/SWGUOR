"use client";
import { useState, useEffect } from "react";
import { PackagePlus } from "lucide-react";
import type { Database } from "@/types/database";
type Categoria = Database['public']['Tables']['categorias']['Row'];
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateInsumoDialog({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "Tela",
    unidad_medida: "Metros",
    stock_actual: "",
    stock_minimo: "",
    categoria_id: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetch("/api/admin/categorias")
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => setCategorias(Array.isArray(data) ? data : []))
        .catch(() => {
          toast.error("Error al cargar categorías");
          setCategorias([]);
        });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const data = {
      nombre: formData.nombre,
      tipo: formData.tipo,
      unidad_medida: formData.unidad_medida,
      stock_actual: parseFloat(formData.stock_actual || "0"),
      stock_minimo: parseFloat(formData.stock_minimo || "0"),
      categoria_id: formData.categoria_id ? Number(formData.categoria_id) : null,
    };

    try {
      const res = await fetch("/api/admin/inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Nuevo insumo registrado con éxito");
        setFormData({ nombre: "", tipo: "Tela", unidad_medida: "Metros", stock_actual: "", stock_minimo: "", categoria_id: "" });
        onSuccess();
        onClose();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error en el servidor");
      }
    } catch (err: any) {
      toast.error(err.message || "Error al guardar el insumo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-none shadow-2xl bg-white p-0 overflow-hidden max-h-[90vh]">
        {/* Banner decorativo superior */}
        <div className="h-2 bg-pink-600 w-full" />
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8px)]">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-50 rounded-lg">
                <PackagePlus className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800 uppercase tracking-tight">
                  Nuevo Insumo
                </DialogTitle>
                <DialogDescription className="text-slate-500">
                  Registra un nuevo material o insumo al inventario.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre */}
            <div className="space-y-2">
              <Label className="text-[11px] uppercase font-bold text-slate-400">
                Nombre del Material
              </Label>
              <Input 
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Tela Lino Premium" 
                required 
                disabled={loading}
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-11"
              />
            </div>

            {/* Tipo y Unidad de Medida */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] uppercase font-bold text-slate-400">Tipo</Label>
                <Select 
                  value={formData.tipo} 
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  disabled={loading}
                >
                  <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="Tela">Tela</SelectItem>
                    <SelectItem value="Hilo">Hilo</SelectItem>
                    <SelectItem value="Avios">Avíos / Accesorios</SelectItem>
                    <SelectItem value="Embalaje">Embalaje</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] uppercase font-bold text-slate-400">U. Medida</Label>
                <Select 
                  value={formData.unidad_medida} 
                  onValueChange={(value) => setFormData({ ...formData, unidad_medida: value })}
                  disabled={loading}
                >
                  <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="Metros">Metros</SelectItem>
                    <SelectItem value="Unidades">Unidades</SelectItem>
                    <SelectItem value="Conos">Conos</SelectItem>
                    <SelectItem value="Kg">Kilogramos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stock Actual y Mínimo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] uppercase font-bold text-slate-400">Stock Inicial</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  value={formData.stock_actual}
                  onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
                  placeholder="0.00"
                  required 
                  disabled={loading}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] uppercase font-bold text-slate-400">Stock Mínimo</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  value={formData.stock_minimo}
                  onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                  placeholder="5.00"
                  disabled={loading}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-11"
                />
              </div>
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <Label className="text-[11px] uppercase font-bold text-slate-400">Categoría Relacionada</Label>
              <Select 
                value={formData.categoria_id} 
                onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
                disabled={loading}
              >
                <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Seleccionar una categoría..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {categorias.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Footer con acciones */}
            <DialogFooter className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onClose}
                disabled={loading}
                className="text-slate-500 hover:bg-slate-100"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-pink-600 hover:bg-pink-700 text-white shadow-md shadow-pink-200 px-8 transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Registrando
                  </span>
                ) : (
                  "Registrar Insumo"
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}