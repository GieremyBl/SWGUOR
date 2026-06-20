'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function TesoreriaPagosPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <p className="text-xs text-gray-500">
        <span className="font-bold text-gray-900">{total}</span> transacciones encontradas
      </p>
      <div className="flex gap-2 items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="px-4 py-1.5 text-xs font-bold bg-gray-50 border rounded-lg">
          Página {page} de {totalPages || 1}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
