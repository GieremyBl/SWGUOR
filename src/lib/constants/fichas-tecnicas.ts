import type { EstadoFicha } from '@prisma/client';

export const ESTADOS_FICHA: Record<
  EstadoFicha,
  { label: string; color: string; dot: string }
> = {
  borrador:    { label: 'Borrador',    color: 'bg-gray-50 text-gray-600 border-gray-200',       dot: '#94A3B8' },
  en_revision: { label: 'En revisión', color: 'bg-amber-50 text-amber-700 border-amber-200',    dot: '#F59E0B' },
  aprobada:    { label: 'Aprobada',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: '#10B981' },
  obsoleta:    { label: 'Obsoleta',    color: 'bg-red-50 text-red-700 border-red-200',          dot: '#EF4444' },
};

export const LISTA_ESTADOS_FICHA = Object.keys(ESTADOS_FICHA) as EstadoFicha[];
