'use client';

import { useProductos } from "@/lib/hooks/useProductos";

export default function ReporteStockPage() {

  const { productos, isLoading } = useProductos({});

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
            <th className="p-2 text-center">Estado</th>
          </tr>
        </thead>

        <tbody>
          {productos.map((p: any) => {

            const variantes =
              p.variantes ?? p.variantes_producto ?? [];
            //stock
            const stockActual = variantes.reduce(
              (acc: number, v: any) => acc + (v.stock ?? 0),
              0
            );

            const stockReservado = p.stock_reservado ?? 0;
            const disponibleCantidad = stockActual - stockReservado;
            const disponible = disponibleCantidad > 0;

            // estado
            let estado = '';
            let color = '';

            if (stockActual <= 400) {
              estado = 'CRÍTICO';
              color = 'text-red-600';
            } else if (stockActual <= 800) {
              estado = 'PRECAUCIÓN';
              color = 'text-yellow-600';
            } else {
              estado = 'ESTABLE';
              color = 'text-green-600';
            }

            return (
              <tr key={p.id}>
                <td className="p-2">{p.nombre}</td>

                <td className="p-2 text-center font-bold">
                  {stockActual}
                </td>

                <td className="p-2 text-center">
                  {stockReservado}
                </td>

                <td className={`p-2 text-center font-bold ${
                  disponible ? 'text-green-600' : 'text-red-600'
                }`}>
                  {disponible ? 'Sí' : 'No'}
                </td>

                <td className={`p-2 text-center font-bold ${color}`}>
                  {estado}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

    </div>
  );
}