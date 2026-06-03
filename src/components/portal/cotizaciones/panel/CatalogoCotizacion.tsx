'use client';

import { useState, useMemo, CSSProperties, ChangeEvent } from 'react';
import { Search, Package, Plus, Check } from 'lucide-react';
import { ModalAgregarAlBorrador } from './ModalAgregarAlBorrador';
import { usePortal } from '@/lib/hooks/usePortal';
import type { ProductoPortal } from '@/components/portal/_contexts/PortalContext';

interface Props {
  idsAgregados: number[];
}

export function CatalogoCotizacion({ idsAgregados }: Props) {
  const { productos, loading } = usePortal(); // ← usa el contexto en lugar de fetch propio
  const [busqueda, setBusqueda] = useState('');
  const [productoModal, setProductoModal] = useState<ProductoPortal | null>(null);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return productos;
    return productos.filter(p =>
      p.nombre?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q)
    );
  }, [productos, busqueda]);

  return (
    <div className="flex flex-col h-full">

      {/* Título panel */}
      <div
        className="px-5 pt-5 pb-3 border-b"
        style={{ borderColor: 'var(--guor-stone, #e2d9cf)' }}
      >
        <p
          className="text-[10px] font-black uppercase tracking-[0.2em]"
          style={{ color: 'var(--guor-dark, #231e1d)', opacity: 0.4 }}
        >
          Catálogo de modelos
        </p>
      </div>

      {/* Buscador */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2"
            size={13}
            style={{ color: 'var(--guor-dark, #231e1d)', opacity: 0.35 }}
          />
          <input
            type="text"
            value={busqueda}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o SKU..."
            className="w-full pl-8 pr-4 py-2 text-xs rounded-xl outline-none transition-all"
            style={{
              backgroundColor: 'var(--guor-cream, #fff4e2)',
              border: '1px solid var(--guor-stone, #e2d9cf)',
              color: 'var(--guor-dark, #231e1d)',
            } as CSSProperties}
          />
        </div>
      </div>

      {/* Lista de productos */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
        {loading ? (
          <div className="py-12 flex flex-col items-center gap-2 opacity-40">
            <span
              className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--guor-gold, #b5854b) var(--guor-gold, #b5854b) transparent transparent' }}
            />
            <span className="text-xs" style={{ color: 'var(--guor-dark, #231e1d)' }}>Cargando…</span>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-12 text-center opacity-30">
            <Package size={28} className="mx-auto mb-2" style={{ color: 'var(--guor-dark, #231e1d)' }} />
            <p className="text-xs" style={{ color: 'var(--guor-dark, #231e1d)' }}>Sin resultados</p>
          </div>
        ) : filtrados.map(prod => {
          // ProductoPortal no tiene variantes cargadas desde el contexto,
          // se compara por producto_id en su lugar
          const yaAgregado = idsAgregados.includes(prod.id);

          return (
            <div
              key={prod.id}
              className="flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer group"
              style={{
                backgroundColor: 'white',
                borderColor: 'var(--guor-stone, #e2d9cf)',
              }}
              onClick={() => setProductoModal(prod)}
            >
              {/* Imagen */}
              <div
                className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border"
                style={{
                  backgroundColor: 'var(--guor-cream, #fff4e2)',
                  borderColor: 'var(--guor-stone, #e2d9cf)',
                }}
              >
                {prod.imagen
                  ? <img src={prod.imagen} alt={prod.nombre} className="w-full h-full object-cover" />
                  : <Package size={18} className="m-auto mt-3 opacity-20" />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: 'var(--guor-dark, #231e1d)' }}>
                  {prod.nombre}
                </p>
                <p className="text-[10px] font-bold uppercase opacity-40 truncate" style={{ color: 'var(--guor-dark, #231e1d)' }}>
                  {prod.sku}
                </p>
                <p className="text-xs font-black mt-0.5" style={{ color: 'var(--guor-gold, #b5854b)' }}>
                  S/ {prod.precio.toFixed(2)}
                </p>
              </div>

              {/* Acción */}
              {yaAgregado ? (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border"
                  style={{
                    backgroundColor: 'var(--guor-cream, #fff4e2)',
                    borderColor: 'var(--guor-gold, #b5854b)',
                    color: 'var(--guor-gold, #b5854b)',
                  }}
                >
                  <Check size={13} />
                </div>
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border transition-all group-hover:scale-110"
                  style={{
                    backgroundColor: 'var(--guor-cream, #fff4e2)',
                    borderColor: 'var(--guor-stone, #e2d9cf)',
                    color: 'var(--guor-dark, #231e1d)',
                  }}
                >
                  <Plus size={13} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {productoModal && (
        <ModalAgregarAlBorrador
          producto={productoModal}
          onClose={() => setProductoModal(null)}
        />
      )}
    </div>
  );
}