"use client";

import React from 'react';
import { Shield, ChevronRight } from 'lucide-react';

interface DashboardSectionProps {
  title:     string;
  subtitle?: string;
  role:      'administrador' | 'gerente' | 'recepcionista' | 'disenador' | 'cortador' | 'ayudante' | 'representante_taller' | 'almacenero';
  actions?:  React.ReactNode;
  children:  React.ReactNode;
}

export function DashboardSection({ title, subtitle, actions, children }: DashboardSectionProps) {
  return (
    // Conserva el fondo crema sofisticado general del archivo css global (--guor-cream)
    <div className="min-h-screen bg-[var(--guor-cream)] text-[var(--guor-dark)]">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      {/* Forzamos el fondo blanco e inyectamos la sombra sutil descrita en tu globals.css */}
      <header className="bg-white border-b border-[hsl(var(--admin-line))] shadow-[0_1px_0_0_hsl(var(--admin-line))] px-8">
        <div className="max-w-[1280px] mx-auto flex flex-wrap gap-3 justify-between items-center py-[18px]">

          {/* Identidad */}
          <div className="flex items-center gap-3.5 min-w-0">
            
            {/* CONTENEDOR DEL ÍCONO (ROSA): Mapeado directamente a tu --admin-accent (rose-500) */}
            <div className="flex-shrink-0 p-2 bg-[hsl(var(--admin-accent))/0.08] rounded-lg border border-[hsl(var(--admin-accent))/0.2] text-[hsl(var(--admin-accent))] flex">
              <Shield size={20} strokeWidth={2.5} />
            </div>

            <div className="min-w-0">
              {/* Breadcrumbs con acento rosa en el texto principal de marca */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-black text-[hsl(var(--admin-accent))] uppercase tracking-[0.18em] whitespace-nowrap">
                  MODAS Y ESTILOS GUOR
                </span>
                <ChevronRight size={9} className="text-[hsl(var(--admin-ink-soft))] flex-shrink-0" />
                <span className="text-[9px] font-semibold text-[hsl(var(--admin-ink-soft))] uppercase tracking-[0.1em] whitespace-nowrap">
                  Sistema de Gestión
                </span>
              </div>

              {/* Título Principal en color Ink de administración */}
              <h1 className="text-2xl font-black text-[hsl(var(--admin-ink))] tracking-tight m-0 overflow-hidden text-ellipsis whitespace-nowrap">
                {title}
              </h1>

              {/* Subtítulo en Ink Soft */}
              {subtitle && (
                <p className="text-xs text-[hsl(var(--admin-ink-soft))] font-normal mt-0.5 max-w-[420px]">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Acciones */}
          {actions && (
            <div className="flex items-center gap-2 flex-wrap">
              {actions}
            </div>
          )}
        </div>
      </header>

      {/* ── CONTENIDO ───────────────────────────────────────────────────────── */}
      <main className="max-w-[1280px] mx-auto px-8 py-7">
        <div className="flex flex-col gap-5">
          {children}
        </div>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="max-w-[1280px] mx-auto px-8 py-4 border-t border-[hsl(var(--admin-line))]">
        <p className="text-[10px] text-center text-[hsl(var(--admin-ink-soft))] font-semibold uppercase tracking-wider">
          © {new Date().getFullYear()} Modas y Estilos GUOR — Panel de Control
        </p>
      </footer>
    </div>
  );
}