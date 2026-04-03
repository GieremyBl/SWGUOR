"use client";

import React from "react";
import { CheckSquare, Zap, AlertTriangle, ClipboardList, AlertCircle, Briefcase } from 'lucide-react';
import DashboardCharts from "./DashboardCharts";

type personal = {
  id: string | number;
  nombre_completo: string;
  rol: string;
  estado: string;
};

export default function DashboardAyudante({ personal }: { personal: personal }) {
  // Datos simulados (Idealmente vendrían de un fetch)
  const tareas = [
    { id: 1, tarea: "Limpieza de mesas de corte", prioridad: "Urgente", tiempo: "10 min" },
    { id: 2, tarea: "Acarreo de rollos a bodega B", prioridad: "Normal", tiempo: "30 min" },
    { id: 3, tarea: "Apoyo en remalle de lote #402", prioridad: "Baja", tiempo: "1 hr" },
  ];

  return (
    <div className="space-y-8 p-4 md:p-8 bg-[#f8fafc] min-h-screen font-sans">
      
      {/* HEADER PERSONALIZADO */}
      <header className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              Jornada Productiva
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">
              Hola, {personal.nombre_completo.split(' ')[0]}
            </h1>
            <p className="text-slate-500 text-sm font-medium">Sector: Talleres GUOR • Turno Mañana</p>
          </div>

          {/* PROGRESO DIARIO */}
          <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-2xl border border-emerald-100 shadow-sm h-fit min-w-[250px]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Meta del Día</span>
              <span className="text-sm font-black text-emerald-600 bg-emerald-100/50 px-2.5 py-1 rounded-lg">65%</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full w-[65%] rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
            </div>
            <p className="text-[8px] text-slate-400 font-bold mt-3 uppercase tracking-widest">23/35 Tareas completadas</p>
          </div>
        </div>
      </header>

      {/* KPI GRID - ENFOQUE EN CARGA DE TRABAJO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard 
          title="Tareas Pendientes" 
          value="5" 
          color="orange" 
          subtitle="Próximas 4 horas"
          icon={Zap}
        />
        <KpiCard 
          title="Completadas Hoy" 
          value="8" 
          color="emerald" 
          subtitle="+2 que ayer"
          icon={CheckSquare}
        />
        <KpiCard 
          title="Prioridad Alta" 
          value="2" 
          color="rose" 
          isAlert={true}
          subtitle="Atención inmediata"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LISTA DE TAREAS OPERATIVAS */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-xl border border-slate-50">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
              <h3 className="font-black uppercase text-slate-800 tracking-tight">Hoja de Ruta</h3>
            </div>
            <button className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors">
              Historial
            </button>
          </div>

          <div className="space-y-4">
            {tareas.length > 0 ? (
              tareas.map((t) => (
                <div key={t.id} className="group flex items-center justify-between p-5 rounded-[2rem] border border-slate-50 bg-slate-50/30 hover:bg-white hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      t.prioridad === 'Urgente' ? 'bg-rose-100' : 'bg-white shadow-sm'
                    }`}>
                      {t.prioridad === 'Urgente' ? (
                        <AlertCircle className="w-6 h-6 text-rose-600" />
                      ) : t.prioridad === 'Normal' ? (
                        <CheckSquare className="w-6 h-6 text-slate-400" />
                      ) : (
                        <Briefcase className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{t.tarea}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                          t.prioridad === 'Urgente' ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {t.prioridad}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {t.tiempo}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">¡Excelente! Estás al día</p>
              </div>
            )}
          </div>
        </div>

        {/* LOGROS O NOTIFICACIONES */}
        <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
          <h3 className="font-black uppercase tracking-tighter mb-6">
            Mi Desempeño
          </h3>
          
          <div className="space-y-6 relative z-10">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Racha semanal</p>
              <p className="text-xl font-black italic">4 Días Impecables</p>
            </div>
            
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Comentario Supervisor</p>
              <p className="text-sm font-medium text-slate-200">"Buen apoyo en la línea de corte ayer. Sigue así."</p>
            </div>
          </div>

          <div className="mt-12">
            <DashboardCharts minimal /> 
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, color, isAlert, subtitle, icon: Icon }: any) {
  const colors: any = { 
    rose: 'bg-rose-50', 
    emerald: 'bg-emerald-50', 
    orange: 'bg-orange-50' 
  };

  return (
    <div className={`bg-white p-6 rounded-[2.5rem] border-2 transition-all hover:shadow-xl group ${
      isAlert ? 'border-rose-100 shadow-lg shadow-rose-50' : 'border-transparent shadow-sm hover:border-slate-100'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
        <span className="text-[10px] font-bold text-slate-400 lowercase">{subtitle}</span>
      </div>
    </div>
  );
}