"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { XCircle, Loader2, AlertTriangle, X, RefreshCcw, Trash2, Ban } from "lucide-react";

export default function CancelPedidoDialog({ isOpen, pedido, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [motivo, setMotivo]   = useState("");

  const handleClose = () => {
    setMotivo("");
    onClose();
  };

  const handleCancel = async () => {
    const motivoTrimmed = motivo.trim();
    if (!motivoTrimmed) {
      toast.error("Debe ingresar el motivo de cancelación");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/pedidos/${pedido.id}/cancelar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: motivoTrimmed }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Error al anular");

      toast.success("Pedido anulado correctamente");
      setMotivo("");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "No se pudo anular el pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white/95 backdrop-blur-2xl border-none shadow-[0_32px_128px_-32px_rgba(220,38,38,0.3)] p-0 overflow-hidden rounded-[48px] animate-in zoom-in-95 duration-500">

        {/* Header */}
        <div className="bg-gradient-to-br from-red-600 to-rose-950 px-10 py-12 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/20 rounded-full -ml-12 -mb-12 blur-xl" />
          <div className="flex justify-between items-start relative z-10">
            <div className="p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl">
              <Ban className="w-8 h-8 text-white" />
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
          <div className="mt-8 space-y-2 relative z-10">
            <DialogTitle className="text-3xl font-black tracking-tighter uppercase leading-tight">
              Anulación de <br /> Transacción
            </DialogTitle>
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md w-fit px-3 py-1 rounded-full border border-white/10">
              <span className="text-[10px] font-black text-rose-200 uppercase tracking-widest">
                Folio: #{pedido?.id?.toString().padStart(4, "0")}
              </span>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-6">

          {/* Advertencia */}
          <div className="bg-rose-50/50 border border-rose-100 rounded-[32px] p-6 space-y-4">
            <p className="text-sm font-bold text-slate-700 leading-relaxed">
              ¿Confirma la anulación del pedido del cliente{" "}
              <span className="font-black text-red-600 italic">
                "{pedido?.clientes?.razon_social || "Cliente no identificado"}"
              </span>?
            </p>
            <div className="grid grid-cols-1 gap-3">
              <ImpactItem
                icon={<RefreshCcw className="w-3.5 h-3.5" />}
                text="Restauración automática de stock en inventario."
              />
              <ImpactItem
                icon={<XCircle className="w-3.5 h-3.5" />}
                text="El estado pasará irreversiblemente a CANCELADO."
              />
            </div>
          </div>

          {/* Motivo — requerido por el endpoint */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <AlertTriangle className="w-3 h-3 text-red-500" />
              Motivo de cancelación <span className="text-red-500">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Cliente solicitó cancelación por cambio de colección..."
              rows={3}
              disabled={loading}
              className="w-full rounded-2xl border border-rose-100 bg-rose-50/30 p-3 text-xs font-medium text-slate-700 placeholder-slate-400 focus:border-red-300 focus:outline-none focus:ring-4 focus:ring-red-100 transition-all resize-none disabled:opacity-50"
            />
          </div>

          <DialogFooter className="flex flex-col gap-4">
            <Button
              onClick={handleCancel}
              disabled={loading || !motivo.trim()}
              className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-red-200 transition-all active:scale-95 group disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Ejecutando...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  Confirmar Anulación
                  <Trash2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                </span>
              )}
            </Button>
            <button
              onClick={handleClose}
              disabled={loading}
              className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] hover:text-slate-600 transition-colors"
            >
              Mantener Transacción
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImpactItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-rose-100 shadow-sm">
      <div className="text-red-600 mt-0.5 shrink-0">{icon}</div>
      <p className="text-[11px] font-bold text-slate-500 leading-tight">{text}</p>
    </div>
  );
}