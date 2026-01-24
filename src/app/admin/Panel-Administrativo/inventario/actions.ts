'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { Database, InventarioInsert, InventarioUpdate } from '@/types/supabase.types'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { 
      cookies: { 
        getAll: () => Array.from(cookieStore.getAll()),
        // Es buena práctica añadir setAll para que las acciones puedan refrescar sesiones
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        }
      } 
    }
  )
}

export async function saveInsumo(data: any, id?: number | null) {
  const supabase = await getSupabase()

  // Definimos la tabla con su tipo explícito para evitar el error 'never'
  const tablaInventario = supabase.from('inventario')

  if (id) {
    // Caso UPDATE
    const updateData: InventarioUpdate = {
      nombre: data.nombre,
      tipo: data.tipo,
      unidad_medida: data.unidad_medida,
      stock_actual: data.stock_actual,
      stock_minimo: data.stock_minimo,
      updated_at: new Date().toISOString()
    }

    const { error } = await (tablaInventario as any)
      .update(updateData)
      .eq('id', id)

    if (error) throw new Error(error.message)
  } else {
    // Caso INSERT
    const insertData: InventarioInsert = {
      nombre: data.nombre,
      tipo: data.tipo,
      unidad_medida: data.unidad_medida,
      stock_actual: data.stock_actual,
      stock_minimo: data.stock_minimo,
      updated_at: new Date().toISOString()
      // No incluimos ID ni created_at porque son automáticos
    }

    const { error } = await (tablaInventario as any)
      .insert(insertData)

    if (error) throw new Error(error.message)
  }

  revalidatePath('/admin/Panel-Administrativo/inventario')
}

export async function deleteInsumo(id: number) {
  const supabase = await getSupabase()
  const { error } = await supabase
    .from('inventario')
    .delete()
    .eq('id', id)
  
  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/Panel-Administrativo/inventario')
}