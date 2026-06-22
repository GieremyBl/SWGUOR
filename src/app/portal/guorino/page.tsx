'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { GuorinoChatPanel } from '@/components/portal/guorino/GuorinoChatPanel';

export default function GuorinoPortalPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-4 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 text-white rounded-2xl shadow-lg bg-[#1a1409] shadow-[#1a1409]/20">
            <Sparkles size={24} className="text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Guorino — Chat GUOR</h1>
            <p className="text-sm text-slate-500">
              Consulte stock, cotice y genere pedidos con confirmación previa
            </p>
          </div>
        </div>
        <Link
          href="/portal/pedidos"
          className="text-xs font-semibold text-rose-600 hover:text-rose-700"
        >
          Ver mis pedidos →
        </Link>
      </div>

      <GuorinoChatPanel variant="page" showHistory />
    </div>
  );
}
