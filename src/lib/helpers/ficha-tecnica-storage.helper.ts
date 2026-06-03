import { STORAGE_BUCKET_FICHAS_TECNICAS } from '@/lib/constants/storage';

/** Extrae la ruta interna del bucket desde path relativo o URL pública de Supabase. */
export function extractFichaStoragePath(ref: string | null | undefined): string | null {
  if (!ref?.trim()) return null;

  const trimmed = ref.trim();
  if (!trimmed.startsWith('http')) {
    return trimmed.replace(/^\/+/, '');
  }

  try {
    const url = new URL(trimmed);
    const marker = '/storage/v1/object/';
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return null;

    const rest = url.pathname.slice(idx + marker.length);
    const parts = rest.split('/').filter(Boolean);
    // public | sign | authenticated / bucket / ...path
    if (parts.length < 3) return null;

    const bucket = parts[1];
    const pathParts = parts.slice(2);

    if (bucket !== STORAGE_BUCKET_FICHAS_TECNICAS) {
      // URL antigua con otro bucket: igual intentamos la ruta de archivo
      return pathParts.map(decodeURIComponent).join('/');
    }

    return pathParts.map(decodeURIComponent).join('/');
  } catch {
    return null;
  }
}

export function buildFichaArchivoApiUrl(ref: string | null | undefined): string | null {
  const path = extractFichaStoragePath(ref);
  if (!path) return ref?.startsWith('http') ? ref : null;
  return `/api/fichas-tecnicas/archivo?ref=${encodeURIComponent(path)}`;
}

export function contentTypeFromStoragePath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}
