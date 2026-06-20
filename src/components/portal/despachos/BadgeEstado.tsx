'use client';

// Definimos los estados válidos según el ENUM public.EstadoDespacho de tu base de datos
export type EstadoDespachoPortal =
  | 'pendiente'
  | 'programado'
  | 'en_almacen'
  | 'en_ruta'
  | 'entregado'
  | 'incidencia'
  | string;

interface BadgeEstadoProps {
  estado: EstadoDespachoPortal;
}

export default function BadgeEstado({ estado }: BadgeEstadoProps) {

  // Mapeo exhaustivo utilizando la paleta Slate, Amber, Emerald y Rose corporativa
  const config: Record<string, { label: string; classes: string }> = {
    pendiente: {
      label: 'Pendiente',
      classes: 'bg-slate-50 text-slate-600 border-slate-200',
    },
    programado: {
      label: 'Programado',
      classes: 'bg-blue-50 text-blue-700 border-blue-200/60',
    },
    preparando: {
      label: 'Preparando',
      classes: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    },
    en_almacen: {
      label: 'En Almacén',
      classes: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    },
    en_ruta: {
      label: 'En Ruta',
      classes: 'bg-amber-50 text-[#B8962D] border-amber-300/40 animate-pulse',
    },
    entregado: {
      label: 'Entregado',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    incidencia: {
      label: 'Incidencia',
      classes: 'bg-rose-50 text-rose-700 border-rose-200 font-extrabold',
    },
  };

  // Fallback seguro en caso de que venga un estado no registrado o nulo
  const actual = config[estado] ?? {
    label: estado ? estado.replace('_', ' ') : 'Desconocido',
    classes: 'bg-slate-100 text-slate-700 border-slate-300',
  };

  return (
    <span
      className={`inline-flex items-center text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-md border shadow-2xs transition-all duration-300 select-none ${actual.classes}`}
    >
      {actual.label}
    </span>
  );
}