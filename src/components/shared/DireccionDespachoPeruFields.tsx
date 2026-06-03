'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePeruUbigeo } from '@/lib/hooks/usePeruUbigeo';
import {
  componerDireccionDespachoPeru,
  esDireccionDespachoPeruValida,
  parsearDireccionDespachoPeru,
  validarPartesDireccionDespachoPeru,
} from '@/lib/helpers/direccion-despacho-peru.helper';
import { buscarCodigoPorNombre } from '@/lib/helpers/peru-ubigeo.helper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DireccionDespachoPeruFieldsProps {
  value: string;
  onChange: (value: string) => void;
  onValidityChange?: (valid: boolean) => void;
  disabled?: boolean;
  className?: string;
  /** Estilos compactos para modales portal. */
  variant?: 'default' | 'portal' | 'admin';
  showPreview?: boolean;
}

interface UbigeoSelectProps {
  label: string;
  placeholder: string;
  value: string;
  options: { code: string; name: string }[];
  disabled?: boolean;
  loading?: boolean;
  onChange: (code: string) => void;
  triggerClassName?: string;
}

function UbigeoSelect({
  label,
  placeholder,
  value,
  options,
  disabled,
  loading,
  onChange,
  triggerClassName,
}: UbigeoSelectProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
        {label}
      </label>
      <Select value={value || undefined} onValueChange={onChange} disabled={disabled || loading}>
        <SelectTrigger className={cn('w-full bg-white', triggerClassName)}>
          {loading ? (
            <span className="flex items-center gap-2 text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Cargando…
            </span>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {options.map((opt) => (
            <SelectItem key={opt.code} value={opt.code}>
              {opt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function DireccionDespachoPeruFields({
  value,
  onChange,
  onValidityChange,
  disabled = false,
  className,
  variant = 'default',
  showPreview = true,
}: DireccionDespachoPeruFieldsProps) {
  const parsed = useMemo(() => parsearDireccionDespachoPeru(value), [value]);

  const [ubicacionExacta, setUbicacionExacta] = useState(parsed.ubicacionExacta);
  const [departamentoCode, setDepartamentoCode] = useState('');
  const [provinciaCode, setProvinciaCode] = useState('');
  const [distritoCode, setDistritoCode] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const {
    departamentos,
    provincias,
    distritos,
    cargandoDepartamentos,
    cargandoProvincias,
    cargandoDistritos,
  } = usePeruUbigeo(departamentoCode, provinciaCode);

  useEffect(() => {
    setUbicacionExacta(parsed.ubicacionExacta);
  }, [parsed.ubicacionExacta, value]);

  useEffect(() => {
    if (!departamentos.length || !parsed.departamento) return;
    const code = buscarCodigoPorNombre(departamentos, parsed.departamento);
    if (code) setDepartamentoCode(code);
  }, [departamentos, parsed.departamento]);

  useEffect(() => {
    if (!provincias.length || !parsed.provincia) return;
    const code = buscarCodigoPorNombre(provincias, parsed.provincia);
    if (code) setProvinciaCode(code);
  }, [provincias, parsed.provincia]);

  useEffect(() => {
    if (!distritos.length || !parsed.distrito) return;
    const code = buscarCodigoPorNombre(distritos, parsed.distrito);
    if (code) setDistritoCode(code);
  }, [distritos, parsed.distrito]);

  const emitChange = useCallback(
    (
      exacta: string,
      deptCode: string,
      provCode: string,
      distCode: string,
    ) => {
      const departamento =
        departamentos.find((d) => d.code === deptCode)?.name ?? '';
      const provincia = provincias.find((p) => p.code === provCode)?.name ?? '';
      const distrito = distritos.find((d) => d.code === distCode)?.name ?? '';

      const partes = {
        ubicacionExacta: exacta,
        departamento,
        provincia,
        distrito,
      };

      const error = validarPartesDireccionDespachoPeru(partes);
      setErrorLocal(error);
      onValidityChange?.(!error);

      if (!error) {
        onChange(componerDireccionDespachoPeru(partes));
      }
    },
    [departamentos, provincias, distritos, onChange, onValidityChange],
  );

  useEffect(() => {
    if (!departamentoCode || !provinciaCode || !distritoCode) return;
    emitChange(ubicacionExacta, departamentoCode, provinciaCode, distritoCode);
  }, [
    departamentoCode,
    provinciaCode,
    distritoCode,
    ubicacionExacta,
    emitChange,
  ]);

  useEffect(() => {
    onValidityChange?.(esDireccionDespachoPeruValida(value));
  }, [value, onValidityChange]);

  const handleExactaChange = (texto: string) => {
    setUbicacionExacta(texto);
    emitChange(texto, departamentoCode, provinciaCode, distritoCode);
  };

  const handleDepartamentoChange = (code: string) => {
    setDepartamentoCode(code);
    setProvinciaCode('');
    setDistritoCode('');
    emitChange(ubicacionExacta, code, '', '');
  };

  const handleProvinciaChange = (code: string) => {
    setProvinciaCode(code);
    setDistritoCode('');
    emitChange(ubicacionExacta, departamentoCode, code, '');
  };

  const handleDistritoChange = (code: string) => {
    setDistritoCode(code);
    emitChange(ubicacionExacta, departamentoCode, provinciaCode, code);
  };

  const inputClass =
    variant === 'portal'
      ? 'w-full px-3.5 py-2 text-xs border rounded-xl bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500 border-[color:var(--guor-stone)]'
      : 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900';

  const preview = useMemo(() => {
    const departamento =
      departamentos.find((d) => d.code === departamentoCode)?.name ?? '';
    const provincia = provincias.find((p) => p.code === provinciaCode)?.name ?? '';
    const distrito = distritos.find((d) => d.code === distritoCode)?.name ?? '';

    if (!ubicacionExacta.trim() || !departamento || !provincia || !distrito) {
      return null;
    }

    return componerDireccionDespachoPeru({
      ubicacionExacta,
      departamento,
      provincia,
      distrito,
    });
  }, [
    ubicacionExacta,
    departamentoCode,
    provinciaCode,
    distritoCode,
    departamentos,
    provincias,
    distritos,
  ]);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <UbigeoSelect
          label="Departamento"
          placeholder="Seleccionar departamento"
          value={departamentoCode}
          options={departamentos}
          disabled={disabled}
          loading={cargandoDepartamentos}
          onChange={handleDepartamentoChange}
          triggerClassName={variant === 'portal' ? 'h-10 text-xs rounded-xl' : undefined}
        />
        <UbigeoSelect
          label="Provincia"
          placeholder={departamentoCode ? 'Seleccionar provincia' : 'Primero el departamento'}
          value={provinciaCode}
          options={provincias}
          disabled={disabled || !departamentoCode}
          loading={cargandoProvincias}
          onChange={handleProvinciaChange}
          triggerClassName={variant === 'portal' ? 'h-10 text-xs rounded-xl' : undefined}
        />
        <UbigeoSelect
          label="Distrito"
          placeholder={provinciaCode ? 'Seleccionar distrito' : 'Primero la provincia'}
          value={distritoCode}
          options={distritos}
          disabled={disabled || !provinciaCode}
          loading={cargandoDistritos}
          onChange={handleDistritoChange}
          triggerClassName={variant === 'portal' ? 'h-10 text-xs rounded-xl' : undefined}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
          Ubicación exacta <span className="text-rose-500">*</span>
        </label>
        <textarea
          value={ubicacionExacta}
          onChange={(e) => handleExactaChange(e.target.value)}
          disabled={disabled}
          rows={variant === 'portal' ? 2 : 3}
          className={inputClass}
          placeholder="Ej. Av. Industrial 450, Mz B Lt 3, urbanización, referencia…"
        />
        <p className="text-[10px] text-slate-500">
          Escriba calle, número, interior y referencias. Departamento, provincia y distrito se eligen arriba.
        </p>
      </div>

      {errorLocal && ubicacionExacta.trim() && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          {errorLocal}
        </p>
      )}

      {showPreview && preview && (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Vista previa
          </p>
          <p className="text-sm text-slate-800">{preview}</p>
        </div>
      )}
    </div>
  );
}

export { esDireccionDespachoPeruValida } from '@/lib/helpers/direccion-despacho-peru.helper';
