// Crear archivo en f:/sistema-guor-v2/src/lib/helpers/confeccion-upload.client.ts
import { createClient } from '@/lib/supabase/client'; // Ajusta la ruta a tu cliente de supabase
import { STORAGE_BUCKET_EVIDENCIAS_CONFECCION, evidenciaConfeccionStoragePath } from '../constants/storage';

export async function subirEvidenciasConfeccion(
    confeccionId: string | number,
    archivos: File[]
): Promise<string[]> {
    const urls: string[] = [];

    for (const file of archivos) {
        const path = evidenciaConfeccionStoragePath(confeccionId, file.name);
        const supabase = createClient();
        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET_EVIDENCIAS_CONFECCION)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('Error al subir imagen de evidencia:', error);
            throw new Error(`No se pudo subir el archivo ${file.name}`);
        }

        if (data) {
            // Obtener URL pública
            const { data: publicUrlData } = supabase.storage
                .from(STORAGE_BUCKET_EVIDENCIAS_CONFECCION)
                .getPublicUrl(path);

            if (publicUrlData?.publicUrl) {
                urls.push(publicUrlData.publicUrl);
            }
        }
    }

    return urls;
}