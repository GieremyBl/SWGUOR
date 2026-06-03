import type { Prisma } from '@prisma/client';
import type { TipoMovimiento } from '@prisma/client';

type Tx = Prisma.TransactionClient;

export type LineaStockPedido = {
  producto_id: number | bigint;
  variante_id: number | bigint;
  cantidad: number;
};

/**
 * Actualiza productos.stock sin devolver el registro completo.
 * Evita el error del driver adapter "(not available)" al hacer RETURN de columnas.
 */
async function setProductoStock(tx: Tx, productoId: bigint, stock: number): Promise<void> {
  const total = Math.max(0, Math.floor(stock));

  // Ejecutamos SQL puro. 
  // Esto es inmune a los errores de mapeo de columnas del Driver Adapter.
  await tx.$executeRaw`
    UPDATE public.productos 
    SET stock = ${total} 
    WHERE id = ${productoId}
  `;
}

async function setVarianteStock(tx: Tx, varianteId: bigint, stock: number): Promise<void> {
  const total = Math.max(0, Math.floor(stock));
  const { count } = await tx.variantes_producto.updateMany({
    where: { id: varianteId },
    data: { stock: total },
  });
  if (count === 0) {
    throw new Error(`Variante ${varianteId} no encontrada`);
  }
}

/**
 * Sincroniza productos.stock con la suma de variantes_producto.stock activas.
 */
export async function sincronizarStockProductoDesdeVariantes(
  tx: Tx,
  productoId: bigint,
): Promise<void> {
  const variantes = await tx.variantes_producto.findMany({
    where: { producto_id: productoId, estado: 'activo' },
    select: { stock: true },
  });

  const total = variantes.reduce((sum, v) => sum + v.stock, 0);
  await setProductoStock(tx, productoId, total);
}

/**
 * Descuenta stock de la variante y actualiza el total del producto padre.
 */
export async function descontarStockLineaPedido(
  tx: Tx,
  linea: LineaStockPedido,
): Promise<void> {
  const varianteId = BigInt(linea.variante_id);
  const productoId = BigInt(linea.producto_id);
  const cantidad = Math.floor(Number(linea.cantidad));

  if (cantidad <= 0) {
    throw new Error('La cantidad debe ser mayor a 0');
  }

  const variante = await tx.variantes_producto.findFirst({
    where: { id: varianteId, producto_id: productoId, estado: 'activo' },
    select: { id: true, stock: true },
  });

  if (!variante) {
    throw new Error(`Variante ${varianteId} no encontrada o inactiva`);
  }

  if (variante.stock < cantidad) {
    throw new Error(
      `Stock insuficiente. Disponible: ${variante.stock}, solicitado: ${cantidad}`,
    );
  }

  await setVarianteStock(tx, varianteId, variante.stock - cantidad);
  await sincronizarStockProductoDesdeVariantes(tx, productoId);
}

/**
 * Aplica movimiento de inventario sobre productos.stock (columna Int en BD).
 */
export async function aplicarMovimientoStockProducto(
  tx: Tx,
  productoId: bigint,
  cantidad: number,
  tipo_movimiento: TipoMovimiento,
): Promise<void> {
  const qty = Math.floor(Math.abs(Number(cantidad)));
  if (qty <= 0) throw new Error('La cantidad debe ser mayor a 0');

  const producto = await tx.productos.findFirst({
    where: { id: productoId },
    select: { id: true, stock: true, nombre: true },
  });

  if (!producto) throw new Error('Producto no encontrado');

  const tiposEntrada: TipoMovimiento[] = [
    'entrada',
    'produccion_entrada',
    'recepcion_devolucion_cliente',
    'recepcion_devolucion_proveedor',
    'devolucion_consumo',
  ];

  if (tiposEntrada.includes(tipo_movimiento)) {
    await setProductoStock(tx, productoId, producto.stock + qty);
    return;
  }

  if (producto.stock < qty) {
    throw new Error(
      `Stock insuficiente en "${producto.nombre}". Actual: ${producto.stock}, solicitado: ${qty}`,
    );
  }

  await setProductoStock(tx, productoId, producto.stock - qty);
}
