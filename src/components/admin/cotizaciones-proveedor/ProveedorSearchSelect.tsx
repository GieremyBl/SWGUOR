'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { filterProveedoresByQuery } from '@/lib/helpers/proveedor-search';
import { buscarProveedoresCotizacionAction } from '@/app/admin/Panel-Administrativo/cotizaciones-proveedor/actions';
import type { ProveedorOption } from './CotizacionProveedorForm';

interface Props {
  proveedores: ProveedorOption[];
  value?: number;
  onChange: (proveedorId: number) => void;
  onCreateNew?: () => void;
  disabled?: boolean;
}

export function ProveedorSearchSelect({
  proveedores,
  value,
  onChange,
  onCreateNew,
  disabled,
}: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [remote, setRemote] = useState<ProveedorOption[]>([]);
  const [loading, setLoading] = useState(false);

  const selected = proveedores.find((p) => Number(p.id) === value)
    ?? remote.find((p) => Number(p.id) === value);

  const localFiltered = useMemo(
    () => filterProveedoresByQuery(proveedores, query, 30),
    [proveedores, query],
  );

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setRemote([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await buscarProveedoresCotizacionAction(query.trim());
        if (res.success && res.data) {
          setRemote(
            res.data.map((p) => ({
              id: p.id,
              razon_social: p.razon_social,
              ruc: p.ruc,
            })),
          );
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, open]);

  const opciones = useMemo(() => {
    const map = new Map<string, ProveedorOption>();
    [...localFiltered, ...remote].forEach((p) => map.set(String(p.id), p));
    return Array.from(map.values()).slice(0, 20);
  }, [localFiltered, remote]);

  return (
    <div className="space-y-2 relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          className="pl-9 rounded-xl"
          placeholder={
            selected
              ? `${selected.razon_social}${selected.ruc ? ` (${selected.ruc})` : ''}`
              : 'Buscar proveedor por nombre o RUC...'
          }
          value={query}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {opciones.length === 0 ? (
            <p className="p-3 text-xs text-slate-500">Sin coincidencias</p>
          ) : (
            opciones.map((p) => (
              <button
                key={String(p.id)}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b last:border-0"
                onClick={() => {
                  onChange(Number(p.id));
                  setQuery('');
                  setOpen(false);
                }}
              >
                <span className="font-medium">{p.razon_social}</span>
                {p.ruc && (
                  <span className="text-xs text-slate-400 ml-2">RUC {p.ruc}</span>
                )}
              </button>
            ))
          )}
          {onCreateNew && (
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start rounded-none text-indigo-700"
              onClick={() => {
                setOpen(false);
                onCreateNew();
              }}
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Registrar nuevo proveedor
            </Button>
          )}
        </div>
      )}

      {selected && !query && (
        <p className="text-xs text-emerald-700 font-medium">
          Seleccionado: {selected.razon_social}
        </p>
      )}
    </div>
  );
}
