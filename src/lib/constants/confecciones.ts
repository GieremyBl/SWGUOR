import type { RolUsuario } from '@/lib/constants/roles';

export const CONFECCIONES_ADMIN_API = '/api/admin/confecciones';

export const CONFECCIONES_ROLES_VER: RolUsuario[] = [
  'administrador',
  'gerente',
  'representante_taller',
  'almacenero',
  'ayudante',
];

export const CONFECCIONES_ROLES_ESCRITURA: RolUsuario[] = [
  'administrador',
  'gerente',
  'representante_taller',
];
