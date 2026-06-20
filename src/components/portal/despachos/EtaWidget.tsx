'use client';

import { Clock3, CheckCircle2, Truck, AlertCircle, CalendarRange } from 'lucide-react';
import type { DespachoPortal } from '../_contexts/PortalContext';
import { formatFecha } from '@/lib/helpers/despachos-helpers';

interface EtaWidgetProps {
  despacho: DespachoPortal;
}

export default function EtaWidget({ despacho }: EtaWidgetProps) {
  const { estado, fecha_entrega, historial_grupo } = despacho;

  // 1. Obtener de manera dinámica el último hito registrado en la línea de tiempo
  const ultimoHito = historial_grupo && historial_grupo.length > 0
    ? historial_grupo[historial_grupo.length - 1]
    : null;

  // 2. Configuración de mensajes, iconos y estilos según el ENUM de EstadoDespacho
  const config: Record<string, { icon: React.ReactNode; mensaje: string; color: string; textStyle: string }> = {
    pendiente: {
      icon: <Clock3 className="w-4 h-4 text-slate-400" />,
      mensaje: 'Pendiente de preparación — El lote se encuentra en almacén central.',
      color: 'bg-slate-50 border-slate-200/60',
      textStyle: 'text-slate-600',
    },
    programado: {
      icon: <CalendarRange className="w-4 h-4 text-[#B8962D]" />,
      mensaje: 'Despacho programado — Asignando bloque horario de transporte.',
      color: 'bg-amber-50/40 border-amber-200/40',
      textStyle: 'text-slate-700',
    },
    preparando: {
      icon: <Clock3 className="w-4 h-4 text-[#B8962D]" />,
      mensaje: 'En preparación — El lote se encuentra en almacén central.',
      color: 'bg-amber-50/40 border-amber-200/40',
      textStyle: 'text-slate-700',
    },
    en_almacen: {
      icon: <Clock3 className="w-4 h-4 text-[#B8962D]" />,
      mensaje: 'En zona de carga — Pasando controles de empaquetado final.',
      color: 'bg-amber-50/40 border-amber-200/40',
      textStyle: 'text-slate-700',
    },
    en_ruta: {
      icon: <Truck className="w-4 h-4 text-[#B8962D] animate-pulse" />,
      mensaje: `En tránsito — Destino en camino. Entrega estimada: ${fecha_entrega ? formatFecha(fecha_entrega) : 'Por confirmar'}.`,
      color: 'bg-amber-50/60 border-amber-200/50',
      textStyle: 'text-slate-800 font-medium',
    },
    entregado: {
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      mensaje: `Lote entregado de manera conforme${fecha_entrega ? ` el ${formatFecha(fecha_entrega)}` : ''}.`,
      color: 'bg-emerald-50/50 border-emerald-100',
      textStyle: 'text-emerald-800',
    },
    incidencia: {
      icon: <AlertCircle className="w-4 h-4 text-rose-600" />,
      mensaje: 'Incidencia en ruta registrada — El equipo de operaciones está gestionando el caso.',
      color: 'bg-rose-50/60 border-rose-100',
      textStyle: 'text-rose-900 font-semibold',
    },
  };

  // Fallback por si llega un estado imprevisto del backend
  const current = config[estado] ?? {
    icon: <Clock3 className="w-4 h-4 text-slate-400" />,
    mensaje: `Estado actual: ${estado.replace('_', ' ')}.`,
    color: 'bg-slate-50 border-slate-200',
    textStyle: 'text-slate-600',
  };

  return (
    <div className={`flex flex-col gap-2 border rounded-xl px-4 py-3.5 shadow-2xs transition-colors duration-300 ${current.color}`}>
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex-shrink-0">
          {current.icon}
        </div>
        <p className={`text-xs leading-relaxed ${current.textStyle}`}>
          {current.mensaje}
        </p>
      </div>

      {/* 3. Renderizado de la última nota extraída de tu tabla 'seguimiento_despachos' */}
      {ultimoHito?.notas && (
        <div className="pl-6 border-l border-slate-200/80 ml-2 mt-1">
          <p className="text-[11px] text-slate-500 font-medium italic leading-normal">
            Última actualización: "{ultimoHito.notas}"
          </p>
        </div>
      )}
    </div>
  );
}