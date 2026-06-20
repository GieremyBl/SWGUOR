import { z } from 'zod';
import { PAIS_DEFAULT_ENTREGA } from '@/lib/constants/direccion-entrega';

export const datosEntregaPagoSchema = z.object({
  paisCode: z.string().min(2).max(2),
  departamentoCode: z.string(),
  provinciaCode: z.string().optional(),
  distritoCode: z.string(),
  tipoVia: z.string().min(1),
  nombreVia: z.string().min(2),
  numero: z.string().optional(),
  tipoReferencia: z.string().min(1),
  referenciaDetalle: z.string().optional(),
});

export type DatosEntregaPago = z.infer<typeof datosEntregaPagoSchema>;

export const DATOS_ENTREGA_PAGO_INICIAL: DatosEntregaPago = {
  paisCode: PAIS_DEFAULT_ENTREGA,
  departamentoCode: '',
  provinciaCode: '',
  distritoCode: '',
  tipoVia: 'avenida',
  nombreVia: '',
  numero: '',
  tipoReferencia: 'sin_referencia',
  referenciaDetalle: '',
};
