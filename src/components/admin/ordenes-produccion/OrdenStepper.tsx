"use client";

import { Check, Zap } from "lucide-react";

// DICCIONARIO LOCAL INTEGRADO DE RESPALDO:
// Mapea exactamente los identificadores ENUM de la base de datos con los nombres del taller.
const ETAPA_LABELS_INTERNO = {
  diseno: "Diseño",
  patronaje: "Patronaje",
  corte: "Corte de Tela",
  confeccion: "Confección",
  remallado: "Remallado",
  bordado_estampado: "Bordado / Estampado",
  control_calidad: "Control de Calidad",
  acabado: "Acabados",
  listo_entrega: "Listo para Entrega",
};

interface OrdenStepperProps {
  etapas: readonly string[];
  etapaActual: string;
}

type Estado = "completado" | "activo" | "pendiente";

export default function OrdenStepper({ etapas, etapaActual }: OrdenStepperProps) {
  // Limpiamos la etapa actual para asegurar que haga match con el índice sin importar tildes o plurales accidentales
  const etapaActualSanitizada = etapaActual
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Si el backend envía "acabados", lo asimilamos a "acabado"
  const etapaBuscada = etapaActualSanitizada === "acabados" ? "acabado" : etapaActualSanitizada;

  // Encontrar el índice actual en el flujo lineal enviado
  const indexActual = etapas.findIndex(
    (e) => e.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === etapaBuscada
  );

  const porcentaje = etapas.length
    ? Math.round((Math.max(indexActual, 0) / etapas.length) * 100)
    : 0;

  const estadoDe = (idx: number): Estado =>
    idx < indexActual ? "completado" : idx === indexActual ? "activo" : "pendiente";

  const labelDe = (etapa: string) => {
    const key = etapa
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace("acabados", "acabado"); // Asegura compatibilidad con el plural

    return ETAPA_LABELS_INTERNO[key as keyof typeof ETAPA_LABELS_INTERNO] || etapa;
  };

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-3xl border border-[hsl(var(--admin-accent)/0.15)] bg-white shadow-lg shadow-black/5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-7">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[hsl(var(--admin-accent))]">
              Control de Etapas
            </p>
            <h3 className="mt-1 text-xl sm:text-2xl font-black text-[var(--guor-dark)] tracking-tight">
              Seguimiento de producción
            </h3>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl sm:text-3xl font-black text-[hsl(var(--admin-accent))] tabular-nums leading-none">
              {Math.max(indexActual + 1, 1)}
              <span className="text-sm font-bold text-[hsl(var(--admin-accent)/0.5)]">/{etapas.length}</span>
            </p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--admin-accent))]">
              {porcentaje}% completado
            </p>
          </div>
        </div>

        {/* ── Horizontal: tablet / desktop ── */}
        <div className="hidden sm:block px-6 sm:px-8 py-8 overflow-x-auto">
          <div className="flex items-start min-w-max">
            {etapas.map((etapa, idx) => {
              const estado = estadoDe(idx);
              return (
                <div key={etapa} className="flex items-center last:flex-none">
                  <div className="flex flex-col items-center w-[100px] shrink-0">
                    <div
                      className={
                        "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 " +
                        (estado === "completado"
                          ? "bg-[hsl(var(--admin-accent))] border-[hsl(var(--admin-accent))] text-white"
                          : estado === "activo"
                            ? "bg-white border-[hsl(var(--admin-accent))] text-[var(--guor-dark)] ring-4 ring-[hsl(var(--admin-accent)/0.15)] motion-safe:animate-pulse"
                            : "bg-transparent border-[var(--guor-cream)] text-[hsl(var(--admin-accent)/0.3)]")
                      }
                    >
                      {estado === "completado" ? (
                        <Check size={18} className="stroke-[3]" />
                      ) : (
                        <span className="text-sm font-black">{idx + 1}</span>
                      )}
                    </div>
                    <span
                      className={
                        "mt-3 text-center text-[10px] font-bold uppercase tracking-wider leading-tight max-w-[90px] break-words " +
                        (estado === "pendiente" ? "text-[hsl(var(--admin-accent)/0.4)]" : "text-[var(--guor-dark)]")
                      }
                    >
                      {labelDe(etapa)}
                    </span>
                  </div>

                  {idx < etapas.length - 1 && (
                    <div
                      className={
                        "w-12 border-t-[3px] mx-1 mx-2 " +
                        (idx < indexActual
                          ? "border-dashed border-[hsl(var(--admin-accent))]"
                          : "border-dashed border-[var(--guor-cream)]")
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Vertical: mobile ── */}
        <div className="sm:hidden px-6 py-6">
          {etapas.map((etapa, idx) => {
            const estado = estadoDe(idx);
            const esUltima = idx === etapas.length - 1;
            return (
              <div key={etapa} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 shrink-0 transition-all duration-300 " +
                      (estado === "completado"
                        ? "bg-[hsl(var(--admin-accent))] border-[hsl(var(--admin-accent))] text-white"
                        : estado === "activo"
                          ? "bg-white border-[hsl(var(--admin-accent))] text-[var(--guor-dark)] ring-4 ring-[hsl(var(--admin-accent)/0.15)] motion-safe:animate-pulse"
                          : "bg-transparent border-[var(--guor-cream)] text-[hsl(var(--admin-accent)/0.3)]")
                    }
                  >
                    {estado === "completado" ? (
                      <Check size={16} className="stroke-[3]" />
                    ) : (
                      <span className="text-xs font-black">{idx + 1}</span>
                    )}
                  </div>
                  {!esUltima && (
                    <div
                      className="w-[2px] flex-1 min-h-[28px] my-1"
                      style={{
                        backgroundImage:
                          idx < indexActual
                            ? "repeating-linear-gradient(180deg, hsl(var(--admin-accent)) 0 6px, transparent 6px 11px)"
                            : "repeating-linear-gradient(180deg, var(--guor-cream) 0 6px, transparent 6px 11px)",
                      }}
                    />
                  )}
                </div>
                <div className={esUltima ? "pb-1" : "pb-5"}>
                  <p
                    className={
                      "text-xs font-black uppercase tracking-wide " +
                      (estado === "pendiente" ? "text-[hsl(var(--admin-accent)/0.4)]" : "text-[var(--guor-dark)]")
                    }
                  >
                    {labelDe(etapa)}
                  </p>
                  <p
                    className={
                      "text-[10px] font-semibold " +
                      (estado === "pendiente"
                        ? "text-[hsl(var(--admin-accent)/0.4)]"
                        : "text-[hsl(var(--admin-accent))]")
                    }
                  >
                    {estado === "completado" ? "Completado" : estado === "activo" ? "En curso" : "Pendiente"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Etapa actual */}
        <div className="flex items-center gap-3 border-t border-[hsl(var(--admin-accent)/0.1)] bg-gray-50 px-6 sm:px-8 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--admin-accent)/0.15)] border border-[hsl(var(--admin-accent)/0.2)]">
            <Zap size={16} className="text-[hsl(var(--admin-accent))]" />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--admin-accent))]">Etapa actual</p>
            <p className="text-base font-black text-[var(--guor-dark)]">{labelDe(etapaActual)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}