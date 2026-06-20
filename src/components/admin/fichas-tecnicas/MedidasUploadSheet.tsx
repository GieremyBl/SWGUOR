"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  FormField, FormControl, FormItem, FormMessage,
} from "@/components/ui/form";
import PdfUploadExtractor from "@/components/admin/common/PdfUploadExtractor";

// ─── Schema ─────────────────────────────────────────────────────────────────

const medidaSchema = z.object({
  punto_medida: z.string().min(1, "Punto de medida requerido"),
  talla:        z.string().min(1, "Talla requerida"),
  valor_cm:     z.number().nonnegative().optional(),
  tolerancia:   z.number().nonnegative().optional(),
});

const medidasUploadSchema = z.object({
  medidas: z.array(medidaSchema).min(1, "Debe haber al menos una medida"),
});

type MedidasUploadInput = z.infer<typeof medidasUploadSchema>;

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  fichaId: string;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Componente ─────────────────────────────────────────────────────────────

export default function MedidasUploadSheet({ fichaId, onClose, onSuccess }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MedidasUploadInput>({
    resolver: zodResolver(medidasUploadSchema),
    defaultValues: {
      medidas: [{ punto_medida: "", talla: "", valor_cm: undefined, tolerancia: undefined }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "medidas",
  });

  // ── Callback del extractor PDF de medidas ──────────────────
  const handlePdfExtracted = (data: any) => {
    if (data?.medidas?.length > 0) {
      replace(
        data.medidas.map((m: any) => ({
          punto_medida: m.punto_medida || "",
          talla:        m.talla        || "",
          valor_cm:     m.valor_cm     ? Number(m.valor_cm)   : undefined,
          tolerancia:   m.tolerancia   ? Number(m.tolerancia) : undefined,
        }))
      );
      toast.success(`Se extrajeron ${data.medidas.length} puntos de medida`);
    }
  };

  // ── Submit ─────────────────────────────────────────────────
  const onSubmit = async (data: MedidasUploadInput) => {
    try {
      setIsSubmitting(true);

      const res = await fetch('/api/admin/ficha-medidas', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ficha_id: fichaId, medidas: data.medidas }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Error al guardar medidas');

      toast.success("Medidas cargadas correctamente");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar las medidas");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end animate-in slide-in-from-bottom">
      <div className="bg-white w-full max-h-[90vh] overflow-y-auto rounded-t-3xl shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase">Cargar Medidas</h2>
            <p className="text-xs text-slate-400 mt-0.5">Extrae desde PDF o carga manualmente</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">

            {/* Alerta informativa */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-900">Cortador: carga tu ficha de medidas</p>
                <p className="text-xs text-emerald-700 mt-1">
                  Sube un PDF con la tabla de medidas para extraerlas automáticamente, o cárgalas manualmente.
                </p>
              </div>
            </div>

            {/* Opción 1: PDF */}
            <div className="space-y-3">
              <p className="text-sm font-black text-slate-700 uppercase tracking-widest">
                Opción 1 — Extraer desde PDF
              </p>
              <PdfUploadExtractor
                label="Cargar PDF con tabla de medidas"
                description="Arrastra el PDF o haz clic para seleccionar"
                onExtract={handlePdfExtracted}
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">o</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Opción 2: Manual */}
            <div className="space-y-4">
              <p className="text-sm font-black text-slate-700 uppercase tracking-widest">
                Opción 2 — Cargar manualmente
              </p>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Punto de Medida</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Talla</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor (cm)</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Tolerancia</th>
                      <th className="px-4 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fields.map((field, idx) => (
                      <tr key={field.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <FormField
                            control={form.control}
                            name={`medidas.${idx}.punto_medida`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder="Ej: Largo" className="border-slate-200 h-8 text-xs" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <FormField
                            control={form.control}
                            name={`medidas.${idx}.talla`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder="S, M, L..." className="border-slate-200 h-8 text-xs text-center" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <FormField
                            control={form.control}
                            name={`medidas.${idx}.valor_cm`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number" step="0.1" min="0" placeholder="0"
                                    className="border-slate-200 h-8 text-xs text-center"
                                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <FormField
                            control={form.control}
                            name={`medidas.${idx}.tolerancia`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number" step="0.1" min="0" placeholder="±0"
                                    className="border-slate-200 h-8 text-xs text-center"
                                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => remove(idx)}
                            className="text-slate-400 hover:text-red-600 transition p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button
                type="button" variant="outline"
                className="w-full border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 font-bold gap-2 h-10"
                onClick={() => append({ punto_medida: "", talla: "", valor_cm: undefined, tolerancia: undefined })}
              >
                <Plus className="w-4 h-4" /> Agregar fila
              </Button>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-3 border-t border-slate-200 pt-6">
              <Button
                type="button" variant="outline"
                className="flex-1 border-slate-200 font-bold h-11"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar Medidas
              </Button>
            </div>

          </form>
        </Form>
      </div>
    </div>
  );
}