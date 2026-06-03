'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase';
import {
  STORAGE_BUCKET_ACTAS_ENTREGA,
  STORAGE_BUCKET_EVIDENCIAS_EMPAQUE,
  actaEntregaStoragePath,
  evidenciaEmpaqueStoragePath,
  evidenciaEntregaStoragePath,
} from '@/lib/constants/storage';

async function subirArchivo(params: {
  bucket: string;
  path: string;
  file: File;
}): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage.from(params.bucket).upload(params.path, params.file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(params.bucket).getPublicUrl(params.path);
  return data.publicUrl;
}

export async function subirFotoEmpaque(pedidoId: string | number, file: File): Promise<string> {
  return subirArchivo({
    bucket: STORAGE_BUCKET_EVIDENCIAS_EMPAQUE,
    path: evidenciaEmpaqueStoragePath(pedidoId, file.name),
    file,
  });
}

export async function subirActaEntrega(pedidoId: string | number, file: File): Promise<string> {
  return subirArchivo({
    bucket: STORAGE_BUCKET_ACTAS_ENTREGA,
    path: actaEntregaStoragePath(pedidoId, file.name),
    file,
  });
}

export async function subirFotoEntrega(pedidoId: string | number, file: File): Promise<string> {
  return subirArchivo({
    bucket: STORAGE_BUCKET_EVIDENCIAS_EMPAQUE,
    path: evidenciaEntregaStoragePath(pedidoId, file.name),
    file,
  });
}
