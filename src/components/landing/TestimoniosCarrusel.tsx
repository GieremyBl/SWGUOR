'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Testimonio {
  id:          number;
  puntuacion:  number;
  comentario:  string;
  created_at:  string;
  clientes: { 
    nombre_comercial: string; 
  } | null;
}

function StarRow({ puntuacion }: { puntuacion: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= puntuacion ? 'fill-[#e8d5a8] text-[#8a6d3b]' : 'fill-transparent text-[#e8d5a8]/30'}
        />
      ))}
    </div>
  );
}

function TestimonioCard({ item }: { item: Testimonio; active: boolean }) {
  return (
    <div className="flex-shrink-0 w-full transition-all duration-500">
      <div className="bg-white rounded-2xl shadow-md border border-[#e8d5a8]/20 p-7 md:p-9 mx-auto max-w-2xl relative">
        {/* Comilla decorativa */}
        <Quote
          size={48}
          className="absolute top-5 right-6 text-[#e8d5a8]/20 fill-[#e8d5a8]/10"
        />

        <div className="space-y-4">
          <StarRow puntuacion={item.puntuacion} />

          {/* FIX (react/no-unescaped-entities): Evaluamos las comillas como strings de JS */}
          <p className="text-[#1a1410]/80 text-base md:text-lg leading-relaxed italic">
            {"\""}{item.comentario}{"\""}
          </p>

          <div className="flex items-center gap-3 pt-2 border-t border-[#e8d5a8]/20">
            {/* Avatar inicial */}
            <div className="w-9 h-9 rounded-full bg-[#e8d5a8]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#8a6d3b] font-bold text-sm">
                {item.clientes?.nombre_comercial?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1a1410]">
                {item.clientes?.nombre_comercial ?? 'Cliente'}
              </p>
              <p className="text-xs text-[#8a6d3b]/50">
                {new Date(item.created_at).toLocaleDateString('es-PE', {
                  month: 'long', 
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TestimoniosCarrusel() {
  const [items, setItems]     = useState<Testimonio[]>([]);
  const [current, setCurrent] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [paused, setPaused]   = useState<boolean>(false);
  const intervalRef           = useRef<ReturnType<typeof setInterval> | null>(null);

  // FETCH: Carga asíncrona de testimonios aprobados para el portal comercial
  useEffect(() => {
    let isMounted = true;
    fetch('/api/landing/testimonios')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<Testimonio[]>;
      })
      .then((data) => { 
        if (isMounted) {
          setItems(data); 
          setLoading(false); 
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const next = useCallback(() => {
    setItems((prevItems) => {
      if (prevItems.length === 0) return prevItems;
      setCurrent((c) => (c + 1) % prevItems.length);
      return prevItems;
    });
  }, []);

  const prev = useCallback(() => {
    setItems((prevItems) => {
      if (prevItems.length === 0) return prevItems;
      setCurrent((c) => (c - 1 + prevItems.length) % prevItems.length);
      return prevItems;
    });
  }, []);

  // Auto-play seguro controlado por estados de interrupción (hover del cursor)
  useEffect(() => {
    if (items.length <= 1 || paused) return;

    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % items.length);
    }, 5000);

    return () => { 
      if (intervalRef.current) {
        clearInterval(intervalRef.current); 
      }
    };
  }, [items.length, paused]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#8a6d3b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-[#fdf9f3]">
      <div className="max-w-4xl mx-auto px-4 md:px-8">

        {/* Encabezado */}
        <div className="text-center mb-12 space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#8a6d3b]">
            Testimonios
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a1410]">
            Lo que dicen nuestros clientes
          </h2>
          <div className="w-12 h-0.5 bg-[#e8d5a8] mx-auto mt-3" />
        </div>

        {/* Contenedor del Carrusel */}
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Ventana de visualización (Viewport) */}
          <div className="relative overflow-hidden w-full py-4">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {items.map((item, idx) => (
                <div key={item.id} className="flex-shrink-0 w-full px-4">
                  <TestimonioCard item={item} active={idx === current} />
                </div>
              ))}
            </div>
          </div>

          {/* Botones de Navegación Lateral */}
          {items.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-6
                           w-10 h-10 rounded-full bg-white border border-[#e8d5a8]/40 shadow-sm
                           flex items-center justify-center text-[#8a6d3b] z-10
                           hover:bg-[#e8d5a8]/10 transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-6
                           w-10 h-10 rounded-full bg-white border border-[#e8d5a8]/40 shadow-sm
                           flex items-center justify-center text-[#8a6d3b] z-10
                           hover:bg-[#e8d5a8]/10 transition-colors"
                aria-label="Siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* Paginación por puntos inferior (Dots) */}
          {items.length > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrent(idx)}
                  className={cn(
                    'rounded-full transition-all duration-300',
                    idx === current
                      ? 'w-6 h-2 bg-[#8a6d3b]'
                      : 'w-2 h-2 bg-[#e8d5a8]/50 hover:bg-[#e8d5a8]',
                  )}
                  aria-label={`Ir al testimonio ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}