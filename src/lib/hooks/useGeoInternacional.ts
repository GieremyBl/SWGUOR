'use client';

import { useEffect, useState } from 'react';
import type { GeoOption } from '@/lib/helpers/geo-internacional.helper';

async function fetchGeo<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'force-cache' });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? 'No se pudo cargar ubicaciones');
  }
  return json as T;
}

export function useGeoInternacional(paisCode?: string, estadoCode?: string) {
  const [paises, setPaises] = useState<GeoOption[]>([]);
  const [estados, setEstados] = useState<GeoOption[]>([]);
  const [ciudades, setCiudades] = useState<GeoOption[]>([]);
  const [tieneEstados, setTieneEstados] = useState(true);

  const [cargandoPaises, setCargandoPaises] = useState(true);
  const [cargandoEstados, setCargandoEstados] = useState(false);
  const [cargandoCiudades, setCargandoCiudades] = useState(false);

  useEffect(() => {
    setCargandoPaises(true);
    fetchGeo<{ data: GeoOption[] }>('/api/geo/countries')
      .then((json) => setPaises(json.data))
      .catch(() => setPaises([]))
      .finally(() => setCargandoPaises(false));
  }, []);

  useEffect(() => {
    if (!paisCode || paisCode === 'PE') {
      setEstados([]);
      setCiudades([]);
      setTieneEstados(true);
      return;
    }

    setCargandoEstados(true);
    fetchGeo<{ data: GeoOption[] }>(`/api/geo/states?country=${paisCode}`)
      .then((json) => {
        setEstados(json.data);
        setTieneEstados(json.data.length > 0);
      })
      .catch(() => {
        setEstados([]);
        setTieneEstados(false);
      })
      .finally(() => setCargandoEstados(false));
  }, [paisCode]);

  useEffect(() => {
    if (!paisCode || paisCode === 'PE') {
      setCiudades([]);
      return;
    }

    if (tieneEstados && !estadoCode) {
      setCiudades([]);
      return;
    }

    setCargandoCiudades(true);
    const query = tieneEstados
      ? `country=${paisCode}&state=${estadoCode}`
      : `country=${paisCode}`;

    fetchGeo<{ data: GeoOption[] }>(`/api/geo/cities?${query}`)
      .then((json) => setCiudades(json.data))
      .catch(() => setCiudades([]))
      .finally(() => setCargandoCiudades(false));
  }, [paisCode, estadoCode, tieneEstados]);

  return {
    paises,
    estados,
    ciudades,
    tieneEstados,
    cargandoPaises,
    cargandoEstados,
    cargandoCiudades,
  };
}
