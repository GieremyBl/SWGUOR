-- =============================================================================
-- Migración: deprecar tabla legacy `detalle_ficha_insumos`
-- Fecha: 2026-05-28
-- Contexto: El flujo activo de fichas técnicas usa `fichas_tecnicas_detalle`
--           (servicio fichas-tecnicas-detalle.service.ts, API /fichas-tecnicas/detalle).
--           `detalle_ficha_insumos` no tiene referencias en src/ (solo schema/types).
--
-- EJECUTAR EN: Supabase SQL Editor o psql contra la BD del proyecto.
-- RECOMENDACIÓN: Hacer backup o snapshot antes de ejecutar en producción.
-- =============================================================================

BEGIN;

-- ── 1. Diagnóstico previo (revisar output antes de continuar) ─────────────────
DO $$
DECLARE
  legacy_count bigint;
  canonical_count bigint;
BEGIN
  SELECT COUNT(*) INTO legacy_count FROM public.detalle_ficha_insumos;
  SELECT COUNT(*) INTO canonical_count FROM public.fichas_tecnicas_detalle;
  RAISE NOTICE 'Filas en detalle_ficha_insumos (legacy): %', legacy_count;
  RAISE NOTICE 'Filas en fichas_tecnicas_detalle (canónica): %', canonical_count;
END $$;

-- ── 2. Migración opcional de datos legacy → tabla canónica ────────────────────
-- Mapeo de columnas:
--   id_ficha          → ficha_id
--   id_insumo         → insumo_id
--   consumo_unitario  → cantidad_consumo
--   merma_permitida   → porcentaje_desperdicio
-- Solo inserta filas que no existan ya (misma ficha + mismo insumo).
INSERT INTO public.fichas_tecnicas_detalle (
  ficha_id,
  insumo_id,
  cantidad_consumo,
  porcentaje_desperdicio,
  observaciones
)
SELECT
  d.id_ficha,
  d.id_insumo,
  COALESCE(d.consumo_unitario, 0)::numeric(12, 4),
  COALESCE(d.merma_permitida, 0)::numeric(5, 2),
  'Migrado desde detalle_ficha_insumos (2026-05-28)'
FROM public.detalle_ficha_insumos d
WHERE d.id_ficha IS NOT NULL
  AND d.id_insumo IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.fichas_tecnicas_detalle ftd
    WHERE ftd.ficha_id = d.id_ficha
      AND ftd.insumo_id = d.id_insumo
  );

-- ── 3. Verificación post-migración ────────────────────────────────────────────
DO $$
DECLARE
  migrables bigint;
  sin_destino bigint;
BEGIN
  SELECT COUNT(*) INTO migrables
  FROM public.detalle_ficha_insumos d
  WHERE d.id_ficha IS NOT NULL AND d.id_insumo IS NOT NULL;

  SELECT COUNT(*) INTO sin_destino
  FROM public.detalle_ficha_insumos d
  WHERE d.id_ficha IS NOT NULL
    AND d.id_insumo IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.fichas_tecnicas_detalle ftd
      WHERE ftd.ficha_id = d.id_ficha AND ftd.insumo_id = d.id_insumo
    );

  IF sin_destino > 0 THEN
    RAISE EXCEPTION
      'Abortando: quedan % filas legacy sin equivalente en fichas_tecnicas_detalle. Revisar datos.',
      sin_destino;
  END IF;

  RAISE NOTICE 'Migración de datos OK. Filas legacy con ficha+insumo: %', migrables;
END $$;

-- ── 4. Eliminar políticas RLS (si existen en Supabase) ────────────────────────
DROP POLICY IF EXISTS "detalle_ficha_insumos_select" ON public.detalle_ficha_insumos;
DROP POLICY IF EXISTS "detalle_ficha_insumos_insert" ON public.detalle_ficha_insumos;
DROP POLICY IF EXISTS "detalle_ficha_insumos_update" ON public.detalle_ficha_insumos;
DROP POLICY IF EXISTS "detalle_ficha_insumos_delete" ON public.detalle_ficha_insumos;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.detalle_ficha_insumos;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.detalle_ficha_insumos;

-- ── 5. Eliminar tabla legacy ──────────────────────────────────────────────────
DROP TABLE IF EXISTS public.detalle_ficha_insumos CASCADE;

COMMIT;

-- =============================================================================
-- POST-MIGRACIÓN (ejecutar en el repo, NO en SQL):
--
-- 1. Re-introspectar Prisma (el schema es introspected, no migraciones Prisma):
--      npx prisma db pull --schema=prisma/schema
--      npm run db:generate
--
-- 2. Regenerar tipos Supabase (si usas el cliente con database.ts):
--      npx supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.ts
--
-- 3. Verificar que no queden referencias:
--      rg "detalle_ficha_insumos" .
--    Debe quedar vacío salvo este script y documentación histórica.
-- =============================================================================
