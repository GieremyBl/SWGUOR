import EstadoAvanceBadge from './EstadoAvanceBadge';

import type {
  ReporteTallerItem,
} from '@/types/reporte-talleres';

interface Props {
  data: ReporteTallerItem[];
}

export default function ReporteTalleresTable({
  data,
}: Props) {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#e4c28a]/20 bg-[#fbddd3] shadow-sm">

      <div className="border-b border-[#e4c28a]/20 px-6 py-5">

        <h3 className="text-xl font-bold text-[#231e1d]">
          Detalle de Producción
        </h3>

      </div>

      <div className="overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-[#b5854b] text-white">

            <tr>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Taller
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Pedido
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Cantidad
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Avance
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Fecha Compromiso
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold">
                Estado
              </th>

            </tr>

          </thead>

          <tbody>

            {data.map((item) => (
              <tr
                key={item.id}
                className="border-b border-[#e4c28a]/10 bg-white/50 transition hover:bg-white"
              >

                <td className="px-6 py-5 font-semibold text-[#231e1d]">
                  {item.taller}
                </td>

                <td className="px-6 py-5 text-[#231e1d]/80">
                  {item.pedido}
                </td>

                <td className="px-6 py-5 text-[#231e1d]/80">
                  {item.cantidad.toLocaleString()}
                </td>

                <td className="px-6 py-5">

                  <div className="flex items-center gap-3">

                    <div className="h-3 w-40 overflow-hidden rounded-full bg-[#fff4e2]">

                      <div
                        className="h-full rounded-full bg-[#b5854b]"
                        style={{
                          width: `${item.avance}%`,
                        }}
                      />

                    </div>

                    <span className="text-sm font-bold text-[#231e1d]">
                      {item.avance}%
                    </span>

                  </div>

                </td>

                <td className="px-6 py-5 text-[#231e1d]/80">
                  {item.fechaCompromiso}
                </td>

                <td className="px-6 py-5">
                  <EstadoAvanceBadge estado={item.estado} />
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}