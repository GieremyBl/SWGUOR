'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ALCANCE_CAMPANA_OPCIONES } from '@/lib/constants/promociones';
import { type AlcanceCampanaValue } from '@/lib/constants/promociones';
import type { EscalaCampanaForm } from '@/lib/schemas/promociones-ofertas';
import { cn } from '@/lib/utils';

interface CategoriaOpt {
  id: number | string;
  nombre: string;
}

interface ProductoOpt {
  id: number | string;
  nombre: string;
}

interface Props {
  alcance: AlcanceCampanaValue;
  categoriaId: string | number | null;
  productoId: string | number | null;
  escalas: EscalaCampanaForm[];
  categorias: CategoriaOpt[];
  productos: ProductoOpt[];
  errors: Record<string, string>;
  onAlcanceChange: (alcance: AlcanceCampanaValue) => void;
  onCategoriaChange: (id: string | number | null) => void;
  onProductoChange: (id: string | number | null) => void;
  onEscalasChange: (escalas: EscalaCampanaForm[]) => void;
}

const fieldLabelClass = 'text-xs font-semibold text-slate-600 uppercase tracking-wide';
// Aseguramos que el texto sea oscuro (slate-900) y visible
const fieldInputClass = 'h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-amber-600/30 focus:border-amber-600';
const fieldSelectClass = 'w-full h-11 bg-white border-slate-200 text-slate-900 [&_svg]:text-slate-500 focus:bg-white';

export function EscalaDescuentosSection({
  alcance,
  categoriaId,
  productoId,
  escalas,
  categorias,
  productos,
  errors,
  onAlcanceChange,
  onCategoriaChange,
  onProductoChange,
  onEscalasChange,
}: Props) {
  const updateEscala = (index: number, patch: Partial<EscalaCampanaForm>) => {
    const next = [...escalas];
    next[index] = { ...next[index], ...patch };
    onEscalasChange(next);
  };

  const addEscala = () => {
    const ultima = escalas[escalas.length - 1];
    onEscalasChange([
      ...escalas,
      {
        cantidad_min: (ultima?.cantidad_min ?? 400) + 100,
        valor_descuento: Math.min((ultima?.valor_descuento ?? 5) + 2, 100),
      },
    ]);
  };

  const removeEscala = (index: number) => {
    if (escalas.length <= 1) return;
    onEscalasChange(escalas.filter((_, i) => i !== index));
  };

  return (
    <div className="border rounded-xl p-4 space-y-4 bg-slate-50/60 border-slate-200">
      <div>
        <p className="text-sm font-semibold text-slate-800">Escala de descuentos (reglas)</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Define cantidades mínimas y porcentajes. Se crean reglas vinculadas a esta campaña.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className={fieldLabelClass}>Alcance</Label>
        <Select value={alcance} onValueChange={(v) => onAlcanceChange(v as AlcanceCampanaValue)}>
          <SelectTrigger className={fieldSelectClass}>
            <SelectValue placeholder="Seleccionar alcance" />
          </SelectTrigger>
          <SelectContent className="z-[100]">
            {ALCANCE_CAMPANA_OPCIONES.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {alcance === 'categoria' && (
        <div className="space-y-1.5">
          <Label className={fieldLabelClass}>Categoría *</Label>
          <Select
            value={categoriaId != null ? String(categoriaId) : undefined}
            onValueChange={(v) => onCategoriaChange(v)}
          >
            <SelectTrigger
              className={cn(fieldSelectClass, errors.categoria_id && 'border-red-400')}
            >
              <SelectValue placeholder="Seleccionar categoría..." />
            </SelectTrigger>
            <SelectContent className="z-[100]">
              {categorias.map((c) => (
                <SelectItem key={String(c.id)} value={String(c.id)}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoria_id && <p className="text-xs text-red-500 font-medium">{errors.categoria_id}</p>}
        </div>
      )}

      {alcance === 'producto' && (
        <div className="space-y-1.5">
          <Label className={fieldLabelClass}>Producto *</Label>
          <Select
            value={productoId != null ? String(productoId) : undefined}
            onValueChange={(v) => onProductoChange(v)}
          >
            <SelectTrigger
              className={cn(fieldSelectClass, errors.producto_id && 'border-red-400')}
            >
              <SelectValue placeholder="Seleccionar producto..." />
            </SelectTrigger>
            <SelectContent className="z-[100]">
              {productos.map((p) => (
                <SelectItem key={String(p.id)} value={String(p.id)}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.producto_id && <p className="text-xs text-red-500 font-medium">{errors.producto_id}</p>}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Escalas</p>
          <Button type="button" size="sm" variant="outline" onClick={addEscala} className="border-slate-200" >
            <Plus className="w-4 h-4 mr-1" /> Agregar escala
          </Button>
        </div>

        {escalas.map((escala, idx) => (
          <div
            key={`escala-${idx}`}
            className="flex gap-3 items-end bg-white p-3 rounded-lg border border-slate-100"
          >
            <div className="flex-1 space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Cantidad mínima
              </Label>
              <Input
                type="number"
                min={1}
                value={escala.cantidad_min}
                onChange={(e) => updateEscala(idx, { cantidad_min: Number(e.target.value) || 1 })}
                className={fieldInputClass}
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                % descuento
              </Label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={escala.valor_descuento}
                onChange={(e) => updateEscala(idx, { valor_descuento: Number(e.target.value) || 0 })}
                className={fieldInputClass}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={escalas.length <= 1}
              onClick={() => removeEscala(idx)}
              className="h-11 w-11 text-red-500 hover:bg-red-50 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}