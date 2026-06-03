'use client';

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Unlock, AlertTriangle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { liberarReservaStockAction } from '@/app/admin/Panel-Administrativo/inventario/reservas/actions';
import type { ReservaStockMonitorRow } from '@/lib/services/reserva-stock-admin.service';
import { cn } from '@/lib/utils';

interface ReservasStockTableProps {
  data: ReservaStockMonitorRow[];
}

function estadoPedidoBadge(estado: string | null) {
  if (!estado) {
    return <span className="text-gray-400 text-xs">—</span>;
  }
  const normalized = estado.toLowerCase();
  const variant =
    normalized === 'cancelado'
      ? 'destructive'
      : normalized === 'finalizado' || normalized === 'entregado'
        ? 'default'
        : 'secondary';
  return (
    <Badge variant={variant} className="uppercase text-[10px] font-bold tracking-wide">
      {estado}
    </Badge>
  );
}

export default function ReservasStockTable({ data }: ReservasStockTableProps) {
  const [rows, setRows] = useState(data);
  const [pending, startTransition] = useTransition();

  const handleLiberar = (id: string) => {
    startTransition(async () => {
      const result = await liberarReservaStockAction(id);
      if (!result.success) {
        toast.error(result.error ?? 'Error al liberar');
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success('Stock liberado correctamente');
    });
  };

  if (rows.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 italic shadow-sm">
        No hay reservas activas en este momento.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-widest py-4">
              Producto
            </TableHead>
            <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-widest py-4 text-center">
              Cantidad reservada
            </TableHead>
            <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-widest py-4">
              Pedido
            </TableHead>
            <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-widest py-4">
              Estado pedido
            </TableHead>
            <TableHead className="font-bold text-gray-400 uppercase text-[10px] tracking-widest py-4">
              Expira
            </TableHead>
            <TableHead className="text-right font-bold text-gray-400 uppercase text-[10px] tracking-widest py-4">
              Acción
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn(
                'hover:bg-slate-50/50 transition-colors',
                row.estaVencida && 'bg-amber-50/40',
              )}
            >
              <TableCell>
                <p className="font-bold text-gray-900 text-sm">{row.productoNombre}</p>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">
                  {row.varianteLabel}
                  {row.sku ? ` · SKU ${row.sku}` : ''}
                </p>
                {row.cotizacionNumero && !row.pedidoId && (
                  <p className="text-[10px] text-violet-600 mt-1">
                    Cotización {row.cotizacionNumero}
                  </p>
                )}
              </TableCell>
              <TableCell className="text-center">
                <span className="font-black text-gray-900">{row.cantidad.toLocaleString()}</span>
              </TableCell>
              <TableCell>
                {row.pedidoId ? (
                  <span className="font-mono text-sm font-bold text-gray-800">#{row.pedidoId}</span>
                ) : (
                  <span className="text-gray-400 text-xs">Sin pedido</span>
                )}
              </TableCell>
              <TableCell>{estadoPedidoBadge(row.pedidoEstado)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  {row.estaVencida && (
                    <AlertTriangle size={14} className="text-amber-600 shrink-0" aria-hidden />
                  )}
                  <span
                    className={cn(
                      'text-sm font-medium',
                      row.estaVencida ? 'text-amber-700' : 'text-gray-700',
                    )}
                  >
                    {format(new Date(row.expiraEn), "dd/MM/yyyy HH:mm", { locale: es })}
                  </span>
                </div>
                {row.estaVencida && (
                  <p className="text-[10px] text-amber-600 font-bold uppercase mt-0.5">Vencida</p>
                )}
              </TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      className="gap-1.5 text-xs font-bold border-amber-200 text-amber-800 hover:bg-amber-50"
                    >
                      <Unlock size={14} />
                      Liberar manualmente
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Liberar esta reserva?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se marcará la reserva #{row.id} como cancelada y el stock dejará de estar
                        apartado para{' '}
                        {row.pedidoId ? `el pedido #${row.pedidoId}` : 'la cotización asociada'}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleLiberar(row.id)}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        Liberar stock
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
