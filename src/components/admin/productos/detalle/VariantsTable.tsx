"use client";

import { Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Interfaz exportada y actualizada
export interface Variante {
  id: number;
  color: string;
  talla: string;
  sku: string;
  stock: number;
  estado?: string; 
}

interface Props {
  variantes: Variante[];
}

export default function VariantsTable({ variantes }: Props) {
  if (!variantes.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-guor-gold/40">
        <Layers size={40} strokeWidth={1} />
        <p className="text-[11px] font-black uppercase tracking-widest">
          Este producto no tiene variantes registradas
        </p>
      </div>
    );
  }

  // Totales para el resumen
  const totalStock = variantes.reduce((acc, v) => acc + (v.stock ?? 0), 0);
  const coloresUnicos = [...new Set(variantes.map((v) => v.color).filter(Boolean))];
  const tallasUnicas  = [...new Set(variantes.map((v) => v.talla).filter(Boolean))];

  return (
    <div className="space-y-5">

      {/* ── Resumen rápido ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Variantes", value: variantes.length },
          { label: "Colores",         value: coloresUnicos.length },
          { label: "Tallas",          value: tallasUnicas.length },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col gap-0.5 bg-guor-cream/60 border border-guor-peach/50 rounded-xl px-4 py-3"
          >
            <span className="text-[9px] font-black text-guor-gold/70 uppercase tracking-widest">
              {label}
            </span>
            <span className="text-xl font-black text-guor-dark">{value}</span>
          </div>
        ))}
      </div>

      {/* ── Tabla ── */}
      <div className="overflow-x-auto rounded-2xl border border-guor-peach/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-guor-cream/60 border-b border-guor-peach/50">
              {["Color", "Talla", "SKU Variante", "Stock", "Estado"].map((h) => (
                <th
                  key={h}
                  className="text-left text-[9px] font-black text-guor-gold/70 uppercase tracking-widest px-5 py-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-guor-peach/30">
            {variantes.map((v) => {
              const stockLevel = v.stock === 0 ? "empty" : v.stock < 50 ? "low" : "ok";
              // Controlamos de forma segura si el estado es indefinido
              const currentEstado = v.estado || "inactivo";

              return (
                <tr
                  key={v.id}
                  className="hover:bg-guor-cream/60 transition-colors group"
                >
                  {/* Color */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-4 h-4 rounded-full border border-guor-peach shrink-0 shadow-sm"
                        style={{
                          background: v.color?.toLowerCase() ?? "#e5e7eb",
                        }}
                      />
                      <span className="font-semibold text-guor-dark/80 capitalize text-xs">
                        {v.color || "—"}
                      </span>
                    </div>
                  </td>

                  {/* Talla */}
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-black text-guor-brown/70 uppercase bg-guor-peach/40 px-2.5 py-1 rounded-lg">
                      {v.talla || "—"}
                    </span>
                  </td>

                  {/* SKU */}
                  <td className="px-5 py-3.5">
                    <code className="text-[11px] font-mono bg-guor-peach/40 text-guor-gold px-2.5 py-1 rounded-lg">
                      {v.sku}
                    </code>
                  </td>

                  {/* Stock */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-black text-sm ${
                          stockLevel === "empty"
                            ? "text-rose-500"
                            : stockLevel === "low"
                            ? "text-amber-500"
                            : "text-guor-dark"
                        }`}
                      >
                        {v.stock}
                      </span>
                      {stockLevel === "empty" && (
                        <span className="text-[9px] font-black text-rose-400 uppercase">
                          Agotado
                        </span>
                      )}
                      {stockLevel === "low" && (
                        <span className="text-[9px] font-black text-amber-400 uppercase">
                          Bajo
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-5 py-3.5">
                    <Badge
                      variant="outline"
                      className={`rounded-full px-2.5 py-0.5 text-[8px] font-black border uppercase ${
                        currentEstado === "activo"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-guor-peach/40 text-guor-gold/70 border-guor-peach"
                      }`}
                    >
                      {currentEstado}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Footer con stock total */}
          <tfoot>
            <tr className="border-t-2 border-guor-peach/50 bg-guor-cream/60">
              <td colSpan={3} className="px-5 py-3 text-[10px] font-black text-guor-gold/70 uppercase tracking-widest">
                Total
              </td>
              <td className="px-5 py-3">
                <span className="text-sm font-black text-guor-dark">{totalStock}</span>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}