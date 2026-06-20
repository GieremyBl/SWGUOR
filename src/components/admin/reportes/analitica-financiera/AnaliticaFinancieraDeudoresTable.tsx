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
import type { AnaliticaFinancieraDeudor } from '@/lib/schemas/reporte-analitica-financiera';
import { formatMontoAnalitica } from '@/lib/helpers/analitica-financiera.helper';
import type { MonedaAnaliticaFiltro } from '@/lib/constants/analitica-financiera';
import { Users } from 'lucide-react';

interface Props {
  deudores: AnaliticaFinancieraDeudor[];
  moneda: MonedaAnaliticaFiltro;
  loading?: boolean;
}

export function AnaliticaFinancieraDeudoresTable({ deudores, moneda, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white border border-[#e4c28a] rounded-3xl p-6 animate-pulse h-80" />
    );
  }

  return (
    <div className="bg-white border border-[#e4c28a] rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-[#f0e0c8]">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#b5854b]" />
          <div>
            <h2 className="text-xl font-bold text-[#231e1d]">Top 10 clientes con mayor deuda</h2>
            <p className="text-sm text-[#6b5b52] mt-0.5">
              Cuentas por cobrar acumuladas por cliente
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-[#fff4e2]/60">
            <TableRow className="hover:bg-transparent">
              {['#', 'Cliente', 'RUC', 'Moneda', 'Pedidos', 'Deuda acumulada', 'Acción'].map(
                (col) => (
                  <TableHead
                    key={col}
                    className="font-bold text-[#b5854b] uppercase text-[10px] tracking-widest py-4 whitespace-nowrap"
                  >
                    {col}
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {deudores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-[#6b5b52] italic">
                  No hay clientes con deuda pendiente para la moneda seleccionada
                </TableCell>
              </TableRow>
            ) : (
              deudores.map((deudor, index) => (
                <TableRow key={deudor.cliente_id} className="hover:bg-[#fff4e2]/40">
                  <TableCell className="font-black text-[#231e1d]">{index + 1}</TableCell>
                  <TableCell>
                    <p className="font-semibold text-[#231e1d] max-w-[220px] truncate">
                      {deudor.razon_social}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-[#6b5b52]">{deudor.ruc ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase">
                      {deudor.moneda}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{deudor.pedidos_con_deuda}</TableCell>
                  <TableCell className="text-sm font-black text-amber-700 tabular-nums">
                    {formatMontoAnalitica(deudor.deuda_total, deudor.moneda as MonedaAnaliticaFiltro)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/Panel-Administrativo/clientes/${deudor.cliente_id}`}
                      className="text-xs font-bold uppercase tracking-wide text-[#b5854b] hover:text-[#231e1d]"
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
