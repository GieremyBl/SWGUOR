import Link from 'next/link';
import { ArrowLeft, ClipboardCheck } from 'lucide-react';
import {
  listarConfeccionesParaOperaciones,
  listarTalleresActivosSelect,
} from '@/lib/helpers/confecciones-list.helper';
import { ConfeccionesListaWorkspace } from '@/components/ayudante/ConfeccionesListaWorkspace';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ taller?: string }>;
}

export default async function AyudanteConfeccionesPage({ searchParams }: PageProps) {
  const { taller } = await searchParams;
  const tallerId = taller?.trim() || undefined;

  const [items, talleres] = await Promise.all([
    listarConfeccionesParaOperaciones({ tallerId }),
    listarTalleresActivosSelect(),
  ]);

  const tallerValido = tallerId && talleres.some((t) => t.id === tallerId) ? tallerId : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div>
        <Link
          href="/admin/Panel-Administrativo/dashboard"
          className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-teal-600 hover:opacity-80 mb-3"
        >
          <ArrowLeft size={13} /> Volver al panel
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-sm">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">Confecciones</h1>
            <p className="text-sm text-stone-500 font-medium">
              Revise el trabajo del taller y apruebe conformidad
            </p>
          </div>
        </div>
      </div>

      <ConfeccionesListaWorkspace
        items={items}
        talleres={talleres}
        tallerActual={tallerValido}
      />
    </div>
  );
}
