'use client';

import { Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PagosToolbarProps {
  searchTerm:    string;
  onSearchChange: (v: string) => void;
  loading:       boolean;
  onRefresh:     () => void;
}

export function PagosToolbar({ searchTerm, onSearchChange, loading, onRefresh }: PagosToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar por N.° pedido, RUC o razón social..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-10 bg-white border-gray-200 rounded-xl h-11"
        />
      </div>
      <Button
        variant="outline"
        onClick={onRefresh}
        disabled={loading}
        className="rounded-xl h-11 px-4 border-gray-200 hover:bg-gray-50"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        Actualizar
      </Button>
    </div>
  );
}