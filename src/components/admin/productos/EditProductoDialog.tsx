"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Producto, Categoria } from "@/types/supabase.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface EditProductoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  producto: Producto;
  categorias: Categoria[];
}

export default function EditProductoDialog({
  isOpen,
  onClose,
  onSuccess,
  producto,
  categorias,
}: EditProductoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: producto.nombre,
    descripcion: producto.descripcion || "",
    sku: producto.sku,
    precio: producto.precio.toString(),
    stock: producto.stock.toString(),
    stock_minimo: producto.stock_minimo.toString(),
    categoria_id: producto.categoria_id.toString(),
    estado: producto.estado,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre || !formData.sku || !formData.categoria_id || !formData.precio) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from("productos")
        .update({
          nombre: formData.nombre,
          descripcion: formData.descripcion || null,
          sku: formData.sku,
          precio: parseFloat(formData.precio),
          stock: parseInt(formData.stock) || 0,
          stock_minimo: parseInt(formData.stock_minimo) || 400,
          categoria_id: parseInt(formData.categoria_id),
          estado: formData.estado as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", producto.id);

      if (error) throw error;

      toast.success("Producto actualizado correctamente");
      onSuccess();
    } catch (error) {
      console.error("Error actualizando producto:", error);
      toast.error("Error al actualizar el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
          <DialogDescription>
            Actualiza los datos del producto
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Producto *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU *</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) =>
                setFormData({ ...formData, sku: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoría *</Label>
            <Select
              value={formData.categoria_id}
              onValueChange={(value) =>
                setFormData({ ...formData, categoria_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="precio">Precio (S/) *</Label>
            <Input
              id="precio"
              type="number"
              step="0.01"
              value={formData.precio}
              onChange={(e) =>
                setFormData({ ...formData, precio: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_minimo">Stock Mínimo</Label>
              <Input
                id="stock_minimo"
                type="number"
                value={formData.stock_minimo}
                onChange={(e) =>
                  setFormData({ ...formData, stock_minimo: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={formData.estado}
              onValueChange={(value) =>
                setFormData({ ...formData, estado: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
                <SelectItem value="agotado">Agotado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
