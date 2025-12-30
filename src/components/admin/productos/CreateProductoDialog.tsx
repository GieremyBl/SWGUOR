"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Categoria } from "@/types/supabase.types";
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

interface CreateProductoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categorias: Categoria[];
}

export default function CreateProductoDialog({
  isOpen,
  onClose,
  onSuccess,
  categorias,
}: CreateProductoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    sku: "",
    precio: "",
    stock: "0",
    stock_minimo: "400",
    categoria_id: "",
    estado: "activo",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre || !formData.sku || !formData.categoria_id || !formData.precio) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from("productos").insert([
        {
          nombre: formData.nombre,
          descripcion: formData.descripcion || null,
          sku: formData.sku,
          precio: parseFloat(formData.precio),
          stock: parseInt(formData.stock) || 0,
          stock_minimo: parseInt(formData.stock_minimo) || 400,
          categoria_id: parseInt(formData.categoria_id),
          estado: formData.estado,
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      toast.success("Producto creado correctamente");
      setFormData({
        nombre: "",
        descripcion: "",
        sku: "",
        precio: "",
        stock: "0",
        stock_minimo: "400",
        categoria_id: "",
        estado: "activo",
      });
      onSuccess();
    } catch (error) {
      console.error("Error creando producto:", error);
      toast.error("Error al crear el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Producto</DialogTitle>
          <DialogDescription>
            Ingresa los datos del nuevo producto a tu catálogo
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
              placeholder="Ej: Polo Básico Hombre"
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
              placeholder="Ej: POLO-001-BL"
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
                <SelectValue placeholder="Selecciona una categoría" />
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
              placeholder="0.00"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Inicial</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
                placeholder="0"
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
                placeholder="400"
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
              placeholder="Describe el producto..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={formData.estado}
              onValueChange={(value) =>
                setFormData({ ...formData, estado: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
