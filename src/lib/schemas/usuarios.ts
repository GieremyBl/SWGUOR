import { z } from "zod";

export const ROL_USUARIO = [
  "gerente",
  "administrador",
  "almacenero",
  "recepcionista",
  "disenador",
  "cortador",
  "ayudante",
  "representante_taller",
  "cliente",
] as const;

export const ESTADO_USUARIO = ["activo", "inactivo", "suspendido"] as const;

export const CARGO_PERSONAL = ROL_USUARIO;

export const usuarioSchema = z.object({
  email:  z.string().email("Email inválido"),
  rol:    z.enum(ROL_USUARIO),
  estado: z.enum(ESTADO_USUARIO).default("activo"),
});

export const personalInternoSchema = z.object({
  dni:             z.string().regex(/^\d{8}$/, "El DNI debe tener exactamente 8 dígitos"),
  nombre_completo: z.string().min(3, "Nombre requerido"),
  cargo:           z.enum(CARGO_PERSONAL),
  telefono:        z.string().regex(/^\d+$/, "Teléfono inválido").optional(),
  fecha_ingreso:   z.string().optional(),
  estado:          z.boolean().default(true),
});

export const usuarioCompletoSchema = usuarioSchema.merge(
  z.object({ personal: personalInternoSchema.optional() })
);

export type UsuarioFormValues       = z.infer<typeof usuarioSchema>;
export type PersonalInternoValues   = z.infer<typeof personalInternoSchema>;
export type UsuarioCompletoValues   = z.infer<typeof usuarioCompletoSchema>;

export const ROL_LABELS: Record<typeof ROL_USUARIO[number], string> = {
  gerente:              "Gerente General",
  administrador:        "Administrador",
  almacenero:           "Almacenero",
  recepcionista:        "Recepcionista",
  disenador:            "Diseñador",
  cortador:             "Cortador",
  ayudante:             "Ayudante",
  representante_taller: "Representante de Taller",
  cliente:              "Cliente",
};

export const ESTADO_USUARIO_LABELS: Record<typeof ESTADO_USUARIO[number], string> = {
  activo:     "Activo",
  inactivo:   "Inactivo",
  suspendido: "Suspendido",
};

export interface ApiResponse<T = unknown> {
  success:  boolean;
  data?:    T;
  error?:   string;
  message?: string;
}