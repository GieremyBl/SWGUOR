import { ubigeoINEI, type IUbigeo } from 'peru-utils';

export interface UbigeoOption {
  code: string;
  name: string;
}

function toOption(u: IUbigeo): UbigeoOption {
  return { code: u.code, name: u.name };
}

function isDefined(u: IUbigeo | undefined): u is IUbigeo {
  return u !== undefined;
}

export function listarDepartamentosPeru(): UbigeoOption[] {
  return ubigeoINEI.getDepartments().map(toOption);
}

export function listarProvinciasPeru(departamentoCode: string): UbigeoOption[] {
  if (!departamentoCode) return [];
  return (ubigeoINEI.getProvince(departamentoCode) ?? [])
    .filter(isDefined)
    .map(toOption);
}

export function listarDistritosPeru(provinciaCode: string): UbigeoOption[] {
  if (!provinciaCode) return [];
  return (ubigeoINEI.getDistrict(provinciaCode) ?? [])
    .filter(isDefined)
    .map(toOption);
}

export function buscarCodigoPorNombre(
  opciones: UbigeoOption[],
  nombre: string,
): string | undefined {
  const objetivo = normalizarUbigeoTexto(nombre);
  if (!objetivo) return undefined;
  return opciones.find((o) => normalizarUbigeoTexto(o.name) === objetivo)?.code;
}

export function normalizarUbigeoTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}