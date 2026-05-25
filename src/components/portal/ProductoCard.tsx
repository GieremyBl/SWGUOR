'use client';

import { useState } from 'react';
import { ShoppingCart, Info, Loader2, PackageSearch, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/helpers/format-helpers';
import { usePortal } from '@/app/portal/_contexts/PortalContext';
import { toast } from 'sonner';
import { PromocionProductoBadge } from '@/components/portal/PromocionProductoBadge';
import type { ProductoCampanaBadge } from '@/lib/services/portal-promociones-catalogo.service';

// ── Brand colors ──────────────────────────────────────────────────
const BRAND = {
  ocre:      '#b5854b',
  ocreDark:  '#9a6e3a',
  ocreLight: '#fff4e2',
  negro:     '#231e1d',
};

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number; 
  imagen: string | null; 
  sku: string;
  descripcion?: string;
  variantes_producto?: any[];
  colores_disponibles?: string[];
  tallas_disponibles?: string[];
}

interface ProductoCardProps {
  producto: Producto;
  onOpenDetails: () => void;
  promociones?: ProductoCampanaBadge[];
}

export function ProductoCard({ producto, onOpenDetails, promociones = [] }: ProductoCardProps) {
  const { agregarAlBorrador } = usePortal();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const PROJECT_ID = "fkpvmgfsopjhvorckoat";
  const BUCKET_NAME = "productos";
  const PUBLIC_STORAGE_URL = `https://${PROJECT_ID}.supabase.co/storage/v1/object/public/${BUCKET_NAME}/`;
  
  const imageUrl = producto.imagen 
    ? (producto.imagen.startsWith('http') 
        ? producto.imagen 
        : `${PUBLIC_STORAGE_URL}${producto.imagen}`)
    : null;

  const handleCotizar = async () => {
    setIsAdding(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    agregarAlBorrador({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen,
      cantidad: 400, // MOQ por defecto
      variantes: producto.variantes_producto || [],
      colores_disponibles: producto.colores_disponibles || [],
      tallas_disponibles: producto.tallas_disponibles || [],
    });

    setIsAdding(false);
    setJustAdded(true);

    // Toast de confirmación
    toast.success('Producto agregado al borrador de cotización', {
      description: producto.nombre,
      icon: <CheckCircle size={16} />,
      duration: 3000,
    });

    // Reset del estado visual del botón
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <article 
      className="group bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-amber-900/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full focus-within:ring-2 focus-within:ring-amber-400"
      role="article"
      aria-label={`Producto: ${producto.nombre}`}
    >
      
      {/* Imagen y Categoría */}
      <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={`${producto.nombre} - Producto`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = ""; 
              e.currentTarget.className = "hidden";
              e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-100">
            <PackageSearch size={40} className="mb-2 opacity-50" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Sin Imagen</span>
          </div>
        )}
        
        {/* Badge de Categoría */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
          <span 
            className="px-2 py-1 sm:px-3 sm:py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-black uppercase text-slate-800 shadow-sm"
            aria-label={`Categoría: ${producto.categoria}`}
          >
            {producto.categoria}
          </span>
        </div>

        {promociones.length > 0 && <PromocionProductoBadge badges={promociones} />}
      </div>

      {/* Contenido del Card */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:transition-colors line-clamp-2 min-h-[40px]"
              style={{ '--tw-text-opacity': 1 } as React.CSSProperties}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = BRAND.ocre}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = ''}
          >
            {producto.nombre}
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
            SKU: {producto.sku || producto.id}
          </p>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {/* Precio y Botón de Cotizar */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 sm:pt-4 gap-3">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Precio Base</p>
              <p className="text-lg sm:text-xl font-black text-slate-900">{formatCurrency(producto.precio)}</p>
            </div>
            
            {/* Botón cotizar — ocre cuando no está agregado, verde check cuando sí */}
            <button 
              onClick={handleCotizar}
              disabled={isAdding || justAdded}
              aria-busy={isAdding}
              aria-label={isAdding ? "Agregando al borrador" : `Cotizar ${producto.nombre}`}
              className={cn(
                "p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-xs font-bold shrink-0 text-white",
                "disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2",
                justAdded ? "opacity-100" : "opacity-100"
              )}
              style={{
                backgroundColor: justAdded ? '#22c55e' : BRAND.ocre,
              }}
              onMouseEnter={e => {
                if (!justAdded && !isAdding)
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = BRAND.ocreDark;
              }}
              onMouseLeave={e => {
                if (!justAdded)
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = justAdded ? '#22c55e' : BRAND.ocre;
              }}
              title={isAdding ? "Agregando al borrador" : "Agregar al borrador de cotización"}
            >
              {isAdding ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : justAdded ? (
                <CheckCircle size={16} aria-hidden="true" />
              ) : (
                <>
                  <ShoppingCart size={16} aria-hidden="true" />
                  <span className="hidden sm:group-hover:inline transition-all duration-300">COTIZAR</span>
                </>
              )}
            </button>
          </div>

          {/* Botón de Detalles Técnicos */}
          <button 
            onClick={onOpenDetails}
            aria-label={`Ver detalles técnicos de ${producto.nombre}`}
            className="w-full py-2 sm:py-2.5 border text-sm font-semibold rounded-lg sm:rounded-xl text-[11px] transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2"
            style={{
              borderColor: BRAND.ocre + '40',
              color: BRAND.ocre,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = BRAND.ocreLight;
              (e.currentTarget as HTMLButtonElement).style.borderColor = BRAND.ocre;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
              (e.currentTarget as HTMLButtonElement).style.borderColor = BRAND.ocre + '40';
            }}
            title="Ver ficha técnica del producto"
          >
            <Info size={14} aria-hidden="true" /> DETALLES TÉCNICOS
          </button>
        </div>
      </div>
    </article>
  );
}

// --- SKELETON PARA ESTADOS DE CARGA ---
export function ProductoSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 animate-pulse flex flex-col h-full">
      <div className="aspect-[4/5] bg-slate-100 rounded-2xl w-full relative overflow-hidden">
        <div className="absolute top-4 left-4 h-5 w-16 bg-white/60 rounded-full" />
      </div>
      <div className="flex-1 space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-slate-100 rounded-lg w-full" />
          <div className="h-4 bg-slate-100 rounded-lg w-2/3" />
          <div className="h-2 bg-slate-50 rounded w-1/4 mt-2" />
        </div>
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center pt-4 border-t border-slate-50">
            <div className="space-y-2">
              <div className="h-2 bg-slate-100 rounded w-12" />
              <div className="h-6 bg-slate-100 rounded w-24" />
            </div>
            <div className="h-12 w-12 bg-slate-200 rounded-2xl" />
          </div>
          <div className="h-10 w-full bg-slate-50 border border-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}