import { CATEGORIAS_SUMINISTRO } from '@/lib/schemas/proveedor';
import type { CotizacionExtraccionIA } from '@/lib/schemas/cotizacion-extraccion-ia';

function limpiarRuc(ruc?: string | null): string {
  if (!ruc) return '';
  return ruc.replace(/\D/g, '').slice(0, 11);
}

export function datosProveedorPrefillDesdeExtraccion(extraccion: CotizacionExtraccionIA) {
  const p = extraccion.proveedor ?? {};
  const ruc = limpiarRuc(p.ruc);
  const razon = p.razon_social?.trim() || '';

  return {
    ruc,
    razon_social: razon,
    contacto: p.contacto?.trim() || razon || 'Contacto pendiente',
    telefono: p.telefono?.trim() || '000000000',
    email: p.email?.trim() || (ruc ? `proveedor.${ruc}@registro.guor.local` : ''),
    direccion: 'Por completar',
    categoria_suministro: CATEGORIAS_SUMINISTRO[CATEGORIAS_SUMINISTRO.length - 1],
  };
}
