'use client';

export default function ReportesSkeleton() {
  return (
    <div className="space-y-6 w-full animate-pulse p-1">
      
      {/* 1. Header Superior Mudo */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div className="space-y-2 w-full max-w-md">
          <div className="h-3 w-40 bg-slate-200 rounded" />
          <div className="h-7 w-56 bg-slate-200 rounded-md" />
          <div className="h-4 w-72 bg-slate-200/70 rounded" />
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <div className="h-10 w-32 bg-slate-200 rounded-xl" />
          <div className="h-10 w-44 bg-slate-200 rounded-xl" />
        </div>
      </div>

      {/* 2. KPIs Mudos (rounded-[2rem]) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className="p-6 bg-white border border-slate-100 rounded-[2rem] h-[108px] flex items-center gap-5 shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-200 flex-shrink-0" />
            <div className="space-y-2 w-full">
              <div className="h-3 w-16 bg-slate-200/80 rounded" />
              <div className="h-6 w-24 bg-slate-200 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Dashboards Inferiores */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Gráfico Principal */}
          <div className="border border-slate-100 rounded-[2rem] bg-white p-6 space-y-6 shadow-sm">
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                <div className="h-5 w-40 bg-slate-200 rounded" />
                <div className="h-3 w-52 bg-slate-200/60 rounded" />
              </div>
              <div className="h-6 w-20 bg-slate-200 rounded" />
            </div>
            <div className="h-[280px] w-full bg-slate-50 rounded-2xl" />
          </div>
        </div>

        {/* Columna Lateral */}
        <div className="lg:col-span-4">
          <div className="border border-slate-100 bg-white rounded-[2rem] p-6 h-[440px] flex flex-col justify-between shadow-sm">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-40 bg-slate-200/60 rounded" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
              </div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-20 bg-slate-200/70 rounded" />
                    <div className="h-2 bg-slate-100 rounded-full w-full" />
                  </div>
                ))}
              </div>
            </div>
            <div className="h-11 w-full bg-slate-200 rounded-xl" />
          </div>
        </div>
      </section>
    </div>
  );
}