// src/services/ordenes.service.ts
import { supabase } from '@/lib/supabase/client';
import { calcularTotalVenta, crearOrden } from '@/lib/helpers/ordenes-helpers';

export const OrdenesService = {
  /**
   * Crea una orden de fabricación y registra sus productos
   */
  crearOrdenDeProduccion: async (datosForm: any, productos: any[]) => {
    try {
      // 1. Calculamos el total
      const total = calcularTotalVenta(productos);
      
      // 2. Preparamos el objeto según el esquema de la tabla public.ordenes
      const insertData = {...datosForm,
        total_venta: total,
        created_at: new Date().toISOString(),
      };

      // 3. Insertar en Supabase
      const { data: orden, error } = await crearOrden(insertData);

      if (error) throw new Error(error);

      return { success: true, data: orden };
    } catch (error: any) {
      console.error("Error en Producción:", error.message);
      return { success: false, error: error.message };
    }
  }
};