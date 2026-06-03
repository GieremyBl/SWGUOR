import { cn } from '@/lib/utils';

function Pulse({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-guor-100/60', className)} />;
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Cabecera Skeleton */}
      <div className="flex justify-between items-center pb-4 border-b border-guor-line">
        <div className="space-y-2">
          <Pulse className="h-4 w-24 rounded-full" />
          <Pulse className="h-8 w-64 rounded-xl" />
          <Pulse className="h-3 w-32 rounded-md" />
        </div>
        <div className="flex gap-3">
          <Pulse className="hidden md:block h-12 w-36 rounded-xl" />
          <Pulse className="h-11 w-40 rounded-xl" />
        </div>
      </div>
      {/* KPIs Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Pulse key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      {/* Contenido Principal Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Pulse className="h-[340px] rounded-2xl" />
        </div>
        <div>
          <Pulse className="h-[340px] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
