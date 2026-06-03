"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  Package, 
  Loader2,
  X,
  CreditCard,
  Receipt,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Estilos constantes para coherencia visual de GUOR PRO
const ERP_LABEL = "text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2.5 mb-3";
const ERP_INPUT_BOX = "bg-slate-50/50 backdrop-blur-sm border border-slate-200/50 rounded-[24px] focus-within:border-pink-300 focus-within:bg-white focus-within:shadow-2xl focus-within:shadow-pink-50/50 transition-all duration-500";

export default function CreatePedidoDialog({ isOpen, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  
  const [selectedCliente, setSelectedCliente] = useState<string>("");
  const [searchProd, setSearchProd] = useState("");
  const [carrito, setCarrito] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      const loadInitialData = async () => {
        try {
          const [cliRes, prodRes] = await Promise.all([
            fetch('/api/admin/clientes'),
            fetch('/api/admin/productos')
          ]);
          const cliData = await cliRes.json();
          const prodData = await prodRes.json();
          setClientes(cliData || []);
          setProductos(prodData.filter((p: any) => p.stock > 0) || []);
        } catch (error) {
          toast.error("Error al sincronizar datos de inventario");
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
    ).slice(0, 6);
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
        if (newQty > item.stock) { toast.error("Límite de stock"); return item; }
        return newQty > 0 ? { ...item, cantidad: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCarrito(carrito.filter(item => item.id !== id));
    toast.info("Prenda removida del carrito");
  };

  const total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  const handleSave = async () => {
    if (!selectedCliente) return toast.error("Seleccione un cliente");
    if (carrito.length === 0) return toast.error("El carrito está vacío");

    setLoading(true);
    try {
      const pedidoData = {
        cliente_id: selectedCliente,
        metodo_pago: "EFECTIVO",
        subtotal: total / 1.18,
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

      if (!response.ok) throw new Error("Error al procesar pedido");

      toast.success("¡Venta registrada correctamente!");
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
      <DialogContent className="max-w-6xl h-[92vh] bg-white/95 backdrop-blur-2xl rounded-[48px] overflow-hidden p-0 border border-white/20 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.15)] flex flex-col animate-in zoom-in-95 duration-500">
        
        {/* HEADER DE CAJA PREMIUM */}
        <div className="px-10 py-10 border-b border-slate-100/50 flex items-center justify-between relative overflow-hidden bg-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-50/30 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse"></div>
          <div className="relative flex items-center gap-6">
            <div className="p-4 bg-gradient-to-br from-pink-500 to-rose-600 rounded-[28px] shadow-lg shadow-pink-200/50 rotate-3 transition-transform hover:rotate-0">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <DialogTitle className="text-3xl font-black text-[#1a2b4b] uppercase tracking-tighter">
                  Terminal de Ventas
                </DialogTitle>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> En Línea
                </div>
              </div>
              <p className="text-slate-400 text-sm font-semibold mt-1">GUOR PRO System <span className="mx-2 opacity-30">•</span> Caja Centralizada de Operaciones</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-4 bg-slate-50 hover:bg-rose-50 rounded-full transition-all group relative z-10"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-rose-500 transition-colors" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          
          {/* PANEL IZQUIERDO: CONFIGURACIÓN Y BÚSQUEDA */}
          <div className="flex-1 p-10 space-y-10 overflow-y-auto custom-scrollbar bg-white/50">
            
            {/* SECCIÓN CLIENTE CON DISEÑO DE TARJETA */}
            <div className="space-y-4">
              <Label className={ERP_LABEL}><User className="w-4 h-4" /> Entidad Responsable</Label>
              <Select onValueChange={setSelectedCliente} value={selectedCliente}>
                <SelectTrigger className="bg-white border border-slate-200 h-16 rounded-[24px] px-6 font-bold text-slate-700 shadow-sm hover:shadow-md transition-all focus:ring-4 focus:ring-pink-50/50">
                  <SelectValue placeholder="Busca o selecciona un cliente corporativo..." />
                </SelectTrigger>
                <SelectContent className="rounded-[32px] border-none shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] p-3 backdrop-blur-xl bg-white/95">
                  {clientes.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()} className="rounded-2xl py-4 px-5 font-bold mb-2 focus:bg-pink-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-[10px]">{c.razon_social?.substring(0, 2).toUpperCase()}</div>
                        <div className="flex flex-col">
                          <span className="text-slate-900">{c.razon_social}</span>
                          <span className="text-[10px] text-pink-500 font-black uppercase tracking-widest">RUC: {c.ruc}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* BUSCADOR DE PRODUCTOS CON RESULTADOS FLOTANTES */}
            <div className="space-y-4 relative">
              <div className="flex justify-between items-center">
                <Label className={ERP_LABEL}><Package className="w-4 h-4" /> Catálogo de Inventario</Label>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Stock en tiempo real</span>
              </div>
              <div className={cn("flex items-center px-6 h-20", ERP_INPUT_BOX)}>
                <Search className="w-6 h-6 text-slate-300 mr-4" />
                <Input 
                  placeholder="Introduce nombre de prenda, color o SKU..." 
                  className="bg-transparent border-none h-full font-bold focus-visible:ring-0 shadow-none text-xl text-slate-800 placeholder:text-slate-300"
                  value={searchProd}
                  onChange={(e) => setSearchProd(e.target.value)}
                />
                {searchProd && (
                   <button onClick={() => setSearchProd("")} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
                      <X className="w-4 h-4 text-slate-400" />
                   </button>
                )}
              </div>

              {/* Resultados de búsqueda con efecto glass */}
              {filteredProducts.length > 0 && (
                <div className="absolute z-50 w-full bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-[32px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)] mt-3 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 p-2">
                  {filteredProducts.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="w-full p-4 text-left hover:bg-pink-50/50 rounded-2xl flex justify-between items-center transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform">
                          {p.imagen_url ? <img src={p.imagen_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-slate-300" />}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-lg leading-tight group-hover:text-pink-600 transition-colors">{p.nombre}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">SKU: {p.sku || 'N/A'}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                              p.stock < 10 ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
                            )}>
                              {p.stock} Disponibles
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Precio Unit.</p>
                          <p className="font-black text-[#1a2b4b] text-xl tracking-tighter">S/ {p.precio.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-white border border-slate-100 rounded-xl group-hover:bg-pink-500 group-hover:text-white group-hover:border-pink-500 transition-all shadow-sm">
                           <Plus className="w-5 h-5" />
                        </div>
                      </div>
                    </button>
                  ))}
                  <div className="p-4 bg-slate-50/50 text-center">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Fin de resultados</p>
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN DE MÉTODOS Y DETALLES */}
            <div className="grid grid-cols-2 gap-6">
               <div className="p-8 bg-gradient-to-br from-slate-50 to-white rounded-[40px] border border-slate-100 hover:shadow-lg transition-all duration-500 group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl group-hover:scale-110 transition-transform">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Condición de Pago</p>
                  </div>
                  <p className="text-xl font-black text-slate-800">Efectivo / Caja Chapa</p>
               </div>
               <div className="p-8 bg-gradient-to-br from-slate-50 to-white rounded-[40px] border border-slate-100 hover:shadow-lg transition-all duration-500 group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl group-hover:scale-110 transition-transform">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Documento Fiscal</p>
                  </div>
                  <p className="text-xl font-black text-slate-800">Nota de Pedido Interna</p>
               </div>
            </div>
          </div>

          {/* PANEL DERECHO: RESUMEN Y CHECKOUT (MÁS OSCURO Y PROFESIONAL) */}
          <div className="w-[480px] bg-slate-900 border-l border-white/5 p-10 flex flex-col relative">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-pink-500/5 via-transparent to-transparent pointer-events-none"></div>
            
            <h3 className="text-[12px] font-black text-pink-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <Sparkles className="w-4 h-4" /> Detalle de Liquidación
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-6 my-8 pr-2 custom-scrollbar relative z-10">
              {carrito.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale-0">
                  <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                    <ShoppingCart className="w-12 h-12 text-slate-400" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Esperando Selección</p>
                </div>
              ) : (
                carrito.map(item => (
                  <div key={item.id} className="bg-slate-800/50 backdrop-blur-md p-6 rounded-[32px] border border-white/5 flex flex-col gap-4 group hover:bg-slate-800 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-black text-base text-white leading-tight group-hover:text-pink-400 transition-colors">{item.nombre}</p>
                        <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-widest">S/ {item.precio.toFixed(2)} / unidad</p>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)} 
                        className="text-slate-600 hover:text-rose-500 transition-all p-2 hover:bg-rose-500/10 rounded-xl"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center bg-slate-950 rounded-[20px] p-1.5 border border-white/5">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)} 
                          className="w-10 h-10 flex items-center justify-center hover:bg-slate-800 rounded-2xl transition-all text-slate-400 hover:text-white"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-black text-lg text-white">{item.cantidad}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)} 
                          className="w-10 h-10 flex items-center justify-center hover:bg-slate-800 rounded-2xl transition-all text-slate-400 hover:text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Subtotal</p>
                         <p className="font-black text-white text-2xl tracking-tighter">S/ {(item.precio * item.cantidad).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* TOTALES Y ACCIÓN FINAL */}
            <div className="mt-auto space-y-8 pt-8 border-t border-white/10 relative z-10">
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">
                    <span>Base Imponible</span>
                    <span>S/ {(total / 1.18).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">
                    <span>Impuestos (18%)</span>
                    <span>S/ {(total - (total / 1.18)).toFixed(2)}</span>
                 </div>
              </div>

              <div className="flex justify-between items-end bg-white/5 p-8 rounded-[36px] border border-white/5">
                <span className="text-[12px] font-black text-pink-400 uppercase tracking-[0.4em] mb-2">Total Final</span>
                <span className="text-5xl font-black text-white tracking-tighter">S/ {total.toFixed(2)}</span>
              </div>
              
              <div className="flex flex-col gap-4">
                <Button 
                  onClick={handleSave} 
                  disabled={loading || carrito.length === 0} 
                  className="w-full h-24 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-[32px] font-black text-2xl shadow-2xl shadow-pink-900/50 transition-all active:scale-95 flex items-center justify-center gap-4 group"
                >
                  {loading ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <>
                      <span>Procesar Venta</span>
                      <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                    </>
                  )}
                </Button>
                <button 
                  onClick={onClose} 
                  className="w-full py-4 text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors"
                >
                  Cancelar Operación
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
