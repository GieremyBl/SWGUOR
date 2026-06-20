-- =============================================================================
-- Migración: corregir fn_auditoria() para tabla pagos (PK id_uuid, sin columna id)
-- Fecha: 2026-06-08
-- Síntoma: INSERT en pagos falla con "record \"new\" has no field \"id\"" (P2022)
--          → POST /api/culqi/charge devuelve 500 aunque Culqi cobró OK.
-- EJECUTAR EN: Supabase SQL Editor o psql (dev/staging/prod).
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.fn_auditoria()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_accion      public."AccionAuditoria";
  v_antes       jsonb := NULL;
  v_despues     jsonb := NULL;
  v_usuario_id  bigint := NULL;
  v_ids         jsonb := '{}'::jsonb;
  v_registro_id bigint := NULL;
  v_jwt_sub     uuid := NULL;
  ESTADOS_BAJA  text[] := ARRAY['inactivo', 'suspendido', 'descontinuado'];
BEGIN
  BEGIN
    v_usuario_id := current_setting('app.current_user_id', true)::bigint;
  EXCEPTION WHEN OTHERS THEN
    v_usuario_id := NULL;
  END;

  IF v_usuario_id IS NULL THEN
    BEGIN
      SELECT u.id INTO v_usuario_id
      FROM public.usuarios u
      WHERE u.auth_id = auth.uid();
    EXCEPTION WHEN OTHERS THEN
      v_usuario_id := NULL;
    END;
  END IF;

  IF v_usuario_id IS NULL THEN
    BEGIN
      v_jwt_sub := current_setting('request.jwt.claim.sub', true)::uuid;

      IF v_jwt_sub IS NOT NULL THEN
        SELECT u.id INTO v_usuario_id
        FROM public.usuarios u
        WHERE u.auth_id = v_jwt_sub;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_usuario_id := NULL;
    END;
  END IF;

  IF TG_TABLE_NAME = 'cotizaciones' THEN
    v_ids := jsonb_build_object(
      'cotizacion_id', COALESCE(NEW.id, OLD.id),
      'cliente_id',    COALESCE(NEW.cliente_id, OLD.cliente_id)
    );
    v_registro_id := COALESCE(NEW.id, OLD.id);
  ELSIF TG_TABLE_NAME = 'pedidos' THEN
    v_ids := jsonb_build_object(
      'pedido_id',     COALESCE(NEW.id, OLD.id),
      'cliente_id',    COALESCE(NEW.cliente_id, OLD.cliente_id),
      'cotizacion_id', COALESCE(NEW.cotizacion_id, OLD.cotizacion_id)
    );
    v_registro_id := COALESCE(NEW.id, OLD.id);
  ELSIF TG_TABLE_NAME = 'ordenes_compra' THEN
    v_ids := jsonb_build_object(
      'orden_compra_id',         COALESCE(NEW.id, OLD.id),
      'proveedor_id',            COALESCE(NEW.proveedor_id, OLD.proveedor_id),
      'cotizacion_proveedor_id', COALESCE(NEW.cotizacion_proveedor_id, OLD.cotizacion_proveedor_id)
    );
    v_registro_id := COALESCE(NEW.id, OLD.id);
  ELSIF TG_TABLE_NAME = 'pagos' THEN
    v_ids := jsonb_build_object(
      'pago_id',   COALESCE(NEW.id_uuid, OLD.id_uuid)::text,
      'pedido_id', COALESCE(NEW.pedido_id, OLD.pedido_id)
    );
    v_registro_id := COALESCE(NEW.pedido_id, OLD.pedido_id);
  ELSIF TG_TABLE_NAME = 'pagos_taller' THEN
    v_ids := jsonb_build_object(
      'pago_taller_id',      COALESCE(NEW.id, OLD.id),
      'taller_id',           COALESCE(NEW.taller_id, OLD.taller_id),
      'confeccion_id',       COALESCE(NEW.confeccion_id, OLD.confeccion_id),
      'orden_produccion_id', COALESCE(NEW.orden_produccion_id, OLD.orden_produccion_id)
    );
    v_registro_id := COALESCE(NEW.id, OLD.id);
  ELSE
    v_ids := jsonb_build_object('id', COALESCE(NEW.id, OLD.id));
    v_registro_id := COALESCE(NEW.id, OLD.id);
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_accion  := 'crear';
    v_despues := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_antes   := to_jsonb(OLD);
    v_despues := to_jsonb(NEW);

    IF (NEW.estado)::text = ANY(ESTADOS_BAJA)
       AND (OLD.estado IS DISTINCT FROM NEW.estado)
    THEN
      v_accion := 'eliminar';
    ELSE
      v_accion := 'actualizar';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_accion := 'eliminar';
    v_antes  := to_jsonb(OLD);
  END IF;

  INSERT INTO public.auditoria (
    usuario_id, accion, tabla, registro_id, ids, datos_antes, datos_despues
  ) VALUES (
    v_usuario_id,
    v_accion,
    TG_TABLE_NAME,
    v_registro_id,
    v_ids,
    v_antes,
    v_despues
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$;

COMMIT;
