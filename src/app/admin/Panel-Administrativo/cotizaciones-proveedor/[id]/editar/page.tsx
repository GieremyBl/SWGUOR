import { notFound, redirect } from 'next/navigation';
import { CotizacionProveedorForm } from '@/components/admin/cotizaciones-proveedor/CotizacionProveedorForm';
import type { CotizacionProveedorInitial } from '@/components/admin/cotizaciones-proveedor/CotizacionProveedorForm';
import { ESTADO_COTIZACION_PROVEEDOR } from '@/lib/constants/cotizacion-proveedor-estados';
import { prisma } from '@/lib/prisma';
import { getCotizacionProveedorPdfPublicUrl } from '@/lib/services/cotizacion-proveedor-documento.service';

export const metadata = {
  title: 'Editar Cotización de Proveedor | GUOR',
};

async function getProveedores() {
  try {
    return await prisma.proveedores.findMany({
      select: { id: true, razon_social: true, ruc: true },
      where: { estado: 'activo' },
      orderBy: { razon_social: 'asc' },
    });
  } catch {
    return [];
  }
}

async function getCotizacion(id: string) {
  try {
    return await prisma.cotizaciones_proveedor.findUnique({
      where: { id: BigInt(id) },
      include: {
        cotizaciones_proveedor_items: { orderBy: { id: 'asc' } },
      },
    });
  } catch {
    return null;
  }
}

export default async function EditarCotizacionProveedorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [cotizacion, proveedores] = await Promise.all([
    getCotizacion(id),
    getProveedores(),
  ]);

  if (!cotizacion) notFound();

  if (cotizacion.estado !== ESTADO_COTIZACION_PROVEEDOR.BORRADOR) {
    redirect(`/admin/Panel-Administrativo/cotizaciones-proveedor/${id}`);
  }

  const initial: CotizacionProveedorInitial = {
    id: String(cotizacion.id),
    proveedor_id: String(cotizacion.proveedor_id),
    numero_externo: cotizacion.numero_externo,
    fecha_solicitud: cotizacion.fecha_solicitud.toISOString(),
    fecha_vencimiento: cotizacion.fecha_vencimiento?.toISOString() ?? null,
    moneda: cotizacion.moneda ?? 'PEN',
    notas: cotizacion.notas,
    pdf_url: cotizacion.pdf_url ?? getCotizacionProveedorPdfPublicUrl(id),
    items: cotizacion.cotizaciones_proveedor_items.map((item) => ({
      descripcion: item.descripcion ?? '',
      cantidad: Number(item.cantidad),
      precio_unitario: Number(item.precio_unitario),
      unidad: item.unidad ?? 'unidades',
    })),
  };

  const proveedoresOpts = proveedores.map((p) => ({
    id: String(p.id),
    razon_social: p.razon_social,
    ruc: p.ruc ?? '',
  }));

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
          Editar Cotización
        </h1>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
          COT-{id} · Solo editable en estado borrador
        </p>
      </div>
      <CotizacionProveedorForm
        proveedores={proveedoresOpts}
        initial={initial}
        modo="editar"
      />
    </div>
  );
}
