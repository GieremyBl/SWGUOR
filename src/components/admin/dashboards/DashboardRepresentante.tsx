"use client";

import React from "react";
import { Zap, Truck, Users } from 'lucide-react';
import DashboardCharts from "./DashboardCharts";

type personal = {
  id: string | number;
  nombre_completo: string;
  rol: string;
  estado: string;
};

export default function DashboardRepresentante({ personal }: { personal: personal }) {
  // Datos simulados del piso de producción
  const lotesEnProduccion = [
    { id: "L-405", prenda: "Pantalón Denim", avance: 65, operarios: 4, prioridad: "Alta" },
    { id: "L-408", prenda: "Camisa Oxford", avance: 30, operarios: 3, prioridad: "Media" },
    { id: "L-410", prenda: "Casaca Bomber", avance: 10, operarios: 2, prioridad: "Baja" },
  ];

  return (
    <div className="space-y-8 p-6 bg-[#f9fafb] min-h-screen">
      
      {/* HEADER DE CONTROL */}
      <header className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600"></span>
              </span>
              Producción en Vivo
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">
              Planta <span className="text-slate-400 font-light">de</span> Confección
            </h1>
            <p className="text-slate-500 text-sm font-medium">Línea de producción activa • {personal.nombre_completo}</p>
          </div>

          <button className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-200 h-fit">
            Iniciar Nuevo Lote
          </button>
        </div>
      </header>

      {/* MÉTRICAS DE PLANTA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard 
          title="Lotes en Costura" 
          value="18" 
          color="orange" 
          detail="85% capacidad"
          icon={Zap}
        />
        <KpiCard 
          title="Salida del Día" 
          value="42" 
          color="emerald" 
          detail="Meta: 50 prendas"
          icon={Truck}
        />
        <KpiCard 
          title="Equipo Taller" 
          value="08" 
          color="blue" 
          detail="4 módulos activos"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* MONITOREO DE LOTES */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="font-black uppercase text-slate-800 tracking-tight">
                Progreso de Manufactura
              </h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase mt-1">Tiempo real por módulo</p>
            </div>
          </div>

          <div className="space-y-6">
            {lotesEnProduccion.map((lote) => (
              <div key={lote.id} className="p-6 bg-slate-50/50 rounded-[2.5rem] border border-transparent hover:border-slate-100 hover:bg-white transition-all group">
                <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-xs text-slate-400">
                      {lote.id}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 uppercase text-sm group-hover:text-orange-600 transition-colors">
                        {lote.prenda}
                      </h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                        {lote.operarios} Operarios asignados
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 max-w-[200px] space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase">
                      <span className="text-slate-400">Avance</span>
                      <span className="text-slate-900">{lote.avance}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          lote.avance > 50 ? 'bg-emerald-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${lote.avance}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${
                      lote.prioridad === 'Alta' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {lote.prioridad}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ANALÍTICA Y ALERTAS */}
        <div className="lg:col-span-4 space-y-8">
          
          <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white">
            <h3 className="font-black uppercase tracking-widest text-[10px] mb-8 text-slate-400">Rendimiento Semanal</h3>
            <DashboardCharts minimal={true} />
          </div>

          <div className="bg-rose-50 p-8 rounded-[3rem] border border-rose-100 relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-[10px] font-black text-rose-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-ping" />
                Alertas Críticas
              </h4>
              <p className="text-[11px] text-rose-700 font-medium leading-relaxed">
                El módulo 3 reporta un retraso por <strong>falta de habilitado</strong>. El ayudante debe abastecer en menos de 15 min.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
             <h4 className="text-[10px] font-black text-slate-800 uppercase mb-4">Personal en Turno</h4>
             <div className="flex -space-x-3">
               {[1,2,3,4,5].map(i => (
                 <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                   OP
                 </div>
               ))}
               <div className="w-10 h-10 rounded-full border-4 border-white bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                 +3
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function KpiCard({ title, value, color, detail, icon: Icon }: any) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-transparent hover:border-slate-100 transition-all">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase italic">{detail}</p>
      </div>
    </div>
  );
}