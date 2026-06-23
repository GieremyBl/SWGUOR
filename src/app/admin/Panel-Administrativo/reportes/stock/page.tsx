'use client';

import { PortalProvider } from '@/components/portal/_contexts/PortalContext';
import { usePortal } from '@/lib/hooks/usePortal';

function ReporteStockContent() {
  const { productos, loading } = usePortal();

  const productosConStock = productos
    ? productos.map((p) => {

        const variantes = p.variantes ?? p.variantes_producto ?? [];

        // 🔥 sumar stock de todas las variantes
        const stockActual = variantes.reduce((total: number, v: any) => {
          return total + (v.stock ?? v.stock_actual ?? 0);
        }, 0);

        const stockReservado = 0; // luego lo conectamos

        return {
          id: p.id,
          nombre: p.nombre,
          stockActual,
          stockReservado,
        };
      })
    : [];

  if (loading) {
    return <div className="p-6">Cargando productos...</div>;
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
          {productosConStock.map((p) => {

            const disponible = p.stockActual - p.stockReservado > 0;

            let estado = '';
            let color = '';

            if (p.stockActual <= 10) {
              estado = 'CRÍTICO';
              color = 'text-red-600';
            } else if (p.stockActual <= 50) {
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
                  {p.stockActual}
                </td>

                <td className="p-2 text-center">
                  {p.stockReservado}
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

export default function ReporteStockPage() {
  return (
    <PortalProvider>
      <ReporteStockContent />
    </PortalProvider>
  );
}