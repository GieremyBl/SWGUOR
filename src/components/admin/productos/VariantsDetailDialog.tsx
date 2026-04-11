"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, Palette, Maximize2, AlertCircle } from "lucide-react";

interface VariantsDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  producto: any; // El producto seleccionado
}

export default function VariantsDetailDialog({
  isOpen,
  onClose,
  producto,
}: VariantsDetailDialogProps) {
  // Las variantes ya deberían venir cargadas en el objeto producto 
  // si el query de Supabase incluyó .select('*, variantes_producto(*)')
  const variantes = producto?.variantes_producto || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
        {/* Header con estilo de la marca GUOR */}
        <div className="bg-pink-600 p-6 text-white">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Package className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
                Detalle de Existencias
              </DialogTitle>
            </div>
            <DialogDescription className="text-pink-100 font-medium">
              Desglose de tallas y colores para: <span className="text-white font-bold">{producto?.nombre}</span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6">
          {variantes.length > 0 ? (
            <div className="border rounded-2xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">
                      <div className="flex items-center gap-2">
                        <Palette className="w-3 h-3" /> Color
                      </div>
                    </TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Maximize2 className="w-3 h-3" /> Talla
                      </div>
                    </TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 text-right">
                      Existencia
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variantes.map((v: any) => (
                    <TableRow key={v.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-slate-700 capitalize">
                        {v.color}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-black border-slate-200 text-slate-600 bg-white">
                          {v.talla}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`text-sm font-black ${v.stock <= 5 ? 'text-orange-600' : 'text-slate-900'}`}>
                          {v.stock} uds.
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-2xl border border-dashed">
              <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-sm font-bold text-slate-500 uppercase">
                No se encontraron variantes registradas
              </p>
              <p className="text-xs text-slate-400">
                Verifica que el producto tenga tallas y colores asignados en la base de datos.
              </p>
            </div>
          )}

          {/* Resumen Total */}
          <div className="mt-6 flex items-center justify-between p-4 bg-slate-900 rounded-2xl text-white">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Stock Total en Almacén</span>
            <span className="text-2xl font-black italic">{producto?.stock} <small className="text-[10px] not-italic text-slate-400 uppercase">Unidades</small></span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}