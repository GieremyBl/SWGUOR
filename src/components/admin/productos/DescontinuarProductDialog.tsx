"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2, X,
  PackageX, Box, Archive, 
  ArrowRightLeft
} from "lucide-react";
import { tienePermiso, type RolUsuario } from "@/lib/constants/roles";

// ── Definición de Interfaces Estrictas ──────────────────────────────────

export interface ProductoDescontinuarData {
  id: string | number;
  nombre: string;
}

interface DescontinuarProductoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  producto: ProductoDescontinuarData | null | undefined;
  rolUsuario: RolUsuario;
}

export default function DescontinuarProductoDialog({
  isOpen,
  onClose,
  onSuccess,
  producto,
  rolUsuario,
}: DescontinuarProductoDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!tienePermiso(rolUsuario, 'descontinuar_productos')) return null;

  const handleDescontinuar = async () => {
    if (!producto?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/productos?id=${producto.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "inactivo" }),
      });

      const result = await response.json();

      if (!response.ok)
        throw new Error(result.error || "No se pudo descontinuar el producto");

      toast.success("Catálogo actualizado: Producto fuera de circulación");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al descontinuar:", error);
      // Validación segura del error capturado en lugar de usar 'any'
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error inesperado al descontinuar");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white/95 backdrop-blur-2xl border-none shadow-[0_32px_128px_-32px_rgba(245,158,11,0.2)] p-0 overflow-hidden rounded-[48px] animate-in zoom-in-95 duration-500">

        {/* CABECERA: Identidad de Catálogo */}
        <div className="bg-gradient-to-br from-amber-600 to-yellow-900 px-10 py-12 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl" />

          <div className="flex justify-between items-start relative z-10">
            <div className="p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl">
              <PackageX className="w-7 h-7 text-white" />
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>

          <div className="mt-8 space-y-2 relative z-10">
            <DialogTitle className="text-3xl font-black tracking-tighter uppercase leading-tight">
              Retirar de <br /> Circulación
            </DialogTitle>
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md w-fit px-3 py-1 rounded-full border border-white/10">
              <span className="text-[10px] font-black text-amber-100 uppercase tracking-widest">
                Gestión de Portafolio
              </span>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-8">
          {/* INFO DEL PRODUCTO */}
          <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
                <Box className="w-7 h-7 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU / Identificador</p>
                <p className="text-sm font-black text-slate-800 line-clamp-1">{producto?.nombre || "Producto"}</p>
              </div>
            </div>
          </div>

          {/* ADVERTENCIA DE IMPACTO */}
          <div className="bg-amber-50/50 border border-amber-100 rounded-[32px] p-8 space-y-6 relative overflow-hidden group">
            <div className="flex gap-4 relative z-10">
              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-700 leading-relaxed">
                  ¿Confirma la descontinuación de <span className="font-black text-amber-600 italic">{producto?.nombre}</span>?
                </p>

                <div className="grid grid-cols-1 gap-3">
                  <WarningItem
                    icon={<Archive className="w-3.5 h-3.5" />}
                    text="El producto se ocultará del catálogo de ventas."
                  />
                  <WarningItem
                    icon={<ArrowRightLeft className="w-3.5 h-3.5" />}
                    text="Se mantendrá el historial de pedidos previo."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ACCIONES FINALES */}
          <DialogFooter className="flex flex-col gap-4">
            <Button
              onClick={handleDescontinuar}
              disabled={loading}
              className="w-full h-16 bg-amber-600 hover:bg-amber-700 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-amber-200 transition-all active:scale-95 group"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Sincronizando...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  Descontinuar Ahora
                  <PackageX className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </div>
              )}
            </Button>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] hover:text-slate-600 transition-colors"
            >
              Mantener en Catálogo
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── UI Helpers ────────────────────────────────────────────────
function WarningItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-amber-100 shadow-sm">
      <div className="text-amber-600 mt-0.5 shrink-0">
        {icon}
      </div>
      <p className="text-[11px] font-bold text-slate-500 leading-tight">
        {text}
      </p>
    </div>
  );
}