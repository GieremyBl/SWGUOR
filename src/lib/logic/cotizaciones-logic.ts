import { REGLAS_NEGOCIO } from '../constants/estados';

/** MOQ general del catálogo B2B */
export function cumpleMoqCantidad(cantidadTotal: number): boolean {
  return cantidadTotal >= REGLAS_NEGOCIO.MOQ_GENERAL;
}
