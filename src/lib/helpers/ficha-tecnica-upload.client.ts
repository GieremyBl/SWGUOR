'use client';

import {
  buildFichaArchivoApiUrl,
} from '@/lib/helpers/ficha-tecnica-storage.helper';

export async function subirArchivoFichaTecnica(params: {
  file: File;
  productoId: string | number;
  tipo: 'pdf' | 'geometral' | 'evidencia';
}): Promise<string> {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('productoId', String(params.productoId));
  formData.append('tipo', params.tipo);

  const res = await fetch('/api/fichas-tecnicas/upload', {
    method: 'POST',
    body: formData,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? 'Error al subir archivo');
  }

  return json.path as string;
}

/** URL segura para abrir PDF/imagen de ficha (path relativo o URL legacy). */
export function urlVerArchivoFicha(ref: string | null | undefined): string | null {
  return buildFichaArchivoApiUrl(ref);
}
