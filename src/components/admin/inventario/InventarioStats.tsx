'use client'

import { Inventario } from '@/types/supabase.types'
import { AlertTriangle, Package, BarChart3 } from 'lucide-react'

interface Props {
  data: Inventario[]
}

export default function InventoryStats({ data }: Props) {
  const totalItems = data.length
  const stockBajo = data.filter(item => item.stock_actual <= item.stock_minimo).length
  const tiposDiferentes = new Set(data.map(item => item.tipo)).size

  // Tarjetas informativas
  const stats = [
    {
      name: 'Total Insumos',
      value: totalItems,
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      name: 'Stock Crítico',
      value: stockBajo,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-100',
      alert: stockBajo > 0
    },
    {
      name: 'Categorías',
      value: tiposDiferentes,
      icon: BarChart3,
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {stats.map((stat) => (
        <div key={stat.name} className={`p-6 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center space-x-4 ${stat.alert ? 'ring-2 ring-red-500 animate-pulse' : ''}`}>
          <div className={`p-3 rounded-xl ${stat.bg}`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.name}</p>
            <p className="text-2xl font-black text-gray-900">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}