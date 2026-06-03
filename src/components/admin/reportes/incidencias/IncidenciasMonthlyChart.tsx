'use client';

import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from 'recharts';

interface Props {
  data: {
    mes: string;
    total: number;
  }[];
}

export default function IncidenciasMonthlyChart({
  data,
}: Props) {

  return (
    <div
      className="
        bg-[#fbddd3]
        border
        border-[#e4c28a]
        rounded-3xl
        p-6
        h-[450px]
      "
    >

      <div className="mb-6">

        <h2 className="
          text-2xl
          font-bold
          text-[#231e1d]
        ">
          Incidencias Mensuales
        </h2>

        <p className="text-[#6b5b52] mt-1">
          Seguimiento mensual de incidencias registradas.
        </p>

      </div>

      <ResponsiveContainer
        width="100%"
        height="85%"
      >

        <BarChart data={data}>

          <CartesianGrid
            strokeDasharray="4 4"
            stroke="#e4c28a"
          />

          <XAxis
            dataKey="mes"
            stroke="#6b5b52"
          />

          <YAxis
            stroke="#6b5b52"
          />

          <Tooltip />

          <Bar
            dataKey="total"
            fill="#b5854b"
            radius={[10, 10, 0, 0]}
          />

        </BarChart>

      </ResponsiveContainer>

    </div>
  );
}