'use client'

import { useState } from 'react'
import { Scale } from 'lucide-react'

export default function UnitConverter() {
  const [kilos, setKilos] = useState(0)
  const [rendimiento, setRendimiento] = useState(0)

  const totalMetros = (kilos * rendimiento).toFixed(2)

  return (
    <div className="bg-linear-to-br from-gray-900 to-gray-800 p-6 rounded-3xl text-white shadow-xl">
      <div className="flex items-center gap-2 mb-4 text-red-400">
        <Scale className="w-5 h-5" />
        <h3 className="text-xs font-black uppercase tracking-widest">Calculadora de Rendimiento</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="text-[10px] text-gray-400 uppercase font-bold">Peso en Kilos (Rollo)</label>
          <input 
            type="number" 
            value={kilos} 
            onChange={(e) => setKilos(Number(e.target.value))}
            className="w-full bg-gray-700/50 border-none rounded-xl mt-1 text-xl font-bold focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 uppercase font-bold">Rendimiento (Metros por Kilo)</label>
          <input 
            type="number" 
            value={rendimiento} 
            onChange={(e) => setRendimiento(Number(e.target.value))}
            className="w-full bg-gray-700/50 border-none rounded-xl mt-1 text-xl font-bold focus:ring-2 focus:ring-red-500"
          />
        </div>
        
        <div className="pt-4 border-t border-gray-700 flex justify-between items-end">
          <span className="text-xs text-gray-400 uppercase font-bold">Total Disponible:</span>
          <span className="text-3xl font-black text-red-500">{totalMetros} <small className="text-xs text-white">m</small></span>
        </div>
      </div>
    </div>
  )
}