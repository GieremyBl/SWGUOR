'use client';

import { Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DespachosToolbarProps {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  loading: boolean;
  onRefresh: () => void;
}

export function DespachosToolbar({ searchTerm, onSearchChange, loading, onRefresh }: DespachosToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar por despacho, cliente o tracking..."
          className="pl-10 h-11 bg-white border-gray-200 rounded-xl"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Button variant="outline" className="h-11 rounded-xl border-gray-200" onClick={onRefresh}>
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}