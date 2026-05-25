import { cn } from '@/lib/utils';

export function ActivoBadge({ activo }: { activo: boolean | null | undefined }) {
  const on = activo !== false;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        on ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600',
      )}
    >
      {on ? 'Activo' : 'Inactivo'}
    </span>
  );
}
