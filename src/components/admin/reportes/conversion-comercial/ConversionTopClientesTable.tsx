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
import type { ConversionTopCliente } from '@/lib/schemas/reporte-conversion-comercial';
import { formatMontoFacturacion } from '@/lib/helpers/conversion-comercial.helper';
import { Crown } from 'lucide-react';

interface Props {
  clientes: ConversionTopCliente[];
  loading?: boolean;
}

export function ConversionTopClientesTable({ clientes, loading }: Props) {
  if (loading) {
    return <div className="bg-white border border-slate-200 rounded-3xl p-6 h-80 animate-pulse" />;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Top Clientes por Facturación</h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Ranking según volumen acumulado en pedidos
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/70">
            <TableRow className="hover:bg-transparent">
              {['#', 'Cliente', 'RUC', 'Pedidos', 'Facturación', 'Acción'].map((col) => (
                <TableHead
                  key={col}
                  className="font-bold text-slate-400 uppercase text-[10px] tracking-widest py-4"
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-slate-500 italic">
                  No hay datos de facturación por cliente
                </TableCell>
              </TableRow>
            ) : (
              clientes.map((cliente, index) => (
                <TableRow key={cliente.cliente_id} className="hover:bg-slate-50/60">
                  <TableCell className="font-black text-slate-900">{index + 1}</TableCell>
                  <TableCell className="font-semibold max-w-[220px] truncate">
                    {cliente.razon_social}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{cliente.ruc ?? '—'}</TableCell>
                  <TableCell className="text-sm tabular-nums">{cliente.pedidos_count}</TableCell>
                  <TableCell className="text-sm font-black text-emerald-700 tabular-nums">
                    {formatMontoFacturacion(cliente.total_facturado, cliente.moneda)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/Panel-Administrativo/clientes/${cliente.cliente_id}`}
                      className="text-xs font-bold uppercase tracking-wide text-indigo-600 hover:text-indigo-800"
                    >
                      Ver cliente
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
