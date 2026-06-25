'use client';

import { useState } from 'react';

import type {
  ReporteIncidenciaItem,
} from '@/types/reporte-incidencias';

interface Props {
  data: ReporteIncidenciaItem[];
  onEstadoCambiado?: () => void;
}

const ESTADOS = [
  { valor: 'abierta', etiqueta: 'Abierta' },
  { valor: 'en_revision', etiqueta: 'En revisión' },
  { valor: 'resuelta', etiqueta: 'Resuelta' },
  { valor: 'cerrada', etiqueta: 'Cerrada' },
];

export default function IncidenciasClienteTable({ data, onEstadoCambiado }: Props) {
  // Guardamos qué fila se está actualizando para deshabilitar su selector
  const [actualizando, setActualizando] = useState<number | null>(null);

  const cambiarEstado = async (id: number, nuevoEstado: string) => {
    try {
      setActualizando(id);

      const resp = await fetch('/api/admin/reportes/incidencias-cliente/estado', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado: nuevoEstado }),
      });

      if (!resp.ok) {
        alert('No se pudo cambiar el estado.');
        return;
      }

      // Avisar a la página para que recargue los datos
      onEstadoCambiado?.();
    } catch (error) {
      console.error(error);
      alert('Error al cambiar el estado.');
    } finally {
      setActualizando(null);
    }
  };

  return (
    <div className="bg-[#fbddd3] border border-[#e4c28a] rounded-3xl p-6">

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#231e1d]">
          Detalle de Incidencias
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">

          <thead>
            <tr className="border-b border-[#e4c28a]">
              <th className="text-left py-4">Cliente</th>
              <th className="text-left py-4">Tipo</th>
              <th className="text-left py-4">Severidad</th>
              <th className="text-left py-4">Fecha</th>
              <th className="text-left py-4">Estado</th>
              <th className="text-left py-4">Evidencia</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-b border-[#f1d7c1]">

                <td className="py-4">{item.taller}</td>
                <td className="py-4">{item.tipo}</td>
                <td className="py-4">{item.severidad}</td>
                <td className="py-4">{item.fecha}</td>

                {/* Columna de estado con selector para cambiarlo */}
                <td className="py-4">
                  <select
                    className="
                      bg-white border border-[#e4c28a] rounded-xl
                      px-3 py-2 text-sm font-semibold text-[#231e1d]
                      cursor-pointer
                    "
                    value={
                      item.estado === 'Resuelto' ? 'resuelta' : 'abierta'
                    }
                    disabled={actualizando === item.id}
                    onChange={(e) => cambiarEstado(item.id, e.target.value)}
                  >
                    {ESTADOS.map((est) => (
                      <option key={est.valor} value={est.valor}>
                        {est.etiqueta}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Columna de evidencia (foto) */}
                <td className="py-4">
                  {item.evidencia && item.evidencia.length > 0 ? (
                    <a
                      href={item.evidencia[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#B8962D] font-semibold underline"
                    >
                      Ver foto
                    </a>
                  ) : (
                    <span className="text-gray-400">Sin foto</span>
                  )}
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
}

