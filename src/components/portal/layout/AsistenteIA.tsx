'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, X, ArrowRight } from 'lucide-react';
import { usePortal } from '@/lib/hooks/usePortal';
import { cn } from '@/lib/utils';

type ChatMessage = { role: 'user' | 'bot'; content: string };

const MENSAJE_INICIAL: ChatMessage = {
  role: 'bot',
  content: 'Bienvenido a GUOR. Soy Nexus, su asesor comercial. Puedo ayudarle con cotizaciones, consultas de stock y escalas de precios. ¿En qué puedo asistirle hoy?',
};

const PREGUNTAS_FRECUENTES = [
  { label: 'Descuentos por volumen', prompt: '¿Cuáles son las escalas de descuentos por volumen de compra?' },
  { label: 'Stock disponible', prompt: '¿Tienen disponibilidad de los modelos de temporada actual?' },
  { label: 'Plazos de entrega', prompt: '¿Cuál es el tiempo estimado de entrega para Lima y provincias?' },
  { label: 'Estado de mis cotizaciones', prompt: 'Deseo saber el estado de mis últimas cotizaciones.' },
];

const NexusIcon = ({ size = 18, color = '#D4AF37' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L15 8.5L22 9.3L17 14L18.5 21L12 17.5L5.5 21L7 14L2 9.3L9 8.5Z" />
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <line x1="22" y1="2" x2="11" y2="13" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" fill="#D4AF37" />
  </svg>
);

const WAIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
  </svg>
);

export function AsistenteIA() {
  const { cliente } = usePortal();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([MENSAJE_INICIAL]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat, loading]);

  const enviarMensaje = async (texto: string) => {
    const textoTrimmed = texto.trim();
    if (!textoTrimmed || loading) return;

    const nuevoChat: ChatMessage[] = [...chat, { role: 'user', content: textoTrimmed }];
    setChat(nuevoChat);
    setMensaje('');
    setLoading(true);

    try {
      const historialParaAPI = nuevoChat
        .slice(1)
        .map(m => ({ role: m.role === 'user' ? 'user' : 'model', content: m.content }));

      const res = await fetch('/api/portal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historialParaAPI, cliente_id: cliente?.id }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setChat(prev => [...prev, { role: 'bot', content: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.' }]);
          return;
        }
        throw new Error(errData.error || `Error ${res.status}`);
      }

      const data = await res.json();
      if (!data.text) throw new Error('Respuesta vacía');
      setChat(prev => [...prev, { role: 'bot', content: data.text }]);
    } catch {
      setChat(prev => [...prev, { role: 'bot', content: 'No pude procesar su consulta. Por favor, intente nuevamente.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje(mensaje); }
  };

  return (
    <>
      {/* ZONA ACTIVA DE HOVER (Contenedor principal):
        Detecta el mouse cuando se aproxima a la esquina inferior derecha.
      */}
      <div className="fixed bottom-8 right-0 z-[9999] group flex flex-col items-end pl-10">

        {/* Subcontenedor de globos:
          - En reposo: `translate-x-[38px]` (se asoman sutilmente por el borde) y opacidad reducida.
          - En hover o chat abierto: se despliegan al 100% de manera orgánica.
        */}
        <div
          className={cn(
            "flex flex-col items-end gap-3 pr-4 transition-all duration-300 ease-out",
            isOpen ? "translate-x-0 opacity-100" : "translate-x-[38px] opacity-60 group-hover:translate-x-0 group-hover:opacity-100"
          )}
        >
          {/* Botón WhatsApp */}
          <a
            href="https://api.whatsapp.com/send?phone=%2B51912768800&token=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEyNSJ9.eyJleHAiOjE3NzczMTMwMjcsInBob25lIjoiKzUxOTEyNzY4ODAwIiwiY29udGV4dCI6IkFmaGtDWEhOOHUxSjRvZUt4MHliWGt2VnowejVmamZjZ1lLSW1VdWc0MnRhbC1ySnFVcW5aUWRaMmlfdUFrYU9ueW9QMFRtU19WZndJNkxZa2lEeVgwdUdLX0pha3dPQ0h1N3d1emQzNm9QT2Vxa3ZJR2wtbjJGYkRCVzA1MkpKeHhveHZORXJQNTNQRzhVWjl3aFFGdHhXd3ciLCJzb3VyY2UiOiJGUF9QYWdlIiwiYXBwIjoiZmFjZWJvb2siLCJlbnRyeV9wb2ludCI6InBhZ2VfY3RhIn0._0PaoUIvwZcBsIQR0jvdQ_i5KnVOkl9s95SY0iPkGbMDe4rVwn4vZVh1Gv69NmHUuqxGLEhJ-bzADO_WHeCeUw&fbclid=IwY2xjawRbMzJleHRuA2FlbQIxMABicmlkETFwMnFGOEhhWEdRTXh1ZjFTc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHkM4VrxhBD8aEH3bMA8o7Mn0JTXIfFbT_C9y9kKtmRfG4vgHo3R5ouFK6c3Z_aem_JhBPXQh3IOYgFOQkiK943w"
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: '#25D366', border: '3px solid #fff' }}
            className="w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            title="Contactar por WhatsApp"
          >
            <WAIcon />
          </a>

          {/* Ventana del Chat */}
          {isOpen && (
            <div
              className="absolute bottom-[76px] right-4 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300"
              style={{
                width: 360, height: 560,
                borderRadius: 28,
                border: '0.5px solid #e2ddd5',
                background: '#fff',
                boxShadow: '0 8px 40px rgba(26,20,9,0.13)',
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 shrink-0" style={{ background: '#1a1409' }}>
                <div className="flex items-center justify-center shrink-0"
                  style={{ width: 40, height: 40, borderRadius: '50%', background: '#2c2010', border: '1.5px solid #D4AF37' }}>
                  <NexusIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
                    Guorino — Asesor GUOR
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                    <span style={{ fontSize: 10, color: '#D4AF37', fontWeight: 500 }}>En línea · Responde al instante</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center transition-opacity hover:opacity-60"
                  style={{ width: 30, height: 30, borderRadius: '50%', background: '#2c2010', border: 'none', cursor: 'pointer' }}
                >
                  <X size={14} color="#a89060" />
                </button>
              </div>

              {/* Cuerpo del Chat */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col gap-3 p-4" style={{ background: '#faf9f7' }}>
                {chat.map((m, i) => (
                  <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div
                      className="text-[12.5px] leading-relaxed whitespace-pre-wrap"
                      style={{
                        maxWidth: '83%',
                        padding: '11px 15px',
                        borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: m.role === 'user' ? '#1a1409' : '#fff',
                        color: m.role === 'user' ? '#f5e6c0' : '#2c2010',
                        border: m.role === 'user' ? 'none' : '0.5px solid #e8e3da',
                      }}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {chat.length === 1 && (
                  <div className="flex flex-col gap-1.5 mt-1">
                    <p style={{ fontSize: 9, fontWeight: 700, color: '#a89060', letterSpacing: '0.08em', textTransform: 'uppercase', paddingLeft: 2 }}>
                      Consultas frecuentes
                    </p>
                    {PREGUNTAS_FRECUENTES.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => enviarMensaje(q.prompt)}
                        disabled={loading}
                        className="flex items-center justify-between w-full text-left transition-all disabled:opacity-50"
                        style={{ padding: '9px 13px', borderRadius: 10, background: '#fff', border: '0.5px solid #ddd8ce', fontSize: 11.5, color: '#5a4a2a', fontWeight: 500, cursor: 'pointer' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#D4AF37'; (e.currentTarget as HTMLElement).style.color = '#1a1409'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#ddd8ce'; (e.currentTarget as HTMLElement).style.color = '#5a4a2a'; }}
                      >
                        {q.label}
                        <ArrowRight size={13} color="#D4AF37" />
                      </button>
                    ))}
                  </div>
                )}

                {loading && (
                  <div className="flex items-center gap-2" style={{ color: '#a89060', fontSize: 11 }}>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Nexus está escribiendo…</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 px-3 py-3 shrink-0" style={{ background: '#fff', borderTop: '0.5px solid #ede8e0' }}>
                <input
                  value={mensaje}
                  onChange={e => setMensaje(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  placeholder="Escriba su consulta…"
                  className="flex-1 outline-none disabled:opacity-60"
                  style={{ background: '#f5f2ed', border: '0.5px solid #e2ddd5', borderRadius: 22, padding: '10px 16px', fontSize: 12, color: '#2c2010' }}
                />
                <button
                  onClick={() => enviarMensaje(mensaje)}
                  disabled={loading || !mensaje.trim()}
                  className="flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                  style={{ width: 38, height: 38, borderRadius: '50%', background: '#1a1409', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                >
                  {loading ? <Loader2 size={16} color="#D4AF37" className="animate-spin" /> : <SendIcon />}
                </button>
              </div>
            </div>
          )}

          {/* FAB principal — Nexus */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-center transition-all active:scale-90 hover:scale-105"
            style={{
              width: 60, height: 60,
              borderRadius: '50%',
              background: isOpen ? '#fff' : '#1a1409',
              border: '3px solid #fff',
              boxShadow: '0 4px 20px rgba(26,20,9,0.25)',
              cursor: 'pointer',
            }}
            title={isOpen ? 'Cerrar asistente' : 'Abrir Nexus — Asesor GUOR'}
          >
            {isOpen ? <X size={26} color="#1a1409" /> : <NexusIcon size={26} />}
          </button>
        </div>
      </div>
    </>
  );
}