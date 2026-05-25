import { createAdminClient } from '@/lib/supabase/admin';
import {
  STORAGE_BUCKET_DOCUMENTOS,
  STORAGE_PATH_ORDENES_COMPRA,
  ordenCompraPdfStoragePath,
} from '@/lib/constants/storage';
import { renderOrdenCompraPdfBuffer } from '@/lib/pdf/orden-compra-pdf';
import type { OrdenCompraDetalle } from '@/lib/services/ordenes-compra.types';

export function getOrdenCompraPdfPublicUrl(ordenId: string | number): string {
  const supabase = createAdminClient();
  const path = ordenCompraPdfStoragePath(ordenId);
  const { data } = supabase.storage
    .from(STORAGE_BUCKET_DOCUMENTOS)
    .getPublicUrl(path);
  return data.publicUrl;
}

export async function ordenCompraPdfExists(
  ordenId: string | number,
): Promise<boolean> {
  const supabase = createAdminClient();
  const path = ordenCompraPdfStoragePath(ordenId);
  const folder = `${STORAGE_PATH_ORDENES_COMPRA}/${ordenId}`;
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET_DOCUMENTOS)
    .list(folder, { search: 'orden.pdf' });

  if (error) return false;
  return (data ?? []).some((f) => f.name === 'orden.pdf');
}

/**
 * Genera el PDF de la OC y lo sube a Supabase Storage.
 * Ruta determinística: documentos/ordenes-compra/{id}/orden.pdf
 */
export async function generarYAlmacenarPdfOrdenCompra(
  orden: OrdenCompraDetalle,
): Promise<{ pdf_url: string; storage_path: string }> {
  const buffer = await renderOrdenCompraPdfBuffer(orden);
  const path = ordenCompraPdfStoragePath(String(orden.id));
  const supabase = createAdminClient();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET_DOCUMENTOS)
    .upload(path, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    throw new Error(`No se pudo almacenar el PDF: ${error.message}`);
  }

  return {
    storage_path: path,
    pdf_url: getOrdenCompraPdfPublicUrl(String(orden.id)),
  };
}
