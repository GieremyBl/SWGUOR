'use client';

import { useEffect, useState } from 'react';
import type { UbigeoOption } from '@/lib/helpers/peru-ubigeo.helper';

async function fetchUbigeo(
  tipo: 'departamentos' | 'provincias' | 'distritos',
  codigo?: string,
): Promise<UbigeoOption[]> {
  const params = new URLSearchParams({ tipo });
  if (codigo) params.set('codigo', codigo);

  const res = await fetch(`/api/ubigeo?${params.toString()}`, { cache: 'force-cache' });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error ?? 'No se pudo cargar ubigeo');
  }

  return (json.data ?? []) as UbigeoOption[];
}

export function usePeruUbigeo(departamentoCode?: string, provinciaCode?: string) {
  const [departamentos, setDepartamentos] = useState<UbigeoOption[]>([]);
  const [provincias, setProvincias] = useState<UbigeoOption[]>([]);
  const [distritos, setDistritos] = useState<UbigeoOption[]>([]);
  const [cargandoDepartamentos, setCargandoDepartamentos] = useState(true);
  const [cargandoProvincias, setCargandoProvincias] = useState(false);
  const [cargandoDistritos, setCargandoDistritos] = useState(false);

  useEffect(() => {
    setCargandoDepartamentos(true);
    fetchUbigeo('departamentos')
      .then(setDepartamentos)
      .catch(() => setDepartamentos([]))
      .finally(() => setCargandoDepartamentos(false));
  }, []);

  useEffect(() => {
    if (!departamentoCode) {
      setProvincias([]);
      return;
    }

    setCargandoProvincias(true);
    fetchUbigeo('provincias', departamentoCode)
      .then(setProvincias)
      .catch(() => setProvincias([]))
      .finally(() => setCargandoProvincias(false));
  }, [departamentoCode]);

  useEffect(() => {
    if (!provinciaCode) {
      setDistritos([]);
      return;
    }

    setCargandoDistritos(true);
    fetchUbigeo('distritos', provinciaCode)
      .then(setDistritos)
      .catch(() => setDistritos([]))
      .finally(() => setCargandoDistritos(false));
  }, [provinciaCode]);

  return {
    departamentos,
    provincias,
    distritos,
    cargandoDepartamentos,
    cargandoProvincias,
    cargandoDistritos,
  };
}
