'use client';

import { Calendar, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ReportFiltersProps {
  range: string;
  setRange: (range: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function ReportFilters({
  range,
  setRange,
  onRefresh,
  isLoading,
}: ReportFiltersProps) {
  return (
    <div className="flex items-center bg-muted border border-border rounded-xl p-1 gap-1 w-full sm:w-auto">
      <Select value={range} onValueChange={setRange}>
        <SelectTrigger className="w-full sm:w-[170px] border-none bg-transparent shadow-none font-bold text-muted-foreground focus:ring-0 h-9 text-xs">
          <Calendar className="w-3.5 h-3.5 mr-2 text-rose-500" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-border bg-popover">
          <SelectItem value="7"  className="text-xs">Últimos 7 días</SelectItem>
          <SelectItem value="30" className="text-xs">Últimos 30 días</SelectItem>
          <SelectItem value="90" className="text-xs">Vista Trimestral</SelectItem>
        </SelectContent>
      </Select>
      <div className="w-px h-5 bg-border mx-1" />
      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        className="rounded-lg hover:bg-card text-muted-foreground h-9 w-9"
      >
        <RefreshCcw size={14} className={isLoading ? 'animate-spin text-rose-500' : ''} />
      </Button>
    </div>
  );
}