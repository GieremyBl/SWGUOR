'use client';

import { Layers, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface SizeAnalysisProps {
  data: any[];
}

export default function SizeAnalysis({ data }: SizeAnalysisProps) {
  const router = useRouter();
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card className="border border-border bg-card shadow-sm rounded-[2rem] p-6 flex flex-col justify-between min-h-[620px] relative overflow-hidden">
      <div>
        {/* Cabecera */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-base font-bold text-foreground tracking-tight">
              Análisis de Tallas
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
              Demanda operativa activa
            </p>
          </div>
          <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100 text-rose-600">
            <Layers size={18} />
          </div>
        </div>

        {/* Barras */}
        <div className="space-y-6">
          {data.length > 0 ? (
            data.slice(0, 6).map((item: any) => {
              const pct = Math.min(Math.max((item.value / maxVal) * 100, 4), 100);
              return (
                <div key={item.name} className="group">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 group-hover:text-foreground transition-colors">
                    <span>Talla {item.name}</span>
                    <span className="text-rose-600 font-bold">
                      {item.value.toLocaleString('es-PE')} und.
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden p-0.5 border border-border">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${pct}%`,
                        background: 'linear-gradient(to right, #e11d48, #fb7185)',
                        boxShadow: '0 0 8px rgba(225,29,72,0.2)',
                      }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center text-muted-foreground/50">
              <p className="font-medium text-xs">Sin registros históricos</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 space-y-4">
        <Button
          onClick={() => router.push('/admin/inventario')}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-5 font-bold text-sm transition-all shadow-md shadow-rose-500/10 flex items-center justify-center gap-1 border-none"
        >
          Gestionar Inventario
          <ChevronRight size={16} />
        </Button>
        <p className="text-center text-[9px] text-muted-foreground font-bold uppercase tracking-widest animate-pulse">
          Sincronización en tiempo real
        </p>
      </div>
    </Card>
  );
}