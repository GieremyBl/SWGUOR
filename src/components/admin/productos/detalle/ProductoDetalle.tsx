"use client";

import { useState } from "react";
import { ArrowLeft, Package, Layers, Info, Tag, BarChart3 } from "lucide-react";
import Link from "next/link";

// Componentes de visualización (Solo lectura)
import ProductInfoDisplay from "@/components/admin/productos/detalle/ProductInfoDisplay";
import VariantsTable from "@/components/admin/productos/detalle/VariantsTable";

// ── Definición de Interfaces Estrictas ──────────────────────────────────

export interface CategoriaBase {
  id: number | string;
  nombre: string;
}

export interface VarianteProductoDetalle {
  id: number;
  color: string;
  talla: string;
  sku: string;
  stock: number;
  stock_actual?: number;
  textura?: string;
  estado?: string;
}

export interface ProductoDetalleData {
  id: string | number;
  nombre: string;
  sku: string;
  precio: number;
  estado: "activo" | "inactivo";
  imagen: string | null;
  stock: number; // Solución al Error TS2741: Añadido aquí para concordar con ProductDisplayData
  categoria_id: string | number;
  categorias?: {
    nombre: string;
  } | null;
  variantes_producto?: VarianteProductoDetalle[];
  fichas_tecnicas_id?: string | number | null;
}

interface ProductoDetalleProps {
  producto: ProductoDetalleData;
  categorias: CategoriaBase[];
}

type TabId = "general" | "variantes";

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
}

const TABS: TabItem[] = [
  { id: "general",   label: "Información General",   icon: Info   },
  { id: "variantes", label: "Variantes y Existencias", icon: Layers },
];

export default function ProductoDetalle({ producto, categorias }: ProductoDetalleProps) {
  const [activeTab, setActiveTab] = useState<TabId>("general");

  // ── Resolución de categoría ──
  const categoriaNombre =
    producto.categorias?.nombre ??
    categorias.find(
      (c) => String(c.id) === String(producto.categoria_id)
    )?.nombre ??
    "Sin categoría";

  return (
    <div className="min-h-screen bg-guor-cream/60">
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">

        {/* Header de Navegación */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/admin/Panel-Administrativo/productos"
              className="inline-flex items-center gap-1.5 text-guor-brown hover:text-guor-brown/90 text-xs font-bold uppercase tracking-widest transition-colors mb-2"
            >
              <ArrowLeft size={13} />
              Volver al Inventario
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-guor-brown rounded-xl shadow-md">
                <Package className="text-white w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-guor-dark leading-tight">
                  {producto.nombre}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-guor-gold text-xs font-medium uppercase tracking-wider">
                    <Tag size={12} className="text-guor-brown/70" />
                    {categoriaNombre}
                  </span>
                  <span className="text-guor-gold/40">|</span>
                  <span className="text-guor-gold/70 text-xs font-mono">
                    SKU: {producto.sku}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/admin/Panel-Administrativo/fichas-tecnicas/${producto.id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-guor-dark text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-guor-dark/90 transition-all shadow-sm"
            >
              <BarChart3 size={14} />
              Ver Ficha Técnica
            </Link>
          </div>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex gap-1 bg-guor-cream border border-guor-peach rounded-2xl p-1.5 shadow-sm w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === id
                  ? "bg-guor-brown text-white shadow-md"
                  : "text-guor-gold hover:text-guor-dark/80 hover:bg-guor-cream/60"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Panel de Contenido */}
        <div className="bg-guor-cream border border-guor-peach rounded-3xl shadow-sm overflow-hidden">
          <div className="p-8">
            {activeTab === "general" && (
              <div className="animate-in fade-in duration-500">
                <ProductInfoDisplay
                  producto={producto}
                  categoria={categoriaNombre}
                />
              </div>
            )}

            {activeTab === "variantes" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col border-b border-guor-peach/50 pb-4">
                  <h3 className="text-lg font-bold text-guor-dark">Matriz de Variantes</h3>
                  <p className="text-sm text-guor-gold">Stock disponible por combinación de atributos.</p>
                </div>
                <VariantsTable variantes={producto.variantes_producto || []} />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}