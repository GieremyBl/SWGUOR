'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Clock3, Warehouse } from 'lucide-react';
import type { LoteExterno } from '@/lib/services/dashboard.service';

type RowData = {
  lote: LoteExterno;
  inicio: Date | null;
  fin: Date | null;
  progreso: number;
};

type DayCell = {
  date: Date;
  key: string;
  dayNumber: string;
  weekday: string;
};

const LEFT_WIDTH = 340;
const RIGHT_WIDTH = 200;
const DAY_WIDTH = 42;

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatShortDay(date: Date) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
  }).format(date);
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'short',
  }).format(date).slice(0, 1).toUpperCase();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getState(progress: number, isOverdue: boolean) {
  if (progress >= 100) return { label: 'Completado', pill: 'bg-green-500 text-white', bar: 'bg-green-500' };
  if (isOverdue) return { label: 'Retrasado', pill: 'bg-red-500 text-white', bar: 'bg-red-500' };
  if (progress > 0) return { label: 'En Proceso', pill: 'bg-yellow-500 text-white', bar: 'bg-yellow-500' };
  return { label: 'Pendiente', pill: 'bg-gray-400 text-white', bar: 'bg-gray-400' };
}

export default function DashboardGanttTimeline({ lotes }: { lotes: LoteExterno[] }) {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const { rows, days, minDay, maxDay } = useMemo(() => {
    const now = new Date();

    const rowsData: RowData[] = lotes.map((lote) => {
      const inicio = parseDate(lote.inicio_iso);
      const fin = parseDate(lote.entrega_iso) ?? parseDate(lote.fin_iso);
      const baseEnd = fin ?? inicio;

      let progreso = 0;
      if (inicio && baseEnd) {
        const total = Math.max(baseEnd.getTime() - inicio.getTime(), 1);
        const elapsed = clamp(now.getTime() - inicio.getTime(), 0, total);
        progreso = Math.round((elapsed / total) * 100);
      }

      return {
        lote,
        inicio,
        fin: baseEnd,
        progreso,
      };
    });

    const starts = rowsData.map((row) => row.inicio).filter(Boolean) as Date[];
    const ends = rowsData.map((row) => row.fin).filter(Boolean) as Date[];

    const min = startOfDay(starts.length > 0 ? new Date(Math.min(...starts.map((date) => date.getTime()))) : now);
    const max = startOfDay(ends.length > 0 ? new Date(Math.max(...ends.map((date) => date.getTime()))) : addDays(now, 13));
    const safeMax = max.getTime() <= min.getTime() ? addDays(min, 13) : max;

    const daysList: DayCell[] = [];
    const dayCount = Math.max(Math.round((safeMax.getTime() - min.getTime()) / 86400000) + 1, 14);

    for (let index = 0; index < dayCount; index += 1) {
      const date = addDays(min, index);
      daysList.push({
        date,
        key: date.toISOString().slice(0, 10),
        dayNumber: formatShortDay(date),
        weekday: formatWeekday(date),
      });
    }

    return {
      rows: rowsData,
      days: daysList,
      minDay: min,
      maxDay: addDays(min, daysList.length - 1),
    };
  }, [lotes]);

  const isEmpty = rows.length === 0;
  const calendarWidth = days.length * DAY_WIDTH;
  const totalWidth = LEFT_WIDTH + calendarWidth + RIGHT_WIDTH;
  const todayIndex = clamp(Math.round((startOfDay(new Date()).getTime() - minDay.getTime()) / 86400000), 0, days.length - 1);

  return (
    <div className="overflow-hidden rounded-3xl border border-[#e4c28a]/30 bg-[#fbddd3] shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#e4c28a]/20 bg-[linear-gradient(180deg,#fff4e2_0%,#fbddd3_100%)] px-5 py-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#b5854b]">
            Reporte de avance de talleres externos
          </p>
          <h3 className="mt-1 text-2xl font-black tracking-tight text-[#231e1d]">
            Calendario diario de pedidos
          </h3>
          <p className="mt-1 max-w-2xl text-base text-[#231e1d]/70">
            Vista por días, más compacta, para ver el taller, el rango y el porcentaje sin que el panel se alargue demasiado.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-[#231e1d]/70">
          <span className="rounded-full bg-white px-3 py-1 text-green-700 shadow-sm ring-1 ring-green-100">Completado</span>
          <span className="rounded-full bg-white px-3 py-1 text-yellow-700 shadow-sm ring-1 ring-yellow-100">En Proceso</span>
          <span className="rounded-full bg-white px-3 py-1 text-red-700 shadow-sm ring-1 ring-red-100">Retrasado</span>
          <span className="rounded-full bg-white px-3 py-1 text-gray-600 shadow-sm ring-1 ring-gray-100">Pendiente</span>
        </div>
      </div>

      <div className="overflow-x-auto bg-[#fff4e2]/40">
        <div style={{ minWidth: `${Math.max(totalWidth, 980)}px` }}>
          <div
            className="grid border-b border-[#e4c28a]/20 bg-[#fff4e2] text-[11px] font-black uppercase tracking-[0.25em] text-[#231e1d]/60"
            style={{ gridTemplateColumns: `${LEFT_WIDTH}px ${calendarWidth}px ${RIGHT_WIDTH}px` }}
          >
            <div className="border-r border-[#e4c28a]/20 px-4 py-3">
              <div className="flex items-center gap-2 text-[#b5854b]">
                <CalendarDays size={12} />
                Pedido / taller
              </div>
            </div>

            <div className="border-r border-[#e4c28a]/20 bg-white/70">
              <div className="grid" style={{ gridTemplateColumns: `repeat(${days.length}, ${DAY_WIDTH}px)` }}>
                {days.map((day) => (
                  <div
                    key={day.key}
                    className="border-r border-[#e4c28a]/20 px-1 py-3 text-center"
                  >
                    <div className="text-[11px] font-black uppercase tracking-[0.28em] text-[#b5854b]">
                      {day.weekday}
                    </div>
                    <div className="mt-1 text-base font-black text-[#231e1d]">
                      {day.dayNumber}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 py-3 text-right text-[#231e1d]/70">% actual</div>
          </div>

          {isEmpty ? (
            <div className="flex min-h-[280px] items-center justify-center bg-white/50 text-center">
              <div>
                <Warehouse size={34} className="mx-auto text-[#b5854b]" />
                <p className="mt-3 text-xs font-black uppercase tracking-widest text-[#231e1d]/50">
                  No hay pedidos externos para mostrar
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#e4c28a]/15 bg-white/80">
              {rows.map((row) => {
                const startIndex = row.inicio
                  ? Math.round((startOfDay(row.inicio).getTime() - minDay.getTime()) / 86400000)
                  : 0;
                const endIndex = row.fin
                  ? Math.round((startOfDay(row.fin).getTime() - minDay.getTime()) / 86400000)
                  : startIndex;
                const span = Math.max(endIndex - startIndex + 1, 1);
                const isOverdue = Boolean(row.fin && row.fin.getTime() < Date.now() && row.progreso < 100);
                const state = getState(row.progreso, isOverdue);

                return (
                  <div
                    key={row.lote.id}
                    className="grid min-h-[118px] bg-white/95"
                    style={{ gridTemplateColumns: `${LEFT_WIDTH}px ${calendarWidth}px ${RIGHT_WIDTH}px` }}
                  >
                    <div className="border-r border-[#e4c28a]/20 px-5 py-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#fbddd3] text-[#b5854b] shadow-sm ring-1 ring-[#e4c28a]/30">
                          <Warehouse size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-black uppercase tracking-tight text-[#231e1d]">
                              Pedido / Orden #{row.lote.id}
                            </p>
                            <button
                              type="button"
                              onClick={() => setSelectedRowId((current) => (current === row.lote.id ? null : row.lote.id))}
                              className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition hover:scale-[1.02] ${state.pill}`}
                            >
                              {state.label}
                            </button>
                          </div>
                          <p className="mt-0.5 truncate text-base font-semibold text-[#231e1d]/75">
                            {row.lote.taller}
                          </p>
                          <p className="mt-1 truncate text-sm text-[#231e1d]/60">
                            {row.lote.servicio}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                            <span className="rounded-full bg-white px-3 py-1.5 text-[#231e1d]/70 ring-1 ring-[#e4c28a]/25">
                              {row.inicio ? formatDate(row.inicio) : 'Sin inicio'}
                            </span>
                            <span className="rounded-full bg-white px-3 py-1.5 text-[#231e1d]/70 ring-1 ring-[#e4c28a]/25">
                              {row.fin ? formatDate(row.fin) : 'Sin fin'}
                            </span>
                          </div>

                          {selectedRowId === row.lote.id && (
                            <div className="mt-3 rounded-2xl border border-[#e4c28a]/30 bg-[#fff4e2] px-3 py-2 text-[11px] font-semibold text-[#231e1d]/80 shadow-sm">
                              Estado actual: <span className="font-black uppercase tracking-widest text-[#231e1d]">{state.label}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="relative border-r border-[#e4c28a]/20 bg-[repeating-linear-gradient(to_right,#fff_0,#fff_1px,transparent_1px,transparent_42px)]">
                      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${days.length}, ${DAY_WIDTH}px)` }}>
                        {days.map((day) => (
                          <div key={`${row.lote.id}-${day.key}`} className="border-r border-[#f4e6ce]" />
                        ))}
                      </div>

                      <div
                        className={`absolute top-1/2 h-12 -translate-y-1/2 rounded-full border shadow-sm ${state.label === 'Completado' ? 'bg-green-50 border-green-100' : state.label === 'En Proceso' ? 'bg-yellow-50 border-yellow-100' : state.label === 'Retrasado' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}
                        style={{
                          left: `${clamp((startIndex / Math.max(days.length, 1)) * 100, 0, 100)}%`,
                          width: `${clamp((span / Math.max(days.length, 1)) * 100, 8, 100)}%`,
                        }}
                      >
                        <div
                          className={`h-full rounded-full ${state.bar} transition-all`}
                          style={{ width: `${clamp(row.progreso, 0, 100)}%` }}
                        />
                      </div>

                      <div
                        className="absolute top-2 bottom-2 w-0 border-l-2 border-dashed border-[#b5854b]/70"
                        style={{ left: `${clamp((todayIndex / Math.max(days.length - 1, 1)) * 100, 0, 100)}%` }}
                        title="Día actual"
                      />
                    </div>

                    <div className="flex flex-col justify-center gap-2 px-5 py-5 text-right">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-[#b5854b]">
                          <Clock3 size={11} className="mr-1 inline-block align-[-2px]" />
                          Porcentaje
                        </p>
                        <p className="text-3xl font-black text-[#231e1d]">{row.progreso}%</p>
                      </div>
                      <div className="text-[12px] text-[#231e1d]/70">
                        <p className="font-medium">Inicio: {row.inicio ? formatDate(row.inicio) : 'Sin fecha'}</p>
                        <p className="font-medium">Fin: {row.fin ? formatDate(row.fin) : 'Sin fecha'}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[#e4c28a]/20 bg-[#fff4e2] px-5 py-3 text-[11px] font-medium text-[#231e1d]/60">
        Vista desde {formatDate(minDay)} hasta {formatDate(maxDay)}.
      </div>
    </div>
  );
}