'use client';

import { Loader2, Lock, MapPin } from 'lucide-react';
import { formatearVistaDireccionDespacho } from '@/lib/helpers/direccion-despacho-peru.helper';
import { cn } from '@/lib/utils';
import {
  TIPOS_REFERENCIA_ENTREGA,
  TIPOS_VIA_DIRECCION,
  obtenerEtiquetasUbicacionPais,
} from '@/lib/constants/direccion-entrega';
import { useGeoInternacional } from '@/lib/hooks/useGeoInternacional';
import { usePeruUbigeo } from '@/lib/hooks/usePeruUbigeo';
import type { DatosEntregaPago } from '@/lib/schemas/datos-entrega-pago';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  value: DatosEntregaPago;
  onChange: (value: DatosEntregaPago) => void;
  disabled?: boolean;
  readOnly?: boolean;
  readOnlyText?: string | null;
  className?: string;
}

interface CampoSelectProps {
  label: string;
  placeholder: string;
  value: string;
  options: { code: string; name: string }[];
  disabled?: boolean;
  loading?: boolean;
  onChange: (code: string) => void;
  required?: boolean;
}

function CampoSelect({
  label,
  placeholder,
  value,
  options,
  disabled,
  loading,
  onChange,
  required,
}: CampoSelectProps) {
  return (
    <div className="space-y-1.5 min-w-0">
      <label className="text-[10px] font-black uppercase tracking-wider text-[#231e1d]/50 block">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <Select value={value || undefined} onValueChange={onChange} disabled={disabled || loading}>
        <SelectTrigger
          className={cn(
            'h-11 w-full rounded-xl border-[#e4c28a]/25 bg-[#fffdf8] text-sm text-[#231e1d]',
            'focus:ring-[#e4c28a]/40',
          )}
        >
          {loading ? (
            <span className="flex items-center gap-2 text-slate-400 text-xs">
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

function CampoTexto({
  label,
  placeholder,
  value,
  onChange,
  disabled,
  required,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5 min-w-0">
      <label className="text-[10px] font-black uppercase tracking-wider text-[#231e1d]/50 block">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          'h-11 w-full px-3.5 rounded-xl border text-sm text-[#231e1d]',
          'border-[#e4c28a]/25 bg-[#fffdf8] placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-[#e4c28a]/30 focus:border-[#e4c28a]/50',
        )}
      />
    </div>
  );
}

export function PagoDireccionEntregaForm({
  value,
  onChange,
  disabled,
  readOnly,
  readOnlyText,
  className,
}: Props) {
  const esPeru = value.paisCode === 'PE';
  const etiquetas = obtenerEtiquetasUbicacionPais(value.paisCode);

  const {
    paises,
    estados,
    ciudades,
    tieneEstados,
    cargandoPaises,
    cargandoEstados,
    cargandoCiudades,
  } = useGeoInternacional(
    esPeru ? undefined : value.paisCode,
    esPeru ? undefined : value.departamentoCode,
  );

  const {
    departamentos,
    provincias,
    distritos,
    cargandoDepartamentos,
    cargandoProvincias,
    cargandoDistritos,
  } = usePeruUbigeo(
    esPeru ? value.departamentoCode : undefined,
    esPeru ? value.provinciaCode : undefined,
  );

  const patch = (partial: Partial<DatosEntregaPago>) => {
    onChange({ ...value, ...partial });
  };

  const handlePaisChange = (paisCode: string) => {
    onChange({
      ...value,
      paisCode,
      departamentoCode: '',
      provinciaCode: '',
      distritoCode: '',
    });
  };

  const opcionesVia = TIPOS_VIA_DIRECCION.map((t) => ({ code: t.value, name: t.label }));
  const opcionesReferencia = TIPOS_REFERENCIA_ENTREGA.map((t) => ({
    code: t.value,
    name: t.label,
  }));

  const soloLectura = Boolean(readOnly);
  const textoRegistrado = readOnlyText?.trim()
    ? formatearVistaDireccionDespacho(readOnlyText)
    : '';

  return (
    <div
      className={cn(
        'rounded-2xl border border-[#e4c28a]/20 bg-white p-6 shadow-sm shadow-[#231e1d]/5',
        className,
      )}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-[#231e1d] text-[#e4c28a]">
          <MapPin size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-black text-lg text-[#231e1d]">Dirección de entrega</h2>
            {soloLectura && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <Lock className="w-3 h-3" />
                Solo lectura
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {soloLectura
              ? 'La dirección ya fue registrada en el pedido y no puede modificarse aquí.'
              : 'Seleccione país, ubicación y datos de la vía desde los catálogos disponibles.'}
          </p>
        </div>
      </div>

      {soloLectura ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
            Dirección registrada
          </p>
          <p className="text-sm font-medium text-slate-800 leading-relaxed">
            {textoRegistrado || 'Sin dirección registrada en el pedido.'}
          </p>
        </div>
      ) : (
      <div className="space-y-4">
        <CampoSelect
          label="País"
          placeholder="Seleccionar país"
          value={value.paisCode}
          options={paises}
          loading={cargandoPaises}
          disabled={disabled}
          onChange={handlePaisChange}
          required
        />

        {esPeru ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CampoSelect
              label={etiquetas.region}
              placeholder={`Seleccionar ${etiquetas.region.toLowerCase()}`}
              value={value.departamentoCode}
              options={departamentos}
              loading={cargandoDepartamentos}
              disabled={disabled}
              onChange={(code) =>
                patch({ departamentoCode: code, provinciaCode: '', distritoCode: '' })
              }
              required
            />
            <CampoSelect
              label={etiquetas.subregion}
              placeholder={
                value.departamentoCode
                  ? `Seleccionar ${etiquetas.subregion.toLowerCase()}`
                  : `Primero el ${etiquetas.region.toLowerCase()}`
              }
              value={value.provinciaCode ?? ''}
              options={provincias}
              loading={cargandoProvincias}
              disabled={disabled || !value.departamentoCode}
              onChange={(code) => patch({ provinciaCode: code, distritoCode: '' })}
              required
            />
            <CampoSelect
              label={etiquetas.localidad}
              placeholder={
                value.provinciaCode
                  ? `Seleccionar ${etiquetas.localidad.toLowerCase()}`
                  : `Primero la ${etiquetas.subregion.toLowerCase()}`
              }
              value={value.distritoCode}
              options={distritos}
              loading={cargandoDistritos}
              disabled={disabled || !value.provinciaCode}
              onChange={(code) => patch({ distritoCode: code })}
              required
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tieneEstados && (
              <CampoSelect
                label={etiquetas.region}
                placeholder={`Seleccionar ${etiquetas.region.toLowerCase()}`}
                value={value.departamentoCode}
                options={estados}
                loading={cargandoEstados}
                disabled={disabled || !value.paisCode}
                onChange={(code) => patch({ departamentoCode: code, distritoCode: '' })}
                required
              />
            )}
            <CampoSelect
              label={etiquetas.localidad}
              placeholder={
                tieneEstados && !value.departamentoCode
                  ? `Primero el ${etiquetas.region.toLowerCase()}`
                  : `Seleccionar ${etiquetas.localidad.toLowerCase()}`
              }
              value={value.distritoCode}
              options={ciudades}
              loading={cargandoCiudades}
              disabled={disabled || (tieneEstados && !value.departamentoCode)}
              onChange={(code) => patch({ distritoCode: code })}
              required
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-4">
            <CampoSelect
              label="Tipo de vía"
              placeholder="Tipo"
              value={value.tipoVia}
              options={opcionesVia}
              disabled={disabled}
              onChange={(code) => patch({ tipoVia: code })}
              required
            />
          </div>
          <div className="sm:col-span-5">
            <CampoTexto
              label="Nombre de vía"
              placeholder="Ej. Los Industriales"
              value={value.nombreVia}
              onChange={(texto) => patch({ nombreVia: texto })}
              disabled={disabled}
              required
            />
          </div>
          <div className="sm:col-span-3">
            <CampoTexto
              label="Número"
              placeholder="Nº / Mz / Lt"
              value={value.numero ?? ''}
              onChange={(texto) => patch({ numero: texto })}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CampoSelect
            label="Tipo de referencia"
            placeholder="Seleccionar referencia"
            value={value.tipoReferencia}
            options={opcionesReferencia}
            disabled={disabled}
            onChange={(code) => patch({ tipoReferencia: code })}
            required
          />
          {value.tipoReferencia !== 'sin_referencia' && (
            <CampoTexto
              label="Detalle de referencia"
              placeholder="Ej. fábrica azul, portón negro…"
              value={value.referenciaDetalle ?? ''}
              onChange={(texto) => patch({ referenciaDetalle: texto })}
              disabled={disabled}
            />
          )}
        </div>
      </div>
      )}
    </div>
  );
}
