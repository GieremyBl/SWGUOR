"use client";

import React from "react";
import { Scissors, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import DashboardCharts from "./DashboardCharts";

type personal = {
  id: string | number;
  nombre_completo: string;
  rol: string;
  estado: string;
};

export default function DashboardCortador({ personal }: { personal: personal }) {
  // Datos simulados de la cola de corte
  const tareasCorte = [
    { id: 1, lote: "L-405", producto: "Pantalón Denim Slim", capas: 50, tela: "Mezclilla 12oz", prioridad: "Urgente" },
    { id: 2, lote: "L-408", producto: "Camisa Oxford Blanca", capas: 120, tela: "Algodón Premium", prioridad: "Normal" },
    { id: 3, lote: "L-409", producto: "Polo Jersey Gris", capas: 80, tela: "Jersey 30/1", prioridad: "Normal" },
  ];

  return (
    <div className="space-y-8 p-4 md:p-8 bg-[#f8fafc] min-h-screen font-sans">
      
      {/* HEADER OPERATIVO */}
      <header className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
              </span>
              Estación de Corte
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">Centro de Corte</h1>
            <p className="text-slate-500 text-sm font-medium">Mesa 01 • Estación de Alta Precisión</p>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 h-fit">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Eficiencia Hoy</p>
              <p className="text-3xl font-black text-slate-900 leading-none mt-2">94.2%</p>
            </div>
            <div className="w-px bg-slate-200 h-px" />
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Turno Active</p>
              <p className="text-sm font-black text-indigo-600 uppercase mt-2">Mañana</p>
            </div>
          </div>
        </div>
      </header>

      {/* KPI GRID - MÉTRICAS DE TALLER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard 
          title="Cortes Pendientes" 
          value="15" 
          color="indigo" 
          detail="Aprox. 320 capas"
          icon={Scissors}
        />
        <KpiCard 
          title="Completados Hoy" 
          value="23" 
          color="emerald" 
          detail="+15% vs ayer"
          icon={CheckCircle2}
        />
        <KpiCard 
          title="Lotes Urgentes" 
          value="3" 
          color="rose" 
          isAlert={true}
          detail="Prioridad de despacho"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLA DE PRODUCCIÓN */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="font-black uppercase text-slate-800 tracking-tight">Orden de Trabajo</h3>
            </div>
          </div>

          <div className="space-y-4">
            {tareasCorte.map((t) => (
              <div key={t.id} className="group relative bg-slate-50/50 hover:bg-white p-6 rounded-[2.5rem] border border-transparent hover:border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-pointer overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Lote</p>
                      <p className="text-lg font-black text-indigo-600">{t.lote}</p>
                    </div>
                    <div className="h-10 w-px bg-slate-200 hidden md:block" />
                    <div>
                      <h4 className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase text-sm">{t.producto}</h4>
                      <div className="flex gap-4 mt-1">
                        <span className="text-[10px] text-slate-500 font-bold">
                          {t.capas} capas
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">
                          {t.tela}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                      t.prioridad === 'Urgente' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {t.prioridad}
                    </span>
                    <button className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-indigo-600 transition-all flex items-center justify-center">
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RENDIMIENTO LATERAL (USANDO EL COMPONENTE REFACTOREADO) */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white">
            <h3 className="font-black uppercase tracking-tighter mb-8">
              Productividad
            </h3>
            
            {/* Aquí pasamos minimal={true} que ya no dará error TS */}
            <DashboardCharts minimal={true} />

            <div className="mt-8 pt-8 border-t border-slate-800 space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Meta Semanal</span>
                  <span className="text-[10px] font-black text-white uppercase">150 Cortes</span>
               </div>
               <div className="w-full bg-slate-800 h-1.5 rounded-full">
                  <div className="bg-indigo-500 h-full w-[82%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
               </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
            <h4 className="font-black uppercase text-slate-800 text-xs mb-4">Nota del Supervisor</h4>
            <p className="text-xs text-slate-500 leading-relaxed italic">
              "Priorizar el lote L-405, el cliente lo requiere para el despacho de mañana a primera hora."
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function KpiCard({ title, value, color, isAlert, detail, icon: Icon }: any) {
  const colorMap: any = { 
    indigo: 'bg-indigo-50', 
    emerald: 'bg-emerald-50', 
    rose: 'bg-rose-50' 
  };
  
  return (
    <div className={`bg-white p-6 rounded-[2.5rem] border-2 transition-all group hover:scale-[1.02] ${
      isAlert ? 'border-rose-100 shadow-lg shadow-rose-50' : 'border-transparent shadow-sm hover:border-slate-100'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{title}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{detail}</p>
      </div>
    </div>
  );
}