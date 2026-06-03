import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { obtenerProductosParaCotizar } from '@/app/portal/cotizaciones/actions';
import { NuevaCotizacionClient } from './NuevaCotizacionClient';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Nueva Solicitud de Cotización | Portal B2B',
  description: 'Configure productos, proponga precios unitarios y envíe requerimientos al equipo comercial.',
};

export default async function NuevaCotizacionPage() {
  // Usamos la server action sólo para validar acceso y detectar catálogo vacío
  // antes de hidratar el cliente. El contexto (usePortal) se encarga
  // del fetch de productos en el lado cliente.
  const result = await obtenerProductosParaCotizar();

  // 1. Error de autenticación o cuenta inactiva
  if (!result.success) {
    const esInactivo = result.error === 'cliente_inactivo';

    return (
      <div className="max-w-md mx-auto my-12 p-6 border border-red-100 bg-red-50/30 rounded-2xl text-center space-y-4 shadow-xs">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-black text-slate-950">
            {esInactivo ? 'Cuenta Comercial Suspendida' : 'Error de Conexión'}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {esInactivo
              ? 'Tu perfil corporativo se encuentra en revisión o inactivo. Contacta con tu asesor asignado.'
              : 'No pudimos sincronizar el catálogo de confecciones en este momento. Por favor, reintenta.'}
          </p>
        </div>
        <div className="pt-2">
          <Button asChild size="sm" variant="outline" className="rounded-xl text-xs gap-1.5">
            <Link href="/portal/cotizaciones">
              <ArrowLeft size={13} />
              Regresar al Historial
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // 2. Catálogo sin existencias activas
  if (result.productos.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 border rounded-2xl text-center space-y-4 bg-slate-50/50">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-black text-slate-800">Catálogo Temporalmente Vacío</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Actualmente no hay existencias o modelos configurados listos para preventa B2B.
          </p>
        </div>
        <div className="pt-2">
          <Button asChild size="sm" variant="outline" className="rounded-xl text-xs">
            <Link href="/portal/cotizaciones">Regresar</Link>
          </Button>
        </div>
      </div>
    );
  }

  // 3. Acceso validado — el componente cliente obtiene sus datos del PortalContext
  return <NuevaCotizacionClient />;
}