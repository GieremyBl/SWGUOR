import { z } from 'zod';

export const reporteAnaliticaFinancieraQuerySchema = z.object({
  moneda: z.enum(['todos', 'PEN', 'USD']).default('todos'),
});

export type ReporteAnaliticaFinancieraQuery = z.infer<
  typeof reporteAnaliticaFinancieraQuerySchema
>;

export interface AnaliticaFinancieraKpis {
  ingresos_totales: number;
  monto_recaudado: number;
  saldo_pendiente: number;
  porcentaje_morosidad: number;
}

export interface AnaliticaFinancieraTendenciaMes {
  mes: string;
  ventas: number;
  pagos: number;
}

export interface AnaliticaFinancieraDeudor {
  cliente_id: number;
  razon_social: string;
  ruc: string | null;
  moneda: string;
  deuda_total: number;
  pedidos_con_deuda: number;
}

export interface ReporteAnaliticaFinancieraResponse {
  success: true;
  moneda: 'todos' | 'PEN' | 'USD';
  kpis: AnaliticaFinancieraKpis;
  tendencia: AnaliticaFinancieraTendenciaMes[];
  top_deudores: AnaliticaFinancieraDeudor[];
}
