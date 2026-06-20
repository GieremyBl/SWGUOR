'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EstadoBadge } from '@/components/portal/EstadoBadge';
import {
  ESTADOS_TESORERIA_LABELS,
  METODO_PAGO_TESORERIA_LABELS,
} from '@/lib/constants/tesoreria-pagos';
import type { TesoreriaPagoFila } from '@/lib/schemas/tesoreria-pagos';
import { cn } from '@/lib/utils';
import { CheckCircle, Eye, FileText, XCircle, Clock } from 'lucide-react';

const ESTADO_TESORERIA_UI: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle }
> = {
  exitoso: {
    label: ESTADOS_TESORERIA_LABELS.exitoso,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
  },
  pendiente: {
    label: ESTADOS_TESORERIA_LABELS.pendiente,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  },
  fallido: {
    label: ESTADOS_TESORERIA_LABELS.fallido,
    className: 'bg-red-50 text-red-700 border-red-200',
    icon: XCircle,
  },
};

const TIPO_LABELS: Record<string, string> = {
  adelanto: 'Adelanto',
  cuota: 'Cuota',
  saldo_final: 'Saldo final',
  pago_completo: 'Pago completo',
};

interface Props {
  data: TesoreriaPagoFila[];
  isLoading?: boolean;
  onViewPedido?: (row: TesoreriaPagoFila) => void;
  onViewComprobante?: (row: TesoreriaPagoFila) => void;
  onVerify?: (row: TesoreriaPagoFila) => void;
}

function formatMoney(value: number) {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function nombreCliente(row: TesoreriaPagoFila): string {
  return (
    row.cliente?.razon_social ??
    row.cliente?.nombre_comercial ??
    'Sin cliente'
  );
}

export function TesoreriaPagosTable({
  data,
  isLoading,
  onViewPedido,
  onViewComprobante,
  onVerify,
}: Props) {
  if (isLoading) {
    return (
      <div className="border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-50 border-b border-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="hover:bg-transparent">
              {[
                'Pedido / Cliente',
                'Comprobante',
                'Monto',
                'Método',
                'Fecha',
                'Estado pedido',
                'Estado pago',
                'Acciones',
              ].map((col) => (
                <TableHead
                  key={col}
                  className={cn(
                    'font-bold text-gray-400 uppercase text-[10px] tracking-widest py-4 whitespace-nowrap',
                    col === 'Acciones' && 'text-right',
                  )}
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-gray-400 italic">
                  No se encontraron transacciones con los filtros aplicados
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const est = ESTADO_TESORERIA_UI[row.estado_tesoreria] ?? ESTADO_TESORERIA_UI.pendiente;
                const EstIcon = est.icon;
                const numeroComprobante =
                  row.comprobante?.numero_completo ??
                  (row.comprobante
                    ? `${row.comprobante.serie}-${row.comprobante.correlativo}`
                    : null);

                return (
                  <TableRow key={row.id_uuid} className="group hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex flex-col min-w-[160px]">
                        <Link
                          href={`/admin/Panel-Administrativo/pedidos/${row.pedido_id}`}
                          className="font-bold text-slate-900 hover:text-emerald-600 transition-colors w-fit"
                        >
                          Pedido #{row.pedido_id}
                        </Link>
                        <span className="text-[11px] text-slate-500 truncate max-w-[220px]">
                          {nombreCliente(row)}
                        </span>
                        <span className="text-[10px] text-slate-400">{row.cliente?.ruc}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {numeroComprobante ? (
                        <div className="min-w-[120px]">
                          <p className="text-xs font-bold text-slate-800">{numeroComprobante}</p>
                          <p className="text-[10px] text-slate-400 uppercase">
                            {row.comprobante?.tipo}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-slate-800 tabular-nums">
                        {formatMoney(row.monto)}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {TIPO_LABELS[row.tipo] ?? row.tipo}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-slate-600">
                        {METODO_PAGO_TESORERIA_LABELS[row.metodo_pago] ?? row.metodo_pago}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(row.fecha_pago)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <EstadoBadge estado={row.pedido.estado ?? 'pendiente'} tipo="pedido" />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 w-fit',
                          est.className,
                        )}
                      >
                        <EstIcon className="w-3 h-3" />
                        {est.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {onViewPedido && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => onViewPedido(row)}
                            title="Ver detalle del pedido"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {onViewComprobante && row.comprobante && row.estado_tesoreria === 'exitoso' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl hover:bg-indigo-50 hover:text-indigo-600"
                            onClick={() => onViewComprobante(row)}
                            title="Ver comprobante"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        )}
                        {onVerify && row.estado === 'pendiente' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => onVerify(row)}
                            title="Verificar pago"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
