'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { GuorinoChatPanel, GuorinoIcon } from '@/components/portal/guorino/GuorinoChatPanel';
import { cn } from '@/lib/utils';

const WAIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
  </svg>
);

const WHATSAPP_URL =
  'https://api.whatsapp.com/send?phone=%2B51912768800&token=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEyNSJ9.eyJleHAiOjE3NzczMTMwMjcsInBob25lIjoiKzUxOTEyNzY4ODAwIiwiY29udGV4dCI6IkFmaGtDWEhOOHUxSjRvZUt4MHliWGt2VnowejVmamZjZ1lLSW1VdWc0MnRhbC1ySnFVcW5aUWRaMmlfdUFrYU9ueW9QMFRtU19WZndJNkxZa2lEeVgwdUdLX0pha3dPQ0h1N3d1emQzNm9QT2Vxa3ZJR2wtbjJGYkRCVzA1MkpKeHhveHZORXJQNTNQRzhVWjl3aFFGdHhXd3ciLCJzb3VyY2UiOiJGUF9QYWdlIiwiYXBwIjoiZmFjZWJvb2siLCJlbnRyeV9wb2ludCI6InBhZ2VfY3RhIn0._0PaoUIvwZcBsIQR0jvdQ_i5KnVOkl9s95SY0iPkGbMDe4rVwn4vZVh1Gv69NmHUuqxGLEhJ-bzADO_WHeCeUw';

export function AsistenteIA() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-0 z-[9999] group flex flex-col items-end pl-10">
      <div
        className={cn(
          'flex flex-col items-end gap-3 pr-4 transition-all duration-300 ease-out',
          isOpen
            ? 'translate-x-0 opacity-100'
            : 'translate-x-[38px] opacity-60 group-hover:translate-x-0 group-hover:opacity-100',
        )}
      >
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: '#25D366', border: '3px solid #fff' }}
          className="w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
          title="Contactar por WhatsApp"
        >
          <WAIcon />
        </a>

        {isOpen && (
          <div className="absolute bottom-[76px] right-4 animate-in fade-in slide-in-from-bottom-8 duration-300">
            <GuorinoChatPanel variant="widget" onClose={() => setIsOpen(false)} showHistory />
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center transition-all active:scale-90 hover:scale-105 w-[60px] h-[60px] rounded-full border-[3px] border-white shadow-lg cursor-pointer"
          style={{
            background: isOpen ? '#fff' : '#1a1409',
            boxShadow: '0 4px 20px rgba(26,20,9,0.25)',
          }}
          title={isOpen ? 'Cerrar asistente' : 'Abrir Guorino — Asesor GUOR'}
        >
          {isOpen ? <X size={26} color="#1a1409" /> : <GuorinoIcon size={26} />}
        </button>
      </div>
    </div>
  );
}
