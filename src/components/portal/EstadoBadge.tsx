import { cn } from '@/lib/utils';
import { getEstadoInfo } from '@/lib/constants/estados';

type TipoEstado = 'cotizacion' | 'pedido' | 'despacho' | 'cliente' | 'pago';

interface EstadoBadgeProps {
  estado: string;
  tipo: TipoEstado;
  className?: string;
}

export function EstadoBadge({ estado, tipo, className }: EstadoBadgeProps) {
  const info = getEstadoInfo(estado, tipo);

  // Mapeo manual de colores de bordes basados en el bgColor
  const borderStyles: Record<string, string> = {
    'bg-slate-100': 'border-slate-200',
    'bg-amber-100': 'border-amber-200',
    'bg-green-100': 'border-green-200',
    'bg-red-100': 'border-red-200',
    'bg-blue-100': 'border-blue-200',
    'bg-purple-100': 'border-purple-200',
    'bg-emerald-100': 'border-emerald-200',
    'bg-indigo-100': 'border-indigo-200',
    'bg-teal-100': 'border-teal-200',
    'bg-orange-100': 'border-orange-200',
  };

  const borderColor = borderStyles[info.bgColor] || 'border-gray-200';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold transition-all shadow-sm hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        info.bgColor,
        info.color,
        borderColor,
        className
      )}
      role="status"
      aria-label={`Estado: ${info.label}`}
      title={`${tipo.charAt(0).toUpperCase() + tipo.slice(1)}: ${info.label}`}
    >
      {/* Punto decorativo con animación sutil */}
      <span 
        className={cn(
          'w-1.5 h-1.5 rounded-full fill-current animate-pulse',
          info.color.replace('text-', 'bg-')
        )}
        aria-hidden="true"
      />
      {info.label}
    </span>
  );
}