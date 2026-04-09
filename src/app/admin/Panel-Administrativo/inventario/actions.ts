'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type Insumo = Database['public']['Tables']['insumo']['Row'];
type InsumoInsert = Database['public']['Tables']['insumo']['Insert'];
type InsumoUpdate = Database['public']['Tables']['insumo']['Update'];

async function getSupabase() {
  const cookieStore = await cookies()
  // Mantenemos Database aquí para el autocompletado general
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { 
      cookies: { 
        getAll: () => Array.from(cookieStore.getAll()),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        }
      } 
    }
  )
}

export async function saveInsumo(data: any, id?: number | null) {
  const supabase = await getSupabase()

  // Preparamos los datos exactamente como los espera el SQL
  const insumoData = {
    nombre: data.nombre,
    tipo: data.tipo,
    unidad_medida: data.unidad_medida,
    stock_actual: Number(data.stock_actual),
    stock_minimo: Number(data.stock_minimo),
    precio_unitario: data.precio_unitario ? Number(data.precio_unitario) : null,
    proveedor: data.proveedor || null,
  }

  if (id) {

    const { error } = await (supabase.from('insumo') as any)
      .update(insumoData)
      .eq('id', id)

    if (error) throw new Error(error.message)
  } else {
    const { error } = await (supabase.from('insumo') as any)
      .insert([insumoData])

    if (error) throw new Error(error.message)
  }

  revalidatePath('/admin/Panel-Administrativo/inventario')
}

export async function deleteInsumo(id: number) {
  const supabase = await getSupabase()
  
  const { error } = await (supabase.from('insumo') as any)
    .delete()
    .eq('id', id)
  
  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/Panel-Administrativo/inventario')
}