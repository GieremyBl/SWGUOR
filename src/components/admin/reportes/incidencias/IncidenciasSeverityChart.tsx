'use client';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

interface Props {
  resumen?: {
    baja: number;
    media: number;
    alta: number;
    critica: number;
  };
}

const COLORS = [
  '#22c55e',
  '#facc15',
  '#f97316',
  '#ef4444',
];

export default function IncidenciasSeverityChart({
  resumen,
}: Props) {

  const data = [
    {
      name: 'Baja',
      value: resumen?.baja || 0,
    },
    {
      name: 'Media',
      value: resumen?.media || 0,
    },
    {
      name: 'Alta',
      value: resumen?.alta || 0,
    },
    {
      name: 'Crítica',
      value: resumen?.critica || 0,
    },
  ];

  return (
    <div
      className="
        bg-[#fbddd3]
        border
        border-[#e4c28a]
        rounded-3xl
        p-6
        h-[500px]
      "
    >

      <div className="mb-6">

        <h2
          className="
            text-2xl
            font-bold
            text-[#231e1d]
          "
        >
          Distribución por Severidad
        </h2>

      </div>

      <ResponsiveContainer
        width="100%"
        height="85%"
      >

        <PieChart>

          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={140}
            innerRadius={70}
            paddingAngle={4}
          >

            {data.map((entry, index) => (

              <Cell
                key={`cell-${index}`}
                fill={COLORS[index]}
              />

            ))}

          </Pie>

          <Tooltip />

          <Legend />

        </PieChart>

      </ResponsiveContainer>

    </div>
  );
}
