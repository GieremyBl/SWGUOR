"use client";

import React from 'react';
import { Shield, ChevronRight } from 'lucide-react';
import { COMPANY_PALETTE } from './widgets/DashboardUtils';

interface DashboardSectionProps {
  title:    string;
  subtitle?: string;
  role:     'administrador' | 'gerente' | 'recepcionista' | 'disenador' | 'cortador' | 'ayudante' | 'representante_taller';
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const P = COMPANY_PALETTE;

export function DashboardSection({ title, subtitle, actions, children }: DashboardSectionProps) {
  return (
    <div style={{ minHeight: '100vh', background: P.bg }}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header style={{
        background:   P.white,
        borderBottom: `1px solid ${P.border}`,
        boxShadow:    '0 1px 0 0 #d4dae5',
        padding:      '0 32px',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          display: 'flex', flexWrap: 'wrap', gap: 12,
          justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 0',
        }}>

          {/* Identidad */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <div style={{
              flexShrink: 0,
              padding: 8,
              background: '#f0f4ff',
              borderRadius: 8,
              border: `1px solid #c0d0ff`,
              color: P.accent,
              display: 'flex',
            }}>
              <Shield size={20} strokeWidth={2.5} />
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{
                  fontSize: 9, fontWeight: 800, color: P.accent,
                  textTransform: 'uppercase', letterSpacing: '0.18em', whiteSpace: 'nowrap',
                }}>
                  MODAS Y ESTILOS GUOR
                </span>
                <ChevronRight size={9} style={{ color: P.muted, flexShrink: 0 }} />
                <span style={{
                  fontSize: 9, fontWeight: 600, color: P.muted,
                  textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap',
                }}>
                  Sistema de Gestión
                </span>
              </div>

              <h1 style={{
                fontSize: 22, fontWeight: 800, color: P.text,
                letterSpacing: '-0.02em', lineHeight: 1.2,
                margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {title}
              </h1>

              {subtitle && (
                <p style={{
                  fontSize: 12, color: P.muted, fontWeight: 400,
                  marginTop: 3, maxWidth: 420,
                }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Acciones */}
          {actions && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {actions}
            </div>
          )}
        </div>
      </header>

      {/* ── CONTENIDO ───────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {children}
        </div>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '16px 32px',
        borderTop: `1px solid ${P.border}`,
      }}>
        <p style={{
          fontSize: 10, textAlign: 'center', color: P.muted,
          fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          © {new Date().getFullYear()} Modas y Estilos GUOR — Panel de Control
        </p>
      </footer>
    </div>
  );
}