/** Buckets y rutas de Supabase Storage (sin modificar schema Prisma) */

export const STORAGE_BUCKET_DOCUMENTOS =
  process.env.SUPABASE_STORAGE_BUCKET_DOCUMENTOS ?? 'documentos';

export const STORAGE_PATH_ORDENES_COMPRA = 'ordenes-compra' as const;
export const STORAGE_PATH_COTIZACIONES_PROVEEDOR = 'cotizaciones-proveedor' as const;

export function ordenCompraPdfStoragePath(ordenId: string | number): string {
  return `${STORAGE_PATH_ORDENES_COMPRA}/${ordenId}/orden.pdf`;
}

export function cotizacionProveedorPdfStoragePath(cotizacionId: string | number): string {
  return `${STORAGE_PATH_COTIZACIONES_PROVEEDOR}/${cotizacionId}/referencia.pdf`;
}

export const STORAGE_BUCKET_FICHAS_TECNICAS =
  process.env.SUPABASE_STORAGE_BUCKET_FICHAS ?? 'fichas-tecnicas';

export function fichaTecnicaStoragePath(
  productoId: string | number,
  tipo: 'pdf' | 'geometral' | 'evidencia',
  fileName: string,
): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `producto-${productoId}/${tipo}/${Date.now()}-${safe}`;
}

export const STORAGE_BUCKET_EVIDENCIAS_EMPAQUE =
  process.env.SUPABASE_STORAGE_BUCKET_EVIDENCIAS_EMPAQUE ?? 'evidencias-empaque';

export const STORAGE_BUCKET_ACTAS_ENTREGA =
  process.env.SUPABASE_STORAGE_BUCKET_ACTAS_ENTREGA ?? 'actas-entrega';

export function evidenciaEmpaqueStoragePath(
  pedidoId: string | number,
  fileName: string,
): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `pedido-${pedidoId}/${Date.now()}-${safe}`;
}

export function actaEntregaStoragePath(
  pedidoId: string | number,
  fileName: string,
): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `pedido-${pedidoId}/acta-${Date.now()}-${safe}`;
}

export function evidenciaEntregaStoragePath(
  pedidoId: string | number,
  fileName: string,
): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `pedido-${pedidoId}/entrega-${Date.now()}-${safe}`;
}
