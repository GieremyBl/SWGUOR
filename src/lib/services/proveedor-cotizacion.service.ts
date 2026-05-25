import { prisma } from '@/lib/prisma';
import { upsertProveedor } from '@/lib/services/proveedor.service';
import { filterProveedoresByQuery, normalizeSearchText } from '@/lib/helpers/proveedor-search';
import type { CotizacionExtraccionIA } from '@/lib/schemas/cotizacion-extraccion-ia';
import { CATEGORIAS_SUMINISTRO } from '@/lib/schemas/proveedor';

export interface ProveedorResumen {
  id: string;
  ruc: string;
  razon_social: string;
  email: string;
  telefono: string;
  contacto: string;
  estado: string;
}

function limpiarRuc(ruc?: string | null): string | null {
  if (!ruc) return null;
  const digits = ruc.replace(/\D/g, '');
  return digits.length === 11 ? digits : null;
}

function emailTemporal(ruc: string): string {
  return `proveedor.${ruc}@registro.guor.local`;
}

export async function listarProveedoresActivos(limit = 500): Promise<ProveedorResumen[]> {
  const rows = await prisma.proveedores.findMany({
    where: { estado: 'activo' },
    select: {
      id: true,
      ruc: true,
      razon_social: true,
      email: true,
      telefono: true,
      contacto: true,
      estado: true,
    },
    orderBy: { razon_social: 'asc' },
    take: limit,
  });

  return rows.map((r) => ({
    id: String(r.id),
    ruc: r.ruc,
    razon_social: r.razon_social,
    email: r.email,
    telefono: r.telefono,
    contacto: r.contacto,
    estado: r.estado,
  }));
}

export async function buscarProveedoresSimilares(
  busqueda: string,
  limit = 20,
): Promise<ProveedorResumen[]> {
  const q = busqueda.trim();
  if (!q) return listarProveedoresActivos(limit);

  const ruc = limpiarRuc(q);
  if (ruc) {
    const porRuc = await prisma.proveedores.findFirst({
      where: { ruc, estado: 'activo' },
      select: {
        id: true,
        ruc: true,
        razon_social: true,
        email: true,
        telefono: true,
        contacto: true,
        estado: true,
      },
    });
    if (porRuc) {
      return [
        {
          id: String(porRuc.id),
          ruc: porRuc.ruc,
          razon_social: porRuc.razon_social,
          email: porRuc.email,
          telefono: porRuc.telefono,
          contacto: porRuc.contacto,
          estado: porRuc.estado,
        },
      ];
    }
  }

  const todos = await listarProveedoresActivos(500);
  return filterProveedoresByQuery(todos, q, 35).slice(0, limit);
}

export async function encontrarProveedorPorExtraccion(
  extraccion: CotizacionExtraccionIA,
): Promise<ProveedorResumen | null> {
  const ruc = limpiarRuc(extraccion.proveedor?.ruc);
  if (ruc) {
    const p = await prisma.proveedores.findFirst({
      where: { ruc, estado: 'activo' },
      select: {
        id: true,
        ruc: true,
        razon_social: true,
        email: true,
        telefono: true,
        contacto: true,
        estado: true,
      },
    });
    if (p) {
      return {
        id: String(p.id),
        ruc: p.ruc,
        razon_social: p.razon_social,
        email: p.email,
        telefono: p.telefono,
        contacto: p.contacto,
        estado: p.estado,
      };
    }
  }

  const nombre = extraccion.proveedor?.razon_social?.trim();
  if (!nombre) return null;

  const candidatos = await buscarProveedoresSimilares(nombre, 5);
  const exacto = candidatos.find(
    (c) => normalizeSearchText(c.razon_social) === normalizeSearchText(nombre),
  );
  return exacto ?? candidatos[0] ?? null;
}

export interface CrearProveedorDesdeExtraccionInput {
  ruc: string;
  razon_social: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
  categoria_suministro: string;
}

export function datosProveedorDesdeExtraccion(
  extraccion: CotizacionExtraccionIA,
): CrearProveedorDesdeExtraccionInput {
  const p = extraccion.proveedor ?? {};
  const ruc = limpiarRuc(p.ruc) ?? '';
  const razon = p.razon_social?.trim() || 'Proveedor sin nombre';
  const contacto = p.contacto?.trim() || p.razon_social?.trim() || 'Contacto pendiente';

  return {
    ruc,
    razon_social: razon,
    contacto,
    telefono: p.telefono?.trim() || '000000000',
    email: p.email?.trim() || (ruc ? emailTemporal(ruc) : ''),
    direccion: 'Por completar',
    categoria_suministro: CATEGORIAS_SUMINISTRO[CATEGORIAS_SUMINISTRO.length - 1],
  };
}

export async function crearProveedorDesdeExtraccion(
  input: CrearProveedorDesdeExtraccionInput,
): Promise<ProveedorResumen> {
  const ruc = limpiarRuc(input.ruc);
  if (!ruc) throw new Error('RUC inválido: debe tener 11 dígitos');

  const creado = await upsertProveedor({
    ruc,
    razon_social: input.razon_social,
    contacto: input.contacto,
    telefono: input.telefono,
    email: input.email || emailTemporal(ruc),
    direccion: input.direccion || 'Por completar',
    categoria_suministro: input.categoria_suministro || 'Otros',
    estado: 'activo',
  });

  return {
    id: String(creado.id),
    ruc: creado.ruc,
    razon_social: creado.razon_social,
    email: creado.email,
    telefono: creado.telefono,
    contacto: creado.contacto,
    estado: creado.estado,
  };
}
