'use client';

import { Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ESTADOS_ORDEN_COMPRA } from '@/lib/constants/estados';

interface OrdenesCompraToolbarProps {
  searchTerm:      string;
  onSearchChange:  (v: string) => void;
  estadoFilter:    string;
  onEstadoChange:  (v: string) => void;
  isLoading:       boolean;
  onRefresh:       () => void;
}

export function OrdenesCompraToolbar({
  searchTerm, onSearchChange,
  estadoFilter, onEstadoChange,
  isLoading, onRefresh,
}: OrdenesCompraToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar por proveedor, N° OC..."
          className="pl-10 h-11 bg-white rounded-xl"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select value={estadoFilter} onValueChange={onEstadoChange}>
        <SelectTrigger className="w-full sm:w-48 h-11 bg-white rounded-xl">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los estados</SelectItem>
          {Object.entries(ESTADOS_ORDEN_COMPRA).map(([key, cfg]) => (
            <SelectItem key={key} value={key}>
              {cfg.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        className="h-11 rounded-xl bg-white"
        onClick={onRefresh}
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}