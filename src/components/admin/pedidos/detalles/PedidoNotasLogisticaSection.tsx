'use client';

import { FileText, Package, Truck } from 'lucide-react';
import { parseNotasPedido } from '@/lib/helpers/pedido-notas-json.helper';

interface Props {
  notasCliente: string | null;
  notasPedido: string | null;
}

function BloqueFotos({ fotos, titulo }: { fotos: string[]; titulo: string }) {
  if (!fotos.length) return null;
  return (
    <div>
      <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">
        {titulo}
      </p>
      <div className="flex flex-wrap gap-2">
        {fotos.map((url) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-16 h-16 rounded-lg overflow-hidden border border-stone-200 bg-stone-100"
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
          </a>
        ))}
      </div>
    </div>
  );
}

export function PedidoNotasLogisticaSection({ notasCliente, notasPedido }: Props) {
  const doc = parseNotasPedido(notasPedido);
  const tieneLogistica = doc.empaque || doc.entrega;
  const tieneLegacy = doc.legacy?.trim();
  const tieneCliente = notasCliente?.trim();

  if (!tieneCliente && !tieneLogistica && !tieneLegacy) {
    return null;
  }

  return (
    <div className="bg-white border border-stone-100 rounded-2xl shadow-sm p-5 space-y-4">
      <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
        Notas del pedido
      </h3>

      {tieneCliente && (
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
          <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">
            Cliente
          </p>
          <p className="text-sm text-blue-900 leading-relaxed">{notasCliente}</p>
        </div>
      )}

      {doc.empaque && (
        <div className="rounded-xl bg-violet-50 border border-violet-100 p-4 space-y-3">
          <p className="text-xs font-black text-violet-800 flex items-center gap-2">
            <Package size={14} /> Empaque y preparación
          </p>
          {doc.empaque.notas && (
            <p className="text-sm text-violet-900">{doc.empaque.notas}</p>
          )}
          <BloqueFotos fotos={doc.empaque.fotos} titulo="Fotos de empaque" />
        </div>
      )}

      {doc.entrega && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 space-y-3">
          <p className="text-xs font-black text-emerald-800 flex items-center gap-2">
            <Truck size={14} /> Entrega confirmada
          </p>
          {doc.entrega.notas && (
            <p className="text-sm text-emerald-900">{doc.entrega.notas}</p>
          )}
          {doc.entrega.acta_pdf_url && (
            <a
              href={doc.entrega.acta_pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
            >
              <FileText size={14} />
              Ver acta de conformidad (PDF)
            </a>
          )}
          <BloqueFotos fotos={doc.entrega.fotos} titulo="Fotos de entrega" />
        </div>
      )}

      {tieneLegacy && !tieneLogistica && (
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
          <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">
            Internas
          </p>
          <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">
            {doc.legacy}
          </p>
        </div>
      )}
    </div>
  );
}
