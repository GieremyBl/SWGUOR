import { createAdminClient } from '@/lib/supabase/admin';
import {
  STORAGE_BUCKET_DOCUMENTOS,
  cotizacionProveedorPdfStoragePath,
} from '@/lib/constants/storage';

export function getCotizacionProveedorPdfPublicUrl(cotizacionId: string | number): string {
  const supabase = createAdminClient();
  const path = cotizacionProveedorPdfStoragePath(cotizacionId);
  const { data } = supabase.storage.from(STORAGE_BUCKET_DOCUMENTOS).getPublicUrl(path);
  return data.publicUrl;
}

export async function almacenarPdfReferenciaCotizacion(
  cotizacionId: string | number,
  buffer: Buffer,
  contentType = 'application/pdf',
): Promise<{ pdf_url: string; storage_path: string }> {
  const path = cotizacionProveedorPdfStoragePath(cotizacionId);
  const supabase = createAdminClient();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET_DOCUMENTOS)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) {
    throw new Error(`No se pudo almacenar el PDF: ${error.message}`);
  }

  return {
    storage_path: path,
    pdf_url: getCotizacionProveedorPdfPublicUrl(cotizacionId),
  };
}
