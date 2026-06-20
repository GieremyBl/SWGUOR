# Auditoría de Cobertura: Base de Datos ↔ Código Fuente

**Proyecto:** SWGUOR ERP  
**Fecha:** 28 de mayo de 2026  
**Alcance:** `prisma/schema/introspected.prisma` (fuente de verdad del esquema; no existe `prisma/schema.prisma` en la raíz) vs. `src/app/api`, `src/lib/services`, `src/lib/hooks`, `src/app/admin` y `src/app/portal`.

**Metodología:** Se listaron los 85 modelos del schema (62 en `public`, 23 en `auth`). Para cada entidad de negocio se buscó uso vía `prisma.<modelo>`, servicios dedicados, rutas API, hooks y pantallas admin/portal. Las tablas del schema `auth` se excluyen de “huérfanas” porque las gestiona Supabase Auth, no la aplicación Next.js.

---

## Resumen ejecutivo

| Categoría | Cantidad |
|-----------|----------|
| 🟢 Implementadas (flujo completo o núcleo operativo) | 48 |
| 🟡 Parciales (backend sin UI, UI sin backend, o cobertura mínima) | 14 |
| 🔴 Huérfanas (sin interacción real en código) | 6 |
| ⚙️ Infraestructura Auth (Supabase, sin Prisma en app) | 23 |

---

## 🟢 Entidades Implementadas

Modelos con rutas API, servicios y/o pantallas que conforman un flujo de trabajo utilizable.

### Catálogo y productos
| Modelo | Cobertura |
|--------|-----------|
| `productos` | API `src/app/api/admin/productos`, servicio `productos.service.ts`, páginas admin productos/nuevo/detalle, portal catálogo. |
| `variantes_producto` | Servicio `variantes.service.ts`, CRUD anidado en productos, reservas y cotizaciones. |
| `categorias_productos` | API admin/portal categorías, servicio `categorias.service.ts`, página admin categorías. |
| `fichas_tecnicas` | API fichas técnicas, servicio `fichas-tecnicas.service.ts`, páginas admin listado/nueva/detalle, roles diseñador/cortador. |
| `fichas_tecnicas_detalle` | Servicio `fichas-tecnicas-detalle.service.ts`, integrado en flujo de fichas. |
| `ficha_medidas` | API `admin/ficha-medidas`, servicio `fichas-tecnicas.service.ts`. |

### Ventas, cotizaciones y pedidos
| Modelo | Cobertura |
|--------|-----------|
| `cotizaciones` | API admin/portal cotizaciones, servicio `cotizaciones.service.ts`, páginas admin y portal completas. |
| `cotizacion_items` | API portal items, acciones portal, servicio cotizaciones. |
| `pedidos` | API admin/portal pedidos, servicio `pedidos.service.ts`, páginas admin detalle/entrega/empaque, portal seguimiento. |
| `pedido_items` | Helpers y servicios de pedidos, charts, generación OP. |
| `reservas_stock` | API `admin/reservas-stock`, servicios `reserva-stock*.ts`, página admin reservas (CUS_47). |

### Promociones y descuentos
| Modelo | Cobertura |
|--------|-----------|
| `promociones` | API `admin/promociones`, servicio `promociones.service.ts`, página admin promociones. |
| `promocion_reglas` | Gestionado en `promociones.service.ts` y portal catálogo promociones. |
| `ofertas` | Mismo módulo promociones/ofertas, servicio `ofertas.service.ts`. |
| `oferta_reglas` | CRUD en `ofertas.service.ts` y `CampanaFormModal`. |
| `reglas_descuento` | API `admin/reglas-descuento`, servicio `reglas-descuento.service.ts`. |

### Pagos y facturación
| Modelo | Cobertura |
|--------|-----------|
| `pagos` | API admin pagos/tesorería, Culqi (`culqi/charge`, webhook), servicios `pagos`, `tesoreria-pagos`, `pago-*`, portal historial y confirmación. |
| `comprobantes` | Servicio `comprobantes.service.ts`, emisión simulada en cierre Culqi, confirmación portal y tesorería. |

### Producción y manufactura
| Modelo | Cobertura |
|--------|-----------|
| `ordenes_produccion` | API y servicio `ordenes-produccion.service.ts`, páginas admin listado/detalle/etapas. |
| `ordenes_produccion_items` | Helper `generar-ordenes-pedidos-pagados.helper.ts`, detalle OP. |
| `confecciones` | API admin confecciones, servicio `confecciones.service.ts`, páginas admin y rol ayudante. |
| `seguimiento_confeccion` | API `admin/seguimiento-confeccion`. |
| `seguimiento_pedido` | API `admin/seguimiento-pedido`, portal seguimiento. |
| `seguimiento_produccion` | API `admin/seguimiento-produccion`, etapas OP. |
| `talleres` | API admin talleres, servicio `talleres.service.ts`, página admin. |
| `tarifas_taller` | API admin tarifas-taller, servicio `tarifa-talleres.service.ts`. |
| `pagos_taller` | API `admin/pagos-taller`, servicio `pagos-talleres.service.ts`, hook `usePagosTalleres`. |

### Compras e inventario
| Modelo | Cobertura |
|--------|-----------|
| `proveedores` | API admin proveedores, servicio `proveedor.service.ts`, página admin. |
| `ordenes_compra` | API admin órdenes-compra (CUS_51), servicio `ordenes-compra.service.ts`, páginas listado/nueva/detalle. |
| `ordenes_compra_items` | Servicio órdenes compra, PDF, detalle OC, insumos/materiales. |
| `cotizaciones_proveedor` | API admin (CUS_44 extracción IA), servicio `cotizaciones-proveedor.service.ts`, páginas completas. |
| `cotizaciones_proveedor_items` | Servicio y helpers de cotizaciones proveedor. |
| `insumo` | API admin insumos, servicio `insumos.service.ts`, páginas listado/detalle. |
| `materiales` | API admin materiales, servicio `material.service.ts`, páginas listado/detalle. |
| `categoria_insumo` | API inventario y chat portal (consulta categorías). |
| `almacenes` | API admin almacenes, servicio `almacenes.service.ts`, páginas listado/detalle. |
| `almacen_zonas` | API zonas por almacén, servicio `almacen-zonas.service.ts`. |
| `almacen_stock` | API stock por almacén, servicio `almacenes-stock.service.ts`. |
| `movimientos_inventario` | API inventario/movimientos, servicio `movimientos-inventario.service.ts`, página admin movimientos. |
| `inventario` *(vía materiales/insumos/productos)* | Página admin inventario, servicio `inventario.service.ts`, RPC stock. |

### Logística
| Modelo | Cobertura |
|--------|-----------|
| `despachos` | API admin/portal despachos, servicio `despachos.service.ts`, páginas admin y portal. |
| `despachos_grupos` | Helpers y servicio despachos (agrupación de entregas). |
| `despachos_grupo_pedidos` | Mismo flujo de despachos. |
| `seguimiento_despachos` | Servicio despachos, portal ETA y confirmación entrega. |

### Directorio, sistema y control
| Modelo | Cobertura |
|--------|-----------|
| `usuarios` | API admin usuarios, servicio `usuarios.service.ts`, auth server, página admin. |
| `clientes` | API admin/portal clientes, servicio `clientes.service.ts`, páginas admin y portal perfil. |
| `direcciones_cliente` | Servicio clientes, portal perfil, formulario admin clientes. |
| `personal_interno` | API admin personal, servicio `personal-interno.service.ts`, página admin. |
| `notificaciones` | API admin/portal notificaciones, servicio `notificaciones.service.ts`, hooks y páginas. |
| `auditoria` | API `admin/auditoria`, servicio `auditoria.service.ts`, página admin auditoría. |
| `feedback_cliente` | API admin feedback-cliente, páginas admin listado. |
| `configuracion_sistema` | API `admin/configuracion`, página admin configuración. |

---

## 🟡 Entidades Parciales

Modelos con código existente pero flujo incompleto (falta UI, falta API, o implementación superficial).

| Modelo | Qué existe | Qué falta |
|--------|-----------|-----------|
| `asientos_contables` | API `admin/asientos-contables`, servicio `asientos-contables.service.ts`, hook `useAsientosContables`. | Sin página admin; hook no consumido por ninguna vista. |
| `guias_remision` | API `admin/guias-remision`, servicio `guias-remision.service.ts`, hook `useGuiasRemision`. | Sin módulo UI en admin; hook sin uso en pantallas. |
| `guias_remision_items` | CRUD en servicio/API de guías (createMany/deleteMany). | Depende de guías; sin UI propia. |
| `costo_envio` | Lectura vía SQL raw (`portal-costo-envio.helper.ts`) y Supabase en `PortalContext`. | Sin API admin para mantener zonas/costos; sin modelo Prisma directo en servicios. |
| `incidencias_taller` | Servicio `incidencias-taller.service.ts`, reporte `admin/reportes/incidencias`. | Enlace sidebar a `/incidencias-taller` **sin página**; sin CRUD admin dedicado. |
| `incidencias_cliente` | Inserción vía Supabase en `despachos.service.ts`; permisos en `roles.ts`. | Sin API Prisma; página portal `/despachos/incidencias` es **mock** (simulación); enlace admin sin página. |
| `comprobantes` *(refinamiento)* | Emisión automática post-pago Culqi y visualización portal/tesorería. | Sin módulo admin de gestión/comprobantes electrónicos reales (SUNAT). |
| `detalle_ficha_insumos` | Definido en schema y `database.ts`. | **Ningún** `prisma.detalle_ficha_insumos`; el flujo usa `fichas_tecnicas_detalle` en su lugar. Tabla legacy/duplicada en BD. |
| **Precio histórico** *(tabla fuera de Prisma)* | API `admin/precio-historico`, hook `usePrecioHistorico`, servicio con cast manual. | El servicio declara que el modelo **no existe en Prisma**; acceso frágil vía `(prisma as any).precioHistorico`. |
| **Ventas** *(módulo conceptual)* | Página placeholder `admin/ventas` (“en construcción”). | Sin entidad Prisma `ventas`; no consolida `pedidos`/`pagos`/`comprobantes`. |
| **Culqi / pagos portal** | API charge + webhook, componentes checkout. | Página `portal/pago/[id]` aún mezcla componentes legacy (`YapeForm`) sin `pedido_id` en algunos flujos. |
| `despachos_grupos` | Solo backend (helpers/servicio). | Sin pantalla específica de gestión de grupos. |
| `seguimiento_despachos` | Backend + widget portal. | Sin vista admin de timeline de despacho. |
| `otp_tokens` | Tabla en BD para OTP custom. | Auth usa **Supabase OTP** (`api/auth/send-otp`); tabla `otp_tokens` no referenciada en código. |

---

## 🔴 Entidades No Implementadas (Huérfanas)

Modelos del schema `public` **sin ninguna interacción** vía Prisma, servicios o APIs en `src/` (solo aparecen en tipos generados, permisos o menú fantasma).

| Modelo | Evidencia de ausencia |
|--------|----------------------|
| `devoluciones_cliente` | Enlace en `Sidebar.tsx` a `/devoluciones-cliente`, permisos en `roles.ts`, pero **cero** rutas API, servicios ni páginas. |
| `devoluciones_proveedor` | Igual: menú y permisos definidos, **sin** implementación en `src/app` ni `src/lib/services`. |
| `descuento_aplicaciones` | Solo tipos en `database.ts`. No hay registro de descuentos aplicados en cotizaciones/pedidos pese a existir `reglas_descuento`. |
| `detalle_ficha_insumos` | Modelo en schema sin uso; sustituido funcionalmente por `fichas_tecnicas_detalle`. |
| `otp_tokens` | Modelo en `public` ignorado; flujo OTP delegado a Supabase Auth. |

> **Nota sobre menús fantasma:** Las rutas `/admin/Panel-Administrativo/devoluciones-cliente`, `devoluciones-proveedor`, `incidencias-taller` e `incidencias-cliente` están en el sidebar pero varias **no tienen `page.tsx`** asociado, lo que genera 404 al navegar.

---

## ⚙️ Schema `auth` (Supabase) — Fuera de alcance de “huérfanas”

Los 23 modelos del schema `auth` (`users`, `sessions`, `refresh_tokens`, `identities`, `mfa_*`, `oauth_*`, `saml_*`, `sso_*`, `webauthn_*`, etc.) **no se acceden vía Prisma** en la aplicación. La autenticación usa `@supabase/ssr` y `createClient`. Esto es esperado: son tablas de infraestructura gestionadas por Supabase, no entidades de dominio ERP.

---

## Mapa rápido por capa

### `src/app/api` — dominios con mayor cobertura
- **Admin:** pedidos, cotizaciones, órdenes compra/producción, inventario, almacenes, proveedores, insumos, materiales, promociones, tesorería, confecciones, despachos, usuarios, clientes, auditoría, configuración.
- **Portal:** cotizaciones, pedidos, despachos, pagos, catálogo, notificaciones, dashboard.
- **Integraciones:** Culqi (`charge`, `webhook`), auth, health, ubigeo.

### `src/lib/services` — 60 archivos de dominio
Cobertura sólida en: pedidos, cotizaciones, OC, CP proveedor, inventario, almacenes, pagos/Culqi, promociones, fichas técnicas, confecciones, despachos, clientes, usuarios.

### `src/lib/hooks` — 45 hooks
La mayoría alineados con módulos admin. Hooks **sin consumo en UI detectado:** `useGuiasRemision`, `useAsientosContables`, `useComprobantes`.

### `src/app/admin` — 56 páginas
Módulos maduros: pedidos, cotizaciones, OC, CP proveedor, productos, inventario, almacenes, promociones, tesorería, confecciones, OP, clientes, usuarios.

### `src/app/portal` — 16 páginas
Flujos activos: catálogo, cotizaciones, pedidos, despachos, pagos, dashboard, perfil.

---

## Recomendaciones prioritarias (solo análisis, sin implementación)

1. **Eliminar o implementar** enlaces del sidebar hacia devoluciones e incidencias (evitar 404 y confusión de cobertura).
2. **Unificar fichas:** decidir si `detalle_ficha_insumos` se depreca en BD o se conecta al código.
3. **Completar módulos con API sin UI:** guías de remisión, asientos contables.
4. **Conectar `descuento_aplicaciones`** al motor de promociones o documentar su no uso.
5. **Resolver `precio_historico`:** agregar al schema introspectado o eliminar API/hook huérfanos.
6. **Incidencias cliente:** reemplazar mock del portal por API real sobre `incidencias_cliente`.

---

*Generado automáticamente por auditoría de cobertura. Fuente del schema: `prisma/schema/introspected.prisma`.*
