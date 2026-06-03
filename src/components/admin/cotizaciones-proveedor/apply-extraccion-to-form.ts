import type { UseFormSetValue } from 'react-hook-form';
import type { CrearCotizacionProveedorInput } from '@/lib/schemas/cotizaciones-proveedor';
import type { CotizacionExtraccionIA } from '@/lib/schemas/cotizacion-extraccion-ia';

function normalizarMoneda(raw?: string | null): 'PEN' | 'USD' | 'EUR' {
  const m = (raw ?? 'PEN').toUpperCase();
  if (m.includes('USD') || m === '$') return 'USD';
  if (m.includes('EUR') || m === '€') return 'EUR';
  return 'PEN';
}

function fechaIso(raw?: string | null): string {
  if (!raw) return '';
  const d = raw.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '';
}

export function aplicarExtraccionAlFormulario(
  extraccion: CotizacionExtraccionIA,
  setValue: UseFormSetValue<CrearCotizacionProveedorInput>,
  opts?: { appendItems?: boolean; currentItems?: CrearCotizacionProveedorInput['items'] },
) {
  const cot = extraccion.cotizacion ?? { total_estimado: 0 };
  const items = (extraccion.items ?? []).filter((i) => i.descripcion?.trim());

  if (cot.numero_externo) {
    setValue('numero_externo', cot.numero_externo);
  }
  const fs = fechaIso(cot.fecha_solicitud);
  if (fs) setValue('fecha_solicitud', fs);
  const fv = fechaIso(cot.fecha_vencimiento);
  if (fv) setValue('fecha_vencimiento', fv);
  if (cot.moneda) setValue('moneda', normalizarMoneda(cot.moneda));
  if (cot.notas) setValue('notas', cot.notas);

  if (items.length > 0) {
    const mapped: CrearCotizacionProveedorInput['items'] = items.map((item) => ({
      descripcion: item.descripcion?.trim() ?? 'Ítem',
      cantidad: Number(item.cantidad) > 0 ? Number(item.cantidad) : 1,
      precio_unitario: Number(item.precio_unitario) || 0,
      unidad: item.unidad?.trim() || 'unidades',
      tipo_item: (item.tipo_item === 'material' ? 'material' : 'insumo') as 'insumo' | 'material',
    }));

    if (opts?.appendItems) {
      const actuales = opts.currentItems ?? [];
      setValue('items', [...actuales, ...mapped]);
    } else {
      setValue('items', mapped);
    }
  }
}

export function fusionarExtracciones(extracciones: CotizacionExtraccionIA[]): CotizacionExtraccionIA {
  if (extracciones.length === 0) {
    return { proveedor: {}, cotizacion: { total_estimado: 0 }, items: [] } as unknown as CotizacionExtraccionIA;
  }

  const base = extracciones[extracciones.length - 1];
  const items = extracciones.flatMap((e) => e.items ?? []);

  return {
    proveedor: base.proveedor,
    cotizacion: base.cotizacion ?? { total_estimado: 0 },
    items,
  };
}