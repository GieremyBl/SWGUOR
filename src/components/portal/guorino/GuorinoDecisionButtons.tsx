'use client';

import { cn } from '@/lib/utils';

interface Props {
  affirmativeLabel?: string;
  negativeLabel?: string;
  onAffirmative: () => void;
  onNegative: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function GuorinoDecisionButtons({
  affirmativeLabel = 'Aceptar',
  negativeLabel = 'Denegar',
  onAffirmative,
  onNegative,
  disabled = false,
  loading = false,
  className,
}: Props) {
  return (
    <div className={cn('flex flex-wrap gap-2 pt-1', className)}>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onAffirmative}
        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {affirmativeLabel}
      </button>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onNegative}
        className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        {negativeLabel}
      </button>
    </div>
  );
}
