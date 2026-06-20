import { z } from 'zod';

export const reporteConversionComercialQuerySchema = z.object({}).default({});

export type ReporteConversionComercialQuery = z.infer<
  typeof reporteConversionComercialQuerySchema
>;

export interface ConversionEmbudoEtapa {
  key: string;
  label: string;
  total: number;
  porcentaje: number;
}

export interface ConversionTasaCierreMes {
  mes: string;
  creadas: number;
  convertidas: number;
  tasa_cierre_pct: number;
}

export interface ConversionTopCliente {
  cliente_id: number;
  razon_social: string;
  ruc: string | null;
  total_facturado: number;
  pedidos_count: number;
  moneda: string;
}

export interface ConversionMotivoPerdida {
  motivo: string;
  label: string;
  total: number;
  porcentaje: number;
}

export interface ReporteConversionComercialResponse {
  success: true;
  embudo: ConversionEmbudoEtapa[];
  tasa_cierre_mensual: ConversionTasaCierreMes[];
  tasa_cierre_global_pct: number;
  top_clientes: ConversionTopCliente[];
  analisis_perdida: ConversionMotivoPerdida[];
}
