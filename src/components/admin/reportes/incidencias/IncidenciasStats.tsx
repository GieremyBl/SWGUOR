'use client';

import {
  AlertTriangle,
  ShieldAlert,
  Factory,
  Clock3,
} from 'lucide-react';

interface Props {
  stats?: {
    totalIncidencias: number;
    incidenciasCriticas: number;
    talleresAfectados: number;
    impactoHoras: number;
  };
}

export default function IncidenciasStats({
  stats,
}: Props) {

  const data = [
    {
      title: 'Total Incidencias',
      value: stats?.totalIncidencias || 0,
      icon: AlertTriangle,
    },
    {
      title: 'Incidencias Críticas',
      value: stats?.incidenciasCriticas || 0,
      icon: ShieldAlert,
    },
    {
      title: 'Talleres Afectados',
      value: stats?.talleresAfectados || 0,
      icon: Factory,
    },
    {
      title: 'Impacto Horas',
      value: `${stats?.impactoHoras || 0}h`,
      icon: Clock3,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

      {data.map((item, index) => {

        const Icon = item.icon;

        return (
          <div
            key={index}
            className="
              bg-[#fbddd3]
              border
              border-[#e4c28a]
              rounded-3xl
              p-6
            "
          >

            <div className="
              w-14
              h-14
              rounded-2xl
              bg-[#b5854b]
              flex
              items-center
              justify-center
              mb-5
            ">
              <Icon
                className="text-white"
                size={26}
              />
            </div>

            <p className="text-[#6b5b52] text-sm">
              {item.title}
            </p>

            <h2 className="
              text-4xl
              font-black
              text-[#231e1d]
              mt-2
            ">
              {item.value}
            </h2>

          </div>
        );
      })}

    </div>
  );
}