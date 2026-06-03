"use client";

import React from 'react';
import {
  Users, UserPlus, ShoppingBag, FileText, Heart,
  Search, Plus, ChevronRight, Filter, Calendar, MessageCircle,
} from 'lucide-react';
import { DashboardSection } from './DashboardSection';
import { SparkKpiCard } from './widgets/DashboardWidgets';
import { COMPANY_PALETTE } from './widgets/DashboardUtils';
import DashboardLoader from './DashboardLoaders';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface CotizacionItem {
  id: number;
  cliente: string;
  total: string;
  estado: string;
  fecha: string;
}

interface RecepcionistaData {
  kpis: {
    pedidosHoy: number;
    totalClientes: number;
    cotizacionesPendientes: number;
    satisfaccion: string;
  };
  cotizacionesRecientes: CotizacionItem[];
}

// ─── Badge de estado ──────────────────────────────────────────────────────────
const estadoBadge: Record<string, string> = {
  enviada:    'bg-amber-50 text-amber-700 border-amber-200',
  aprobada:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  rechazada:  'bg-red-50 text-red-600 border-red-200',
  convertida: 'bg-rose-50 text-rose-700 border-rose-200',
  borrador:   'bg-stone-50 text-stone-500 border-stone-200',
  expirada:   'bg-stone-100 text-stone-400 border-stone-200',
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardRecepcionista() {
  const F = COMPANY_PALETTE;
  const [data, setData] = React.useState<RecepcionistaData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busqueda, setBusqueda] = React.useState('');

  React.useEffect(() => {
    fetch('/api/admin/dashboard?role=recepcionista')
      .then((r) => r.json())
      .then((json) => { setData(json); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLoader message="Preparando recepción..." />;

  const cotizaciones = (data?.cotizacionesRecientes ?? []).filter((c) =>
    busqueda === '' ||
    c.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
    String(c.id).includes(busqueda)
  );

  return (
    <DashboardSection
      title="Atención al Cliente"
      role="recepcionista"
      subtitle="Gestión de cotizaciones y atención presencial"
    >
      <div className="space-y-5">

        {/* Barra de acciones rápidas */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white border border-stone-100 p-4 rounded-3xl shadow-sm">
          <div className="relative group w-full md:max-w-sm">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-rose-500 transition-colors"
            />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar cliente o N° cotización..."
              className="w-full pl-10 pr-4 py-3 bg-stone-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-rose-500 transition-all placeholder:text-stone-400 font-medium outline-none"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-stone-100 text-stone-700 rounded-2xl text-[10px] font-black uppercase hover:bg-stone-50 transition-all active:scale-95 shadow-sm">
              <UserPlus size={15} className="text-rose-600" /> Nuevo Cliente
            </button>
            <button
              style={{ background: F.accent }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 text-white rounded-2xl text-[10px] font-black uppercase hover:opacity-90 transition-all active:scale-95 shadow-sm"
            >
              <Plus size={15} /> Crear Pedido
            </button>
          </div>
        </div>

        {/* 1 ─ KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SparkKpiCard
            label="Pedidos Hoy"
            value={data?.kpis?.pedidosHoy ?? 0}
            delta={8}
            icon={ShoppingBag}
            accentColor={F.accent}
            sparkData={[10, 15, 12, 18, 14, data?.kpis?.pedidosHoy ?? 0]}
          />
          <SparkKpiCard
            label="Clientes"
            value={data?.kpis?.totalClientes ?? 0}
            delta={2}
            icon={UserPlus}
            accentColor={F.accent}
            sparkData={[2, 3, 5, 4, 6, 8]}
          />
          <SparkKpiCard
            label="Cotizaciones"
            value={data?.kpis?.cotizacionesPendientes ?? 0}
            delta={12}
            icon={FileText}
            accentColor={F.accent}
            sparkData={[20, 25, 22, 28, 30, data?.kpis?.cotizacionesPendientes ?? 0]}
          />
          <SparkKpiCard
            label="Satisfacción"
            value={data?.kpis?.satisfaccion ?? '—'}
            delta={1}
            icon={Heart}
            accentColor={F.accent}
            sparkData={[95, 96, 97, 98, 98, 99]}
          />
        </div>

        {/* 2 ─ Cuerpo principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Lista de cotizaciones */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">
                    Atenciones Recientes
                  </h3>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tighter">
                    Cotizaciones y seguimiento
                  </p>
                </div>
                <button className="p-2.5 bg-stone-50 text-stone-400 rounded-xl hover:bg-stone-100 transition-colors">
                  <Filter size={15} />
                </button>
              </div>

              {cotizaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <FileText size={36} className="text-stone-200" />
                  <p className="text-[11px] font-black text-stone-400 uppercase tracking-widest">
                    {busqueda ? 'Sin resultados' : 'Sin cotizaciones recientes'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cotizaciones.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between p-4 rounded-2xl bg-stone-50/50 border border-transparent hover:border-rose-100 hover:bg-white hover:shadow-lg hover:shadow-rose-50/40 transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-rose-500 shadow-sm group-hover:scale-105 transition-transform">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-stone-900 uppercase tracking-tight">
                            {item.cliente}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black text-rose-600 uppercase">
                              S/ {item.total}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${estadoBadge[item.estado] ?? 'bg-stone-50 text-stone-500 border-stone-200'}`}
                            >
                              {item.estado}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="hidden sm:block text-xs font-black text-stone-400">
                          #{item.id}
                        </span>
                        <button className="p-2 rounded-xl bg-white border border-stone-100 text-stone-400 hover:text-rose-600 hover:border-rose-200 transition-all">
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Accesos rápidos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-stone-900 rounded-3xl p-6 text-white group cursor-pointer overflow-hidden relative">
                <div className="relative z-10">
                  <h4 className="text-base font-black uppercase tracking-tight mb-1">Registro Rápido</h4>
                  <p className="text-[10px] text-stone-400 font-medium uppercase mb-5">
                    Nuevo cliente corporativo
                  </p>
                  <button className="flex items-center gap-2 text-rose-400 text-[10px] font-black uppercase tracking-widest group-hover:gap-3 transition-all">
                    Empezar <ChevronRight size={12} />
                  </button>
                </div>
                <UserPlus size={90} className="absolute -bottom-6 -right-6 text-white/5 rotate-12" />
              </div>
              <div
                className="rounded-3xl p-6 text-white group cursor-pointer overflow-hidden relative"
                style={{ background: F.accent }}
              >
                <div className="relative z-10">
                  <h4 className="text-base font-black uppercase tracking-tight mb-1">Muestras</h4>
                  <p className="text-[10px] text-rose-100 font-medium uppercase mb-5">
                    Envío de catálogos
                  </p>
                  <button className="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest group-hover:gap-3 transition-all">
                    Ver solicitudes <ChevronRight size={12} />
                  </button>
                </div>
                <Users size={90} className="absolute -bottom-6 -right-6 text-white/10 -rotate-12" />
              </div>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="space-y-4">

            {/* Mensajería */}
            <div className="bg-emerald-50 rounded-3xl border border-emerald-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-sm shadow-emerald-100">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-950 uppercase">Canales Digitales</h4>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">
                    Consultas pendientes
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { name: 'P. Gonzáles', time: '09:45', msg: 'Consulta por catálogo 2024' },
                  { name: 'Textil Norte', time: '10:15', msg: 'Estado de cotización #452' },
                ].map((chat, i) => (
                  <div
                    key={i}
                    className="bg-white p-3.5 rounded-2xl border border-emerald-100 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[10px] font-black text-stone-900 uppercase">{chat.name}</span>
                      <span className="text-[9px] font-bold text-stone-400">{chat.time}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 truncate">{chat.msg}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Próximos eventos */}
            <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-5">
                Próximos Eventos
              </h4>
              <div className="space-y-5">
                {[
                  { date: '15 May', event: 'Lanzamiento Colección Invierno' },
                  { date: '18 May', event: 'Visita Corporativa — Grupo A' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center justify-center w-11 h-11 bg-stone-50 rounded-2xl border border-stone-100 flex-shrink-0">
                      <span className="text-[10px] font-black text-stone-900 leading-none">
                        {item.date.split(' ')[0]}
                      </span>
                      <span className="text-[8px] font-bold text-stone-400 uppercase">
                        {item.date.split(' ')[1]}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-stone-800 leading-tight mb-1">
                        {item.event}
                      </p>
                      <div className="flex items-center gap-1 text-[9px] text-stone-400 font-bold uppercase">
                        <Calendar size={9} /> 09:00 AM
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </DashboardSection>
  );
}