"use client";

import { useState, useEffect, useMemo } from "react";
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

export default function CreatePedidoDialog({ isOpen, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  
  const [selectedCliente, setSelectedCliente] = useState<string>("");
  const [searchProd, setSearchProd] = useState("");
  const [carrito, setCarrito] = useState<any[]>([]);

  // 1. Cargar datos iniciales desde tus nuevas APIs
  useEffect(() => {
    if (isOpen) {
      const loadInitialData = async () => {
        try {
          const [cliRes, prodRes] = await Promise.all([
            fetch('/api/admin/clientes'),
            fetch('/api/admin/productos') // Asegúrate de que esta API filtre los activos
          ]);
          
          const cliData = await cliRes.json();
          const prodData = await prodRes.json();
          
          setClientes(cliData || []);
          setProductos(prodData.filter((p: any) => p.stock > 0) || []);
        } catch (error) {
          toast.error("Error al cargar datos");
        }
      };
      loadInitialData();
    }
  }, [isOpen]);

  const filteredProducts = useMemo(() => {
    if (!searchProd) return [];
    return productos.filter(p => 
      p.nombre.toLowerCase().includes(searchProd.toLowerCase()) || 
      p.sku?.toLowerCase().includes(searchProd.toLowerCase())
    ).slice(0, 5);
  }, [searchProd, productos]);

  const addToCart = (prod: any) => {
    const exists = carrito.find(item => item.id === prod.id);
    if (exists) {
      if (exists.cantidad >= prod.stock) return toast.error("Stock insuficiente");
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

  // Remover producto del carrito
  const removeFromCart = (id: number) => {
  setCarrito(carrito.filter(item => item.id !== id));
  toast.info("Producto removido");
  };

  const total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  // 2. Lógica de guardado enviando todo a la API de pedidos
  const handleSave = async () => {
    if (!selectedCliente) return toast.error("Seleccione un cliente");
    if (carrito.length === 0) return toast.error("El carrito está vacío");

    setLoading(true);
    try {
      const pedidoData = {
        cliente_id: selectedCliente,
        metodo_pago: "EFECTIVO", // Puedes añadir un selector para esto luego
        subtotal: total / 1.18,  // Ejemplo de desglose de IGV
        impuesto: total - (total / 1.18),
        total: total,
        productos: carrito.map(item => ({
          id: item.id,
          cantidad: item.cantidad,
          precio: item.precio
        }))
      };

      const response = await fetch('/api/admin/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedidoData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Error al procesar pedido");

      toast.success("Venta realizada con éxito");
      onSuccess();
      onClose();
      setCarrito([]);
      setSelectedCliente("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col rounded-3xl p-0 border-none">
        <div className="p-6 bg-white flex-1 overflow-y-auto">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-2 text-2xl font-black">
              <div className="p-2 bg-pink-100 rounded-xl">
                <ShoppingCart className="text-pink-600" />
              </div>
              Punto de Venta Modas GUOR
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Buscador y Selección */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <User className="w-3 h-3" /> Identificar Cliente
                </label>
                <Select onValueChange={setSelectedCliente} value={selectedCliente}>
                  <SelectTrigger className="h-14 border-gray-200 rounded-2xl shadow-sm focus:ring-pink-500">
                    <SelectValue placeholder="Buscar cliente por Razón Social..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {clientes.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        <span className="font-bold">{c.razon_social}</span> 
                        <span className="ml-2 text-gray-400 text-xs">({c.ruc})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Package className="w-3 h-3" /> Añadir Prendas
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-4.5 w-5 h-5 text-gray-400" />
                  <Input 
                    placeholder="Escriba nombre de prenda o SKU..." 
                    className="pl-12 h-14 border-gray-200 rounded-2xl shadow-sm focus:ring-pink-500 text-lg"
                    value={searchProd}
                    onChange={(e) => setSearchProd(e.target.value)}
                  />
                </div>

                {filteredProducts.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl mt-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                    {filteredProducts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => addToCart(p)}
                        className="w-full p-4 text-left hover:bg-pink-50 flex justify-between items-center border-b border-gray-50 last:border-0 transition-colors"
                      >
                        <div>
                          <p className="font-bold text-gray-900">{p.nombre}</p>
                          <p className="text-[10px] text-pink-500 font-bold uppercase">Stock: {p.stock} disponibles</p>
                        </div>
                        <span className="font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-lg text-sm">S/ {p.precio.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Resumen de Compra */}
            <div className="bg-gray-50 rounded-4xl border border-gray-100 p-6 flex flex-col min-h-100">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Calculator className="w-3 h-3" /> Detalle de Venta
              </h3>

              <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {carrito.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <ShoppingCart className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest">Esperando productos...</p>
                  </div>
                ) : (
                  carrito.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm animate-in slide-in-from-right duration-300">
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-800">{item.nombre}</p>
                        <p className="text-xs text-gray-400 font-medium">S/ {item.precio.toFixed(2)} x {item.cantidad}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-gray-100 rounded-xl bg-gray-50 p-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 hover:bg-white rounded-lg transition-all"><Minus className="w-3 h-3" /></button>
                          <span className="w-8 text-center text-sm font-black">{item.cantidad}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 hover:bg-white rounded-lg transition-all"><Plus className="w-3 h-3" /></button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 pt-6 border-t-2 border-dashed border-gray-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Estimado</span>
                  <span className="text-4xl font-black text-gray-900 tracking-tighter">S/ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t flex gap-4">
          <Button variant="ghost" onClick={onClose} disabled={loading} className="h-14 flex-1 rounded-2xl font-bold">
            Descartar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || carrito.length === 0} 
            className="h-14 flex-2 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-pink-100 transition-all active:scale-95"
          >
            {loading ? "Registrando en Caja..." : "Finalizar Pedido"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}