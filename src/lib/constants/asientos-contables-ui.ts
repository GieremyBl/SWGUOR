import type { CuentaContable, TipoAsiento } from '@/lib/schemas/asientos-contables';

export const CUENTA_CONTABLE_LABELS: Record<CuentaContable, string> = {
  caja: 'Caja',
  bancos: 'Bancos',
  cuentas_por_cobrar: 'Cuentas por cobrar',
  inventario: 'Inventario',
  ventas: 'Ventas',
  costo_ventas: 'Costo de ventas',
  cuentas_por_pagar: 'Cuentas por pagar',
  capital: 'Capital',
  igv: 'IGV',
  descuentos: 'Descuentos',
  gastos_operativos: 'Gastos operativos',
};

export const CUENTAS_CONTABLES_OPTIONS = Object.entries(CUENTA_CONTABLE_LABELS).map(
  ([value, label]) => ({ value: value as CuentaContable, label }),
);

export const TIPO_ASIENTO_LABELS: Record<TipoAsiento, string> = {
  debe: 'Debe',
  haber: 'Haber',
};

export const TIPO_ASIENTO_STYLES: Record<TipoAsiento, string> = {
  debe: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  haber: 'bg-violet-50 text-violet-700 border-violet-200',
};
