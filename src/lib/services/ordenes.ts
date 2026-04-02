// src/services/ordenes.service.ts
import { supabase } from '@/lib/supabase/client';
import { OrdenesHelper } from '@/lib/helpers/ordenes-helpers';

export const OrdenesService = {
  /**
   * Crea una orden de fabricación y registra sus productos
   */
  crearOrdenDeProduccion: async (datosForm: any, productos: any[]) => {
    try {
      // 1. Calculamos el total
      const total = OrdenesHelper.calcularTotalVenta(productos);
      
      // 2. Preparamos el objeto según el esquema de la tabla public.ordenes
      const insertData = OrdenesHelper.prepararParaInsertar(datosForm, total);

      // 3. Insertar en Supabase
      const { data: orden, error: errorOrden } = await supabase
        .from('ordenes')
        .insert([insertData])
        .select()
        .single();

      if (errorOrden) throw errorOrden;

      // 4. (Opcional) Si tienes una tabla de items de fabricación, regístralos aquí
      // usando orden.id (que será el bigint generado)

      return { success: true, data: orden };
    } catch (error: any) {
      console.error("Error en Producción:", error.message);
      return { success: false, error: error.message };
    }
  }
};