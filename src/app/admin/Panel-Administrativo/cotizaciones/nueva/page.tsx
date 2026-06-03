import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CotizacionForm } from '@/components/admin/cotizaciones/CotizacionForm';
import { CotizacionesService } from '@/lib/services/cotizaciones.service';

export default async function NuevaCotizacionAdminPage() {
  const [clientes, productos] = await Promise.all([
    CotizacionesService.listarClientes(),
    CotizacionesService.listarProductos(),
  ]);

  return (
    <div className="p-4 md:p-8 bg-gray-50/50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          href="/admin/Panel-Administrativo/cotizaciones"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft size={16} />
          Volver a cotizaciones
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Nueva cotización
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Registro manual para revisión y aprobación. También pueden llegar
            solicitudes automáticas desde el portal del cliente.
          </p>
        </div>

        <CotizacionForm clientes={clientes} productos={productos} />
      </div>
    </div>
  );
}
