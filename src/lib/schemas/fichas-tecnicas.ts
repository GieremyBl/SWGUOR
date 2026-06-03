import { z } from "zod";

export const ESTADO_FICHA = [
  "borrador",
  "en_revision",
  "aprobada",
  "obsoleta",
] as const;

export const fichaTecnicaSchema = z.object({
  producto_id:           z.number().min(1, "Producto requerido"),
  version:               z.string().default("1.0"),
  descripcion_detallada: z.string().optional(),
  sam_total:             z.number().min(0).optional(),
  costo_estimado:        z.number().min(0).optional(),
  ficha_url:             z.string().url().optional().or(z.literal("")),
  imagen_geometral:      z.string().url().optional().or(z.literal("")),
  estado:                z.enum(ESTADO_FICHA).default("borrador"),
});

export type FichaTecnicaFormValues = z.infer<typeof fichaTecnicaSchema>;

export const fichaMedidaSchema = z.object({
  ficha_id:    z.number().min(1),
  punto_medida: z.string().min(1, "Punto de medida requerido"),
  talla:       z.string().min(1, "Talla requerida"),
  valor_cm:    z.number().min(0).optional(),
  tolerancia:  z.number().min(0).optional(),
});

export type FichaMedidaFormValues = z.infer<typeof fichaMedidaSchema>;

export const ESTADO_FICHA_LABELS: Record<typeof ESTADO_FICHA[number], string> = {
  borrador:   "Borrador",
  en_revision: "En Revisión",
  aprobada:   "Aprobada",
  obsoleta:   "Obsoleta",
};

export interface Medida {
  id?:          string;
  punto_medida: string;
  talla:        string;
  valor_cm:     number | null;
  tolerancia:   number | null;
}

export interface FichaTecnica {
  id:                    string;
  id_producto:           string;
  version:               string;
  descripcion_detallada: string | null;
  sam_total:             number | null;
  costo_estimado:        number | null;
  ficha_url:             string | null;
  imagen_geometral:      string | null;
  estado:                typeof ESTADO_FICHA[number];
  medidas:               Medida[];
  created_at:            string;
}

export interface ApiResponse<T = unknown> {
  success:  boolean;
  data?:    T;
  error?:   string;
  message?: string;
}