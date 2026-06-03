"use client";

import Image from "next/image"; // Solución a la advertencia de ESLint
import { Package, TrendingUp, Box, BarChart2, Palette, Ruler, Clock, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SUPABASE_STORAGE =
  "https://fkpvmgfsopjhvorckoat.supabase.co/storage/v1/object/public/productos/";

// ── Interfaces Estrictas ──

export interface ProductDisplayData {
  id: string | number;
  nombre: string;
  sku: string;
  precio: string | number;
  estado: "activo" | "inactivo";
  imagen: string | null;
  stock: number;
  moq?: number | null;
  destacado?: boolean | null;
  colores_disponibles?: string[] | null;
  tallas_disponibles?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  descripcion?: string | null;
}

interface Props {
  producto: ProductDisplayData;
  categoria: string;
}

function resolveImageUrl(imagen: string | null): string | null {
  if (!imagen) return null;
  const raw = String(imagen).trim();
  if (raw === "null" || raw === "") return null;
  if (raw.startsWith("http")) return raw;
  const fileName = raw.split("/").pop();
  return fileName ? `${SUPABASE_STORAGE}${fileName}` : null;
}

function fmt(date: string): string {
  return new Date(date).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-black text-guor-gold/70 uppercase tracking-widest">
        {label}
      </span>
      <span className="text-sm font-semibold text-guor-dark">{value ?? "—"}</span>
    </div>
  );
}

export default function ProductInfoDisplay({ producto, categoria }: Props) {
  const imageUrl = resolveImageUrl(producto.imagen);
  const definedMoq = producto.moq ?? 400;

  const stockLevel: "empty" | "low" | "ok" =
    producto.stock === 0
      ? "empty"
      : producto.stock < definedMoq * 0.2
      ? "low"
      : "ok";

  return (
    <div className="space-y-8">

      {/* ── Imagen + datos principales ── */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">

        {/* Imagen */}
        <div className="rounded-2xl border border-guor-peach/50 bg-guor-cream/60 overflow-hidden flex items-center justify-center aspect-square relative">
          {imageUrl ? (
            <div className="relative w-full h-full">
              <Image
                src={imageUrl}
                alt={producto.nombre}
                fill
                sizes="220px"
                className="object-contain"
                unoptimized // Útil para evitar errores si el dominio de Supabase no está configurado en next.config.js
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-guor-gold/40">
              <Package size={44} strokeWidth={1} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Sin imagen
              </span>
            </div>
          )}
        </div>

        {/* Info clave */}
        <div className="flex flex-col gap-5 justify-center">

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={`rounded-full px-3 py-1 text-[9px] font-black border-2 uppercase ${
                producto.estado === "activo"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-rose-50 text-rose-600 border-rose-100"
              }`}
            >
              {producto.estado}
            </Badge>

            <span className="inline-flex items-center gap-1 bg-guor-cream/60 border border-guor-peach px-3 py-1 rounded-full text-[10px] font-black text-guor-gold uppercase">
              <Tag size={9} />
              {categoria}
            </span>

            {producto.destacado && (
              <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full text-[10px] font-black text-amber-600 uppercase">
                ★ Destacado
              </span>
            )}
          </div>

          {/* Stats chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              {
                icon: TrendingUp,
                label: "Precio",
                value: `S/ ${Number(producto.precio).toFixed(2)}`,
                accent: true,
              },
              {
                icon: Box,
                label: "Stock Total",
                value: (
                  <span
                    className={
                      stockLevel === "empty"
                        ? "text-rose-600"
                        : stockLevel === "low"
                        ? "text-amber-500"
                        : "text-guor-dark"
                    }
                  >
                    {producto.stock}
                  </span>
                ),
                accent: false,
              },
              {
                icon: BarChart2,
                label: "MOQ",
                value: definedMoq,
                accent: false,
              },
              {
                icon: Palette,
                label: "Colores",
                value: (producto.colores_disponibles ?? []).length || "—",
                accent: false,
              },
              {
                icon: Ruler,
                label: "Tallas",
                value: (producto.tallas_disponibles ?? []).length || "—",
                accent: false,
              },
            ].map(({ icon: Icon, label, value, accent }) => (
              <div
                key={label}
                className={`flex flex-col gap-1 px-4 py-3 rounded-xl border ${
                  accent
                    ? "bg-guor-peach/50 border-guor-peach"
                    : "bg-guor-cream/60 border-guor-peach/50"
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] font-black text-guor-gold/70 uppercase tracking-widest">
                  <Icon size={10} />
                  {label}
                </div>
                <div
                  className={`text-lg font-black leading-none ${
                    accent ? "text-guor-brown" : "text-guor-dark"
                  }`}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Alerta stock */}
          {stockLevel !== "ok" && (
            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold border ${
                stockLevel === "empty"
                  ? "bg-rose-50 border-rose-100 text-rose-600"
                  : "bg-amber-50 border-amber-100 text-amber-600"
              }`}
            >
              {stockLevel === "empty"
                ? "⚠ Sin stock disponible. Requiere reposición inmediata."
                : `⚠ Stock bajo (${producto.stock} uds). Por debajo del 20% del MOQ.`}
            </div>
          )}
        </div>
      </div>

      {/* ── Campos de detalle ── */}
      <div className="border-t border-guor-peach/50 pt-6 grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5">
        <Field label="SKU" value={<code className="font-mono text-xs bg-guor-peach/40 px-2 py-0.5 rounded">{producto.sku}</code>} />
        <Field label="ID Producto" value={`#${producto.id}`} />
        <Field label="Categoría" value={categoria} />
        <Field label="Precio" value={`S/ ${Number(producto.precio).toFixed(2)}`} />
        <Field label="Stock" value={producto.stock} />
        <Field label="MOQ" value={definedMoq} />
        <Field
          label="Creado"
          value={
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-guor-gold/70" />
              {producto.created_at ? fmt(producto.created_at) : "—"}
            </span>
          }
        />
        <Field
          label="Actualizado"
          value={
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-guor-gold/70" />
              {producto.updated_at ? fmt(producto.updated_at) : "—"}
            </span>
          }
        />
      </div>

      {/* Descripción */}
      {producto.descripcion && (
        <div className="border-t border-guor-peach/50 pt-6 space-y-2">
          <span className="text-[10px] font-black text-guor-gold/70 uppercase tracking-widest">
            Descripción
          </span>
          <p className="text-sm text-guor-brown/70 leading-relaxed">{producto.descripcion}</p>
        </div>
      )}
    </div>
  );
}