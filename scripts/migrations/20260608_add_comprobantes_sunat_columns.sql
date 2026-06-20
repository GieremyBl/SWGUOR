-- =============================================================================
-- Migración: columnas SUNAT faltantes en comprobantes (schema drift)
-- Fecha: 2026-06-08
-- Síntoma: Prisma P2022 — column estado_sunat does not exist al crear/leer comprobantes
-- EJECUTAR EN: Supabase SQL Editor o psql (dev/staging/prod).
-- =============================================================================

BEGIN;

ALTER TABLE public.comprobantes
  ADD COLUMN IF NOT EXISTS estado_sunat public."EstadoComprobante" NOT NULL DEFAULT 'pendiente';

ALTER TABLE public.comprobantes
  ADD COLUMN IF NOT EXISTS enviado_sunat_at timestamptz;

ALTER TABLE public.comprobantes
  ADD COLUMN IF NOT EXISTS respuesta_sunat text;

COMMIT;
