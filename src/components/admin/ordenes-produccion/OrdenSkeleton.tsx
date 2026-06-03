"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function OrdenesSkeleton() {
  return (
    <div className="p-6 space-y-7 animate-pulse">
      {/* 1. Skeleton del Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48 bg-slate-200 rounded-lg" />
          <Skeleton className="h-4 w-64 bg-slate-100 rounded-md" />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Skeleton className="h-11 w-full md:w-32 bg-slate-200 rounded-xl" />
          <Skeleton className="h-11 w-full md:w-40 bg-slate-200 rounded-xl" />
        </div>
      </div>

      {/* 2. Skeleton de StatCards (3 columnas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-5 rounded-2xl border border-slate-100 bg-white flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-xl bg-slate-200" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20 bg-slate-100" />
              <Skeleton className="h-8 w-12 bg-slate-200" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Skeleton de Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-50/50 p-2 rounded-2xl border border-slate-100">
        <Skeleton className="h-10 flex-1 bg-white border border-slate-200 rounded-xl" />
        <Skeleton className="h-10 w-full md:w-56 bg-white border border-slate-200 rounded-xl" />
      </div>

      {/* 4. Skeleton de la Tabla */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden">
        {/* Header de tabla */}
        <div className="h-12 bg-slate-50/50 border-b border-slate-100 flex items-center px-6 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-3 flex-1 bg-slate-200" />
          ))}
        </div>
        
        {/* Filas de tabla */}
        <div className="divide-y divide-slate-50">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-6 py-5 flex items-center gap-4">
              <Skeleton className="h-4 w-10 bg-slate-100" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40 bg-slate-100" />
                <Skeleton className="h-3 w-24 bg-slate-50" />
              </div>
              <Skeleton className="h-4 w-32 bg-slate-100 hidden md:block" />
              <Skeleton className="h-6 w-10 bg-slate-100 rounded-md" />
              <Skeleton className="h-6 w-24 bg-slate-100 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}