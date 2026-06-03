import { z } from "zod";

export const TIPO_CLIENTE   = ["corporativo", "minorista", "distribuidor"] as const;
export const ESTADO_CLIENTE = ["activo", "inactivo", "suspendido", "potencial"] as const;

export const clienteSchema = z.object({
  ruc:              z.string().regex(/^\d{11}$/, "RUC debe tener 11 dígitos"),
  razon_social:     z.string().min(3, "Razón social requerida").optional(),
  nombre_comercial: z.string().optional(),
  telefono:         z.string().optional(),
  email:            z.string().email("Email inválido").optional().or(z.literal("")),
  direccion_fiscal: z.string().optional(),
  tipo_cliente:     z.enum(TIPO_CLIENTE).default("corporativo"),
  activo:           z.enum(ESTADO_CLIENTE).default("activo"),
});

// Schema extendido para el formulario de creación (incluye dirección opcional)
export const createClienteSchema = clienteSchema.extend({
  nombre_comercial:       z.string().optional(),
  crear_direccion:        z.boolean().optional(),
  direccion_alias:        z.string().optional(),
  direccion_direccion:    z.string().optional(),
  direccion_ciudad:       z.string().optional(),
  direccion_departamento: z.string().optional(),
});

export type ClienteFormValues  = z.infer<typeof clienteSchema>;
export type CreateClienteInput = z.infer<typeof createClienteSchema>;

export const TIPO_CLIENTE_LABELS: Record<typeof TIPO_CLIENTE[number], string> = {
  corporativo:  "Corporativo",
  minorista:    "Minorista",
  distribuidor: "Distribuidor",
};

export const ESTADO_CLIENTE_LABELS: Record<typeof ESTADO_CLIENTE[number], string> = {
  activo:     "Activo",
  inactivo:   "Inactivo",
  suspendido: "Suspendido",
  potencial:  "Potencial",
};

export interface ApiResponse<T = unknown> {
  success:  boolean;
  data?:    T;
  error?:   string;
  message?: string;
}