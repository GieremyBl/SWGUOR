"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast }   from "sonner";
import { 
  FilePen, X, Sparkles, Layers, DollarSign, 
  Clock, AlignLeft, Link as LinkIcon, Image as ImageIcon,
  Loader2, Save, Scissors
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ESTADOS_FICHA, LISTA_ESTADOS_FICHA } from "@/lib/constants/fichas-tecnicas";

interface Props {
  isOpen:    boolean;
  ficha:     any;
  onClose:   () => void;
  onSuccess: () => void;
}

export default function EditFichaDialog({ isOpen, ficha, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    version:               "",
    estado:                "borrador",
    sam_total:             "",
    costo_estimado:        "",
    descripcion_detallada: "",
    ficha_url:             "",
    imagen_geometral:      "",
  });

  useEffect(() => {
    if (ficha) setForm({
      version:               ficha.version               ?? "",
      estado:                ficha.estado                ?? "borrador",
      sam_total:             ficha.sam_total      != null ? String(ficha.sam_total)      : "",
      costo_estimado:        ficha.costo_estimado != null ? String(ficha.costo_estimado) : "",
      descripcion_detallada: ficha.descripcion_detallada ?? "",
      ficha_url:             ficha.ficha_url             ?? "",
      imagen_geometral:      ficha.imagen_geometral      ?? "",
    });
  }, [ficha]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/fichas-tecnicas/${ficha.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version:               form.version               || undefined,
          estado:                form.estado,
          sam_total:             form.sam_total      ? Number(form.sam_total)      : undefined,
          costo_estimado:        form.costo_estimado ? Number(form.costo_estimado) : undefined,
          descripcion_detallada: form.descripcion_detallada || undefined,
          ficha_url:             form.ficha_url             || undefined,
          imagen_geometral:      form.imagen_geometral      || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? "Error al guardar");
      toast.success("Ingeniería de prenda actualizada");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const estadoActual = ESTADOS_FICHA[form.estado as keyof typeof ESTADOS_FICHA] ?? ESTADOS_FICHA.borrador;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white/95 backdrop-blur-3xl border-none shadow-[0_32px_128px_-16px_rgba(0,0,0,0.15)] p-0 overflow-hidden rounded-[48px] max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-500">
        
        {/* HEADER: Estética de Atelier Premium */}
        <div className="bg-gradient-to-br from-fuchsia-900 to-pink-950 px-10 py-10 text-white relative shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/10 rounded-full -ml-16 -mb-16 blur-2xl" />
          
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl rotate-3 transition-transform hover:rotate-0">
                <Scissors className="w-8 h-8 text-fuchsia-400" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-3xl font-black tracking-tighter uppercase">
                    Editor de Ficha
                  </DialogTitle>
                  <div className="px-3 py-1 bg-fuchsia-500/20 text-fuchsia-300 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-fuchsia-500/30">
                    Pro Studio
                  </div>
                </div>
                <DialogDescription className="text-slate-400 font-bold text-sm mt-1">
                  {ficha?.productos?.nombre 
                    ? `Perfeccionando la ingeniería de: ${ficha.productos.nombre}`
                    : "Actualiza los parámetros técnicos y de diseño."}
                </DialogDescription>
              </div>
            </div>
            <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-white/50">
          
          {/* FORMULARIO ORGANIZADO EN BLOQUES */}
          <form id="edit-ficha-form" onSubmit={handleSubmit} className="space-y-12">
            
            {/* BLOQUE 1: CONTROL DE VERSIÓN Y ESTADO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="col-span-full">
                <SectionHeader icon={<Layers className="w-4 h-4" />} label="Control de Versión" />
              </div>
              
              <Field label="Versión de Ingeniería" icon={<Sparkles className="w-4 h-4" />}>
                <Input
                  value={form.version}
                  onChange={(e) => set("version", e.target.value)}
                  placeholder="Ej. 2.4.1"
                  className={inputCls}
                />
              </Field>

              <Field label="Estado Operativo" icon={<Clock className="w-4 h-4" />}>
                <Select value={form.estado} onValueChange={(v) => set("estado", v)}>
                  <SelectTrigger className={cn(inputCls, "bg-white")}>
                    <div className="flex items-center gap-3">
                      <span
                        className="w-2.5 h-2.5 rounded-full shadow-lg transition-all"
                        style={{ backgroundColor: estadoActual.dot }}
                      />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-3xl border-none shadow-2xl p-2 bg-white/95 backdrop-blur-xl">
                    {LISTA_ESTADOS_FICHA.map((value) => (
                      <SelectItem key={value} value={value} className="rounded-2xl py-3 px-4 font-bold focus:bg-fuchsia-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ESTADOS_FICHA[value].dot }} />
                          {ESTADOS_FICHA[value].label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* BLOQUE 2: PRODUCTIVIDAD Y COSTOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="col-span-full">
                <SectionHeader icon={<DollarSign className="w-4 h-4" />} label="Eficiencia y Costeo" />
              </div>

              <Field label="SAM Total (Minutos)" icon={<Clock className="w-4 h-4" />}>
                <div className="relative group">
                  <Input
                    type="number"
                    value={form.sam_total}
                    onChange={(e) => set("sam_total", e.target.value)}
                    placeholder="0.00"
                    className={cn(inputCls, "pr-12")}
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">min</span>
                </div>
              </Field>

              <Field label="Costo de Fabricación (Estimado)" icon={<DollarSign className="w-4 h-4" />}>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">S/</span>
                  <Input
                    type="number"
                    value={form.costo_estimado}
                    onChange={(e) => set("costo_estimado", e.target.value)}
                    placeholder="0.00"
                    className={cn(inputCls, "pl-12")}
                  />
                </div>
              </Field>
            </div>

            {/* BLOQUE 3: DOCUMENTACIÓN Y MULTIMEDIA */}
            <div className="space-y-8">
              <SectionHeader icon={<AlignLeft className="w-4 h-4" />} label="Detalles y Recursos" />
              
              <Field label="Notas de Ingeniería / Descripción" icon={<AlignLeft className="w-4 h-4" />}>
                <Textarea
                  value={form.descripcion_detallada}
                  onChange={(e) => set("descripcion_detallada", e.target.value)}
                  placeholder="Especificaciones sobre costuras, avíos, o acabados especiales..."
                  rows={4}
                  className={cn(inputCls, "h-auto py-5 resize-none")}
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Field label="Enlace Ficha Técnica (PDF)" icon={<LinkIcon className="w-4 h-4" />}>
                  <div className="relative">
                    <Input
                      value={form.ficha_url}
                      onChange={(e) => set("ficha_url", e.target.value)}
                      placeholder="https://cloud.storage/ficha.pdf"
                      className={cn(inputCls, "pl-12")}
                    />
                    <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  </div>
                </Field>
                <Field label="Imagen Geometral (Vector)" icon={<ImageIcon className="w-4 h-4" />}>
                  <div className="relative">
                    <Input
                      value={form.imagen_geometral}
                      onChange={(e) => set("imagen_geometral", e.target.value)}
                      placeholder="https://cloud.storage/geometral.png"
                      className={cn(inputCls, "pl-12")}
                    />
                    <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  </div>
                </Field>
              </div>
            </div>
          </form>
        </div>

        {/* FOOTER: Acción y Cierre */}
        <div className="px-10 py-8 bg-slate-50/80 backdrop-blur-md border-t border-slate-100/50 shrink-0 flex items-center justify-between gap-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 rounded-2xl h-14 px-8"
          >
            Descartar Cambios
          </Button>
          <Button
            type="submit"
            form="edit-ficha-form"
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-800 text-white shadow-2xl shadow-slate-200 rounded-[24px] h-14 px-10 font-black uppercase text-xs tracking-widest group"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando Ingeniería...
              </div>
            ) : (
              <div className="flex items-center gap-3">
                Guardar Ficha
                <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Helpers Premium ──────────────────────────────────────────────────
const inputCls = "bg-slate-50 border-slate-100 rounded-[20px] focus:bg-white focus:border-fuchsia-200 focus:shadow-xl focus:shadow-fuchsia-50/50 focus-visible:ring-0 transition-all h-14 px-6 text-sm font-bold text-slate-700 placeholder:text-slate-300";

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="p-2.5 bg-fuchsia-50 text-fuchsia-600 rounded-xl">
        {icon}
      </div>
      <span className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-900">{label}</span>
      <div className="h-px flex-1 bg-slate-100" />
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <Label className="text-[11px] uppercase font-black text-slate-400 flex items-center gap-2 tracking-[0.1em] ml-1">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}
