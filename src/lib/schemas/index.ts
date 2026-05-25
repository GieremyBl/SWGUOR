// Schemas
export {
  notificacionBaseSchema,
  crearNotificacionSchema,
  type Notificacion,
  type CrearNotificacion,
  type TipoNotificacion,
} from './notificaciones';

export {
  almacenBaseSchema,
  crearAlmacenSchema,
  type Almacen,
  type CrearAlmacen,
} from './almacenes';

export {
  reservaStockBaseSchema,
  crearReservaSchema,
  type ReservaStock,
  type CrearReserva,
} from './reserva-stock';

export {
  precioHistoricoBaseSchema,
  crearPrecioHistoricoSchema,
  type PrecioHistorico,
  type CrearPrecioHistorico,
} from './precio-historico';

export {
  pagoTallerBaseSchema,
  crearPagoTallerSchema,
  type PagoTaller,
  type CrearPagoTaller,
} from './pagos-talleres';

export {
  tarifaTallerBaseSchema,
  crearTarifaTallerSchema,
  type TarifaTaller,
  type CrearTarifaTaller,
} from './tarifa-talleres';

export {
  guiaRemisionBaseSchema,
  crearGuiaRemisionSchema,
  type GuiaRemision,
  type CrearGuiaRemision,
} from './guias-remision';

export {
  ordenCompraBaseSchema,
  crearOrdenCompraSchema,
  crearOrdenDesdeCotizacionSchema,
  ordenCompraItemSchema,
  type OrdenCompra,
  type CrearOrdenCompra,
  type CrearOrdenDesdeCotizacion,
  type OrdenCompraItemInput,
} from './ordenes-compra';

export {
  incidenciaBaseSchema,
  crearIncidenciaSchema,
  type Incidencia,
  type CrearIncidencia,
} from './incidencias';

export {
  asientoContableBaseSchema,
  crearAsientoContableSchema,
  type AsientoContable,
  type CrearAsientoContable,
  type DetalleAsiento,
} from './asientos-contables';

export {
  auditoriaBaseSchema,
  type Auditoria,
} from './auditoria';

export {
  comprobanteBaseSchema,
  crearComprobanteSchema,
  type Comprobante,
  type CrearComprobante,
} from './comprobantes';

export {
  pagoBaseSchema,
  crearPagoSchema,
  type Pago,
  type CrearPago,
} from './pagos';

// ── RPC Schemas (Validación para funciones PostgreSQL RPC)
export {
  CalcularCostoFichaSchema,
  CrearReservaStockSchema,
  ActualizarPrecioSchema,
  InsertarMovimientoSchema,
  CrearNotificacionSchema,
  CambiarEstadoConfeccionSchema,
  OperacionStockSchema,
  FiltrosAuditoriaSchema,
  BuscarMovimientosSchema,
  BuscarNotificacionesSchema,
  PaginacionSchema,
  TipoMovimientoEnum,
  ReferenciaMovimientoEnum,
  TipoNotificacionEnum,
  EstadoConfeccionEnum,
  EstadoPedidoEnum,
} from './rpc-schemas';
