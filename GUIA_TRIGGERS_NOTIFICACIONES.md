# 🔔 Guía: Implementar Triggers de Notificaciones Automáticas en Supabase

## 📋 Resumen

Este documento explica cómo ejecutar los **triggers PostgreSQL** que automatizan la creación de notificaciones en tu base de datos Supabase cuando ocurren cambios en el sistema.

---

## ✅ Prerequisitos

- Acceso a **Supabase Dashboard**
- Rol de **administrador** en la base de datos
- El script SQL: `/scripts/01-triggers-notificaciones.sql`

---

## 🚀 Pasos de Implementación

### Paso 1: Acceder al SQL Editor de Supabase

1. Abre [https://supabase.com](https://supabase.com)
2. Selecciona tu proyecto **sistema-guor-v2**
3. En el menú lateral, ve a **SQL Editor**
4. Haz clic en **New Query**

### Paso 2: Copiar el Script SQL

1. Abre el archivo: `scripts/01-triggers-notificaciones.sql`
2. **Selecciona TODO el contenido** (Ctrl+A)
3. **Cópialo** (Ctrl+C)

### Paso 3: Ejecutar el Script en Supabase

1. En la pestaña de **SQL Editor** que abriste
2. **Pega todo el código** (Ctrl+V)
3. Haz clic en el botón **▶ Run** (superior derecha)
4. Espera a que se complete (sin errores)

### Paso 4: Verificar Instalación Exitosa

Ejecuta esta query para confirmar que todos los triggers se crearon:

```sql
SELECT trigger_name, event_object_table, action_timing, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' 
AND trigger_name LIKE 'trg_%'
ORDER BY trigger_name;
```

**Resultado esperado:** Deberías ver **8 triggers** listados:
- `trg_cotizacion_expirada`
- `trg_devolucion_solicitada`
- `trg_stock_bajo_insumo`
- `trg_stock_bajo_material`
- `trg_stock_bajo_producto`
- `trg_confeccion_completada`
- `trg_pago_pendiente`
- `fn_notificar_...` (funciones asociadas)

---

## 📊 Qué Notificaciones se Automatizan

### 1. **Stock Bajo** ⚠️
- **Cuándo:** Cuando `stock_actual <= stock_minimo`
- **Tablas:** `insumo`, `materiales`, `productos`
- **Notificados:** Administradores y almaceneros
- **Referencia:** `PRODUCTO`

### 2. **Cotización Expirada** 📋
- **Cuándo:** Cuando estado cambia a `rechazado` o `cancelado`
- **Tabla:** `cotizaciones`
- **Notificados:** Administradores
- **Referencia:** `COTIZACION`

### 3. **Devolución Solicitada** 🔄
- **Cuándo:** Se crea nuevo registro en `devoluciones_cliente`
- **Tabla:** `devoluciones_cliente`
- **Notificados:** Administradores
- **Referencia:** `PEDIDO`

### 4. **Confección Completada** ✅
- **Cuándo:** Estado cambia a `completada`
- **Tabla:** `confecciones`
- **Notificados:** Cliente (del pedido) + Administradores
- **Referencia:** `ORDEN_PRODUCCION`

### 5. **Pago Pendiente** 💰
- **Cuándo:** Estado cambia a `entregada` o `completada`
- **Tabla:** `confecciones`
- **Notificados:** Administradores
- **Referencia:** `PAGO`

---

## 🔧 Solución de Problemas

### Error: "Function already exists"
**Solución:** Los triggers ya fueron creados. Para actualizar:
```sql
DROP TRIGGER IF EXISTS trg_cotizacion_expirada ON public.cotizaciones;
DROP FUNCTION IF EXISTS fn_notificar_cotizacion_expirada();
-- Luego ejecuta el script completo nuevamente
```

### Error: "Table does not exist"
**Solución:** Verifica que la tabla existe con:
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'cotizaciones' 
AND table_schema = 'public';
```

### Las notificaciones no se crean
**Checklist:**
- ✅ Triggers están activos (ver Paso 4)
- ✅ El usuario realizando cambios tiene permisos
- ✅ Los cambios cumplen las condiciones del trigger
- ✅ Hay administradores activos en la tabla `usuarios` (rol='administrador')

---

## 📝 Estructura de Notificación Creada

Cada notificación creada por los triggers tiene esta estructura:

```typescript
{
  usuario_id: number,           // ID del usuario notificado
  tipo: 'stock_bajo' | 'cotizacion_expirada' | 'devolucion_solicitada' | 'confeccion_completada' | 'pago_pendiente',
  titulo: string,               // Título de la notificación
  mensaje: string,              // Descripción detallada
  referencia_tipo: 'PRODUCTO' | 'COTIZACION' | 'PEDIDO' | 'ORDEN_PRODUCCION' | 'PAGO',
  referencia_id: number,        // ID del recurso relacionado
  url_destino: string,          // URL para navegar al recurso
  leido: false,                 // Siempre sin leer inicialmente
  created_at: timestamp         // Hora de creación
}
```

---

## 🛠️ Mantenimiento

### Ver todas las notificaciones generadas por triggers

```sql
SELECT * FROM public.notificaciones
WHERE referencia_tipo IN ('PRODUCTO', 'COTIZACION', 'PEDIDO', 'ORDEN_PRODUCCION', 'PAGO')
ORDER BY created_at DESC
LIMIT 50;
```

### Eliminar un trigger específico

```sql
DROP TRIGGER IF EXISTS trg_stock_bajo_insumo ON public.insumo;
DROP FUNCTION IF EXISTS fn_notificar_stock_bajo_insumo();
```

### Ver logs de ejecución (si los hay)

```sql
-- Supabase almacena logs en:
SELECT * FROM pg_stat_statements WHERE query LIKE '%notificaciones%';
```

---

## ✨ Ventajas de los Triggers

✅ **Automático:** No requiere código en la aplicación  
✅ **Confiable:** Se ejecuta incluso si la app se desconecta  
✅ **Rápido:** A nivel de base de datos (sin latencia de red)  
✅ **Consistente:** Garantiza que no se pierda ningún evento  
✅ **Sincronizado:** Registra notificaciones en tiempo real  

---

## 📞 Soporte

Si encuentras problemas:

1. Verifica los **logs de Supabase** → Monitoring
2. Revisa que **todas las columnas existan** en las tablas
3. Confirma que **los enums están correctos** (EstadoCotizacion, EstadoConfeccion, etc.)
4. Consulta la **consola del navegador** para errores de cliente

---

## 📌 Próximos Pasos

1. Ejecuta este script en Supabase ✓
2. Las notificaciones se crearán automáticamente
3. El frontend (NotificationDropdown) las mostrará en tiempo real
4. Los usuarios recibirán alertas sin hacer nada extra

¡Listo! 🎉 Ahora tu sistema de notificaciones es **completamente automático**.
