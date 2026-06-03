import {
  Activity,
  Boxes,
  Factory,
  PackageCheck,
} from 'lucide-react';

import type {
  ReporteTallerStats,
} from '@/types/reporte-talleres';

interface Props {
  stats: ReporteTallerStats;
}

export default function ReporteTalleresStats({
  stats,
}: Props) {
  const cards = [
    {
      title: 'Talleres Activos',
      value: stats.talleresActivos,
      icon: Factory,
    },
    {
      title: 'Pedidos Producción',
      value: stats.pedidosProduccion,
      icon: Boxes,
    },
    {
      title: 'Avance Promedio',
      value: `${stats.avancePromedio}%`,
      icon: Activity,
    },
    {
      title: 'Unidades Confeccionadas',
      value: stats.unidadesConfeccionadas.toLocaleString(),
      icon: PackageCheck,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-3xl border border-[#e4c28a]/20 bg-[#fbddd3] p-6 shadow-sm"
          >

            <div className="mb-5 flex items-center justify-between">

              <div className="rounded-2xl bg-[#b5854b] p-3 text-white">
                <Icon size={22} />
              </div>

            </div>

            <h4 className="text-sm font-medium text-[#231e1d]/70">
              {card.title}
            </h4>

            <p className="mt-2 text-3xl font-black text-[#231e1d]">
              {card.value}
            </p>

          </div>
        );
      })}

    </div>
  );
}