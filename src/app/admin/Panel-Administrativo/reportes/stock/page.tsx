'use client';

import { useProductos } from "@/lib/hooks/useProductos";
import { useProductoStockResumen } from "@/lib/hooks/useStockResumen";

export default function ReporteStockPage() {

  const { productos, isLoading } = useProductos({});
  const { data: stockResumen } = useProductoStockResumen();

  if (isLoading) {
    return <p className="p-6">Cargando productos...</p>;
  }

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">
        Reporte de Stock
      </h1>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Producto</th>
            <th className="p-2 text-center">Stock Actual</th>
            <th className="p-2 text-center">Reservado</th>
            <th className="p-2 text-center">Disponible</th>
            <th className="p-2 text-center">Stock Mínimo</th>
            <th className="p-2 text-center">Estado</th>
          </tr>
        </thead>

        <tbody>
          {productos.map((p: any) => {

            //stock
            const stockActual =
              stockResumen?.find((s: any) => s.producto_id === Number(p.id))
                ?.stock_total_adicional ?? p.stock ?? 0;

            //reservado
            const stockReservado = p.stock_reservado ?? 0;

            // mínimo 
            const stockMinimo = p.stock_minimo ?? 10;

            const disponible = stockActual - stockReservado;
            const enRiesgo = disponible <= stockMinimo;

            return (
              <tr key={p.id}>
                <td className="p-2">{p.nombre}</td>

                <td className="p-2 text-center">
                  {stockActual}
                </td>

                <td className="p-2 text-center">
                  {stockReservado}
                </td>

                <td className="p-2 text-center font-bold">
                  {disponible}
                </td>

                <td className="p-2 text-center">
                  {stockMinimo}
                </td>

                <td className={`p-2 text-center font-bold ${
                  enRiesgo ? 'text-red-600' : 'text-green-600'
                }`}>
                  {enRiesgo ? 'RIESGO' : 'OK'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

    </div>
  );
}