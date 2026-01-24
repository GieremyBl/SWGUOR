'use client'

import { useState } from 'react'
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, History } from 'lucide-react'

// Definición local por si aún no tienes la tabla en Supabase
interface Movimiento {
  id: number
  fecha: string
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE'
  cantidad: number
  motivo: string
  usuario: string
  insumo_nombre: string
}

export default function MovementHistory({ movimientos }: { movimientos: Movimiento[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-400" />
          <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Últimos Movimientos</h3>
        </div>
      </div>
      <div className="divide-y divide-gray-50 max-h-100 overflow-y-auto">
        {movimientos.map((m) => (
          <div key={m.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                m.tipo === 'ENTRADA' ? 'bg-green-100 text-green-600' : 
                m.tipo === 'SALIDA' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
              }`}>
                {m.tipo === 'ENTRADA' ? <ArrowDownLeft className="w-4 h-4" /> : 
                 m.tipo === 'SALIDA' ? <ArrowUpRight className="w-4 h-4" /> : <RefreshCcw className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{m.insumo_nombre}</p>
                <p className="text-xs text-gray-500">{m.motivo} • {m.usuario}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-black ${
                m.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'
              }`}>
                {m.tipo === 'ENTRADA' ? '+' : '-'}{m.cantidad}
              </p>
              <p className="text-[10px] text-gray-400 uppercase font-medium">{new Date(m.fecha).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}