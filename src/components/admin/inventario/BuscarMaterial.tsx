'use client'

import { Search } from 'lucide-react'

export default function MaterialSearch({ onSearch }: { onSearch: (term: string) => void }) {
  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
      </div>
      <input
        type="text"
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Buscar tela, hilos, cierres o avíos..."
        className="block w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl leading-5 
                   placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-red-500 
                   sm:text-sm transition-all shadow-sm hover:shadow-md"
      />
      <div className="absolute inset-y-0 right-4 flex items-center text-[10px] font-bold text-gray-300 tracking-widest uppercase">
        Presiona Enter
      </div>
    </div>
  )
}