import { cn } from '@/lib/utils';

function Pulse({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-[#e4c28a]/15', className)} />;
}

export function PedidoSkeleton() {
  return (
    <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-[#e4c28a]/20 animate-pulse">
      <Pulse className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Pulse className="h-3 w-28" />
        <Pulse className="h-2.5 w-40" />
      </div>
      <Pulse className="hidden sm:block h-4 w-20" />
      <Pulse className="hidden md:block h-6 w-24 rounded-full" />
      <Pulse className="w-8 h-8 rounded-lg flex-shrink-0" />
    </div>
  );
}