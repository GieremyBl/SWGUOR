import { CotizacionProveedorForm } from '@/components/admin/cotizaciones-proveedor/CotizacionProveedorForm';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Nueva Cotización de Proveedor | GUOR',
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

export default async function NuevaCotizacionProveedorPage() {
  const proveedores = await getProveedores();

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
          Nueva Cotización de Proveedor
        </h1>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
          Cargue PDFs para extraer datos con IA (Gemini) o complete el formulario manualmente. Se guarda en borrador.
        </p>
      </div>

      <CotizacionProveedorForm
        proveedores={proveedores.map((p) => ({
          id: String(p.id),
          razon_social: p.razon_social,
          ruc: p.ruc ?? undefined,
        }))}
      />
    </div>
  );
}
