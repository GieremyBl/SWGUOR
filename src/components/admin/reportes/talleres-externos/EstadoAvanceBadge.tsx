import type {
  EstadoReporteTaller,
} from '@/types/reporte-talleres';

interface Props {
  estado: EstadoReporteTaller;
}

const styles = {
  completado: 'bg-green-100 text-green-700',
  en_proceso: 'bg-yellow-100 text-yellow-700',
  retrasado: 'bg-red-100 text-red-700',
  pendiente: 'bg-gray-200 text-gray-700',
};

const labels = {
  completado: 'Completado',
  en_proceso: 'En Proceso',
  retrasado: 'Retrasado',
  pendiente: 'Pendiente',
};

export default function EstadoAvanceBadge({
  estado,
}: Props) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[estado]}`}
    >
      {labels[estado]}
    </span>
  );
}