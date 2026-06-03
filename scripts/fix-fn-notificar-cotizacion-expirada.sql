-- Corrige comparación de enum: en BD es "rechazada", no "rechazado".
-- Sin este fix, INSERT en cotizacion_items falla al recalcular descuento (UPDATE cotizaciones).

CREATE OR REPLACE FUNCTION public.fn_notificar_cotizacion_expirada()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  admin_id BIGINT;
BEGIN
  IF (NEW.estado = 'rechazada' OR NEW.estado = 'expirada')
     AND (OLD.estado IS DISTINCT FROM NEW.estado) THEN

    FOR admin_id IN SELECT usuario_id FROM get_admin_users() LOOP
      INSERT INTO public.notificaciones (
        usuario_id, tipo, titulo, mensaje,
        referencia_tipo, referencia_id, url_destino,
        leido, created_at
      ) VALUES (
        admin_id,
        'cotizacion_expirada',
        'Cotización expirada: ' || NEW.numero,
        'La cotización ' || NEW.numero || ' expiró sin aprobación.',
        'COTIZACION',
        NEW.id,
        '/admin/Panel-Administrativo/cotizaciones/' || NEW.id,
        FALSE,
        NOW()
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;
