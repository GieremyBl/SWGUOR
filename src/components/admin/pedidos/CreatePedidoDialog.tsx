"use client";

import { useState, useEffect, useMemo } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, Trash2, Plus, Minus, User, Package, Calculator } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreatePedidoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePedidoDialog({ isOpen, onClose, onSuccess }: CreatePedidoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  
  // Estado del Formulario
  const [selectedCliente, setSelectedCliente] = useState<string>("");
  const [searchProd, setSearchProd] = useState("");
  const [carrito, setCarrito] = useState<any[]>([]);

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      const loadInitialData = async () => {
        const supabase = getSupabaseBrowserClient();
        const [cliRes, prodRes] = await Promise.all([
          supabase.from("clientes").select("id, nombre, apellido").order("nombre"),
          supabase.from("productos").select("*").gt("stock", 0).order("nombre")
        ]);
        setClientes(cliRes.data || []);
        setProductos(prodRes.data || []);
      };
      loadInitialData();
    }
  }, [isOpen]);

  // Filtrar productos por búsqueda
  const filteredProducts = useMemo(() => {
    if (!searchProd) return [];
    return productos.filter(p => 
      p.nombre.toLowerCase().includes(searchProd.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchProd.toLowerCase())
    ).slice(0, 5);
  }, [searchProd, productos]);

  const addToCart = (prod: any) => {
    const exists = carrito.find(item => item.id === prod.id);
    if (exists) {
      if (exists.cantidad >= prod.stock) return toast.error("Stock máximo alcanzado");
      setCarrito(carrito.map(item => item.id === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCarrito([...carrito, { ...prod, cantidad: 1 }]);
    }
    setSearchProd("");
  };

  const updateQuantity = (id: number, delta: number) => {
    setCarrito(carrito.map(item => {
      if (item.id === id) {
        const newQty = item.cantidad + delta;
        if (newQty > item.stock) { toast.error("Sin stock suficiente"); return item; }
        return newQty > 0 ? { ...item, cantidad: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => setCarrito(carrito.filter(item => item.id !== id));

  const total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  const handleSave = async () => {
    if (!selectedCliente) return toast.error("Seleccione un cliente");
    if (carrito.length === 0) return toast.error("El carrito está vacío");

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      
      // 1. Crear el pedido
      const { data: pedido, error: pError } = await supabase
        .from("pedidos")
        .insert([{ cliente_id: Number(selectedCliente), total, estado: "pendiente" }])
        .select()
        .single();

      if (pError) throw pError;

      // 2. Crear los detalles del pedido
      const detalles = carrito.map(item => ({
        pedido_id: pedido.id,
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio
      }));

      const { error: dError } = await supabase.from("pedido_detalles").insert(detalles);
      if (dError) throw dError;

      toast.success("Pedido creado correctamente");
      onSuccess();
      onClose();
      setCarrito([]);
    } catch (err) {
      toast.error("Error al procesar el pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-black">
            <ShoppingCart className="text-pink-600" /> Nuevo Pedido de Venta
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Columna Izquierda: Selección */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3 h-3" /> Cliente
              </label>
              <Select onValueChange={setSelectedCliente} value={selectedCliente}>
                <SelectTrigger className="h-12 border-gray-200">
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.nombre} {c.apellido}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 relative">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Package className="w-3 h-3" /> Buscar Productos
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Escriba nombre o SKU..." 
                  className="pl-10 h-12 border-gray-200 focus:ring-pink-500"
                  value={searchProd}
                  onChange={(e) => setSearchProd(e.target.value)}
                />
              </div>

              {/* Resultados de búsqueda rápidos */}
              {filteredProducts.length > 0 && (
                <div className="absolute z-50 w-full bg-white border rounded-xl shadow-2xl mt-1 overflow-hidden">
                  {filteredProducts.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="w-full p-3 text-left hover:bg-pink-50 flex justify-between items-center border-b last:border-0"
                    >
                      <div>
                        <p className="font-bold text-gray-900">{p.nombre}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">SKU: {p.sku} | Stock: {p.stock}</p>
                      </div>
                      <span className="font-black text-pink-600">S/ {p.precio.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Carrito */}
          <div className="bg-gray-50 rounded-2xl border p-4 flex flex-col min-h-100">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Calculator className="w-3 h-3" /> Resumen del Carrito
            </h3>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-75 pr-2">
              {carrito.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                  <ShoppingCart className="w-12 h-12 mb-2" />
                  <p className="text-sm font-bold">Carrito vacío</p>
                </div>
              ) : (
                carrito.map(item => (
                  <div key={item.id} className="bg-white p-3 rounded-xl border flex items-center justify-between shadow-sm">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-800 line-clamp-1">{item.nombre}</p>
                      <p className="text-xs text-pink-600 font-black">S/ {item.precio.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-lg bg-gray-50">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-pink-600"><Minus className="w-3 h-3" /></button>
                        <span className="w-8 text-center text-sm font-black">{item.cantidad}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-pink-600"><Plus className="w-3 h-3" /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-end">
                <span className="text-xs font-black text-gray-400 uppercase">Total a Pagar</span>
                <span className="text-3xl font-black text-gray-900 tracking-tighter">S/ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading} className="h-12 font-bold px-8">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || carrito.length === 0} 
            className="h-12 bg-pink-600 hover:bg-pink-700 font-black px-10 shadow-lg"
          >
            {loading ? "Procesando..." : "Confirmar Venta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}