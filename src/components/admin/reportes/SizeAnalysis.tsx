'use client';

import { Layers, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

// Definición estricta de la estructura de datos para el análisis de tallas
export interface SizeItem {
  name:  string;
  value: number;
}

interface SizeAnalysisProps {
  data: SizeItem[];
}

export default function SizeAnalysis({ data }: SizeAnalysisProps) {
  const router = useRouter();
  
  // FIX: Previene errores matemáticos si el arreglo de datos llega vacío desde la API
  const values = data.map((d) => d.value);
  const maxVal = values.length > 0 ? Math.max(...values) : 1;

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
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-100 dark:border-rose-900/50 text-rose-600 shrink-0">
            <Layers size={18} />
          </div>
        </div>

        {/* Barras de Análisis */}
        <div className="space-y-6">
          {data.length > 0 ? (
            data.slice(0, 6).map((item) => {
              // Limita el porcentaje entre el 4% y el 100% para evitar que barras con valor 0 desaparezcan por completo
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
                      className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_8px_rgba(225,29,72,0.2)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground/50">
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
          <ChevronRight size={16} className="shrink-0" />
        </Button>
        <p className="text-center text-[9px] text-muted-foreground font-bold uppercase tracking-widest animate-pulse">
          Sincronización en tiempo real
        </p>
      </div>
    </Card>
  );
}