"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import { Save, Loader2, ArrowLeft, Package, Layers, ImageIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useVarianteStockResumen } from '@/lib/hooks/useStockResumen';
import { GeneralInfoSection } from "./sections/GeneralInfoSection";
import { VariantsSection } from "./sections/VariantsSection";
import { ImageUploadSection } from "./sections/ImageUploadSection";
import { generateSKU, generateVariantSKU } from "@/lib/utils/producto-utils";

// ── Definición de Interfaces Estrictas ──

export interface Categoria {
  id: number | string;
  nombre: string;
}

interface VarianteProductoBase {
  id?: string | number;
  color: string;
  talla: string;
  sku: string;
  stock?: number;
  stock_actual?: number;
  textura?: string;
}

interface FichaTecnicaForm {
  version?: string;
  version_detallada?: string;
  sam_total?: string | number;
  costo_estimado?: string | number;
}

export interface ProductoFormData {
  id?: string | number;
  nombre: string;
  precio: string | number;
  categoria_id: string;
  categoria_nombre: string;
  sku: string;
  estado: "activo" | "inactivo";
  imagen: string | null;
  variantes_producto?: VarianteProductoBase[];
  variantes: {
    id?: string | number;
    color: string;
    talla: string;
    sku: string;
    stock: number;
  }[];
  reglas_descuento?: unknown;
  fichas_tecnicas_id?: string | number | null;
  ficha_tecnica?: FichaTecnicaForm;
}

interface ProductFormProps {
  mode: "create" | "edit";
  initialData?: ProductoFormData | null;
  categorias: Categoria[];
  nextId?: number;
}

export default function ProductForm({ mode, initialData, categorias, nextId }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { data: variantesDB } = useVarianteStockResumen(
    initialData?.id ? Number(initialData.id) : undefined
  );

  // Solución al error 2352: Mapeo seguro utilizando 'unknown' para evitar conflictos de superposición de tipos
  const stockResumen: { sku: string; color: string; talla: string; stock: number }[] =
    ((variantesDB as unknown as VarianteProductoBase[] | undefined) ?? initialData?.variantes_producto ?? []).map((v) => ({
      sku: v.sku ?? "",
      color: v.color ?? "",
      talla: v.talla ?? "",
      stock: v.stock ?? v.stock_actual ?? 0,
    }));

  const methods = useForm<ProductoFormData>({
    defaultValues: initialData
      ? {
          ...initialData,
          categoria_id: initialData.categoria_id != null ? String(initialData.categoria_id) : "",
          estado: initialData.estado || "activo",
          imagen: initialData.imagen ?? null,
          variantes: initialData.variantes_producto?.map((v) => ({
            id: v.id,
            color: v.color,
            talla: v.talla,
            sku: v.sku,
            stock: v.stock ?? v.stock_actual ?? 0,
          })) ?? [],
        }
      : {
          nombre: "",
          precio: "",
          categoria_id: "",
          categoria_nombre: "",
          sku: "",
          estado: "activo",
          imagen: null,
          variantes: [{ color: "", talla: "", stock: 0, sku: "" }],
        },
  });

  const onSubmit = async (data: ProductoFormData) => {
    setLoading(true);
    try {
      const isCreate = mode === "create";
      const url = isCreate
        ? "/api/admin/productos"
        : `/api/admin/productos/${initialData?.id}`;

      const categoria = categorias.find((c) => c.id.toString() === data.categoria_id.toString());
      const catNombre = categoria?.nombre ?? "GEN";
      const skuProducto = data.sku || generateSKU(data.nombre, catNombre, nextId || 0);

      const bodyParaAPI = {
        producto: {
          nombre: data.nombre,
          precio: typeof data.precio === "string" ? parseFloat(data.precio) || 0 : data.precio,
          categoria_id: parseInt(data.categoria_id, 10),
          sku: skuProducto,
          estado: data.estado || "activo",
          imagen: data.imagen || null,
          reglas_descuento: data.reglas_descuento || null,
          fichas_tecnicas_id: data.fichas_tecnicas_id || null,
        },
        variantes: (data.variantes || []).map((v) => ({
          id: v.id,
          color: v.color,
          talla: v.talla,
          sku: generateVariantSKU(skuProducto, v.color, v.talla),
          stock: typeof v.stock === "string" ? parseInt(v.stock, 10) || 0 : v.stock,
          estado: "activo",
        })),
        nueva_ficha_relacional: data.ficha_tecnica ? {
          version: data.ficha_tecnica.version || "1.0",
          descripcion_detallada: data.ficha_tecnica.version_detallada || "Sin descripción",
          sam_total: typeof data.ficha_tecnica.sam_total === "string" ? parseFloat(data.ficha_tecnica.sam_total) || 0 : data.ficha_tecnica.sam_total || 0,
          costo_estimado: typeof data.ficha_tecnica.costo_estimado === "string" ? parseFloat(data.ficha_tecnica.costo_estimado) || 0 : data.ficha_tecnica.costo_estimado || 0,
          estado: "Borrador",
          imagen_geometral: null,
        } : null,
      };

      const response = await fetch(url, {
        method: isCreate ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyParaAPI),
      });

      if (!response.ok) throw new Error("Error al guardar el producto");

      toast.success("Producto guardado correctamente");
      router.push("/admin/Panel-Administrativo/productos");
      router.refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Ocurrió un error inesperado";
      toast.error(msg);
    } finally { // Solución al error de sintaxis / typo en la línea 168 (cambiado de 'file' a 'finally')
      setLoading(false);
    }
  };

  const isEdit = mode === "edit";

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="max-w-5xl mx-auto pb-24">

        {/* ── Cabecera ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/admin/Panel-Administrativo/productos"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-[11px] font-black uppercase tracking-widest mb-2 transition-colors"
            >
              <ArrowLeft size={12} />
              Volver al Inventario
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-7 bg-teal-500 rounded-full" />
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {isEdit ? "Editar Producto" : "Nuevo Producto"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="h-10 px-5 text-xs font-bold border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-10 px-6 text-xs font-black bg-teal-600 hover:bg-teal-700 text-white rounded-xl gap-2 shadow-sm shadow-teal-200"
            >
              {loading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <Save size={14} />
              )}
              {isEdit ? "Guardar Cambios" : "Crear Producto"}
            </Button>
          </div>
        </div>

        <div className="space-y-5">
          {/* ── Fila superior: imagen + info general ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
            <SectionCard title="Imagen del Producto" icon={<ImageIcon size={12} />}>
              <ImageUploadSection />
            </SectionCard>

            <SectionCard title="Información General" icon={<Package size={12} />}>
              <GeneralInfoSection
                categorias={categorias}
                isEdit={isEdit}
                nextId={nextId}
              />
            </SectionCard>
          </div>

          {/* ── Variantes ── */}
          <SectionCard title="Variantes e Inventario" icon={<Layers size={12} />}>
            <VariantsSection stockResumen={stockResumen} mode={mode} />
          </SectionCard>
        </div>
      </form>
    </FormProvider>
  );
}

function SectionCard({
  children,
  title,
  icon,
}: {
  children: React.ReactNode;
  title: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3.5 border-b border-slate-100 bg-slate-50/60">
        {icon && <span className="text-teal-500">{icon}</span>}
        <h3 className="text-[10px] font-black text-teal-600 uppercase tracking-widest">
          {title}
        </h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}