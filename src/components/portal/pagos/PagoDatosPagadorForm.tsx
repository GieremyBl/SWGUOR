'use client';

import { UserCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DatosPagadorPago } from '@/lib/schemas/datos-pagador-pago';

interface Props {
  value: DatosPagadorPago;
  onChange: (value: DatosPagadorPago) => void;
  disabled?: boolean;
  error?: string;
  onUsarDireccionEntrega?: () => void;
  className?: string;
}

function CampoTexto({
  label,
  placeholder,
  value,
  onChange,
  disabled,
  required,
  readOnly,
  hint,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  hint?: string;
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
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        className={cn(
          'h-11 w-full px-3.5 rounded-xl border text-sm text-[#231e1d]',
          'border-[#e4c28a]/25 bg-[#fffdf8] placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-[#e4c28a]/30 focus:border-[#e4c28a]/50',
          readOnly && 'bg-slate-50 text-slate-500 cursor-default',
        )}
      />
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}

export function PagoDatosPagadorForm({
  value,
  onChange,
  disabled,
  error,
  onUsarDireccionEntrega,
  className,
}: Props) {
  const patch = (partial: Partial<DatosPagadorPago>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-[#e4c28a]/20 bg-white p-6 shadow-sm shadow-[#231e1d]/5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#231e1d] text-[#e4c28a]">
            <UserCircle2 size={18} />
          </div>
          <div>
            <h2 className="font-black text-lg text-[#231e1d]">Datos del pagador</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Información del titular de la tarjeta. Se envía a la pasarela para validar el pago.
            </p>
          </div>
        </div>
        {onUsarDireccionEntrega && (
          <button
            type="button"
            onClick={onUsarDireccionEntrega}
            disabled={disabled}
            className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-[#b5854b] hover:text-[#231e1d] disabled:opacity-50"
          >
            Usar dir. entrega
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CampoTexto
            label="Nombres"
            placeholder="Ej. Juan Carlos"
            value={value.nombres}
            onChange={(texto) => patch({ nombres: texto })}
            disabled={disabled}
            required
          />
          <CampoTexto
            label="Apellidos"
            placeholder="Ej. Pérez García"
            value={value.apellidos}
            onChange={(texto) => patch({ apellidos: texto })}
            disabled={disabled}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CampoTexto
            label="Teléfono"
            placeholder="Ej. 999 888 777"
            value={value.telefono}
            onChange={(texto) => patch({ telefono: texto })}
            disabled={disabled}
            required
          />
          <CampoTexto
            label="ID de usuario"
            placeholder="—"
            value={value.usuarioId ? String(value.usuarioId) : ''}
            readOnly
            hint="Identificador de tu cuenta en el portal"
          />
        </div>

        <CampoTexto
          label="Dirección"
          placeholder="Ej. Av. Los Industriales 123"
          value={value.direccion}
          onChange={(texto) => patch({ direccion: texto })}
          disabled={disabled}
          required
        />

        <CampoTexto
          label="Ubicación"
          placeholder="Ej. San Juan de Lurigancho, Lima"
          value={value.ubicacion}
          onChange={(texto) => patch({ ubicacion: texto })}
          disabled={disabled}
          required
        />
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
