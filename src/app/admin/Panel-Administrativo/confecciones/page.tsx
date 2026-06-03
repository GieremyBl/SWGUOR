import Link from 'next/link';
import { Scissors } from 'lucide-react';
import {
  listarConfeccionesParaOperaciones,
  listarTalleresActivosSelect,
} from '@/lib/helpers/confecciones-list.helper';
import { ConfeccionesListaWorkspace } from '@/components/ayudante/ConfeccionesListaWorkspace';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ taller?: string }>;
}

export default async function ConfeccionesAdminPage({ searchParams }: PageProps) {
  const { taller } = await searchParams;
  const tallerId = taller?.trim() || undefined;

  const [items, talleres] = await Promise.all([
    listarConfeccionesParaOperaciones({ tallerId }),
    listarTalleresActivosSelect(),
  ]);

  const tallerValido = tallerId && talleres.some((t) => t.id === tallerId) ? tallerId : null;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-pink-50 rounded-xl">
            <Scissors className="w-6 h-6 text-pink-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Confecciones</h1>
            <p className="text-gray-500 text-sm">Órdenes de confección en talleres externos</p>
          </div>
        </div>

        <ConfeccionesListaWorkspace
          items={items}
          talleres={talleres}
          tallerActual={tallerValido}
        />

        <p className="text-xs text-stone-500">
          <Link href="/ayudante/confecciones" className="text-teal-600 font-bold hover:underline">
            Ir a vista de ayudante
          </Link>{' '}
          para aprobar conformidad del taller.
        </p>
      </div>
    </div>
  );
}
