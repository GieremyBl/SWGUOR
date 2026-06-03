'use client';

import type {
  ReporteIncidenciaItem,
} from '@/types/reporte-incidencias';

interface Props {
  data: ReporteIncidenciaItem[];
}

export default function IncidenciasTable({
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
          Detalle de Incidencias
        </h2>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead>

            <tr className="border-b border-[#e4c28a]">

              <th className="text-left py-4">
                Taller
              </th>

              <th className="text-left py-4">
                Tipo
              </th>

              <th className="text-left py-4">
                Severidad
              </th>

              <th className="text-left py-4">
                Impacto
              </th>

              <th className="text-left py-4">
                Fecha
              </th>

              <th className="text-left py-4">
                Estado
              </th>

            </tr>

          </thead>

          <tbody>

            {data.map((item) => (

              <tr
                key={item.id}
                className="
                  border-b
                  border-[#f1d7c1]
                "
              >

                <td className="py-4">
                  {item.taller}
                </td>

                <td className="py-4">
                  {item.tipo}
                </td>

                <td className="py-4">
                  {item.severidad}
                </td>

                <td className="py-4">
                  {item.impactoHoras}h
                </td>

                <td className="py-4">
                  {item.fecha}
                </td>

                <td className="py-4">
                  {item.estado}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}