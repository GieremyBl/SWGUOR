export interface NotasEmpaqueJson {
  tipo: 'empaque';
  fotos: string[];
  notas?: string;
}

export interface NotasEntregaJson {
  tipo: 'entrega';
  fotos: string[];
  acta_pdf_url?: string;
  notas?: string;
}

export interface NotasPedidoDocumento {
  empaque?: Omit<NotasEmpaqueJson, 'tipo'>;
  entrega?: Omit<NotasEntregaJson, 'tipo'>;
  legacy?: string;
}

export function parseNotasPedido(raw: string | null | undefined): NotasPedidoDocumento {
  if (!raw?.trim()) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed !== 'object' || parsed === null) {
      return { legacy: raw };
    }

    const doc: NotasPedidoDocumento = {};

    if (parsed.tipo === 'empaque' && Array.isArray(parsed.fotos)) {
      doc.empaque = {
        fotos: parsed.fotos as string[],
        notas: typeof parsed.notas === 'string' ? parsed.notas : undefined,
      };
    } else if (parsed.empaque && typeof parsed.empaque === 'object') {
      const e = parsed.empaque as Record<string, unknown>;
      if (Array.isArray(e.fotos)) {
        doc.empaque = {
          fotos: e.fotos as string[],
          notas: typeof e.notas === 'string' ? e.notas : undefined,
        };
      }
    }

    if (parsed.tipo === 'entrega' && Array.isArray(parsed.fotos)) {
      doc.entrega = {
        fotos: parsed.fotos as string[],
        acta_pdf_url:
          typeof parsed.acta_pdf_url === 'string' ? parsed.acta_pdf_url : undefined,
        notas: typeof parsed.notas === 'string' ? parsed.notas : undefined,
      };
    } else if (parsed.entrega && typeof parsed.entrega === 'object') {
      const e = parsed.entrega as Record<string, unknown>;
      if (Array.isArray(e.fotos)) {
        doc.entrega = {
          fotos: e.fotos as string[],
          acta_pdf_url:
            typeof e.acta_pdf_url === 'string' ? e.acta_pdf_url : undefined,
          notas: typeof e.notas === 'string' ? e.notas : undefined,
        };
      }
    }

    if (!doc.empaque && !doc.entrega) {
      return { legacy: raw };
    }

    return doc;
  } catch {
    return { legacy: raw };
  }
}

export function mergeNotasEmpaque(params: {
  raw: string | null | undefined;
  fotos: string[];
  notas?: string;
}): string {
  const doc = parseNotasPedido(params.raw);
  const payload: Record<string, unknown> = {
    tipo: 'empaque',
    fotos: params.fotos,
    ...(params.notas?.trim() ? { notas: params.notas.trim() } : {}),
  };

  if (doc.entrega) {
    payload.entrega = {
      tipo: 'entrega',
      fotos: doc.entrega.fotos,
      ...(doc.entrega.acta_pdf_url ? { acta_pdf_url: doc.entrega.acta_pdf_url } : {}),
      ...(doc.entrega.notas ? { notas: doc.entrega.notas } : {}),
    };
  }

  return JSON.stringify(payload);
}

export function mergeNotasEntrega(params: {
  raw: string | null | undefined;
  fotos: string[];
  actaPdfUrl?: string;
  notas?: string;
}): string {
  const doc = parseNotasPedido(params.raw);
  const payload: Record<string, unknown> = {};

  if (doc.empaque) {
    payload.tipo = 'empaque';
    payload.fotos = doc.empaque.fotos;
    if (doc.empaque.notas) payload.notas = doc.empaque.notas;
  }

  payload.entrega = {
    tipo: 'entrega',
    fotos: params.fotos,
    ...(params.actaPdfUrl ? { acta_pdf_url: params.actaPdfUrl } : {}),
    ...(params.notas?.trim() ? { notas: params.notas.trim() } : {}),
  };

  if (!doc.empaque) {
    return JSON.stringify({
      tipo: 'entrega',
      fotos: params.fotos,
      ...(params.actaPdfUrl ? { acta_pdf_url: params.actaPdfUrl } : {}),
      ...(params.notas?.trim() ? { notas: params.notas.trim() } : {}),
    });
  }

  return JSON.stringify(payload);
}
