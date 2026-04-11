"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Info, 
  Droplets, 
  Scissors, 
  Tag, 
  Wind,
  AlertCircle
} from "lucide-react";

interface TechSheetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  producto: any;
}

export default function TechSheetDialog({
  isOpen,
  onClose,
  producto,
}: TechSheetDialogProps) {
  // Extraemos la ficha técnica del producto (asumiendo que es un objeto JSON)
  const ficha = producto?.ficha_tecnica || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-white rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
        {/* Header Estilizado */}
        <div className="bg-slate-900 p-6 text-white">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-pink-600 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
                Ficha Técnica
              </DialogTitle>
            </div>
            <DialogDescription className="text-slate-400 font-medium">
              Especificaciones y cuidados de: <span className="text-pink-500 font-bold">{producto?.nombre}</span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Sección de Materiales */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Scissors className="w-4 h-4 text-pink-500" /> Composición y Materiales
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tela Principal</p>
                <p className="font-black text-slate-800">{ficha.material || "No especificado"}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Textura / Acabado</p>
                <p className="font-black text-slate-800">{ficha.acabado || "Estándar"}</p>
              </div>
            </div>
          </div>

          {/* Sección de Cuidados */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Droplets className="w-4 h-4 text-pink-500" /> Instrucciones de Lavado
            </h3>
            <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100 flex gap-4">
              <Info className="w-5 h-5 text-pink-600 shrink-0" />
              <div className="space-y-2">
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {ficha.cuidados || "Seguir las instrucciones generales de la etiqueta de la prenda."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-white border-pink-200 text-pink-700 text-[10px] font-bold">LAVADO EN FRÍO</Badge>
                  <Badge variant="secondary" className="bg-white border-pink-200 text-pink-700 text-[10px] font-bold">NO USAR LEJÍA</Badge>
                  <Badge variant="secondary" className="bg-white border-pink-200 text-pink-700 text-[10px] font-bold">PLANCHA SUAVE</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Información Adicional */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Temporada</p>
                <p className="text-sm font-black text-slate-800">{ficha.temporada || "Toda estación"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Wind className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">País de Origen</p>
                <p className="text-sm font-black text-slate-800">{ficha.origen || "Perú"}</p>
              </div>
            </div>
          </div>

          {!ficha.material && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
              <AlertCircle className="w-4 h-4" />
              <p className="text-[10px] font-bold uppercase">Ficha técnica incompleta en base de datos</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}