'use client';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

import type {
  ReporteTallerResumen,
} from '@/types/reporte-talleres';

interface Props {
  resumen: ReporteTallerResumen;
}

const COLORS = [
  '#22c55e', // completado
  '#eab308', // proceso
  '#ef4444', // retrasado
  '#9ca3af', // pendiente
];

export default function ReporteTalleresChart({
  resumen,
}: Props) {

  const data = [
    {
      name: 'Completado',
      value: resumen.completado,
    },
    {
      name: 'En Proceso',
      value: resumen.enProceso,
    },
    {
      name: 'Retrasado',
      value: resumen.retrasado,
    },
    {
      name: 'Pendiente',
      value: resumen.pendiente,
    },
  ];

  return (
    <div className="rounded-3xl border border-[#e4c28a]/20 bg-[#fbddd3] p-6 shadow-sm">

      <div className="mb-6">

        <h3 className="text-xl font-bold text-[#231e1d]">
          Estado de Pedidos
        </h3>

        <p className="mt-1 text-sm text-[#231e1d]/60">
          Distribución de pedidos según su estado actual.
        </p>

      </div>

      <div className="h-[420px]">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <PieChart>

            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={90}
              outerRadius={140}
              paddingAngle={3}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index]}
                />
              ))}
            </Pie>

            <Tooltip />

            <Legend />

          </PieChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}