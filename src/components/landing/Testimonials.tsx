'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  id:          string;
  puntuacion:  number;
  comentarios: string;
  clientes: {
    nombre_comercial: string;
  } | null; // Soportamos explícitamente nulos por seguridad de base de datos
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading]           = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadTestimonials() {
      try {
        const res = await fetch('/api/testimonials');
        if (!res.ok) {
          throw new Error(`Error fetching testimonials: ${res.status}`);
        }

        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error('Invalid testimonials response');
        }

        if (isMounted) {
          setTestimonials(data);
        }
      } catch (error) {
        console.error('Error:', error);
        if (isMounted) setTestimonials([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTestimonials();
    return () => { isMounted = false; };
  }, []);

  const next = () => {
    setTestimonials((prevItems) => {
      if (prevItems.length === 0) return prevItems;
      setCurrentIndex((prev) => (prev + 1) % prevItems.length);
      return prevItems;
    });
  };

  const prev = () => {
    setTestimonials((prevItems) => {
      if (prevItems.length === 0) return prevItems;
      setCurrentIndex((prev) => (prev - 1 + prevItems.length) % prevItems.length);
      return prevItems;
    });
  };

  if (loading) return null;
  if (testimonials.length === 0) return null;

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-24 bg-guor-cream relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-guor-gold/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-guor-peach/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-4 bg-white border border-guor-gold text-guor-brown"
          >
            Voces de Confianza
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-black italic text-guor-dark"
          >
            Lo que dicen <span className="text-guor-gold not-italic">nuestros aliados</span>
          </motion.h2>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="overflow-hidden px-4 py-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="bg-white/60 backdrop-blur-xl border border-white rounded-[2.5rem] p-10 md:p-16 shadow-2xl shadow-guor-brown/5 relative"
              >
                <Quote className="absolute top-10 right-10 w-20 h-20 text-guor-peach/30 -z-10" />

                <div className="flex flex-col items-center text-center">
                  
                  {/* FIX: Fila de estrellas dinámica basada en la puntuación del backend */}
                  <div className="flex gap-1 mb-8">
                    {[1, 2, 3, 4, 5].map((starValue) => (
                      <Star 
                        key={starValue} 
                        className={`w-6 h-6 transition-colors ${
                          starValue <= (currentTestimonial?.puntuacion ?? 0)
                            ? "fill-guor-gold text-guor-gold"
                            : "fill-transparent text-guor-gold/20"
                        }`}
                      />
                    ))}
                  </div>

                  {/* FIX (react/no-unescaped-entities): Comillas dobles escapadas mediante cadenas evaluadas */}
                  <p className="text-2xl md:text-3xl font-medium leading-relaxed text-guor-dark mb-10 italic">
                    {"\""}{currentTestimonial?.comentarios}{"\""}
                  </p>

                  <div className="flex flex-col items-center">
                    <div className="w-12 h-1 bg-guor-gold mb-4 rounded-full" />
                    <h4 className="text-xl font-black text-guor-dark uppercase tracking-wider">
                      {currentTestimonial?.clientes?.nombre_comercial ?? 'Aliado Estratégico'}
                    </h4>
                    <p className="text-sm font-bold text-guor-brown mt-1">Socio Corporativo</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          {testimonials.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-12 h-12 rounded-full bg-white border border-guor-gold/20 flex items-center justify-center text-guor-dark hover:bg-guor-dark hover:text-white transition-all shadow-lg z-20"
                aria-label="Anterior"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={next}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-12 h-12 rounded-full bg-white border border-guor-gold/20 flex items-center justify-center text-guor-dark hover:bg-guor-dark hover:text-white transition-all shadow-lg z-20"
                aria-label="Siguiente"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Dots */}
          {testimonials.length > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'bg-guor-dark w-8' : 'bg-guor-gold/30'
                  }`}
                  aria-label={`Ir al testimonio ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}