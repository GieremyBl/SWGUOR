"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import {
  Plus, Trash2, Box, Edit2, Check,
  X, Palette, Ruler, PackagePlus, Shirt, Scissors,
} from "lucide-react";
import { generateVariantSKU } from "@/lib/utils/producto-utils";
import { Input } from "@/components/ui/input";

// Interfaz para el tipado estricto de las variantes en el formulario
export interface VarianteForm {
  id?: string;
  color: string;
  talla: string;
  sku: string;
  stock: number;
  stock_adicional?: number;
}

const COLORES_PRENDA: { nombre: string; hex: string }[] = [
  { nombre: "Animal Print", hex: "#8B6914" },
  { nombre: "Azul", hex: "#2563eb" },
  { nombre: "Azulino", hex: "#93c5fd" },
  { nombre: "Beige", hex: "#d4b896" },
  { nombre: "Blanco", hex: "#f5f5f5" },
  { nombre: "Camel", hex: "#c19a6b" },
  { nombre: "Celeste", hex: "#7dd3fc" },
  { nombre: "Cemento", hex: "#9ca3af" },
  { nombre: "Chocolate", hex: "#5c3d1e" },
  { nombre: "Coral", hex: "#f87171" },
  { nombre: "Crema", hex: "#fef3c7" },
  { nombre: "Fucsia", hex: "#e879f9" },
  { nombre: "Grafito", hex: "#4b5563" },
  { nombre: "Gris", hex: "#9ca3af" },
  { nombre: "Guinda", hex: "#881337" },
  { nombre: "Lila", hex: "#c4b5fd" },
  { nombre: "Marron", hex: "#92400e" },
  { nombre: "Melange", hex: "#d1d5db" },
  { nombre: "Melon", hex: "#fdba74" },
  { nombre: "Negro", hex: "#1a1a1a" },
  { nombre: "Nude", hex: "#e8c9a0" },
  { nombre: "Palo Rosa", hex: "#fda4af" },
  { nombre: "Perla", hex: "#f0ece4" },
  { nombre: "Piton", hex: "#a16207" },
  { nombre: "Rojo", hex: "#dc2626" },
  { nombre: "Rosa", hex: "#f9a8d4" },
  { nombre: "Rose", hex: "#fb7185" }, // Corregido: Removido el literal intruso fontName
  { nombre: "Verde", hex: "#16a34a" },
  { nombre: "Vino", hex: "#7f1d1d" },
];

const TALLAS_ROPA = ["XS", "S", "M", "L", "XL", "XXL"] as const;
const TALLAS_PANT = ["28", "30", "32", "34"] as const;
const CATEGORIAS_PANTALON = ["Pantalones"];

function detectarTipoTallas(categoria: string): "ropa" | "pantalon" {
  return CATEGORIAS_PANTALON.includes(categoria) ? "pantalon" : "ropa";
}

function labelColor(nombre: string) {
  return nombre.replace(/_/g, " ");
}

const LABEL = "text-[9px] font-black text-gray-400 uppercase tracking-[0.14em] block mb-1";

function ColorSwatch({ hex, border }: { hex: string; border?: boolean }) {
  return (
    <span
      className={`inline-block w-3.5 h-3.5 rounded-full shrink-0 shadow-sm ${
        border ? "border-2 border-white" : "border border-gray-200"
      }`}
      style={{ background: hex }}
    />
  );
}

function StockBadge({ value }: { value: number }) {
  const n = Number(value) || 0;
  const cls =
    n === 0 ? "bg-rose-50 text-rose-500 border-rose-100"
      : n < 50 ? "bg-amber-50 text-amber-600 border-amber-100"
        : "bg-emerald-50 text-emerald-600 border-emerald-100";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-black ${cls}`}>
      <Box size={11} />{n}
    </span>
  );
}

// ─── Panel generador ──────────────────────────────────────────

function VariantBuilderPanel({
  skuMaestro,
  categoriaNombre,
  onGenerate,
  onClose,
}: {
  skuMaestro: string;
  categoriaNombre: string;
  onGenerate: (variantes: VarianteForm[]) => void; // Tipado formal en lugar de any[]
  onClose: () => void;
}) {
  const tipoTallas = detectarTipoTallas(categoriaNombre);
  const TALLAS = tipoTallas === "pantalon" ? TALLAS_PANT : TALLAS_ROPA;

  const [coloresSel, setColoresSel] = useState<string[]>([]);
  const [tallasSel, setTallasSel] = useState<string[]>([]);

  const toggle = <T extends string>(
    list: T[], setList: (v: T[]) => void, item: T
  ) => setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  const toggleAllTallas = () =>
    setTallasSel((p) => p.length === TALLAS.length ? [] : [...TALLAS]);

  const preview: VarianteForm[] = coloresSel.flatMap((color) =>
    tallasSel.map((talla) => ({
      color,
      talla,
      sku: generateVariantSKU(skuMaestro, color, talla),
      stock: 0,
      stock_adicional: 0,
    }))
  );

  return (
    <div className="border-t border-gray-100 bg-gradient-to-b from-gray-50/80 to-white">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <PackagePlus size={14} className="text-teal-500" />
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
            Generador de Variantes
          </span>
          <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase ml-2 ${
            tipoTallas === "pantalon" ? "bg-indigo-50 text-indigo-500" : "bg-teal-50 text-teal-600"
          }`}>
            {tipoTallas === "pantalon"
              ? <><Scissors size={9} /> Tallas 28–34</>
              : <><Shirt size={9} /> Tallas XS–XXL</>
            }
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="px-5 pb-5 space-y-5">
        {/* Colores */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Palette size={11} className="text-teal-400" />
            <span className={LABEL}>Colores</span>
            {coloresSel.length > 0 && (
              <span className="ml-auto text-[9px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                {coloresSel.length} seleccionados
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
            {COLORES_PRENDA.map(({ nombre, hex }) => {
              const sel = coloresSel.includes(nombre);
              return (
                <button
                  key={nombre}
                  type="button"
                  onClick={() => toggle(coloresSel, setColoresSel, nombre)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                    sel
                      ? "border-teal-300 bg-teal-50 text-teal-700 shadow-sm"
                      : "border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <ColorSwatch hex={hex} border={sel} />
                  <span className="truncate capitalize text-[11px]">{labelColor(nombre)}</span>
                  {sel && <Check size={10} className="text-teal-400 ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tallas */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Ruler size={11} className="text-indigo-400" />
            <span className={LABEL}>Tallas</span>
            <button
              type="button"
              onClick={toggleAllTallas}
              className="ml-auto text-[9px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest underline"
            >
              {tallasSel.length === TALLAS.length ? "Quitar todas" : "Seleccionar todas"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {TALLAS.map((t) => {
              const sel = tallasSel.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggle(tallasSel, setTallasSel, t)}
                  className={`min-w-[52px] px-4 py-2.5 rounded-xl border text-xs font-black uppercase transition-all ${
                    sel
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                      : "bg-white border-gray-100 text-gray-500 hover:border-indigo-200 hover:text-indigo-500"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Resumen */}
        {preview.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
            <span className="font-black text-gray-700 text-base">{preview.length}</span>
            variantes
            <span className="text-gray-200">·</span>
            <span className="font-semibold">{coloresSel.length} color{coloresSel.length !== 1 ? "es" : ""}</span>
            <span className="text-gray-200">×</span>
            <span className="font-semibold">{tallasSel.length} talla{tallasSel.length !== 1 ? "s" : ""}</span>
            <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-semibold">
              Stock inicial: 0 · se gestiona desde Inventario
            </span>
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                Vista previa · {preview.length} variantes
              </span>
            </div>
            <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
              {preview.map((v, i) => {
                const hex = COLORES_PRENDA.find((c) => c.nombre === v.color)?.hex ?? "#e5e7eb";
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-white">
                    <ColorSwatch hex={hex} />
                    <span className="text-xs font-semibold text-gray-700 w-24 capitalize">
                      {labelColor(v.color)}
                    </span>
                    <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg uppercase">
                      {v.talla}
                    </span>
                    <code className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded ml-auto">
                      {v.sku}
                    </code>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-9 rounded-xl text-xs font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => preview.length && onGenerate(preview)}
            disabled={preview.length === 0}
            className="flex items-center gap-1.5 px-5 h-9 rounded-xl text-xs font-black text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Check size={13} />
            Generar {preview.length > 0 ? `${preview.length} variantes` : "variantes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Fila de variante ─────────────────────────────────────────

function VariantRow({
  index,
  field,
  skuMaestro,
  categoriaNombre,
  mode,
  isEditing,
  onEdit,
  onCancelEdit,
  onRemove,
}: {
  index: number;
  field: VarianteForm; // Tipado estricto reemplazando 'any'
  skuMaestro: string;
  categoriaNombre: string;
  mode: "create" | "edit";
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onRemove: () => void;
}) {
  const { register, watch, setValue } = useFormContext();
  
  const color = watch(`variantes.${index}.color`) || "";
  const talla = watch(`variantes.${index}.talla`) || "";
  const stock = watch(`variantes.${index}.stock`) ?? 0;
  const stockAdicional = watch(`variantes.${index}.stock_adicional`) || 0;

  const tipoTallas = integrateTipoTallas(categoriaNombre);
  function integrateTipoTallas(cat: string) { return detectarTipoTallas(cat); }
  const TALLAS = tipoTallas === "pantalon" ? TALLAS_PANT : TALLAS_ROPA;
  const hex = COLORES_PRENDA.find((c) => c.nombre === color)?.hex ?? "#e5e7eb";

  useEffect(() => {
    if (color && talla && skuMaestro !== "SKU") {
      const nuevoSku = generateVariantSKU(skuMaestro, color, talla);
      setValue(`variantes.${index}.sku`, nuevoSku, { shouldDirty: true });
    }
  }, [color, talla, skuMaestro, index, setValue]);

  const sku = watch(`variantes.${index}.sku`) || field.sku || "—";

  if (isEditing) {
    return (
      <tr className="bg-teal-50/30 border-l-2 border-teal-500 transition-colors">
        <td className="px-5 py-3">
          <div className="flex items-center gap-2">
            <ColorSwatch hex={hex} />
            <select
              {...register(`variantes.${index}.color`)}
              className="text-xs font-semibold rounded-lg border border-gray-200 bg-white p-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 capitalize"
            >
              {COLORES_PRENDA.map((c) => (
                <option key={c.nombre} value={c.nombre}>
                  {labelColor(c.nombre)}
                </option>
              ))}
            </select>
          </div>
        </td>
        <td className="px-5 py-3">
          <select
            {...register(`variantes.${index}.talla`)}
            className="text-xs font-black rounded-lg border border-gray-200 bg-white p-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 uppercase"
          >
            {TALLAS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </td>
        <td className="px-5 py-3">
          <code className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded-lg block w-fit">
            {sku}
          </code>
        </td>
        <td className="px-5 py-3 text-center">
          <StockBadge value={stock} />
        </td>
        {mode === "edit" && (
          <td className="px-5 py-3 text-center">
            <Input
              type="number"
              min={0}
              placeholder="0"
              {...register(`variantes.${index}.stock_adicional`, { valueAsNumber: true })}
              className="w-20 h-8 text-center text-xs font-black text-sky-600 bg-white border-gray-200 focus:ring-sky-500"
            />
          </td>
        )}
        <td className="px-5 py-3">
          <div className="flex justify-end items-center gap-1.5">
            <button
              type="button"
              onClick={onCancelEdit}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Confirmar cambios"
            >
              <Check size={14} className="text-teal-600" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="group hover:bg-gray-50/50 transition-colors">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <ColorSwatch hex={hex} />
          <span className="text-sm font-semibold text-gray-700 capitalize">
            {labelColor(color) || "—"}
          </span>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-xs font-black text-gray-600 uppercase bg-gray-100 px-2.5 py-1 rounded-lg">
          {talla || "—"}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <code className="text-[10px] font-mono bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg">
          {sku}
        </code>
      </td>
      <td className="px-5 py-3.5 text-center">
        <StockBadge value={stock} />
      </td>
      {mode === "edit" && (
        <td className="px-5 py-3.5 text-center">
          {Number(stockAdicional) > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-black text-sky-600 bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-lg">
              +{stockAdicional}
            </span>
          ) : (
            <span className="text-gray-300 text-xs">—</span>
          )}
        </td>
      )}
      <td className="px-5 py-3.5">
        <div className="flex justify-end items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Componente principal ─────────────────────────────────────

export function VariantsSection({ stockResumen = [], mode = "create" }: {
  stockResumen?: { sku: string; color: string; talla: string; stock: number }[];
  mode?: "create" | "edit";
}) {
  const { control, watch, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: "variantes" });

  const skuMaestro = watch("sku") || "SKU";
  const categoriaNombre = watch("categoria_nombre") || "";

  const [showBuilder, setShowBuilder] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!stockResumen?.length) return;
    const allVariants = (watch("variantes") as VarianteForm[]) || [];
    stockResumen.forEach((item) => {
      const index = allVariants.findIndex(
        (v) => v.sku === item.sku || (v.color === item.color && v.talla === item.talla)
      );
      if (index !== -1) {
        setValue(`variantes.${index}.stock`, item.stock ?? 0, { shouldDirty: false });
      }
    });
  }, [stockResumen, setValue, watch]);

  const totalStock = (watch("variantes") as VarianteForm[] || []).reduce(
    (acc: number, v: VarianteForm) => acc + (Number(v.stock) || 0), 0
  );

  const handleGenerate = (nuevas: VarianteForm[]) => {
    const existing = (watch("variantes") as VarianteForm[]) || [];
    const sinDuplicados = nuevas.filter(
      (n) => !existing.some((e) => e.color === n.color && e.talla === n.talla)
    );
    sinDuplicados.forEach((v) => append(v));
    setShowBuilder(false);
  };

  const colHeaders = [
    "Color", "Talla", "SKU Variante", "Stock",
    ...(mode === "edit" ? ["+ Agregar"] : []),
    "",
  ];

  return (
    <div className="max-w-4xl mx-auto w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-teal-500 rounded-full" />
          <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest">
            Variantes de Inventario
          </h3>
          {fields.length > 0 && (
            <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {fields.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {totalStock > 0 && (
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Stock total: <span className="text-gray-700">{totalStock}</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => { setShowBuilder((v) => !v); setEditingIndex(null); }}
            className={`flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-black transition-all ${
              showBuilder
                ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                : "bg-teal-600 hover:bg-teal-700 text-white"
            }`}
          >
            {showBuilder ? <X size={13} /> : <Plus size={13} />}
            {showBuilder ? "Cerrar" : "Agregar variantes"}
          </button>
        </div>
      </div>

      <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
        {fields.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                {colHeaders.map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {fields.map((field, index) => (
                <VariantRow
                  key={field.id}
                  index={index}
                  field={field as unknown as VarianteForm}
                  skuMaestro={skuMaestro}
                  categoriaNombre={categoriaNombre}
                  mode={mode}
                  isEditing={editingIndex === index}
                  onEdit={() => { setEditingIndex(index); setShowBuilder(false); }}
                  onCancelEdit={() => setEditingIndex(null)}
                  onRemove={() => {
                    if (editingIndex === index) setEditingIndex(null);
                    remove(index);
                  }}
                />
              ))}
            </tbody>
          </table>
        ) : (
          <div className="bg-white flex flex-col items-center justify-center py-14 gap-3 text-gray-300">
            <Box size={36} strokeWidth={1} />
            <p className="text-[10px] font-black uppercase tracking-widest">
              Sin variantes · Selecciona colores y tallas
            </p>
          </div>
        )}

        {showBuilder && (
          <VariantBuilderPanel
            skuMaestro={skuMaestro}
            categoriaNombre={categoriaNombre}
            onGenerate={handleGenerate}
            onClose={() => setShowBuilder(false)}
          />
        )}
      </div>
    </div>
  );
}