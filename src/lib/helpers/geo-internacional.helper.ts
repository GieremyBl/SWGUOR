import { City, Country, State } from 'country-state-city';

export interface GeoOption {
  code: string;
  name: string;
}

export function listarPaisesMundo(): GeoOption[] {
  return Country.getAllCountries()
    .map((pais) => ({
      code: pais.isoCode,
      name: pais.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function listarEstadosPorPais(paisCode: string): GeoOption[] {
  if (!paisCode) return [];

  return State.getStatesOfCountry(paisCode)
    .map((estado) => ({
      code: estado.isoCode,
      name: estado.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function listarCiudadesPorEstado(
  paisCode: string,
  estadoCode: string,
): GeoOption[] {
  if (!paisCode || !estadoCode) return [];

  return (City.getCitiesOfState(paisCode, estadoCode) ?? [])
    .map((ciudad) => ({
      code: `${ciudad.name}::${ciudad.latitude ?? ''}::${ciudad.longitude ?? ''}`,
      name: ciudad.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function listarCiudadesPorPais(paisCode: string): GeoOption[] {
  if (!paisCode) return [];

  return (City.getCitiesOfCountry(paisCode) ?? [])
    .map((ciudad) => ({
      code: `${ciudad.name}::${ciudad.stateCode ?? ''}::${ciudad.latitude ?? ''}`,
      name: ciudad.stateCode ? `${ciudad.name} (${ciudad.stateCode})` : ciudad.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function resolverNombrePais(paisCode: string): string {
  return Country.getCountryByCode(paisCode)?.name ?? paisCode;
}

export function resolverNombreEstado(paisCode: string, estadoCode: string): string {
  return State.getStateByCodeAndCountry(estadoCode, paisCode)?.name ?? estadoCode;
}
