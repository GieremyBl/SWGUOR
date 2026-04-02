import { createClient } from "@/lib/supabase/client/client"; // Asegúrate de tener configurado tu cliente
const supabase = createClient();

/**
 * Sube un archivo al bucket de Supabase Storage
 * @param file - Archivo físico desde el input
 * @param bucket - Nombre del bucket
 * @returns Path relativo del archivo subido
 */

export function getSupabaseImageUrl(
  imagePath: string | null | undefined,
  bucket: string = "productos"
): string | null {
  if (!imagePath) return null;

  const { data } = supabase.storage.from(bucket).getPublicUrl(imagePath);

  return data?.publicUrl ?? null;
}

export async function uploadProductImage(file: File, bucket: string = 'productos'): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = fileName; // Guardamos directamente en la raíz del bucket

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) throw error;
    
    return data.path; // Retorna solo el nombre del archivo (ej: "171183...jpg")
  } catch (error) {
    console.error('[SUPABASE_UPLOAD] Error:', error);
    return null;
  }
}