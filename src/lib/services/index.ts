// ── Servicios de dominio ─────────────────────────────────────────────────────
export { notificacionesService } from './notificaciones.service';
export { almacenesService } from './almacenes.service';
export { reservaStockService } from './reserva-stock.service';
export { precioHistoricoService } from './precio-historico.service';
export { PagosTallerService, pagosTalleresService } from './pagos-talleres.service';
export { TarifasTallerService, tarifaTalleresService } from './tarifa-talleres.service';
export { TalleresService } from './talleres.service';
export { ConfeccionesService } from './confecciones.service';
export { CostoEnvioService } from './costo-envio.service';
export { guiasRemisionService } from './guias-remision.service';
export { ordenesCompraService } from './ordenes-compra.service';
export { IncidenciasTallerService } from './incidencias-taller.service';
export {
  DevolucionesClienteService,
  DevolucionClienteError,
  isDevolucionClienteError,
} from './devoluciones-cliente.service';
export {
  DevolucionesProveedorService,
  DevolucionProveedorError,
  isDevolucionProveedorError,
} from './devoluciones-proveedor.service';
export { asientosContablesService } from './asientos-contables.service';
export { auditoriaService } from './auditoria.service';
export { comprobantesService } from './comprobantes.service';
export { pagosService } from './pagos.service';
export {
  ejecutarCierreVentaPostCulqi,
  isCierreVentaCulqiError,
} from './cierre-venta-culqi.service';
export {
  createPaymentGateway,
  getDefaultPaymentGateway,
  CulqiAdapter,
  StripeAdapter,
  MercadoPagoAdapter,
  getStripeClient,
  getMercadoPagoPaymentClient,
  type IPaymentGateway,
  type PaymentGatewayId,
} from './payments';

// ── Servicios que usan Prisma directamente (sin RPC) ─────────────────────────
export { FichasTecnicasService } from './fichas-tecnicas.service';
export { FichasTecnicasDetalleService } from './fichas-tecnicas-detalle.service';
export { FichaMedidasService } from './ficha-medidas.service';
export { OrdenesProduccionService } from './ordenes-produccion.service';
export { OrdenesProduccionItemsService } from './ordenes-produccion-items.service';
export { SeguimientoProduccionService } from './seguimiento-produccion.service';
export { SeguimientoConfeccionService } from './seguimiento-confeccion.service';
export { InventarioService } from './inventario.service';
export { ProductosService } from './productos.service';
export { DireccionesClienteService, DireccionClienteError } from './direcciones-cliente.service';
export {
  DocumentosService,
  DocumentosPedidoError,
  isDocumentosPedidoError,
  type DocumentoPedido,
} from './documentos.service';

// ── RPC unificado ─────────────────────────────────────────────────────────────
// Todo lo que antes estaba en:
//   notificaciones-rpc-service.ts
//   fichas-tecnicas-rpc-service.ts
//   inventario-rpc-service.ts
//   movimientos-inventario-services.ts  (lógica RPC)
export {
  // Notificaciones
  crearNotificacion,
  obtenerNotificacionesNoLeidas,
  marcarNotificacionesComoLeidas,
  marcarTodasComoLeidas,
  notificarCotizacionExpirada,
  notificarDevolucionSolicitada,
  notificarStockBajo,
  notificarPagoPendiente,
  notificarConfeccionCompletada,

  // Fichas técnicas
  obtenerCostoFicha,
  obtenerFichaTecnicaConCosto,
  crearFichaTecnica,
  actualizarFichaTecnica,
  aprobarFichaTecnica,
  marcarFichaObsoleta,
  obtenerFichasPorProducto,
  obtenerHistoricoFicha,

  // Inventario — stock
  obtenerStockProducto,
  obtenerStockInsumo,
  obtenerStockMaterial,
  obtenerStockDisponibleProducto,
  validarStock,
  obtenerInsumosBajoStock,
  obtenerItemsConStockBajo,

  // Inventario — movimientos
  registrarMovimiento,
  listarMovimientos,
  obtenerResumenMovimientos,

  // Namespaces agrupados (alternativa)
  NotificacionesRPC,
  FichasTecnicasRPC,
  InventarioRPC,
} from './rpc.service';